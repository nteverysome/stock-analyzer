# 📥 繼續補抓數據

## 🎯 目標

補抓完整歷史數據直到達成預期：
- 價格記錄：10,000,000+ 筆
- 技術指標：10,000,000+ 筆
- 股票覆蓋：1,962 支

---

## 🚀 立即執行（繼續補抓）

### Step 1️⃣ : 檢查當前進度

在終端執行：

```bash
cd c:\Users\Administrator\Desktop\sotke4

# 查看補抓進度
tail -f backfill.log

# 或查看指標計算進度
tail -f indicators.log
```

---

### Step 2️⃣ : 根據進度決定行動

#### **如果補抓未完成**

```bash
# 繼續補抓（會自動跳過已有數據）
node scripts/fetch-5years-history.mjs > backfill.log 2>&1
```

**說明**：
- 會自動檢測已有數據
- 只補抓缺失部分
- 無需重新下載已有數據

---

#### **如果補抓完成，但指標計算未完成**

```bash
# 繼續計算指標（會自動跳過已有指標）
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

**說明**：
- 會自動檢測已有指標
- 只計算缺失部分
- 無需重新計算已有指標

---

#### **如果兩個都未完成**

```bash
# 方案 A: 串行執行（一個接一個）
# 先補抓
node scripts/fetch-5years-history.mjs > backfill.log 2>&1

# 補抓完成後執行
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

```bash
# 方案 B: 並行執行（同時進行）
# 終端 1: 繼續補抓
node scripts/fetch-5years-history.mjs > backfill.log 2>&1

# 終端 2: 同時計算指標
node scripts/backfill-tw-indicators.mjs --history-full > indicators.log 2>&1
```

---

### Step 3️⃣ : 監控進度

在另一個終端查看實時進度：

```bash
# 查看補抓日誌（實時）
Get-Content backfill.log -Tail 20 -Wait

# 或查看指標日誌（實時）
Get-Content indicators.log -Tail 20 -Wait
```

**預期進度輸出**：
```
[500/1962] ✅450 ⏭️50 ❌0 | 共 1,000,000 筆 | 600s
[1000/1962] ✅950 ⏭️50 ❌0 | 共 2,000,000 筆 | 1200s
[1500/1962] ✅1450 ⏭️50 ❌0 | 共 3,000,000 筆 | 1800s
```

---

### Step 4️⃣ : 完成後驗證

補抓和計算都完成後：

```bash
# 啟動本地開發
npx vercel dev

# 在瀏覽器打開驗證頁面
http://localhost:3000/verify.html

# 點擊「開始驗證」確認數據完整
```

---

## 💡 提示

### 後台執行（不佔用終端）

```bash
# 開新的 PowerShell 窗口，執行補抓
Start-Process powershell -ArgumentList "cd c:\Users\Administrator\Desktop\sotke4; node scripts/fetch-5years-history.mjs | Out-File backfill.log"

# 原終端可以監控進度
Get-Content backfill.log -Tail 10 -Wait
```

### 如果出現錯誤

```bash
# 查看詳細錯誤
cat backfill.log | Select-String "❌"

# 重新執行補抓（會自動跳過已有數據）
node scripts/fetch-5years-history.mjs
```

### 估算剩餘時間

- 每補抓 500 支股票約需 1 小時
- 目前進度：?/1962 支
- 剩餘進度：(1962 - 已完成) / 500 * 60 分鐘

---

## ⏱️ 時間估算

| 進度 | 剩餘時間 |
|------|---------|
| 25% | 3-4 小時 |
| 50% | 2-3 小時 |
| 75% | 1-2 小時 |
| 90% | 30 分鐘 |

---

## ✅ 完成標準

當看到以下信息時表示完成：

```
✅ 補抓完成！(14400s)
   成功股票: 1,962 支
   總價格記錄: ~10,000,000 筆

✅ 完成！(14400s)
   成功股票: 1,962 支
   總記錄數: ~10,000,000 筆
```

---

## 🚀 現在就開始！

```bash
cd c:\Users\Administrator\Desktop\sotke4

# 查看當前進度
tail -f backfill.log

# 如果未完成，繼續補抓
node scripts/fetch-5years-history.mjs > backfill.log 2>&1
```

**需要多少時間？** ⏳  
- 補抓：3-4 小時（取決於剩餘量）
- 計算：3-4 小時（並行可同時進行）

---

**準備好繼續了嗎？開始補抓吧！** 🚀
