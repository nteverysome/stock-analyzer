# 🔄 台股完整歷史數據回填指南

## 📊 方案概述

從 **上市以來的完整歷史** 抓取台股數據（通常 10-20 年），進行完整的技術指標計算。

```
第 1 步：補抓歷史價格  (FinMind)
  ├─ 時間範圍：2000-01-01 ~ 今日
  ├─ 目標表：tw_daily_prices
  └─ 預估：60-90 分鐘（1,962 支股票）

第 2 步：計算歷史指標  (本地計算)
  ├─ 指標：RSI, KD, MACD, MA5/10/20/60/120
  ├─ 目標表：tw_indicators
  └─ 預估：60-90 分鐘（1,962 支 × 平均 2,500 日）
  
總計：120-180 分鐘（2-3 小時）
```

---

## 🚀 快速開始

### 選項 A：完整歷史（推薦）

```bash
# 1. 測試補抓（2 支股票，所有歷史）
node scripts/fetch-5years-history.mjs --test

# 2. 檢查結果
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"

# 3. 全量補抓（後台執行，60-90 分鐘）
node scripts/fetch-5years-history.mjs

# 4. 測試計算指標（2 支股票）
node scripts/backfill-tw-indicators.mjs --history-full --test

# 5. 全量計算指標（後台執行，60-90 分鐘）
node scripts/backfill-tw-indicators.mjs --history-full
```

### 選項 B：只要 5 年

```bash
# 更快速的版本（30-40 分鐘）
node scripts/fetch-5years-history.mjs --5year
node scripts/backfill-tw-indicators.mjs --history-full
```

---

## 📈 數據規模估計

| 項目 | 120 日 | 5 年 | 完整歷史 |
|------|--------|-------|---------|
| 每支股票日期數 | ~120 | ~1,260 | ~2,500 |
| 總價格記錄 | 236K | 2.4M | **5M+** |
| 總指標記錄 | 236K | 2.4M | **5M+** |
| 補抓時間 | 5 分鐘 | 30-40 分鐘 | **60-90 分鐘** |
| 計算時間 | 10-15 分鐘 | 30-45 分鐘 | **60-90 分鐘** |
| 數據庫大小 | ~100MB | ~500MB | **~800MB** |

---

## 📝 詳細執行步驟

### Step 1: 補抓歷史價格

```bash
# 模式 A: 從上市以來（默認）
node scripts/fetch-5years-history.mjs

# 模式 B: 只要 5 年（快速）
node scripts/fetch-5years-history.mjs --5year

# 測試模式
node scripts/fetch-5years-history.mjs --test

# 限制數量（測試）
node scripts/fetch-5years-history.mjs --limit 100
```

**預期輸出**：
```
✅ 補抓完成！(5400s)
   成功股票: 1,962 支
   跳過股票: 0 支
   失敗股票: 0-5 支
   總價格記錄: ~5,000,000 筆
```

---

### Step 2: 計算指標

```bash
# 完整歷史模式（推薦）
node scripts/backfill-tw-indicators.mjs --history-full

# 只最新一天（快速）
node scripts/backfill-tw-indicators.mjs --history-latest

# 測試模式
node scripts/backfill-tw-indicators.mjs --history-full --test

# 限制數量
node scripts/backfill-tw-indicators.mjs --history-full --limit 100
```

**預期輸出**：
```
✅ 完成！(5400s)
   成功股票: 1,962 支
   跳過股票: 0 支
   失敗股票: 0-5 支
   總記錄數: ~5,000,000 筆
```

---

## ✅ 驗證結果

```bash
# 查詢數據量
psql $DATABASE_URL << EOF
SELECT 'tw_daily_prices' as table_name, COUNT(*) as record_count FROM tw_daily_prices
UNION ALL
SELECT 'tw_indicators', COUNT(*) FROM tw_indicators;

-- 查看日期範圍
SELECT 
  MIN(price_date) as earliest_date,
  MAX(price_date) as latest_date,
  COUNT(*) as total_records
FROM tw_daily_prices;

-- 查看每支股票的記錄數
SELECT symbol, COUNT(*) as price_count, COUNT(DISTINCT indicator_date) as indicator_count
FROM tw_daily_prices
LEFT JOIN tw_indicators USING(symbol)
GROUP BY symbol
ORDER BY price_count DESC
LIMIT 10;
EOF
```

---

## ⚠️ 重要注意

1. **FinMind 速率限制**
   - 每秒最多 ~5 個請求
   - 補抓 1,962 支 × 5-20 年 需要 60-90 分鐘
   - **不要並行執行多個腳本**

2. **網路穩定性**
   - 長時間運行，建議在穩定網路環境執行
   - 如果中斷，重新執行會自動跳過已有數據

3. **資料庫空間**
   - ~800MB 數據（在 Neon 免費版 3GB 額度內）

4. **可恢復性**
   - 腳本使用 `ON CONFLICT DO NOTHING` / `DO UPDATE`
   - 中途中斷可重新執行，會自動去重

---

## 🎯 後續應用

完整歷史數據後，你可以：

1. **回測評分模型**
   - 驗證過去 5-10 年的評分準確性
   - 優化評分權重

2. **分析市場週期**
   - 看指標在熊市/牛市的表現
   - 調整 RSI、MACD 的敲邊球

3. **個股深度分析**
   - 完整的技術面歷史
   - 支持 K 線圖繪製

4. **風險管理**
   - 統計歷史勝率、平均漲幅
   - 計算最大回撤

---

## 🆘 常見問題

**Q: 為什麼補抓這麼慢？**
A: FinMind 有速率限制（~5 req/s）。1,962 支 × 平均 2,500 日 = 需要逐筆爬取。

**Q: 可以並行執行加快速度嗎？**
A: 不建議。會觸發 FinMind 的限速保護，反而更慢。

**Q: 中途中斷怎麼辦？**
A: 重新執行同一個命令，會自動跳過已有數據。

**Q: 需要的磁盤空間有多大？**
A: ~800MB (Neon 免費版有 3GB，足夠)

**Q: 如何驗證數據完整性？**
A: 見上面「驗證結果」段落的 SQL 查詢

---

## 📞 需要幫助？

1. 檢查 `.env.local` 是否配置 `DATABASE_URL`
2. 確保 `npm install` 已完成
3. 在終端執行 `--test` 版本先測試連接
4. 查看完整日誌：`node scripts/... 2>&1 | tee backfill.log`
