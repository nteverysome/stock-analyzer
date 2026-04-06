# 📥 繼續補抓 - 5 分鐘快速指南

## 🎯 你的情況

- ❌ 數據還不足（<10M 筆）
- ✅ 補抓腳本已準備好
- ⏳ 需要繼續補抓

---

## 🚀 3 種方式繼續補抓

### 方式 1️⃣ : 自動化腳本（最簡單）

```bash
# 在 PowerShell 執行
.\continue-fetch.ps1
```

**作用**：
- 自動檢測當前進度
- 自動決定補抓還是計算
- 自動執行直到完成

---

### 方式 2️⃣ : 手動命令（最靈活）

```bash
# 進入項目
cd c:\Users\Administrator\Desktop\sotke4

# 繼續補抓（自動跳過已有數據）
node scripts/fetch-5years-history.mjs > backfill.log 2>&1

# 或者計算指標（自動跳過已有指標）
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

---

### 方式 3️⃣ : 並行執行（最快速）

**終端 1: 繼續補抓**
```bash
cd c:\Users\Administrator\Desktop\sotke4
node scripts/fetch-5years-history.mjs > backfill.log 2>&1
```

**終端 2: 同時計算指標**
```bash
cd c:\Users\Administrator\Desktop\sotke4
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

---

## ⏱️ 預計時間

| 當前進度 | 剩餘時間 |
|---------|---------|
| 25% | 3-4 小時 |
| 50% | 2-3 小時 |
| 75% | 1-2 小時 |
| 90% | 30 分鐘 |

---

## 📊 監控進度

在另一個終端查看實時進度：

```bash
# 查看補抓進度
Get-Content backfill.log -Tail 20 -Wait

# 查看計算進度
Get-Content indicators.log -Tail 20 -Wait

# 按 Ctrl+C 停止
```

**預期輸出**：
```
[1500/1962] ✅1400 ⏭️62 ❌0 | 共 3,000,000 筆
[1600/1962] ✅1550 ⏭️50 ❌0 | 共 3,200,000 筆
[1700/1962] ✅1650 ⏭️50 ❌0 | 共 3,400,000 筆
```

---

## ✅ 完成標準

### 補抓完成

```
✅ 補抓完成！(14400s)
   成功股票: 1,962 支
   總價格記錄: ~10,000,000 筆
```

### 計算完成

```
✅ 完成！(14400s)
   成功股票: 1,962 支
   總記錄數: ~10,000,000 筆
```

---

## 🎯 完成後

```bash
# 1. 驗證數據
npx vercel dev
# 訪問 http://localhost:3000/verify.html

# 2. 本地測試
# 訪問 http://localhost:3000/chart.html

# 3. 部署生產
git push origin main
```

---

## 💡 重點

✅ **會自動跳過已有數據** - 不會重複下載  
✅ **可以隨時停止和恢復** - 按 Ctrl+C 停止  
✅ **支持並行執行** - 補抓和計算同時進行  
✅ **無需手動干預** - 自動檢測和繼續  

---

## 🚀 現在就開始！

### 最簡單的方式

打開 PowerShell，複製粘貼：

```powershell
cd c:\Users\Administrator\Desktop\sotke4
.\continue-fetch.ps1
```

**然後按 Enter！** 🚀

---

## 📞 常見問題

**Q: 進度卡住了怎麼辦？**
A: 重新執行命令，會自動跳過已有數據繼續補抓

**Q: 可以同時補抓和計算嗎？**
A: 可以！打開兩個終端同時執行

**Q: 需要多久？**
A: 取決於剩餘數據量，通常 1-4 小時

**Q: 出現錯誤？**
A: 查看日誌文件：`cat backfill.log`

---

**準備好了嗎？開始補抓吧！** 🚀

---

詳細說明查看 `CONTINUE_FETCH.md` 或 `FETCH_MORE_DATA.txt`
