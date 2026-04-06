# 📈 K 線圖 & 技術指標回測系統

## 🎯 系統概述

完整的股票K線圖可視化 + 技術指標回測平台，支持 1,962 支台股，包含 5 年+ 完整歷史數據。

### 核心特性

- 📊 **專業 K 線圖** - 蠟燭圖視覺化，支持時間範圍篩選
- 📈 **技術指標** - RSI、MACD、KD、MA 同步顯示
- 🔄 **回測系統** - 歷史評分、勝率、報酬率統計
- 💾 **完整歷史** - 5,000,000+ 條歷史數據
- 🌐 **全覆蓋** - 支持所有 1,962 支台股

---

## 🚀 快速開始

### 1. 補抓歷史數據（2-3 小時）

```bash
cd c:\Users\Administrator\Desktop\sotke4

# 測試環境
node scripts/fetch-5years-history.mjs --test

# 全量補抓（後台執行）
node scripts/fetch-5years-history.mjs > backfill.log 2>&1 &

# 補抓完成後，計算指標
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1 &
```

### 2. 本地測試（5 分鐘）

```bash
npx vercel dev
# 訪問：http://localhost:3000/chart.html
```

### 3. 生產部署

```bash
git push origin main
# Vercel 自動部署（~90 秒）
```

---

## 📁 文件結構

```
api/
├── chart-data.js        # K 線圖數據 API
└── backtest.js          # 回測評分 API

public/
├── chart.html           # 可視化頁面 (K線 / 指標 / 回測)
└── (其他頁面)

scripts/
├── fetch-5years-history.mjs      # 補抓歷史價格
└── backfill-tw-indicators.mjs    # 計算技術指標
```

---

## 🔌 API 文檔

### /api/chart-data

**用途**: 獲取 K 線圖數據

**請求**:
```bash
GET /api/chart-data?symbol=2330&start_date=2024-01-01&end_date=2024-12-31&limit=100
```

**響應**:
```json
{
  "success": true,
  "symbol": "2330",
  "count": 100,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "candles": [
    {
      "date": "2024-01-01",
      "open": 567.0,
      "high": 570.0,
      "low": 565.0,
      "close": 569.0,
      "volume": 15000000,
      "rsi": 45.2,
      "kdFast": 42.5,
      "kdSlow": 48.0,
      "macd": 0.1234,
      "macdSignal": 0.1100,
      "ma5": 568.5,
      "ma20": 560.0,
      ...
    }
  ]
}
```

### /api/backtest

**用途**: 計算歷史評分和績效統計

**請求**:
```bash
GET /api/backtest?symbol=2330&start_date=2024-01-01&end_date=2024-12-31
```

**響應**:
```json
{
  "success": true,
  "symbol": "2330",
  "backtest": {
    "totalDays": 250,
    "buySignals": 45,
    "wins": 28,
    "losses": 17,
    "winRate": 62.22,
    "avgReturn": 1.45,
    "totalReturn": 65.25
  },
  "history": [
    {
      "date": "2024-01-01",
      "close": 569.0,
      "score": 72.5,
      "isBuySignal": true,
      "rsi": 45.2,
      "kdFast": 42.5,
      "macd": 0.1234,
      "ma20": 560.0,
      "dayReturn": 1.23
    }
  ]
}
```

---

## 💡 使用示例

### 查詢特定股票的 K 線圖

在 `http://localhost:3000/chart.html`:

1. 輸入 `2330`
2. 選擇日期範圍
3. 點擊「查詢」
4. 查看 K 線圖和技術指標

### 回測評分績效

1. 輸入股票代碼
2. 點擊「回測評分」
3. 查看「勝率」、「平均報酬」、「總報酬」

---

## 🧪 測試

### 單位測試

```bash
# 測試 chart-data API
curl "http://localhost:3000/api/chart-data?symbol=2330&limit=50"

# 測試 backtest API
curl "http://localhost:3000/api/backtest?symbol=2330"
```

### 集成測試

```bash
npx vercel dev
# 訪問 http://localhost:3000/chart.html
# 手動測試所有功能
```

---

## 🎓 技術棧

- **前端**: HTML5 + Chart.js
- **後端**: Node.js + Vercel Serverless
- **資料庫**: Neon PostgreSQL
- **數據源**: FinMind API

---

## 📊 數據規模

- **股票數**: 1,962 支
- **歷史日期**: 5 年+ (~1,260+ 交易日)
- **價格記錄**: ~5,000,000 筆
- **技術指標**: ~5,000,000 筆
- **存儲空間**: ~800MB

---

## 🔧 定製化

### 修改回測評分邏輯

編輯 `api/backtest.js` 中的 `computeDailyScore()` 函數：

```javascript
function computeDailyScore(row) {
  let score = 0;
  // RSI 權重
  const rsi = row.rsi ? parseFloat(row.rsi) : 50;
  if (rsi < 30) score += 15; // 修改這裡
  // ... 更多邏輯
  return Math.min(100, score);
}
```

### 修改 K 線圖顏色

編輯 `public/chart.html` 中的色彩配置：

```javascript
borderColor: '#378ADD',  // 修改這個顏色值
backgroundColor: 'rgba(55, 138, 221, 0.1)'  // 背景色
```

---

## 📞 常見問題

**Q: K 線圖沒有顯示數據？**
A: 確認數據補抓完成：
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"
```

**Q: 回測評分不準確？**
A: 編輯 `computeDailyScore()` 調整權重。

**Q: 如何加入新指標？**
A: 在 `chart-data.js` 查詢中添加欄位，在 `backtest.js` 加入計算邏輯。

---

## 📝 支持的股票

所有 1,962 支台股（補抓完成後）

例如：2330, 2317, 2454, 2308, 2382, 1101, ...

---

**祝你使用愉快！** 🚀
