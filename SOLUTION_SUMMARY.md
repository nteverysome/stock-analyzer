# ✅ 問題診斷和解決方案

## 🔍 目前情況

| 項目 | 狀態 |
|------|------|
| ping api.finmind.ai | ✅ 成功（能連接） |
| fetch/axios 調用 | ❌ ECONNRESET（TLS 握手失敗） |
| 可能原因 | **FinMind API 限制了 Node.js 客戶端** |

---

## 💡 根本原因分析

FinMind API 可能：
1. ❌ 阻止 Node.js 的 fetch/axios 連接
2. ❌ 對某些 User-Agent 有限制
3. ❌ 需要特定的請求頭
4. ❌ 有反爬蟲機制

---

## 🎯 解決方案

### **方案 1️⃣ : 使用模擬數據驗證系統（推薦）**

既然網路無法連接，先用**模擬數據**驗證整個系統是否正常工作：

```bash
# 1. 生成模擬數據（10 支股票，2 年歷史）
node scripts/generate-mock-data.mjs

# 2. 計算技術指標
node scripts/backfill-tw-indicators.mjs --history-full

# 3. 檢查數據
node check-progress-simple.mjs

# 4. 啟動開發服務器
npm run dev

# 5. 訪問 K 線圖
http://localhost:3000/chart.html
```

**優點**：
- ✅ 驗證 K 線圖是否正常顯示
- ✅ 驗證回測功能是否正常工作
- ✅ 驗證所有 API 是否正常
- ✅ 完全本地操作，無需網路

---

### **方案 2️⃣ : 使用代理或 VPN**

如果需要真實數據：

1. **使用代理服務**
   ```bash
   # 設置代理環境變數
   set HTTP_PROXY=http://proxy-server:port
   set HTTPS_PROXY=http://proxy-server:port
   
   # 然後重試補抓
   node scripts/fetch-5years-history.mjs --test
   ```

2. **使用 VPN**
   - 連接到 VPN
   - 重試補抓

3. **更換網路環境**
   - 在家用網路試試
   - 在咖啡館試試

---

### **方案 3️⃣ : 其他 API 來源（未來計劃）**

- 使用 Yahoo Finance API
- 使用 Alpha Vantage API
- 使用台灣證交所官網數據
- 使用其他開源數據源

---

## 📝 立即行動計劃

### **第一步：驗證系統（5 分鐘）**

```bash
# 生成 10 支股票的 2 年模擬數據
node scripts/generate-mock-data.mjs
```

預期輸出：
```
🧪 生成測試模擬數據
✅ 生成 2330 的數據... 500 條
✅ 生成 2317 的數據... 500 條
...
🎉 模擬數據生成完成！
   • 10 支股票
   • 時間範圍：約 2 年歷史
   • 每支股票：約 500 條交易日數據
   • 總計：約 5,000 條價格記錄
```

### **第二步：計算指標（10 分鐘）**

```bash
# 計算所有歷史指標
node scripts/backfill-tw-indicators.mjs --history-full
```

### **第三步：驗證數據（1 分鐘）**

```bash
# 檢查現有數據
node check-progress-simple.mjs
```

預期輸出：
```
🔍 補抓進度檢查

📥 價格記錄進度
   [████████████████████] 100%
   5,000 / 10,000,000 筆
   狀態: ✅ 有模擬數據

📈 技術指標進度
   [████████████████████] 100%
   5,000 / 10,000,000 筆
   狀態: ✅ 已計算
```

### **第四步：測試頁面（2 分鐘）**

```bash
# 啟動開發服務器
npm run dev

# 在瀏覽器打開
http://localhost:3000/chart.html
```

預期看到：
- K 線圖正常顯示
- 技術指標（RSI、MACD、KD）正常
- 回測功能正常工作

---

## 🔄 後續步驟

當網路問題解決後：

1. **清除模擬數據**
   ```sql
   DELETE FROM tw_daily_prices WHERE symbol IN (SELECT symbol FROM tw_stocks LIMIT 10);
   DELETE FROM tw_indicators WHERE symbol IN (SELECT symbol FROM tw_stocks LIMIT 10);
   ```

2. **重新補抓真實數據**
   ```bash
   node scripts/fetch-5years-history.mjs --test
   node scripts/fetch-5years-history.mjs  # 全量
   ```

3. **計算指標**
   ```bash
   node scripts/backfill-tw-indicators.mjs --history-full
   ```

---

## ✅ 建議

**現在就用模擬數據驗證系統！**

這樣可以：
1. ✅ 確認系統是否正常工作
2. ✅ 看到 K 線圖和回測功能
3. ✅ 後續網路問題解決時，直接用真實數據替換

**你想開始嗎？** 👇

```bash
node scripts/generate-mock-data.mjs
```
