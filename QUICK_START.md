# ⚡ 快速開始 - 5 分鐘完成 Step 1-3

## 🚀 最快的方式

### **Windows 用戶 - 一鍵啟動：**
```powershell
cd C:\Users\Administrator\Desktop\sotke4
.\setup-neon.ps1
```

### **Mac/Linux 用戶 - 一鍵啟動：**
```bash
cd ~/Desktop/sotke4
chmod +x setup-neon.sh
./setup-neon.sh
```

---

## ⏱️ 手動方式（5 分鐘，超簡單）

### **Step 1: 複製連接字符串（1 分鐘）**

打開此鏈接：
```
https://console.neon.tech/app/org-dawn-pond-34051145/projects
```

1. 進入你的項目
2. 找到「Connection」或「Connection Details」
3. 複製 PostgreSQL 連接字符串
4. **保存到記事本**

✅ **Done!**

---

### **Step 2: 設置環境變數（2 分鐘）**

打開此鏈接：
```
https://vercel.com/dashboard
```

1. 選擇 `stock-analyzer` 項目
2. 點擊 **Settings**
3. 點擊 **Environment Variables**
4. 點擊 **Add new variable**
5. 填入：
   - **Name:** `DATABASE_URL`
   - **Value:** 粘貼 Step 1 的連接字符串
   - **Environments:** 選擇所有（✅ Production, Preview, Development）
6. 點擊 **Save**

✅ **Done!**

---

### **Step 3: 執行 SQL 腳本（2 分鐘）**

打開此鏈接：
```
https://console.neon.tech
```

1. 進入你的項目
2. 點擊 **SQL Editor**
3. 打開本地文件：`NEON_DATABASE_SCHEMA.sql`
4. **Ctrl+A** 全選，**Ctrl+C** 複製
5. 粘貼到 SQL Editor（**Ctrl+V**）
6. 點擊 **Execute**
7. 等待 ✅ 成功提示

✅ **Done!**

---

## 🔍 驗證是否成功

### **立即驗證：**
```bash
npm install @neondatabase/serverless
node verify-setup.js
```

### **期望看到：**
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

## 🎯 完成後立即執行

### **1. 安裝依賴**
```bash
npm install @neondatabase/serverless
```

### **2. 推送代碼**
```bash
git add .
git commit -m "feat: Setup Neon PostgreSQL"
git push origin main
```

### **3. 等待部署（2-3 分鐘）**
Vercel 會自動部署

### **4. 填充全市場數據**
```bash
node scripts/populate-taiwan-stocks.js
```
這會填充 1,068 隻股票 + 120 天歷史數據（15-20 分鐘）

---

## 📞 需要幫助？

### **如果卡在某一步：**

1. 打開 `STEP_BY_STEP_GUIDE.md` （詳細圖文教程）
2. 查看「🆘 如果遇到問題」部分
3. 在終端運行 `node verify-setup.js` 進行診斷

### **常見問題：**

| 問題 | 解決方案 |
|------|--------|
| 找不到連接字符串 | 在 Neon 控制台右上角「Connection」按鈕 |
| SQL 執行失敗 | 確認複製了整個 SQL 文件（不要部分複製） |
| 環境變數未生效 | 運行 `git push` 觸發重新部署 |
| 無法連接數據庫 | 運行 `node verify-setup.js` 診斷 |

---

## 📊 預計時間

| 步驟 | 時間 |
|------|------|
| Step 1 | 1 分鐘 ⏱️ |
| Step 2 | 2 分鐘 ⏱️ |
| Step 3 | 2 分鐘 ⏱️ |
| **總計** | **5 分鐘** ⚡ |

加上驗證：**8 分鐘**

---

## ✅ 完成後會發生什麼？

### **立即可用：**
- ✅ 全台灣股市數據庫就緒
- ✅ API 端點 `/api/market-screener` 就緒
- ✅ 支持 1,068 隻股票查詢

### **下一步：**
- ⏳ 填充全市場數據（15-20 分鐘）
- ⏳ 測試 API（5 分鐘）
- ⏳ 前端整合（可選，30 分鐘）

---

## 🎉 現在就開始！

**選擇一種方式：**

1. **最快（推薦）：** 運行自動化腳本
   ```powershell
   .\setup-neon.ps1
   ```

2. **手動（穩妥）：** 按照上面的 3 步手動操作

3. **詳細（學習）：** 打開 `STEP_BY_STEP_GUIDE.md`

---

**完成後告訴我 ✅**

我會幫你進行下一步：填充全台灣 1,068 隻股票的數據！
