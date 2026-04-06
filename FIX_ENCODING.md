# 🔧 修復 PowerShell 亂碼問題

## 🎯 問題

執行以下命令出現亂碼：

```bash
Get-Content backfill.log -Tail 20 -Wait
```

---

## ✅ 解決方案

### 方案 1️⃣ : 使用修復腳本（推薦）

```bash
.\check-progress.ps1
```

**作用**：自動修復編碼，正確顯示日誌

---

### 方案 2️⃣ : 手動修復編碼

```powershell
# 指定 UTF-8 編碼讀取
Get-Content backfill.log -Encoding UTF8 -Tail 20 -Wait
```

---

### 方案 3️⃣ : 使用其他命令

#### 查看補抓進度

```bash
# 方法 A: tail 命令（Git Bash）
tail -f backfill.log

# 方法 B: type 命令（CMD）
type backfill.log

# 方法 C: cat 命令（PowerShell）
cat backfill.log | Select-Object -Last 20
```

#### 查看指標進度

```bash
# 同上，改成 indicators.log
tail -f indicators.log
cat indicators.log | Select-Object -Last 20
type indicators.log
```

---

### 方案 4️⃣ : 在 Node.js 中檢查進度

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('backfill.log', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(-20).join('\n'));
"
```

---

### 方案 5️⃣ : 直接查詢數據庫

```bash
node scripts/verify-data.mjs
```

**優點**：顯示數據庫中的實際進度，最準確

---

## 🚀 推薦方式

### 快速檢查進度

```powershell
.\check-progress.ps1
```

這個腳本會：
1. ✅ 修復編碼讀取日誌
2. ✅ 直接查詢數據庫進度
3. ✅ 顯示補抓進度
4. ✅ 顯示計算進度
5. ✅ 正確顯示中文字符

---

## 📝 調整 PowerShell 編碼（永久解決）

如果想永久修復，可以修改 PowerShell 的默認編碼：

```powershell
# 1. 打開 PowerShell Profile
notepad $PROFILE

# 2. 添加以下內容到最後
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8

# 3. 保存並重啟 PowerShell
```

---

## ✅ 完整進度檢查步驟

```bash
# 1. 進入項目
cd c:\Users\Administrator\Desktop\sotke4

# 2. 運行進度檢查腳本
.\check-progress.ps1

# 3. 查看詳細進度
# 自動顯示補抓進度、計算進度、數據庫信息
```

---

## 💡 其他常用命令

| 任務 | 命令 |
|------|------|
| 查看補抓進度 | `.\check-progress.ps1` |
| 實時監控補抓 | `tail -f backfill.log` (Git Bash) |
| 查看最後 50 行 | `Get-Content backfill.log -Tail 50 -Encoding UTF8` |
| 搜索錯誤 | `Select-String "❌" backfill.log` |
| 統計進度 | `Select-String "\[" backfill.log | Select-Object -Last 1` |

---

## 🎯 現在就解決亂碼！

```powershell
.\check-progress.ps1
```

**一句命令，自動修復所有編碼問題！** ✅
