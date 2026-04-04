# Upstash Redis 申請與設置完整指南

## 🚀 Step 1: 申請 Upstash Redis（2 分鐘）

### 方法 A：通過 Vercel Marketplace（推薦）
1. **訪問你的 Vercel 項目集成頁面**
   ```
   https://vercel.com/minamisums-projects/~/integrations/upstash
   ```

2. **點擊 "Add Integration" 或 "Connect"**
   - 選擇 **Fixed 250MB ($10/month)** 或 **Fixed 1GB ($30/month)**
   - Vercel 會自動添加環境變數到你的項目

3. **授權 Upstash 訪問**
   - 點擊 "Continue"
   - 審查權限（允許將 Redis 連接到 Vercel）
   - 點擊 "Authorize"

4. **完成！** ✅
   - 環境變數自動設置：
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

---

### 方法 B：直接通過 Upstash（如果 Marketplace 不可用）
1. 訪問 https://console.upstash.com
2. 登入或註冊（支持 GitHub 登入）
3. 點擊 "Create Database"
4. 選擇 **Fixed 250MB ($10/month)**
5. 複製連接信息到 Vercel 環境變數

---

## 📋 Step 2: 驗證設置

在你的 Vercel Dashboard：
1. 進入 **Settings → Environment Variables**
2. 確認這些變數已出現：
   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

---

## 💻 Step 3: 創建 API 端點（測試連接）

在 `api/test-redis.js`：
```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 測試寫入
    await redis.set('test_key', 'Hello from Upstash!');
    
    // 測試讀取
    const value = await redis.get('test_key');
    
    res.status(200).json({
      success: true,
      message: value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

訪問：`https://your-app.vercel.app/api/test-redis`

---

## 🎯 完成後的下一步

1. ✅ Redis 連接成功
2. 🔧 建立 `/api/indicators` 端點（存儲 M1-M5 指標）
3. 📅 創建爬蟲腳本（GitHub Actions 每晚 23:00 更新）
4. 🎨 前端篩選 UI 整合

---

## 💰 成本確認

- **Vercel Pro 月度額度**：$20 USD
- **Upstash Fixed 250MB**：$10 USD/月
- **你的支付**：$0（用 Pro 額度支付）✅

---

## ⚠️ 常見問題

### Q: 如果申請失敗怎麼辦？
A: 確認：
- 你已登入 Vercel
- 你的 Vercel Pro 計畫有效
- 瀏覽器允許彈窗

### Q: 環境變數什麼時候生效？
A: 設置後需要重新部署：
```bash
git add .
git commit -m "Add Upstash Redis integration"
git push origin main
```
Vercel 會自動重新部署（2-3 分鐘）

### Q: 我可以免費試用嗎？
A: 是，Upstash Free Tier 256MB（$0）足夠測試
- 之後再升級到 Fixed 250MB ($10)

---

**準備好了？點擊上面的鏈接開始申請！** 🚀
