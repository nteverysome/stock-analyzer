# ✅ Neon + 全台灣股市 - 完整實施清單

## 📋 **第一階段：準備和配置（15 分鐘）**

### Step 1: 準備 Neon 連接字符串
- [ ] 訪問 https://console.neon.tech
- [ ] 進入你的項目
- [ ] 複製連接字符串（看起來像：`postgresql://user:pass@xxx.neon.tech/stock-analyzer`）
- [ ] ✅ **完成**

### Step 2: 設置 Vercel 環境變數
- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] 新增變數 `DATABASE_URL`
- [ ] 粘貼 Neon 連接字符串
- [ ] 選擇所有環境（Production/Preview/Development）
- [ ] **Save**
- [ ] 等待自動重新部署（2-3 分鐘）
- [ ] ✅ **完成**

### Step 3: 安裝 Node.js 依賴
```bash
npm install @neondatabase/serverless
```
- [ ] ✅ **完成**

---

## 🗄️ **第二階段：數據庫架構（10 分鐘）**

### Step 4: 初始化數據庫表

**方法 A：使用 Neon SQL Editor（推薦）**
- [ ] 打開 Neon 控制台 → SQL Editor
- [ ] 複製 `NEON_DATABASE_SCHEMA.sql` 整個內容
- [ ] 粘貼到 Editor
- [ ] 點擊 **Execute**
- [ ] 確認 5 個表已創建：
  - [ ] `tw_stocks` (1,068 隻股票基本信息)
  - [ ] `tw_daily_prices` (每日 OHLCV 數據)
  - [ ] `tw_indicators` (M1-M5 技術指標)
  - [ ] `tw_screener_cache` (查詢快取)
  - [ ] `tw_update_logs` (更新日誌)
- [ ] ✅ **完成**

**驗證**（可選）：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🔧 **第三階段：部署代碼（10 分鐘）**

### Step 5: 複製 API 文件
- [ ] `api/neon-db.js` - 數據庫連接工具
- [ ] `api/market-screener.js` - 全市場篩選 API
- [ ] `scripts/populate-taiwan-stocks.js` - 數據填充腳本
- [ ] ✅ **完成**

### Step 6: Git 推送
```bash
git add api/neon-db.js api/market-screener.js scripts/populate-taiwan-stocks.js
git commit -m "feat: Add Neon PostgreSQL full Taiwan market support"
git push origin main
```
- [ ] ✅ **推送完成**
- [ ] ⏳ 等待 Vercel 自動部署（2-3 分鐘）

---

## 📥 **第四階段：測試連接（10 分鐘）**

### Step 7: 測試 API 連接

**創建測試端點** `api/test-neon.js`（如果需要）：
```javascript
import pool from './neon-db.js';

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tw_stocks');
    res.json({ 
      success: true, 
      totalStocks: result.rows[0].count 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

- [ ] 訪問 `/api/test-neon`
- [ ] 確認返回 JSON（初始應該是 10 隻樣本股票）
- [ ] ✅ **連接正常**

---

## 🌍 **第五階段：填充全市場數據（15-30 分鐘）**

### Step 8: 運行數據填充腳本

**本地運行（推薦用於開發）：**
```bash
node scripts/populate-taiwan-stocks.js
```

**或通過 API 端點（可創建）：**
```javascript
// api/admin/populate-data.js
import { updateAllIndicators } from '../../scripts/populate-taiwan-stocks.js';

export default async function handler(req, res) {
  if (req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const result = await updateAllIndicators();
  res.json(result);
}
```

- [ ] 運行填充腳本
- [ ] 等待完成（10-15 分鐘，取決於網絡）
- [ ] 查看完成統計：
  - [ ] ✅ 1,068 隻股票已插入
  - [ ] ✅ ~120,000+ 筆價格記錄已插入
- [ ] ✅ **全市場數據就緒**

---

## 🧪 **第六階段：驗證 API（10 分鐘）**

### Step 9: 測試各個查詢端點

#### 測試 1: 獲取所有台股清單
```bash
curl "https://your-app.vercel.app/api/market-screener?market=all&limit=10"
```
- [ ] ✅ 返回 10 隻股票 + 完整數據

#### 測試 2: 按產業篩選
```bash
curl "https://your-app.vercel.app/api/market-screener?industry=semiconductor&limit=5"
```
- [ ] ✅ 返回半導體產業股票

#### 測試 3: 按符號查詢
```bash
curl "https://your-app.vercel.app/api/market-screener?symbols=2330,2317,2454"
```
- [ ] ✅ 返回 3 隻股票的完整數據

#### 測試 4: 技術指標篩選
```bash
curl "https://your-app.vercel.app/api/market-screener?filter=kd_oversold&limit=10"
```
- [ ] ✅ 返回 KD 超賣的股票

---

## 🎨 **第七階段：前端整合（可選，20-30 分鐘）**

### Step 10: 更新 screener.html

在 `public/screener.html` 中添加：

```javascript
// 獲取全市場股票
async function getFullMarket() {
  const res = await fetch('/api/market-screener?market=all');
  const data = await res.json();
  displayResults(data.data);
}

// 按產業篩選
async function filterByIndustry(industry) {
  const res = await fetch(`/api/market-screener?industry=${industry}`);
  const data = await res.json();
  displayResults(data.data);
}

// 技術指標篩選
async function filterByIndicator(filter) {
  const res = await fetch(`/api/market-screener?filter=${filter}`);
  const data = await res.json();
  displayResults(data.data);
}
```

- [ ] 添加篩選按鈕（產業、指標、自選股）
- [ ] 顯示表格（股票代碼、名稱、價格、M1-M5、KD、RSI）
- [ ] 支持排序和過濾
- [ ] ✅ **前端整合完成**

---

## 📅 **第八階段：自動化更新（可選，10 分鐘）**

### Step 11: 設置 GitHub Actions 定時更新

創建 `.github/workflows/update-tw-market.yml`：
```yaml
name: Update Taiwan Market Data
on:
  schedule:
    - cron: '0 18 * * *'  # 台灣時間凌晨 2:00（UTC+8）

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/populate-taiwan-stocks.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

- [ ] 創建 GitHub Actions 工作流
- [ ] 設置每日自動更新
- [ ] ✅ **自動化配置完成**

---

## 💰 **成本確認**

| 服務 | 免費額度 | 成本 |
|------|---------|------|
| **Neon PostgreSQL** | 3GB 存儲 | ✅ $0 |
| **Vercel Functions** | 無限制 | ✅ $0 |
| **全市場查詢** | 無限制 | ✅ $0 |
| **總月費** | | **$0** ✅ |

---

## 📊 **期望結果**

完成後你將擁有：

✅ **完整的台灣股市數據庫**
- 1,068 隻上市公司
- 120 天歷史價格
- 實時技術指標

✅ **高效的 API 端點**
- `/api/market-screener` - 全市場篩選
- 支持 6 種查詢方式
- 毫秒級查詢速度 (<100ms)

✅ **強大的篩選功能**
- 按產業篩選（10+ 個產業）
- 按技術指標篩選（KD、RSI、均線等）
- 按符號直接查詢
- 支持自定義篩選條件

✅ **生產級別的架構**
- 自動備份（Neon 內置）
- 完整的更新日誌追蹤
- 快取層加速查詢

---

## 🎯 **完成標誌**

當你完成以下所有項目時，表示項目成功上線：

- [x] ✅ Neon 數據庫就緒
- [x] ✅ API 端點正常
- [x] ✅ 1,068 隻股票數據已填充
- [x] ✅ 所有查詢測試通過
- [x] ✅ 前端篩選界面就緒
- [x] ✅ 自動更新配置完成

---

## 🚀 **立即開始**

1. **現在就進行 Step 1：** 複製你的 Neon 連接字符串
2. **完成 Step 2-3：** 配置環境和依賴（5 分鐘）
3. **進行 Step 4：** 初始化數據庫（10 分鐘）
4. **執行 Step 5-8：** 部署和測試（20-30 分鐘）

**告訴我你現在完成到哪一步，我可以繼續幫你！** 👍
