# 🤖 Agent 交接文檔 — Stock Analyzer v4

> 最後更新：2026-04-05
> 部署位址：https://stock-analyzer-qfks.vercel.app
> GitHub：https://github.com/nteverysome/stock-analyzer

---

## 一、專案概述

**四模組股票決策引擎**，支援 🇺🇸 美股（852支）+ 🇹🇼 台股（1,962支），使用「四層漏斗」篩選架構，從宏觀環境 → 估值篩選 → 技術面確認 → 凱利倉位計算，最終輸出進場建議。

### 核心頁面
| 頁面 | 路徑 | 說明 |
|------|------|------|
| **Screener（主力）** | `public/screener.html` | 全市場掃描，四層漏斗，5秒出結果 |
| Stock Analyzer | `public/stock_analyzer.html` | 單支股票深度分析 |

---

## 二、技術架構

```
┌─────────────────────────────────────────────────────┐
│  前端：純 HTML/JS（無框架）── 部署在 Vercel         │
│  public/screener.html  (~1,761 行)                  │
│  public/stock_analyzer.html                         │
└──────────────┬──────────────────────────────────────┘
               │ fetch
┌──────────────▼──────────────────────────────────────┐
│  API (Vercel Serverless Functions)                   │
│  api/tw-screener.js  ── 台股一鍵查詢                │
│  api/us-screener.js  ── 美股一鍵查詢                │
│  api/screener.js     ── Yahoo Finance 股票清單      │
│  api/fundamentals.js ── Yahoo Finance 基本面        │
│  api/proxy.js        ── Yahoo Finance 通用代理      │
│  api/macro.js        ── VIX + Fear & Greed          │
└──────────────┬──────────────────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────────────────┐
│  Neon PostgreSQL（ap-southeast-1）                   │
│  ├── tw_stocks / tw_daily_prices / tw_indicators    │
│  ├── tw_fundamentals                                │
│  ├── us_stocks / us_daily_prices / us_indicators    │
│  └── us_fundamentals                                │
└─────────────────────────────────────────────────────┘
```

---

## 三、資料庫 Schema（Neon PostgreSQL）

### 表結構（8 張表）

**台股 (tw_)**
| 表 | 主要欄位 | 數據量 |
|---|---|---|
| `tw_stocks` | symbol(PK), name, sector | 1,962 |
| `tw_daily_prices` | symbol, price_date, OHLCV | ~240K |
| `tw_indicators` | symbol, indicator_date, rsi, kd_fast/slow, macd/signal/histogram, m1-m5(=MA5-120) | ~1,077 |
| `tw_fundamentals` | symbol, update_date, pe_ttm, peg, gross_margin, analyst_target, analyst_count... | ~1,072 |

**美股 (us_)**
| 表 | 主要欄位 | 數據量 |
|---|---|---|
| `us_stocks` | symbol(PK), name, sector, market_cap | 852 |
| `us_daily_prices` | symbol, price_date, OHLCV | ~100K+ |
| `us_indicators` | symbol, indicator_date, rsi, kd_fast/slow, macd/signal/histogram, ma5-ma120 | ~852 |
| `us_fundamentals` | symbol, update_date, pe_ttm, peg, gross_margin, analyst_target... | ~810 |

> ⚠️ **注意**：台股 indicators 表的 MA 欄位名是 `m1,m2,m3,m4,m5`（對應 MA5-120），美股用 `ma5,ma10,ma20,ma60,ma120`。歷史包袱。

### 連線資訊
```
DATABASE_URL 在 .env.local 和 Vercel 環境變數中
GitHub Secret: DATABASE_URL（用於 Actions）
```

---

## 四、API 端點

| 端點 | 方法 | 用途 | 回應 |
|------|------|------|------|
| `/api/tw-screener` | POST | 台股全量查詢（JOIN 4表） | `{success, total, stocks:[...]}` |
| `/api/us-screener` | POST | 美股全量查詢（JOIN 4表） | `{success, total, stocks:[...]}` |
| `/api/screener` | POST | Yahoo 股票清單（舊路徑） | `{total, quotes:[...]}` |
| `/api/fundamentals` | POST | Yahoo 單股基本面 | `{pe_ttm, peg, ...}` |
| `/api/proxy` | POST | Yahoo API 通用代理 | 原始 JSON |
| `/api/macro` | GET | VIX + Fear & Greed | `{vix, fear_greed, ...}` |


---

## 五、前端核心邏輯（screener.html）

### 四層漏斗掃描流程

```
L1 宏觀環境 ─── fetchMacroForScan()
   │  VIX, Fear & Greed → 判定 regime (Goldilocks/Reflation/Stagflation/Deflation)
   │  regime 決定 M1 分數的乘數 mul (0.7~1.0)
   ▼
L2 估值初篩 ─── scanUSStocksFromDB() / scanTaiwanStocksFromDB()
   │  美股：PEG≤2 + 分析師上行≥15% + 毛利率/EPS成長
   │  台股：M2分數≥15（有基本面用PEG/GM/目標，無則用MA位置）
   ▼
L3 技術面 ─── RSI ≤ 40（可自訂）
   ▼
L4 完整評分 ─── scoreStock() / scoreTWStock()
   │  輸出 total 分（0-100），≥65 進場，50-64 觀察
   ▼
輸出：進場機會卡片 + 觀察清單
```

### 評分函數

**`scoreStock(fund, chart, macro)`** — 美股，行 708

| 模組 | 權重 | 數據來源 |
|------|------|---------|
| M1 環境 | 15% | VIX + F&G → regime × mul |
| M2 估值 | 25% | PEG + 分析師上行 + 毛利率 |
| M3 技術 | 35% | RSI + MACD + VR（成交量比） |
| M4 凱利 | 15% | Kelly 公式 → 建議倉位 % |
| M5 出場 | 10% | 分析師目標 → R:R 比 |

**`scoreTWStock(dbData, macro)`** — 台股，行 795

| 模組 | 權重（有基本面/無） | 數據來源 |
|------|---------------------|---------|
| M1 環境 | 15% / 15% | 同美股 |
| M2 估值 | **30%** / 25% | 有基本面→PEG/GM/分析師；無→MA位置/52W/KD |
| M3 技術 | 30% / 35% | RSI/KD/MACD/均線，**正規化**（缺MACD/MA20時按比例放大） |
| M4 凱利 | 15% / 15% | 有分析師目標→真實上行空間 |
| M5 出場 | 10% / 10% | 分析師目標 or MA60/120 作為目標 |

> ⚠️ **重要**：台股 M3 有正規化機制。tw_indicators 很多股票缺 MACD 和 MA20+，M3 按可用指標等比放大，避免缺數據被懲罰。

### 關鍵函數索引（screener.html 行號）

| 函數 | 行號 | 用途 |
|------|------|------|
| `fetchMacroForScan()` | 691 | 取 VIX + F&G → 判定 regime |
| `scoreStock()` | 708 | 美股評分（5 模組） |
| `scoreTWStock()` | 795 | 台股評分（雙模式 M2） |
| `scanTaiwanStocksFromDB()` | 1022 | 台股 DB 掃描全流程 |
| `scanUSStocksFromDB()` | 1105 | 美股 DB 掃描全流程 |
| `startScan()` | 1202 | 主掃描引擎入口 |
| `renderOpportunityCard()` | 1467 | 渲染進場機會卡片 |
| `renderWatchlistRow()` | 1535 | 渲染觀察清單行 |
| `generateNarrativeTW()` | 1566 | 台股分析敘述 |
| `generateNarrative1-5()` | 1596+ | 美股 5 種情境敘述 |

### 市場判斷邏輯

```javascript
// 台股判斷：用 symbol 格式（數字4-5碼）
const isTWStock = /^\d{4,5}$/.test(r.ticker) || r.ticker.endsWith('.TW');
// ⚠️ 不要用 r.dbData != null 判斷！美股從 DB 來也有 dbData
```


---

## 六、批次腳本

| 腳本 | 用途 | 常用指令 |
|------|------|---------|
| `scripts/fetch-us-stocks.mjs` | 美股 3 步驟（清單→基本面→價格指標） | `--step 1\|2\|3\|all --skip-existing --limit N` |
| `scripts/fetch-tw-fundamentals.mjs` | 台股基本面（Yahoo Finance） | `--only-listed --skip-existing --batch 3` |
| `scripts/update-tw-data.mjs` | 台股每日更新（FinMind 價格+重算指標） | 直接執行 |
| `scripts/populate-taiwan-stocks.js` | 初始填充台股（已完成） | — |
| `scripts/create-us-tables.mjs` | 建立美股表結構（已完成） | — |

### Yahoo Finance 認證（⚠️ 重要坑！）

```javascript
// ✅ 正確做法：用 fc.yahoo.com 取輕量 cookie（不會 Headers Overflow）
const r1 = await fetch('https://fc.yahoo.com/', { redirect: 'manual' });
const cookies = r1.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
const crumb = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
  headers: { Cookie: cookies }
}).then(r => r.text());

// ❌ 錯誤做法：用 finance.yahoo.com 首頁 → Node.js Headers Overflow Error
// 因為 Yahoo 首頁的 set-cookie 非常大（超過 Node 預設 16KB 限制）
```

---

## 七、GitHub Actions 自動更新

檔案：`.github/workflows/update-indicators.yml`

| 排程 | 對象 | UTC | 台灣時間 |
|------|------|-----|---------|
| 台股 | tw_prices + tw_indicators + tw_fundamentals | 14:30 週一-五 | 22:30 |
| 美股 | us_stocks + us_fund + us_prices + us_indicators | 22:30 週一-五 | 06:30 |

**Secret**：`DATABASE_URL`（已設定 ✅）

手動觸發：GitHub → Actions → Run workflow → 選 `all` / `tw` / `us`

---

## 八、已知問題 & TODO

### 🐛 已知問題

1. **台股 tw_indicators 缺 MACD/MA20+**：原始填充只算 RSI、KD、MA5、MA10。`update-tw-data.mjs` 每日更新會重算完整指標，幾天後自動修復。
2. **台股 KD 值範圍窄（33-67）**：簡化 KD 公式 `K = 50*2/3 + RSV/3`，無遞迴平滑。閾值已在 `scoreTWStock` 適配。
3. **ADR 分析師目標單位錯誤**：如 2330.TW 台積電的 `analyst_target` 可能是 USD 而非 NTD → 上行空間異常大。需加幣別過濾。
4. **Stagflation 下分數偏低**：M1 × 0.7 → 最高約 67 分。這是**設計意圖**（恐慌市場不鼓勵進場），但用戶可能覺得結果太少。

### 📋 建議後續

- [ ] **改善 KD 計算**：用遞迴 EMA 平滑（需歷史 KD 狀態）
- [ ] **加更多美股**：可加 Russell 2000（目前 852 支）
- [ ] **Vercel Cron 替代 GitHub Actions**：更穩定
- [ ] **混合掃描分組顯示**：美股+台股按市場分開展示
- [ ] **回測模組**：歷史數據驗證評分→報酬率
- [ ] **加殖利率篩選**：DB 已有 `dividend_yield`
- [ ] **stock_analyzer.html 台股支援**：單股分析頁尚未接 DB

---

## 九、開發環境

```bash
# 安裝依賴
npm install

# 本地開發（Vercel dev server, localhost:3000）
npx vercel dev

# 手動批次抓取
node scripts/fetch-us-stocks.mjs --step 2 --limit 10 --skip-existing
node scripts/fetch-tw-fundamentals.mjs --only-listed --limit 10

# 部署（自動）
git push origin main   # Vercel 自動部署 ~60-90 秒
```

### 環境變數

| 變數 | 位置 | 用途 |
|------|------|------|
| `DATABASE_URL` | `.env.local` / Vercel / GitHub Secret | Neon PostgreSQL 連線字串 |

### NPM 依賴

| 套件 | 用途 |
|------|------|
| `@neondatabase/serverless` | Neon DB 客戶端（API + 腳本） |
| `dotenv` | 本地環境變數載入 |
| `undici` | HTTP 客戶端（部分腳本備用） |
| `tweetsodium` | GitHub secret 加密（僅開發用） |

---

## 十、檔案地圖

```
stock-analyzer/
├── .env.local                          # 環境變數（不入 git）
├── .github/workflows/
│   └── update-indicators.yml           # 每日自動更新 TW+US
├── api/                                # Vercel Serverless Functions
│   ├── tw-screener.js                  # 🇹🇼 台股查詢 (JOIN 4表)
│   ├── us-screener.js                  # 🇺🇸 美股查詢 (JOIN 4表)
│   ├── screener.js                     # Yahoo 股票清單
│   ├── fundamentals.js                 # Yahoo 單股基本面
│   ├── proxy.js                        # Yahoo 通用代理
│   └── macro.js                        # VIX + Fear & Greed
├── public/
│   ├── screener.html                   # ⭐ 主頁（1,761行）
│   └── stock_analyzer.html             # 單股分析
├── scripts/
│   ├── fetch-us-stocks.mjs             # 美股 3 步驟抓取
│   ├── fetch-tw-fundamentals.mjs       # 台股基本面
│   ├── update-tw-data.mjs              # 台股每日更新
│   ├── create-us-tables.mjs            # 建表（完成）
│   └── populate-taiwan-stocks.js       # 台股填充（完成）
├── vercel.json                         # Vercel 路由
├── package.json
└── AGENT_HANDOFF.md                    # 📖 本文件
```

---

## 十一、快速上手 3 步

### 1️⃣ 環境設定（5 分鐘）

```bash
# 複製 repo
git clone https://github.com/nteverysome/stock-analyzer.git
cd stock-analyzer

# 安裝依賴
npm install

# 設定環境變數
echo "DATABASE_URL=postgresql://..." > .env.local
# 從 Neon Console 複製 connection string

# 測試本地開發
npx vercel dev
# 開啟 localhost:3000 → 應該能看到 screener.html
```

### 2️⃣ 理解核心流程（10 分鐘）

1. **讀 screener.html 結構**
   - 行 1-50: HTML 模板 + 全局變數
   - 行 691-1000: 環境判定 + 美股評分 `scoreStock()`
   - 行 795-920: 台股評分 `scoreTWStock()`
   - 行 1022-1200: DB 掃描引擎（台股+美股）
   - 行 1202-1400: 四層漏斗 `startScan()`
   - 行 1467-1700: 卡片渲染 + 敘述生成

2. **測試一次掃描**
   - 打開 https://stock-analyzer-qfks.vercel.app
   - 「全市場掃描」→ 選 🇹🇼 台股 或 🇺🇸 美股 → 「開始掃描」
   - 觀察 Network 標籤：`/api/tw-screener` 或 `/api/us-screener` 的 response

3. **查看 DB 數據**
   ```bash
   # 用 psql 或 Neon Console 查詢
   SELECT COUNT(*) FROM tw_stocks;              # 1,962
   SELECT COUNT(*) FROM us_stocks;              # 852
   SELECT COUNT(*) FROM tw_fundamentals WHERE update_date = CURRENT_DATE;  # ~1,072
   ```

### 3️⃣ 常見任務

#### 📥 **增加新股票或修復缺失數據**

```bash
# 台股基本面補抓（每天自動跑，手動觸發：）
node scripts/fetch-tw-fundamentals.mjs --only-listed --skip-existing

# 美股全流程
node scripts/fetch-us-stocks.mjs --step all --skip-existing

# 只抓美股基本面（測試）
node scripts/fetch-us-stocks.mjs --step 2 --limit 50
```

#### 📊 **修改評分邏輯**

編輯 `public/screener.html`:
- **美股 M2**（估值）：行 833
- **台股 M2**（雙模式估值）：行 816
- **M3**（技術面）：行 854-893
- **M4**（凱利倉位）：行 897
- **M5**（出場）：行 908

修改後 `git push` 自動部署（Vercel ~90 秒）

#### 🔧 **修復已知問題（台股 MACD 缺失）**

問題：tw_indicators 很多股票缺 MACD/MA20-120，M3 會不準。

解決方案：編輯 `scripts/update-tw-data.mjs` 第 65-90 行的 `computeIndicators()`，確保每日重算時包含完整指標。已自動在 GitHub Actions 跑，3-5 天後資料會完整。

#### ⚠️ **修復 ADR 分析師目標單位混亂**

問題：2330.TW（台積電 ADR）的 `analyst_target` 混合 USD 和 NTD。

修復位置：`scripts/fetch-us-stocks.mjs` 第 135 行，或 `scripts/fetch-tw-fundamentals.mjs` 第 84 行

添加幣別檢查：
```javascript
// 簡單過濾：如果目標 > 1000 且 PE < 15，可能是 USD（ADR）
if (symbol === '2330' && analystTarget > 1000) {
  analystTarget = null;  // 排除
}
```

#### 📈 **加入新的基本面指標**

1. 在對應的 `*_fundamentals` 表加欄 (ALTER TABLE)
2. 在抓取腳本 (`fetch-us-stocks.mjs` / `fetch-tw-fundamentals.mjs`) 的 extractFields() 加提取邏輯
3. 在 API (`api/us-screener.js` / `api/tw-screener.js`) 的 SQL SELECT 加欄
4. 在 `scoreTWStock()` 或 `scoreStock()` 加評分邏輯

#### 🚀 **測試新的掃描邏輯**

```bash
# 本地開發
npx vercel dev

# 編輯 screener.html 後，刷新瀏覽器自動重載

# 若涉及 API 邏輯改動（api/*.js），需重新部署
git push origin main
```

---

## 十二、常見 Bug & 調試

| 症狀 | 原因 | 解決方案 |
|------|------|---------|
| 🇹🇼 台股旗幟顯示成 🇺🇸 | `isTWStock` 判斷錯誤 | 檢查行 1477：用 `/^\d{4,5}$/` regex，不用 `dbData != null` |
| 掃描卡在「正在分析...」 | API 超時 | 檢查 DB 連線；若網路慢，增加 timeout（行 1130：`AbortSignal.timeout(30000)`) |
| M3 分數異常低 | 台股缺 MACD/MA20 | 正常現象；等 `update-tw-data.mjs` 跑幾次後自動修復 |
| 分析師目標異常大（如 2330.TW 745%） | ADR 單位混亂 | 需手動過濾（見上面「修復 ADR」段） |
| GitHub Actions 失敗 | DATABASE_URL 過期 或 GitHub Secret 不存在 | 檢查 Secrets；若過期，重新設定 |
| 前端 JS 報錯（Console 紅字） | 語法錯誤 | Ctrl+Shift+J 打開 DevTools，查看 error；大多是編輯後遺漏 `}` 或 `;` |

---

## 十三、架構決策 & 權衡

### 為什麼用 Neon DB 而非 Redis/Cache？

- **Neon**：持久化存儲，支援複雜 SQL JOIN，適合數據分析
- 代價：每次掃描需查詢，不如 Cache 快；但數據準確性更高

### 為什麼分 🇺🇸 + 🇹🇼？

- 美股用 Yahoo Finance 官方 API（快、數據全）
- 台股用 FinMind（免費，有政府補助）+ Yahoo 基本面（混合最優）

### 為什麼 M3 要正規化？

- 台股歷史包袱：tw_indicators 初期只算了 RSI/KD/MA5-10，缺 MACD/MA20+
- 若直接用 0 分會懲罰老股票，正規化按比例放大避免此問題
- 每日 `update-tw-data.mjs` 會修復舊數據

### 為什麼台股 M2 權重比美股高（30% vs 25%）？

- 台股基本面數據不如美股完整（分析師覆蓋率低）
- 提高 M2 權重補償，讓有基本面的股票更受青睞

---

## 十四、聯繫資訊 & 資源

| 資源 | URL / 備註 |
|------|-----------|
| **網站** | https://stock-analyzer-qfks.vercel.app |
| **GitHub** | https://github.com/nteverysome/stock-analyzer |
| **部署平台** | Vercel (自動部署) |
| **資料庫** | Neon PostgreSQL (ap-southeast-1) |
| **數據來源 (美股)** | Yahoo Finance API |
| **數據來源 (台股)** | FinMind + Yahoo Finance |
| **宏觀數據** | Benzinga Fear & Greed + Yahoo Finance VIX |

---

## 十五、版本履歷

| 版本 | 日期 | 重點 |
|------|------|------|
| v4.0 | 2026-04-05 | 美股 DB 快速掃描上線；2.7s → 26x 加速 |
| v3.5 | 2026-04-04 | 台股基本面 + M2 雙模式評分 |
| v3.0 | 2026-03-xx | 四層漏斗架構確定 |
| v2.0 | 2026-02-xx | 美股掃描上線 |
| v1.0 | 2026-01-xx | 台股掃描 MVP |

---

> 🎯 **最後貼士**：有任何卡住的地方，先檢查 Browser Console（F12）看是否有 JS 錯誤，再查 Network 看 API 回應。如果都沒問題，99% 是資料不齊全（等 GitHub Actions 跑完）或參數過濾太嚴格。

祝你好運！ 🚀
