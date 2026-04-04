# 別人怎麼做的？ 業界最佳實踐總結

## 🏆 台灣股票篩選平台對比

### 1. 麻瓜股 (mugglestock.com) - 最專業 ⭐⭐⭐⭐⭐
```
架構：爬蟲 + 本地計算 + Web UI

數據流：
  每晚 23:00
    ↓ TWSE 官方數據爬蟲
    ↓ 解析 HTML/API
    ↓ 計算 KD、均線、RSI、MACD、乖離率
    ↓ 存入 PostgreSQL 數據庫
    ↓
  白天用戶訪問
    ↓ 前端篩選
    ↓ 排序、統計
    ↓ 生成報告

技術指標：
  ✅ KD 線（隨機指數）
  ✅ 均線系統（5/10/20/60/120 日線）
  ✅ RSI（相對強度指數）
  ✅ MACD（指數平滑異同移動平均線）
  ✅ 乖離率（股價與均線的偏離程度）
  ✅ 成交量變化
  ✅ 買賣評分（1-10 星）
  
特點：
  - 完全免費使用
  - 每日自動更新
  - 台灣本土化
  - UI 簡潔實用
```

### 2. TradingView - 全球最大 ⭐⭐⭐⭐⭐
```
架構：多交易所 API + CDN + 前端計算

數據流：
  多個交易所 Official API
    ↓ 實時 Level 1/2/3 數據
    ↓ CDN 分發
    ↓ 前端 Canvas 即時繪圖
    ↓ JavaScript 計算 50+ 指標
    ↓
  用戶可視化
    ↓ 圖表、熱力圖、指標
    ↓ 製作告警規則

技術特點：
  - 實時數據（秒級更新）
  - 前端計算指標（無伺服器壓力）
  - 強大的圖表引擎
  - 模組化架構
  
收費模式：
  - 免費版：延遲 15 分鐘
  - 付費版：實時數據
```

### 3. 國内證券公司 App（富途、同花順等）
```
架構：多層 API + 行情服務器 + 數據倉庫

特點：
  - 多 API 源（交易所 + 行情商）
  - 本地行情緩存
  - 複雜的指標計算引擎
  - 實時推送（WebSocket）
  - 機構級別數據安全
```

---

## 🎯 你應該採用的做法（最實用）

### **最像業界的方案：Vercel KV + 定時爬蟲**

```
模仿麻瓜股 + TradingView 的優點

Step 1: 每晚定時爬蟲（類似麻瓜股）
  GitHub Actions @23:00
    ↓
  爬蟲腳本（Python/Node.js）
    ↓ FinMind API 取 292 隻台股 OHLCV
    ↓ 計算 M1-M5（5/10/20/60/120 日均線）
    ↓ 計算 KD、RSI、MACD（可選）
    ↓
  結果存入 Vercel KV Store
    
Step 2: 白天即時查詢（類似 TradingView）
  用戶訪問 screener.html
    ↓
  前端呼叫 /api/indicators?symbols=2330,2317
    ↓
  後端直接從 KV 讀取（毫秒級）
    ↓
  前端篩選、排序、可視化
    ↓
  生成投資建議清單

成本：
  - ✅ 完全免費（Vercel KV 5GB 免費層足夠）
  - ✅ 執行時間短（爬蟲只需 30-60s）
  - ✅ 查詢無成本（KV Store Redis）

優點：
  ✅ 架構與麻瓜股相同
  ✅ 查詢速度如 TradingView 快速
  ✅ 成本為零
  ✅ 無 Vercel 60s 函數限制困擾
  ✅ 用戶體驗最佳
```

---

## 💡 具體實現方案（推薦）

### **新增 3 個文件**

#### 1. `.github/workflows/update-indicators.yml`（爬蟲任務）
```yaml
name: Daily Market Data Update
on:
  schedule:
    - cron: '0 23 * * *'  # 每晚 23:00 執行

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pip install finmind twstock
      - run: python scripts/update_indicators.py
      - run: python scripts/push_to_kv.py
```

#### 2. `scripts/update_indicators.py`（核心爬蟲）
```python
# 核心邏輯
1. 取得 292 隻台股清單
2. 並行呼叫 FinMind API 取 OHLCV
3. 計算 M1-M5（移動平均線）
4. 計算 KD、RSI、MACD（可選）
5. 生成 JSON
6. 推送到 Vercel KV Store
```

#### 3. `api/indicators.js`（查詢 API）
```javascript
// GET /api/indicators?symbols=2330,2317,2454
// 返回 JSON:
{
  "2330": {
    "name": "台積電",
    "price": 452.5,
    "m1": 450.2,     // 5日均線
    "m2": 448.5,     // 10日均線
    "m3": 445.0,     // 20日均線
    "m4": 440.0,     // 60日均線
    "m5": 435.0,     // 120日均線
    "kd": 72,        // KD值
    "rsi": 65,       // RSI
    "macd": 8.5,     // MACD
    "signal": "買入" // AI 評分
  }
}
```

---

## 🚀 實現時間預估

| 步驟 | 時間 | 難度 |
|------|------|------|
| 1. 設置 Vercel KV | 5 分鐘 | ⭐ |
| 2. 編寫爬蟲腳本 | 30 分鐘 | ⭐⭐ |
| 3. 創建 /api/indicators 端點 | 15 分鐘 | ⭐ |
| 4. 設置 GitHub Actions | 10 分鐘 | ⭐ |
| 5. 前端篩選 UI | 30 分鐘 | ⭐⭐ |
| **總計** | **90 分鐘** | ⭐⭐ |

---

## 📊 你現在有的 vs 還缺的

### ✅ 已有
- `screener.html` 前端 UI（完整）
- `/api/screener` 台股清單端點（292 隻）
- 4 模組決策框架（M1-M4）

### ❌ 還缺
- OHLCV 數據源
- 技術指標計算（M1-M5、KD、RSI、MACD）
- 快取 / KV Store 整合
- 爬蟲 + GitHub Actions
- 篩選邏輯

---

## 🎯 現在該做什麼？

### **你想要我立即實現：**

1. **5 分鐘快速**：驗證 FinMind API 在你環境是否可用
2. **30 分鐘方案**：創建 /api/indicators（用 FinMind 或本地計算）
3. **90 分鐘完整**：爬蟲 + KV Store + 前端（完全模仿業界做法）
4. **2 小時終極**：加上 M1-M5 的深度分析 + AI 投資建議

**哪一個最符合你的需求？** 👍
