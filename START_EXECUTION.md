# 🚀 立即執行 - 完整歷史數據補抓

## 最簡單的方式

打開 PowerShell 或 CMD，複製粘貼下面的命令：

---

## 📋 執行步驟

### 步驟 1️⃣：進入項目目錄

```powershell
cd c:\Users\Administrator\Desktop\sotke4
```

### 步驟 2️⃣：檢查環境（30 秒）

```powershell
node --version
npm --version
npm install
```

### 步驟 3️⃣：測試補抓（1-2 分鐘）

```powershell
node scripts/fetch-5years-history.mjs --test
```

**預期看到**:
```
✅ 補抓完成！(120s)
   成功股票: 2 支
   總價格記錄: ~2,500 筆
```

如果看到這個，說明環境正常！繼續下一步 ↓

---

### 步驟 4️⃣：全量補抓（3-4 小時）

```powershell
node scripts/fetch-5years-history.mjs > backfill.log 2>&1
```

**這會**:
- 補抓 1,962 支台股的完整歷史
- 輸出日誌到 `backfill.log`
- 預計 3-4 小時完成

**不要關閉終端**，等待完成

---

### 步驟 5️⃣：補抓完成後，計算指標（3-4 小時）

當看到以下信息時表示補抓完成：

```
✅ 補抓完成！(14400s)
   成功股票: 1,962 支
   總價格記錄: ~10,000,000 筆
```

然後執行：

```powershell
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

**不要關閉終端**，等待完成

---

### 步驟 6️⃣：驗證數據（可選）

指標計算完成後，驗證數據：

```powershell
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tw_daily_prices;"
```

**預期**:
```
count
──────────
 10000000
(1 row)
```

---

### 步驟 7️⃣：本地測試（10 分鐘）

指標計算完成後，啟動本地開發服務器：

```powershell
npx vercel dev
```

在瀏覽器打開：
```
http://localhost:3000/chart.html
```

**測試**:
- [ ] 輸入 `2330` 查詢
- [ ] K 線圖顯示
- [ ] 技術指標加載
- [ ] 回測評分計算
- [ ] 統計數據展示

---

### 步驟 8️⃣：部署到生產（可選）

測試通過後：

```powershell
git add .
git commit -m "feat: Add complete historical K-line and backtest system"
git push origin main
```

Vercel 自動部署（~90 秒）

---

## ⏱️ 時間預估

```
Step 2️⃣  檢查環境      : 30 秒
Step 3️⃣  測試補抓      : 1-2 分鐘    ✅
Step 4️⃣  全量補抓      : 3-4 小時   ⏳
Step 5️⃣  計算指標      : 3-4 小時   ⏳
Step 6️⃣  驗證數據      : 1 分鐘     ✅
Step 7️⃣  本地測試      : 10 分鐘    ✅
Step 8️⃣  部署生產      : 2 分鐘     ✅
─────────────────────────────────────
總計                    : 6-8 小時
```

---

## 💡 提示

### 後台執行（不佔用終端）

如果想在補抓期間做其他工作，使用：

```powershell
# 開新的 PowerShell 窗口，執行：
Start-Process powershell -ArgumentList "cd c:\Users\Administrator\Desktop\sotke4; node scripts/fetch-5years-history.mjs | Out-File backfill.log"

# 回到原窗口，監控進度：
Get-Content backfill.log -Tail 10 -Wait
```

或使用 tmux (如果安裝了):

```bash
tmux new-session -d "node scripts/fetch-5years-history.mjs > backfill.log 2>&1"
tmux attach
```

---

## 🚨 常見問題

**Q: 錯誤 "找不到 node"?**
A: 
```powershell
node --version  # 檢查是否安裝
# 如果沒有，下載安裝：https://nodejs.org
```

**Q: 錯誤 "DATABASE_URL not found"?**
A: 檢查 `.env.local` 是否存在且配置正確

**Q: 想中途停止?**
A: 按 `Ctrl+C` 停止，重新執行時會自動跳過已有數據

**Q: 想查看進度?**
A:
```powershell
# 另開一個終端窗口，執行：
Get-Content backfill.log -Tail 20 -Wait
```

---

## ✨ 現在就開始！

複製第一個命令到你的 PowerShell：

```powershell
cd c:\Users\Administrator\Desktop\sotke4
```

然後按 Enter，開始你的 6-8 小時補抓之旅！ 🚀

---

**預計 6-8 小時後，你將擁有 10,000,000+ 條完整歷史數據！** 🎉
