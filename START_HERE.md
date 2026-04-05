# 🚀 START HERE — Stock Analyzer v4 快速指南

> 下一個 Agent 的 5 分鐘入門指南  
> 完整詳檔：見 `AGENT_HANDOFF.md`

---

## 🎯 這個專案做什麼？

**股票四層漏斗評分引擎**

- 🇹🇼 **台股**：1,962 支（FinMind 價格 + Yahoo 基本面）
- 🇺🇸 **美股**：852 支（Yahoo Finance 完整數據）
- **掃描速度**：5 秒（用 Neon DB 快取，比之前的即時 Yahoo 快 26 倍）
- **評分框架**：5 模組（環境 → 估值 → 技術 → 凱利倉位 → 出場）
- **結果**：進場建議 or 觀察清單

**線上體驗**：https://stock-analyzer-qfks.vercel.app

---

## ⚡ 60 秒快速上手

### 1. 環境設定
```bash
git clone https://github.com/nteverysome/stock-analyzer
cd stock-analyzer
npm install
echo "DATABASE_URL=postgresql://..." > .env.local  # 填入 Neon 連線
npx vercel dev  # 本地開發 → localhost:3000
```

### 2. 運行掃描
- 網頁：https://stock-analyzer-qfks.vercel.app → 「全市場掃描」
- 或本地測試：npx vercel dev 後打開 localhost:3000

### 3. 查看代碼
打開 `public/screener.html`（1,761 行）— 這是全部邏輯

---

## 📁 3 個最重要的檔案

| 檔案 | 用途 | 行數 |
|------|------|------|
| **`public/screener.html`** | ⭐ 主頁 - 四層漏斗評分引擎 | 1,761 |
| **`scripts/fetch-*.mjs`** | 批次抓取台股/美股數據 | — |
| **`.github/workflows/update-indicators.yml`** | 每日自動更新（22:30 台灣時間） | — |

---

## 🧠 screener.html 結構

```
行 1-100      : HTML 骨架 + CSS
行 101-690    : 全局變數 + UI 事件
行 691-920    : 評分函數 (scoreStock/scoreTWStock)
行 1022-1200  : DB 掃描引擎 (scanTaiwan/scanUS)
行 1202-1700  : 四層漏斗 + 卡片渲染 + 敘述生成
```

### 最常編輯的函數

| 函數 | 行號 | 用途 |
|------|------|------|
| `scoreTWStock()` | 795 | 台股評分 |
| `scoreStock()` | 708 | 美股評分 |
| `startScan()` | 1202 | 四層漏斗主引擎 |

---

## 📊 五層評分模組

| 層 | 權重 | 說明 |
|----|------|------|
| **M1** | 15% | VIX + Fear & Greed → 環境乘數 (0.7-1.0) |
| **M2** | 25-30% | **估值**：PEG / 毛利率 / 分析師上行 |
| **M3** | 30-35% | **技術**：RSI / MACD / KD / 均線 |
| **M4** | 15% | **Kelly 倉位**：數學最優投資比例 |
| **M5** | 10% | **出場**：目標價 → R:R 比 |

進場：≥ 65 分  
觀察：50-64 分  
不買：< 50 分

---

## 🔧 常見任務

### 修改評分邏輯
1. 編輯 `screener.html` 的 `scoreTWStock()` 或 `scoreStock()`
2. `git push origin main`
3. 等 Vercel 自動部署（90 秒）
4. 刷新 https://stock-analyzer-qfks.vercel.app

### 補抓數據
```bash
# 台股基本面
node scripts/fetch-tw-fundamentals.mjs --only-listed --skip-existing

# 美股（3 步：清單→基本面→價格指標）
node scripts/fetch-us-stocks.mjs --step all --skip-existing
```

### 觀察自動化運行狀態
GitHub → Actions → Nightly Market Data Update → 查看日誌

---

## ⚠️ 常見坑

| 症狀 | 原因 | 解決 |
|------|------|------|
| 台股旗幟顯示 🇺🇸 | 市場判斷錯誤 | 檢查行 1477，用 `/^\d{4,5}$/` regex |
| 掃描很慢 | DB 超時或網路卡 | 檢查 DATABASE_URL；增加超時（行 1130） |
| M3 分數低 | 台股缺 MACD 數據 | 正常現象；wait GitHub Actions 自動修復 |
| ADR 目標異常大 | 分析師目標單位混亂 | 需手動過濾（見 AGENT_HANDOFF.md） |

---

## 🗄️ 資料庫（Neon PostgreSQL）

**4 + 4 = 8 張表**

| 台股 | 美股 |
|------|------|
| tw_stocks | us_stocks |
| tw_daily_prices | us_daily_prices |
| tw_indicators | us_indicators |
| tw_fundamentals | us_fundamentals |

連線：`DATABASE_URL` 環境變數（.env.local / Vercel）

---

## 📋 Git 工作流

```bash
# 開發
git checkout -b feature/my-feature
# 編輯 screener.html 或 scripts
git add .
git commit -m "feat: description"
git push origin feature/my-feature

# 部署
# 上 GitHub 發 PR → merge → Vercel 自動部署
git push origin main  # 直接推也行
```

---

## 🚀 下一步

1. **讀完 AGENT_HANDOFF.md**（470 行詳細文檔）
2. **本地跑一次掃描** → `npx vercel dev`
3. **嘗試修改評分** → 編輯 `scoreStock()` → `git push`
4. **檢查資料庫** → Neon Console 或 `SELECT COUNT(*) FROM tw_stocks`

---

## 📞 有問題？

| 問題 | 查看 |
|------|------|
| 架構 & 設計決策 | AGENT_HANDOFF.md 第 13 節 |
| 常見 Bug & 調試 | AGENT_HANDOFF.md 第 12 節 |
| 完整 API 文檔 | AGENT_HANDOFF.md 第 4 節 |
| 腳本用法 | AGENT_HANDOFF.md 第 6 節 |
| GitHub Actions | AGENT_HANDOFF.md 第 7 節 |

---

**祝你好運！** 🎯

部署地址：https://stock-analyzer-qfks.vercel.app
