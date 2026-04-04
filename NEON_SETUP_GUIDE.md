# 🇹🇼 Neon PostgreSQL - 全台灣股市數據庫設置指南

## 📋 第一步：在 Neon 創建數據庫（5 分鐘）

### 1. 訪問 Neon 控制台
```
https://console.neon.tech/app/org-dawn-pond-34051145/projects
```

### 2. 創建新項目或選擇現有項目
- 項目名稱：`stock-analyzer`
- 地區：Asia（亞洲，最快）

### 3. 複製連接字符串
```
postgresql://user:password@xxx.neon.tech/stock-analyzer?sslmode=require
```

---

## 🔑 第二步：設置 Vercel 環境變數（3 分鐘）

### 在 Vercel Dashboard：
1. **Settings → Environment Variables**
2. 添加新變數：
   ```
   變數名：DATABASE_URL
   值：postgresql://user:password@xxx.neon.tech/stock-analyzer?sslmode=require
   ```
3. 選擇環境：**Production、Preview、Development**
4. **Save** → 自動重新部署

---

## 🗄️ 第三步：初始化數據庫架構（5 分鐘）

### 方法 A：使用 Neon SQL Editor（推薦）

1. 打開 Neon 控制台
2. 選擇 **SQL Editor**
3. 複製整個 `NEON_DATABASE_SCHEMA.sql` 文件內容
4. 粘貼到 Editor 中
5. **Execute** → 等待完成

### 方法 B：使用命令行（如果安裝了 psql）

```bash
# 連接到 Neon
psql postgresql://user:password@xxx.neon.tech/stock-analyzer

# 執行架構腳本
\i NEON_DATABASE_SCHEMA.sql

# 驗證表已創建
\dt
```

---

## 📦 第四步：安裝 Node.js 依賴（2 分鐘）

```bash
npm install @neondatabase/serverless
```

---

## 🧪 第五步：測試連接（5 分鐘）

### 創建 `api/test-neon.js`：

```javascript
import pool from './neon-db.js';

export default async function handler(req, res) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM tw_stocks'
    );
    
    res.status(200).json({
      success: true,
      message: 'Neon PostgreSQL connection successful',
      totalStocks: result.rows[0].count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}
```

### 訪問測試端點：
```
https://your-app.vercel.app/api/test-neon
```

期望結果：
```json
{
  "success": true,
  "message": "Neon PostgreSQL connection successful",
  "totalStocks": 10,
  "timestamp": "2026-04-03T15:30:00.000Z"
}
```

---

## 📥 第六步：填充 1,068 隻股票數據

### 方法 A：使用 FinMind API（推薦）

創建 `scripts/populate-stocks.js`：

```javascript
import { upsertDailyPrice } from '../api/neon-db.js';

async function populateStocks() {
  // 從 FinMind 獲取所有台灣股票信息
  const response = await fetch(
    'https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo'
  );
  const data = await response.json();
  
  // 逐個插入到數據庫
  for (const stock of data.data) {
    await upsertDailyPrice(stock.stock_id, {
      date: new Date(),
      close: stock.latest_price,
      // ... 其他數據
    });
  }
}

populateStocks();
```

### 方法 B：使用硬編碼清單

SQL 文件中已包含 10 隻樣本股票。您可以：
1. 逐漸添加更多股票
2. 或使用第三方服務（如 FinMind）批量導入

---

## 🚀 第七步：部署 API 端點

### 推送代碼：
```bash
git add api/neon-db.js api/market-screener.js
git commit -m "feat: Add Neon PostgreSQL integration for full Taiwan market"
git push origin main
```

### Vercel 自動部署

---

## 📊 使用示例

### 查詢所有台股（1,068 隻）
```
GET /api/market-screener?market=all
```

### 按產業篩選
```
GET /api/market-screener?industry=semiconductor
```

### 按符號查詢
```
GET /api/market-screener?symbols=2330,2317,2454
```

### 技術指標篩選
```
GET /api/market-screener?filter=kd_oversold&limit=20
GET /api/market-screener?filter=rsi_oversold&limit=20
```

---

## 💰 成本確認

| 服務 | 免費層 | 月費 |
|------|--------|------|
| **Neon PostgreSQL** | 3GB 存儲 | $0（足夠台股）|
| **Vercel API** | 免費 | $0 |
| **總計** | | **$0** ✅ |

---

## 🔍 故障排查

### 連接錯誤
```
Error: connect ENOENT
原因：DATABASE_URL 未設置或格式錯誤
解決：檢查 Vercel 環境變數
```

### 表不存在
```
Error: relation "tw_stocks" does not exist
原因：未執行 NEON_DATABASE_SCHEMA.sql
解決：在 Neon SQL Editor 中運行架構腳本
```

### 慢查詢
```
原因：缺少索引
解決：已在 schema 中包含主要索引
```

---

## ✅ 下一步

1. ✅ 設置 Neon 數據庫
2. ✅ 初始化架構
3. ✅ 部署 API 端點
4. ⏳ 填充全市場 1,068 隻股票數據
5. ⏳ 前端整合篩選 UI
6. ⏳ 設置自動更新（GitHub Actions）

**準備好了嗎？** 告訴我你完成到哪一步！
