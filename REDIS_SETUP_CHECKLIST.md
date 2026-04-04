# ✅ Upstash Redis + 全市場掃描 - 完整設置清單

## 📋 第一階段：申請和驗證（15 分鐘）

- [ ] **1. 申請 Upstash Redis**
  - [ ] 訪問 https://vercel.com/minamisums-projects/~/integrations/upstash
  - [ ] 點擊 "Connect" 或 "Add Integration"
  - [ ] 選擇 Fixed 250MB ($10/month) 方案
  - [ ] 授權完成

- [ ] **2. 驗證環境變數**
  - [ ] Vercel Dashboard → Settings → Environment Variables
  - [ ] 確認存在 `UPSTASH_REDIS_REST_URL`
  - [ ] 確認存在 `UPSTASH_REDIS_REST_TOKEN`
  - [ ] 重新部署項目（自動進行）

- [ ] **3. 測試 Redis 連接**
  - [ ] 複製 `API_INDICATORS_TEMPLATE.js` 到 `api/test-redis.js`
  - [ ] Git 推送
  - [ ] 訪問 `https://your-app.vercel.app/api/test-redis`
  - [ ] 確認返回 "Hello from Upstash!"

---

## 🔧 第二階段：部署爬蟲和 API（30 分鐘）

- [ ] **1. 複製爬蟲腳本**
  - [ ] `scripts/update-indicators.js` 已存在
  - [ ] 安裝依賴：`npm install @upstash/redis node-fetch`

- [ ] **2. 複製 API 端點**
  - [ ] `api/indicators.js` 已創建（來自 `API_INDICATORS_TEMPLATE.js`）
  - [ ] 測試端點：`GET /api/indicators?symbols=2330,2317`

- [ ] **3. 複製 GitHub Actions 工作流**
  - [ ] `.github/workflows/update-indicators.yml` 已存在
  - [ ] 設置 GitHub Secrets：
    - [ ] `UPSTASH_REDIS_REST_URL`
    - [ ] `UPSTASH_REDIS_REST_TOKEN`

- [ ] **4. 手動觸發測試（可選）**
  - [ ] GitHub Actions 頁面 → Select workflow → "Run workflow"
  - [ ] 等待完成（約 2-5 分鐘）
  - [ ] 檢查日誌確認成功

---

## 📅 第三階段：自動化排程（10 分鐘）

- [ ] **GitHub Actions 自動排程已配置**
  - [ ] 每晚 23:00（台灣時間）自動執行
  - [ ] 無需人工干預

- [ ] **檢查日程（可選：Vercel Cron）**
  - [ ] 在 `vercel.json` 中配置 cron（如果需要）
  - [ ] 優先使用 GitHub Actions（更可靠）

---

## 🎯 第四階段：前端整合（20 分鐘）

- [ ] **更新 screener.html**
  - [ ] 添加調用 `/api/indicators` 的代碼
  - [ ] 展示 M1-M5 指標
  - [ ] 添加篩選條件（M1>450, M2>440 等）

示例代碼：
```javascript
async function fetchIndicators(symbols) {
  const res = await fetch(`/api/indicators?symbols=${symbols.join(',')}`);
  const json = await res.json();
  return json.data;
}

// 用法
const data = await fetchIndicators(['2330', '2317', '2454']);
console.log(data); // { "2330": { price: 452.5, m1: 450.2, ... } }
```

---

## 💰 成本確認

- [ ] Vercel Pro 計畫：$20/月 ✅
  - [ ] 包含 $20 USD 月度額度
  - [ ] Upstash Fixed 250MB：$10/月（用額度支付）
  - [ ] 淨支付：$0（用額度覆蓋）

---

## 🔍 故障排查

### Redis 連接失敗
```bash
# 檢查環境變數
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# 重新部署
git push origin main
```

### 爬蟲無法獲取數據
```bash
# 檢查 FinMind API 是否可用
curl "https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo" | head

# 如果不可用，改用硬編碼清單（已有備選）
```

### GitHub Actions 執行失敗
- [ ] 檢查 Secrets 是否正確設置
- [ ] 查看 Logs 找出具體錯誤
- [ ] 手動運行：Actions → Select → Run workflow

---

## 📊 期望結果

✅ **完成後你將擁有：**

1. **Redis 數據庫**
   - 存儲 292 隻台股的 M1-M5 指標
   - 自動更新（每晚 23:00）

2. **API 端點** `/api/indicators`
   - 毫秒級查詢速度
   - 支持批量查詢

3. **前端篩選界面**
   - 即時顯示指標
   - 支持按 M1-M5 排序

4. **完全自動化**
   - 無需人工操作
   - 數據始終保持最新

---

## 🎉 大功告成！

完成所有步驟後，你的應用將達到 **業界水準**（如麻瓜股、TradingView）！

**需要幫助？** 在這個清單中標記 ✅ 完成的項目，告訴我你卡在哪裡！
