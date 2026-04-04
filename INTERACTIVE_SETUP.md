# 🎯 交互式設置指南 - 跟我一步一步操作

## 準備好了嗎？開始吧！ 🚀

---

## **Step 1: 複製 Neon 連接字符串（1 分鐘）**

### ✅ 現在做：
1. **打開此鏈接**（新標籤頁）：
   ```
   https://console.neon.tech/app/org-dawn-pond-34051145/projects
   ```

2. **進入你的項目**（可能已自動打開）

3. **找到「Connection」按鈕**
   - 右上角或左側菜單
   - 看起來像：🔌 Connection

4. **選擇「PostgreSQL」**
   - 頁面會顯示連接字符串

5. **複製整個連接字符串**
   - 看起來像：`postgresql://user:password@xxx.neon.tech/dbname?sslmode=require`
   - 按 **Ctrl+C** 複製

6. **暫時保存到記事本**
   - 在記事本中粘貼（Ctrl+V）
   - 保持打開

---

### ✅ 完成後告訴我：
```
已複製 Neon 連接字符串 ✅
```

---

## **Step 2: 設置 Vercel 環境變數（2 分鐘）**

### ✅ 現在做：

1. **打開新標籤頁，訪問 Vercel Dashboard**：
   ```
   https://vercel.com/dashboard
   ```

2. **選擇項目 `stock-analyzer`**
   - 點擊項目名稱

3. **進入 Settings**
   - 頂部菜單 → Settings

4. **左側菜單 → Environment Variables**

5. **點擊「Add new variable」按鈕**

6. **填入以下內容**：
   | 欄位 | 值 |
   |------|-----|
   | **Name** | `DATABASE_URL` |
   | **Value** | 粘貼你從 Step 1 複製的連接字符串 |

7. **選擇 Environments**：
   - ✅ 勾選 **Production**
   - ✅ 勾選 **Preview**
   - ✅ 勾選 **Development**

8. **點擊 「Save」**
   - 頁面自動重新加載

9. **驗證**：
   - 你應該在列表中看到 `DATABASE_URL`
   - 值顯示為 `••••••••••••••••`（隱藏，正常）

---

### ✅ 完成後告訴我：
```
已設置 Vercel 環境變數 ✅
```

---

## **Step 3: 執行 SQL 架構腳本（2 分鐘）**

### ✅ 現在做：

1. **打開新標籤頁，訪問 Neon SQL Editor**：
   ```
   https://console.neon.tech
   ```

2. **進入你的項目**

3. **點擊 「SQL Editor」標籤**
   - 頁面會打開一個空的 SQL 編輯器

4. **在 VS Code 中打開 SQL 文件**：
   - 打開本地檔案：`NEON_DATABASE_SCHEMA.sql`
   - 按 **Ctrl+A** 全選所有內容
   - 按 **Ctrl+C** 複製

5. **粘貼到 Neon SQL Editor**：
   - 點擊編輯器文本框
   - 按 **Ctrl+V** 粘貼

6. **點擊 「Execute」按鈕**
   - 位置通常在編輯器上方或右上角
   - 或按 **Ctrl+Enter**

7. **等待完成**：
   - 應該看到 ✅ 成功信息
   - 或每個 CREATE TABLE 的成功提示

8. **驗證表已創建**（可選）：
   - 在新行中運行此查詢：
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   - 應該看到 5 個表：
     - `tw_stocks`
     - `tw_daily_prices`
     - `tw_indicators`
     - `tw_screener_cache`
     - `tw_update_logs`

---

### ✅ 完成後告訴我：
```
已執行 SQL 架構腳本 ✅ 5 個表已創建
```

---

## **🎉 完成 Step 1-3！**

### 現在立即在終端執行：

打開你的 VS Code 終端，按順序執行：

```bash
# 1️⃣ 安裝依賴
npm install @neondatabase/serverless

# 2️⃣ 驗證連接（應該看到所有檢查通過）
node verify-setup.js

# 3️⃣ 推送到 GitHub
git add .
git commit -m "feat: Setup Neon PostgreSQL for full Taiwan market"
git push origin main

# 4️⃣ 等待 Vercel 自動部署（2-3 分鐘）
# 然後訪問 https://[你的-vercel-url].vercel.app/api/test-neon

# 5️⃣ 填充全市場數據（可選，但推薦）
node scripts/populate-taiwan-stocks.js
```

---

## ✅ 驗證所有步驟

運行此命令進行最終驗證：
```bash
node verify-setup.js
```

### 應該看到：
```
✅ DATABASE_URL 已設置
✅ 數據庫連接成功
✅ tw_stocks 表已創建
✅ tw_daily_prices 表已創建
✅ tw_indicators 表已創建
✅ tw_screener_cache 表已創建
✅ tw_update_logs 表已創建
🎉 所有步驟已成功完成！
```

---

## 📞 遇到問題？

如果某一步失敗，告訴我：
- 哪一步失敗了？
- 錯誤訊息是什麼？
- 我會幫你診斷和修復！

---

## 🎯 現在就開始！

準備好了嗎？

**告訴我你完成到哪一步：**
- [ ] ⏳ 尚未開始
- [ ] Step 1 進行中...
- [ ] ✅ Step 1 完成
- [ ] Step 2 進行中...
- [ ] ✅ Step 2 完成
- [ ] Step 3 進行中...
- [ ] ✅ Step 3 完成
- [ ] ✅ 全部完成！

**你現在在哪個步驟？** 👇
