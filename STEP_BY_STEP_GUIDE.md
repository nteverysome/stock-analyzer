# 📋 Step 1-3 詳細操作指南

## 🔧 選擇你的操作方式

### **方案 A: 使用自動化腳本（推薦，2 分鐘）**

#### Windows 用戶：
```powershell
# 1. 打開 PowerShell
# 2. 進入你的項目目錄
cd C:\Users\Administrator\Desktop\sotke4

# 3. 運行自動化腳本
.\setup-neon.ps1

# 4. 按照提示操作
```

#### Mac/Linux 用戶：
```bash
# 1. 進入項目目錄
cd ~/Desktop/sotke4

# 2. 賦予執行權限
chmod +x setup-neon.sh

# 3. 運行自動化腳本
./setup-neon.sh

# 4. 按照提示操作
```

---

### **方案 B: 手動操作（3 分鐘，適合新手）**

## **Step 1: 複製 Neon 連接字符串**

### 📍 位置：Neon 控制台

1. **打開 Neon 控制台**
   ```
   👉 https://console.neon.tech/app/org-dawn-pond-34051145/projects
   ```

2. **選擇你的項目**
   - 點擊你的 `stock-analyzer` 項目（或默認項目）

3. **複製連接字符串**
   - 在左側菜單找到「Connection Details」或「Connection strings」
   - 複製 **PostgreSQL 連接字符串**
   - 看起來像：
     ```
     postgresql://user:password@host.neon.tech/dbname?sslmode=require
     ```
   
4. **保存到記事本**
   - 暫時粘貼到記事本（下一步需要）

✅ **Step 1 完成！**

---

## **Step 2: 設置 Vercel 環境變數**

### 📍 位置：Vercel Dashboard

1. **打開 Vercel 控制面板**
   ```
   👉 https://vercel.com/dashboard
   ```

2. **選擇 stock-analyzer 項目**
   - 點擊你的項目名稱

3. **進入 Settings**
   - 頂部菜單 → **Settings** → **Environment Variables**

4. **添加新環境變數**
   
   | 欄位 | 值 |
   |------|-----|
   | **Name** | `DATABASE_URL` |
   | **Value** | 粘貼 Step 1 複製的連接字符串 |
   | **Environments** | 選擇所有三個：✅ Production ✅ Preview ✅ Development |

5. **保存**
   - 點擊 **Save**
   - 頁面自動重新加載

6. **驗證**
   - 確認 `DATABASE_URL` 出現在列表中
   - 值顯示為 `••••••••••••••••`（隱藏，正常）

✅ **Step 2 完成！**

---

## **Step 3: 執行數據庫架構腳本**

### 📍 位置：Neon SQL Editor

1. **打開 Neon SQL Editor**
   ```
   👉 https://console.neon.tech
   ```

2. **進入 SQL Editor**
   - 你的項目 → **SQL Editor** 標籤
   - 或直接：https://console.neon.tech/[your-project]/sql

3. **準備 SQL 腳本**
   - 打開本地文件：`NEON_DATABASE_SCHEMA.sql`
   - **Ctrl+A** 全選所有內容
   - **Ctrl+C** 複製

4. **粘貼到 SQL Editor**
   - 點擊 SQL Editor 的文本框
   - **Ctrl+V** 粘貼整個腳本

5. **執行**
   - 點擊 **Execute** 按鈕（或 Ctrl+Enter）
   - 等待 5-10 秒

6. **驗證結果**
   - 應該看到：`✓ Query executed successfully`
   - 或每個 CREATE TABLE 顯示成功信息

7. **檢查表已創建**
   ```sql
   -- 在新的 SQL Editor 標籤中運行此命令
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   應該返回 5 個表：
   - `tw_stocks`
   - `tw_daily_prices`
   - `tw_indicators`
   - `tw_screener_cache`
   - `tw_update_logs`

✅ **Step 3 完成！**

---

## ✅ **驗證所有步驟已完成**

### **快速檢查清單**

- [ ] ✅ Neon 連接字符串已複製
- [ ] ✅ Vercel 環境變數 `DATABASE_URL` 已設置
- [ ] ✅ 5 個表已在 Neon 數據庫中創建
- [ ] ✅ 可以在 SQL Editor 看到所有表

### **測試連接（可選）**

打開終端，運行：
```bash
npm install @neondatabase/serverless
node api/test-neon.js
```

應該看到：
```json
{
  "success": true,
  "message": "Neon PostgreSQL connection successful",
  "totalStocks": 10,
  "timestamp": "2026-04-03..."
}
```

---

## 🎉 **完成後的下一步**

### **立即執行：**
```bash
# 1. 安裝依賴
npm install @neondatabase/serverless

# 2. 推送代碼到 GitHub
git add .
git commit -m "feat: Setup Neon PostgreSQL for full Taiwan market"
git push origin main

# 3. Vercel 自動部署（2-3 分鐘）
# 訪問：https://stock-analyzer-qfks.vercel.app/api/test-neon

# 4. 填充全市場數據
node scripts/populate-taiwan-stocks.js
```

### **預計時間：**
- Step 1: 1 分鐘 ⏱️
- Step 2: 2 分鐘 ⏱️
- Step 3: 5 分鐘 ⏱️
- **總計：8 分鐘** ⚡

---

## 🆘 **如果遇到問題**

### **Q: 找不到 Neon 連接字符串？**
A: 在 Neon 控制台的項目頁面，右上角有「Connection」按鈕，點擊選擇「PostgreSQL」

### **Q: SQL 執行報錯？**
A: 
- 檢查是否完整複製了整個 SQL 文件
- 嘗試分開執行各個 CREATE TABLE 語句
- 檢查是否有多餘空行或特殊字符

### **Q: Vercel 環境變數設置後沒反應？**
A: 需要重新部署項目才能生效
```bash
git push origin main  # 會自動重新部署
```

---

**完成後告訴我 ✅** 我可以幫你進行下一步（填充全市場數據）！
