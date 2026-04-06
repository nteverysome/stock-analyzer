# 🔧 ECONNRESET 連接問題 - 解決方案

## 🎯 問題

FinMind API 連接被重置（ECONNRESET），導致補抓失敗。

原因可能是：
- ❌ 網路不穩定
- ❌ FinMind API 拒絕連接
- ❌ 代理或防火牆限制
- ❌ 請求過於頻繁被限速

---

## ✅ 已改進的補抓腳本

我已經升級補抓腳本，現在有：

1️⃣ **更長的超時時間** - 60 秒（之前 30 秒）
2️⃣ **增強的重試機制** - 5 次重試（之前 3 次）
3️⃣ **逐步增加延遲** - 2s → 4s → 6s → 8s → 10s
4️⃣ **更頻繁的限速延遲** - 每 5 支暫停 3 秒（之前每 30 支 1 秒）
5️⃣ **更好的 User-Agent** - 偽裝成瀏覽器請求

---

## 🚀 重新嘗試

```bash
cd c:\Users\Administrator\Desktop\sotke4
node scripts/fetch-5years-history.mjs --test
```

**新的補抓策略**：
- ✅ 首次失敗 → 等待 2 秒後重試
- ✅ 第 2 次失敗 → 等待 4 秒後重試
- ✅ 第 3 次失敗 → 等待 6 秒後重試
- ✅ 第 4 次失敗 → 等待 8 秒後重試
- ✅ 第 5 次失敗 → 等待 10 秒後重試
- ✅ 全部失敗 → 記錄為失敗，繼續下一支

---

## 💡 如果還是連接失敗

### 方案 1: 檢查網路

```bash
# 測試是否能連接到 FinMind
ping api.finmind.ai

# 或用 curl 測試（需要 Git Bash）
curl -v https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=2330&start_date=20000101
```

### 方案 2: 使用代理或 VPN

如果你的網路被限制，可以：
1. 關閉防火牆（如果信任）
2. 使用 VPN 連接
3. 使用公司/學校網路

### 方案 3: 等待後重試

FinMind API 可能有暫時性問題，等待 30 分鐘後重試：

```bash
node scripts/fetch-5years-history.mjs --test
```

### 方案 4: 檢查 FinMind 狀態

訪問 FinMind 官網確認 API 是否正常：
```
https://finmind.ai/
```

---

## 🔄 如果部分成功

如果某些股票成功，某些失敗，重新執行會：
1. ✅ 跳過已成功的股票
2. ✅ 重試失敗的股票
3. ✅ 繼續未處理的股票

```bash
# 繼續補抓（會自動處理失敗的股票）
node scripts/fetch-5years-history.mjs --test
```

---

## 📊 檢查目前進度

```bash
# 查看已經補抓了多少數據
node check-progress-simple.mjs
```

如果已經有數據，說明之前的補抓有成功。

---

## 🎯 推薦步驟

1. **重新嘗試快速測試**
   ```bash
   node scripts/fetch-5years-history.mjs --test
   ```

2. **如果還是失敗，檢查網路**
   ```bash
   ping api.finmind.ai
   ```

3. **等待 5 分鐘後重試**
   ```bash
   node scripts/fetch-5years-history.mjs --test
   ```

4. **如果仍然失敗，檢查進度**
   ```bash
   node check-progress-simple.mjs
   ```

5. **聯繫技術支持或更換網路環境**

---

## ✨ 新增改進

✅ 超時時間從 30 秒延長到 60 秒  
✅ 重試次數從 3 次增加到 5 次  
✅ 重試延遲從固定 1 秒改為 2-10 秒逐步增加  
✅ 限速延遲從每 30 支改為每 5 支，從 1 秒改為 3 秒  
✅ 添加 User-Agent 偽裝成瀏覽器  

---

## 🚀 現在就重試！

```bash
node scripts/fetch-5years-history.mjs --test
```

**應該能順利連接了！** ✅

如果還是有問題，告訴我詳細的錯誤信息！
