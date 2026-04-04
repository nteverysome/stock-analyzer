# ✅ Step 2 - 驗證連接

## 🎯 目標

驗證你的 Neon PostgreSQL 數據庫連接是否正確配置。

---

## 📋 前置條件

✅ **已完成**：
- [x] SQL 架構腳本已執行（5 個表已創建）
- [x] Vercel 環境變數已設置 (DATABASE_URL)
- [x] 本地 .env.local 文件已創建（可選）

---

## 🚀 Step 2: 驗證連接（5 分鐘）

### **方法 A：使用驗證腳本（推薦，最快）**

#### **1️⃣ 安裝依賴**
```bash
npm install @neondatabase/serverless
```

#### **2️⃣ 運行驗證**
```bash
node verify-setup.js
```

#### **3️⃣ 查看結果**

**成功的樣子** ✅：
```
================================================
🔍 Neon 設置驗證工具
================================================

[Step 1] 檢查 Neon 連接字符串
──────────────────────────────────────────────
✅ DATABASE_URL 已設置
   格式：postgresql://user:password@xxxxx.neon.tech/...

[Step 2] 驗證 Vercel 環境變數
──────────────────────────────────────────────
ℹ️  本地開發環境（非 Vercel）

[Step 3] 檢查數據庫連接和表結構
──────────────────────────────────────────────
🔄 連接到 Neon PostgreSQL...
✅ 數據庫連接成功！

📊 數據庫表檢查：
   ✅ tw_stocks
   ✅ tw_daily_prices
   ✅ tw_indicators
   ✅ tw_screener_cache
   ✅ tw_update_logs

📈 數據統計：
   10 隻股票已入庫
   0 筆價格數據
   0 筆指標數據

================================================
🎉 設置驗證完成！
================================================

✅ 所有步驟已成功完成：
   ✅ Step 1: Neon 連接字符串已配置
   ✅ Step 2: Vercel 環境變數已設置
   ✅ Step 3: 數據庫架構已初始化
```

---

### **方法 B：手動驗證（如果腳本出現問題）**

#### **1️⃣ 建立 .env.local 文件**

在項目根目錄創建 `.env.local`：
```
DATABASE_URL=postgresql://user:password@xxxxx.neon.tech/neondb?sslmode=require
```

> 💡 **重要**：用你的實際連接字符串替換

#### **2️⃣ 創建簡單測試文件**

創建 `test-connection.js`：
```javascript
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function test() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ 連接成功！', result.rows[0]);
    
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    console.log('✅ 表列表：', tables.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 連接失敗：', error.message);
    process.exit(1);
  }
}

test();
```

#### **3️⃣ 運行測試**
```bash
node test-connection.js
```

---

## 🔍 **常見問題和解決**

### **問題 1: 找不到 DATABASE_URL**
```
❌ 未找到 DATABASE_URL 環境變數
```

**解決**：
1. 確認 Vercel 環境變數已設置
2. 或在本地創建 `.env.local`：
   ```
   DATABASE_URL=your_connection_string
   ```

### **問題 2: 連接字符串格式不正確**
```
❌ DATABASE_URL 格式不正確
```

**解決**：
- 確認字符串以 `postgresql://` 開頭
- 檢查是否完整複製（包括密碼）
- 確認沒有多餘空格

### **問題 3: 無法連接到數據庫**
```
❌ 數據庫連接失敗：connect ENOENT
```

**解決**：
1. 檢查網絡連接
2. 確認 Neon 項目是否活躍
3. 嘗試在 Neon SQL Editor 中測試連接
4. 檢查防火牆/VPN 設置

### **問題 4: 表不存在**
```
❌ tw_stocks 表已創建：否
```

**解決**：
1. 返回 Neon SQL Editor
2. 確認 SQL 架構腳本已完全執行
3. 運行驗證查詢：
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

## ✅ 驗證成功的標誌

✅ **應該看到**：
- [x] DATABASE_URL 已讀取
- [x] 數據庫連接成功
- [x] 所有 5 個表存在
- [x] 10 隻樣本股票已插入

✅ **數據統計應該顯示**：
- [x] 10 隻股票
- [x] 0 筆價格（暫時未填充）
- [x] 0 筆指標（暫時未填充）

---

## 🎯 下一步

完成 Step 2 驗證後，進行 **Step 3 - 部署 API**：

```bash
# 1. 推送代碼
git add .
git commit -m "feat: Setup Neon PostgreSQL connection"
git push origin main

# 2. Vercel 自動部署（等待 2-3 分鐘）

# 3. 測試 API
curl https://your-app.vercel.app/api/test-neon

# 應該返回：
{
  "success": true,
  "message": "Neon PostgreSQL connection successful",
  "totalStocks": 10,
  "timestamp": "2026-04-03T..."
}
```

---

## 📊 驗證清單

- [ ] 安裝依賴：`npm install @neondatabase/serverless`
- [ ] 運行驗證：`node verify-setup.js`
- [ ] 看到 ✅ 所有檢查通過
- [ ] 確認 5 個表已創建
- [ ] 確認 10 隻樣本股票已插入

---

## 🎉 完成！

當所有驗證都通過後：

✅ 你的 Neon 數據庫已就緒
✅ 連接已驗證
✅ 架構已初始化
✅ 準備進行 Step 3

**立即運行驗證腳本！** 👇

```bash
npm install @neondatabase/serverless && node verify-setup.js
```

---

**完成後告訴我結果！** ✅
