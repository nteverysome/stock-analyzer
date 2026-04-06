# 🚀 完整執行計畫 - 從數據到可視化

## 📋 總體時間線

```
Phase 0: 補抓歷史數據            (60-120 分鐘)
  ├─ 補抓 5 年價格數據          (30-60 分鐘)
  └─ 計算歷史指標              (30-60 分鐘)

Phase 1-5: 開發可視化           (現在開始)
  ├─ 建立 K 線圖 API           (10 分鐘)
  ├─ 建立回測 API              (15 分鐘)
  ├─ 創建可視化頁面            (20 分鐘)
  ├─ 集成回測模組              (15 分鐘)
  └─ 測試驗證                  (30 分鐘)

總計：120-180 分鐘（2-3 小時）
```

---

## 🎯 Phase 0: 補抓歷史數據（你在終端執行）

### 步驟 1: 測試環境

```bash
cd c:\Users\Administrator\Desktop\sotke4

# 測試 2 支股票（1-2 分鐘）
node scripts/fetch-5years-history.mjs --test
```

**預期輸出**：
```
✅ 補抓完成！(120s)
   成功股票: 2 支
   總價格記錄: ~2,500 筆
```

---

### 步驟 2: 全量補抓（後台執行）

```bash
# 補抓所有 1,962 支股票的完整歷史（60-90 分鐘）
# ⚠️ 建議：在新終端執行，不要關閉
node scripts/fetch-5years-history.mjs > backfill_prices.log 2>&1 &

# 查看進度
tail -f backfill_prices.log
```

**預期結果**：
```
✅ 補抓完成！(5400s)
   成功股票: 1,962 支
   總價格記錄: ~5,000,000 筆
```

---

### 步驟 3: 計算指標

```bash
# 補抓完成後執行（60-90 分鐘）
node scripts/backfill-tw-indicators.mjs --history-full > backfill_indicators.log 2>&1 &

# 查看進度
tail -f backfill_indicators.log
```

**預期結果**：
```
✅ 完成！(5400s)
   成功股票: 1,962 支
   總記錄數: ~5,000,000 筆
```

---

### 步驟 4: 驗證數據

```bash
# 在 psql 或 Neon Console 執行
SELECT 
  'tw_daily_prices' as table_name, COUNT(*) as count FROM tw_daily_prices
UNION ALL
SELECT 'tw_indicators', COUNT(*) FROM tw_indicators;

-- 預期：
-- tw_daily_prices: ~5,000,000
-- tw_indicators: ~5,000,000
```

---

## 🔧 Phase 1-5: 開發（Agent 執行）

| Phase | 任務 | 文件 | 狀態 |
|-------|------|------|------|
| 1 | K 線圖 API | api/chart-data.js | ⏳ 待執行 |
| 2 | 回測 API | api/backtest.js | ⏳ 待執行 |
| 3 | 可視化頁面 | public/chart.html | ⏳ 待執行 |
| 4 | 回測模組 | public/chart.html | ⏳ 待執行 |
| 5 | 測試驗證 | — | ⏳ 待執行 |

---

## 📊 最終結果

執行完成後，你將擁有：

1. **5 年完整歷史數據**
   - ~5M 條價格記錄
   - ~5M 條技術指標

2. **K 線圖可視化**
   - 支持縮放、平移
   - 自定義時間範圍
   - 技術指標疊加

3. **回測評分系統**
   - 歷史評分展示
   - 勝率統計
   - 回報率分析
   - 風險指標

---

## 🎬 立即開始

### 你的任務（Phase 0）

在你的終端執行：
```bash
# 1. 進入項目目錄
cd c:\Users\Administrator\Desktop\sotke4

# 2. 測試環境
node scripts/fetch-5years-history.mjs --test

# 3. 如果測試通過，執行完整補抓（後台執行）
node scripts/fetch-5years-history.mjs > backfill_prices.log 2>&1 &

# 4. 補抓完成後，計算指標
node scripts/backfill-tw-indicators.mjs --history-full > backfill_indicators.log 2>&1 &

# 5. 驗證數據
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"
```

---

### 我的任務（Phase 1-5）

同步進行開發：
- ✅ 建立 API 端點
- ✅ 創建可視化頁面
- ✅ 集成回測功能
- ✅ 測試驗證

---

## 📞 需要幫助？

1. **數據補抓卡住**？
   - 檢查 `.env.local` 是否配置正確
   - 確認網路連接
   - 查看 log 文件：`tail -f backfill_prices.log`

2. **進度查詢**？
   - `tail -f backfill_prices.log` - 查看價格補抓進度
   - `tail -f backfill_indicators.log` - 查看指標計算進度

3. **隨時聯繫**
   - 補抓完成後告訴我，我立即開始 Phase 1-5
   - 有任何問題隨時問

---

**預計 Phase 0 完成時間：120-180 分鐘（2-3 小時）**
**Phase 1-5 並行開發，預計 1 小時完成**

讓我們開始吧！🚀
