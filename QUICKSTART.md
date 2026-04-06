# 🚀 快速開始指南 - K 線圖 & 回測系統

## 📋 3 個步驟，完整執行

### Step 1️⃣: 補抓「從上市以來」的所有歷史數據（3-4 小時）

在你的終端執行（建議後台執行）：

```bash
cd c:\Users\Administrator\Desktop\sotke4

# 1️⃣ 先測試環境（1-2 分鐘）
node scripts/fetch-5years-history.mjs --test
# 預期：✅ 補抓完成！(120s)

# 2️⃣ 全量補抓從上市以來的所有數據（後台，3-4 小時）
# 默認使用 --all 模式，抓取 1962 支股票的完整歷史（通常 10-20 年）
node scripts/fetch-5years-history.mjs > backfill.log 2>&1 &

# 3️⃣ 查看進度（實時監控）
tail -f backfill.log

# 4️⃣ 補抓完成後，計算歷史指標（後台，3-4 小時）
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1 &

# 5️⃣ 查看指標計算進度
tail -f indicators.log
```

**預期結果**:
```
✅ 補抓完成！
   成功股票: 1,962 支
   總記錄數: ~5,000,000 筆
```

---

### Step 2️⃣: 本地測試（5 分鐘）

數據補抓完成後：

```bash
# 啟動本地開發服務器
npx vercel dev

# 在瀏覽器打開
http://localhost:3000/chart.html
```

**預期畫面**:
- 📥 股票代碼輸入框
- 📅 日期範圍選擇
- 📈 K 線圖區域
- 📊 三個標籤：K線 / 指標 / 回測

---

### Step 3️⃣: 測試功能（3 分鐘）

在 `http://localhost:3000/chart.html`:

1. 輸入股票代碼：`2330`
2. 點擊「查詢」
   - 🎉 應該看到 K 線圖
   - 🎉 技術指標加載
   - 🎉 統計面板顯示

3. 點擊「回測評分」
   - 🎉 評分曲線出現
   - 🎉 勝率、報酬率顯示
   - 🎉 回測統計完整

---

## 🎯 功能概覽

### K 線圖功能
- ✅ 蠟燭圖視覺化（最近 100 天）
- ✅ 時間範圍自由篩選
- ✅ 支持所有 1,962 支台股

### 技術指標
- ✅ RSI(14)
- ✅ MACD(12,26,9)
- ✅ KD(9,3,3)
- ✅ MA5/10/20/60/120
- ✅ 同步顯示、互動查看

### 回測系統
- ✅ 歷史評分計算
- ✅ 買入信號識別
- ✅ 勝率統計
- ✅ 5 日報酬率
- ✅ 風險指標分析

---

## 📱 API 端點

### K 線圖數據
```bash
GET /api/chart-data?symbol=2330&start_date=2024-01-01&limit=100

# 返回：OHLCV + 所有技術指標
```

### 回測評分
```bash
GET /api/backtest?symbol=2330&start_date=2024-01-01

# 返回：歷史評分 + 績效統計
```

---

## 🔧 部署到生產

數據補抓完成 + 本地測試通過後：

```bash
# 提交變更
git add .
git commit -m "feat: Add K-line chart and backtest system

- Add /api/chart-data.js for OHLCV visualization
- Add /api/backtest.js for score backtest
- Add /public/chart.html for full UI integration
- Add data backfill scripts for 5-year history"

# 推送到 GitHub
git push origin main

# Vercel 自動部署（約 90 秒）
# 部署完成後訪問：https://stock-analyzer-qfks.vercel.app/chart.html
```

---

## 🚨 常見問題

### Q: 數據補抓要多久？
A: 120-180 分鐘（2-3 小時）。1,962 支股票，FinMind 有速率限制。

### Q: 補抓失敗怎麼辦？
A: 檢查 `backfill.log` 和 `indicators.log`，再執行一次（會自動跳過已有數據）。

### Q: K 線圖沒有顯示？
A: 確認數據補抓完成：
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"
```

### Q: 如何修改回測評分邏輯？
A: 編輯 `api/backtest.js` 的 `computeDailyScore()` 函數。

### Q: 支持多少支股票？
A: 所有 1,962 支台股（補抓完成後）。

---

## 📊 預期數據規模

| 項目 | 數量 |
|------|------|
| 股票支數 | 1,962 支 |
| 價格記錄 | ~5,000,000 筆 |
| 技術指標 | ~5,000,000 筆 |
| 存儲空間 | ~800MB |
| 加載時間 | <2 秒 |

---

## ✅ 完成檢查表

- [ ] Phase 0 數據補抓完成
- [ ] `npx vercel dev` 啟動正常
- [ ] K 線圖正確顯示
- [ ] 技術指標加載
- [ ] 回測評分計算
- [ ] 統計數據正確
- [ ] 所有股票查詢有效
- [ ] 部署到生產

---

## 🎉 完成後

恭喜！你現在擁有：

✅ **專業級 K 線圖系統**  
✅ **完整的技術指標分析**  
✅ **強大的回測評分引擎**  
✅ **5 年+ 完整歷史數據**  
✅ **支持 1,962 支台股**  

可以開始進行深度技術分析、回測優化、風險評估了！

---

**需要幫助？查看：**
- `BACKFILL_GUIDE.md` - 詳細補抓指南
- `EXECUTION_PLAN.md` - 完整執行計畫
- `PHASE_COMPLETION_REPORT.md` - 技術細節
