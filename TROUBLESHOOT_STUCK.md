# 🔧 補抓卡住 - 故障排除

## 🎯 如果補抓卡在 "Step 2" 

我已經改進了腳本，現在會**顯示每支股票的詳細狀態**，你能看到：

- ✅ 正在補抓哪支股票
- ✅ 補抓了多少筆數據
- ✅ 是否插入成功
- ✅ 失敗原因
- ✅ 重試狀態

---

## 🚀 重新開始（改進版本）

```bash
cd c:\Users\Administrator\Desktop\sotke4
node scripts/fetch-5years-history.mjs
```

**現在會看到詳細進度**：

```
⬇️  Step 2: 從 FinMind 補抓歷史價格...

   正在補抓 2330... ✅ 補抓 5200 筆，插入 5200 筆
   正在補抓 2317... ✅ 補抓 4800 筆，插入 4800 筆
   正在補抓 2454... ⏭️  無數據
   正在補抓 2308... ✅ 補抓 3500 筆，插入 3500 筆
   
   [████████░░░░░░░░░░░░] 50% | [1000/1962] | ✅950 ⏭️50 ❌0 | 2,000,000 筆 | ETA: 1m30s
```

---

## 🛠️ 如果還是卡住

### 檢查 1: 網路連接

```bash
# 測試是否能連接 FinMind
ping api.finmind.ai

# 或用 curl 測試（如果安裝了 Git Bash）
curl -I https://api.finmind.ai/api/v4/data
```

### 檢查 2: 只試補抓 2 支股票

```bash
# 快速測試版本
node scripts/fetch-5years-history.mjs --test
```

預期：1-2 分鐘內完成，顯示詳細進度

### 檢查 3: 查看是否有數據

```bash
# 檢查已有多少數據
node check-progress-simple.mjs
```

如果已有數據，重新執行會從中斷處繼續

---

## 💡 常見原因

| 原因 | 症狀 | 解決方案 |
|------|------|---------|
| FinMind 速率限制 | 卡住 30+ 秒 | 等待，重新執行會繼續 |
| 網路連接慢 | 進度很慢 | 檢查網路，或選擇在網速好的時候執行 |
| API 超時 | 卡 30 秒後繼續 | 正常，已有重試機制 |
| 資料庫連接問題 | 顯示 DB 錯誤 | 檢查 .env.local 配置 |

---

## ✅ 改進內容

✅ **每支股票顯示狀態** - 知道在補抓哪支股票  
✅ **重試機制** - API 失敗會自動重試 3 次  
✅ **詳細錯誤信息** - 顯示失敗原因  
✅ **數據插入統計** - 顯示補抓 vs 插入的筆數  
✅ **限速提示** - 顯示何時進行限速延遲  

---

## 🚀 立即重試

```bash
node scripts/fetch-5years-history.mjs
```

**現在會看到詳細進度，知道每一步在幹什麼！** ✅

---

## 📞 如果還有問題

1. **執行快速測試**
   ```bash
   node scripts/fetch-5years-history.mjs --test
   ```

2. **查看詳細進度**
   ```bash
   node check-progress-simple.mjs
   ```

3. **檢查日誌**
   ```bash
   node scripts/fetch-5years-history.mjs > fetch.log 2>&1
   # 查看 fetch.log 文件
   ```

---

**準備好了嗎？重新開始補抓吧！** 🚀
