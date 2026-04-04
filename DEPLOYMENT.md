# 部署指南

## 🚀 快速部署到 Vercel（推薦）

### 一鍵部署（3 步，2 分鐘）

1. **訪問自動導入鏈接**（推薦）
   ```
   https://vercel.com/new?repo=nteverysome/stock-analyzer
   ```
   會直接跳轉到 Vercel，自動選擇 GitHub 仓库

2. **或者手動導入**
   - 訪問 https://vercel.com/new
   - 選擇 "Import Git Repository"
   - 搜索 `nteverysome/stock-analyzer`
   - 點擊 "Import"

3. **配置並部署**
   - Vercel 自動檢測 vercel.json 配置
   - 無需額外設置
   - 點擊 "Deploy"
   - 等待 1-2 分鐘完成

### ✅ 部署後

部署完成後，您將獲得：
- **自動分配的域名**：`stock-analyzer-xxx.vercel.app`
- **自動 HTTPS**：所有流量加密
- **自動構建**：每次推送 GitHub main 分支自動重新部署

---

## 💻 本地測試（可選）

### Python 內建伺服器

```bash
cd stock-analyzer
python -m http.server 8080
```

訪問 http://localhost:8080

### Node.js 伺服器

```bash
npm install
npm run dev
```

---

## 🔧 自訂部署域名

部署後，在 Vercel 儀表板中：

1. 進入 Project Settings → Domains
2. 添加自訂域名
3. 更新 DNS 指向（根據 Vercel 提示）

---

## 環境變數設置（可選，用於 Claude API）

若要在生產環境使用 Claude API：

1. Vercel 儀表板 → Settings → Environment Variables
2. 添加：
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. 重新部署即可

---

## 常見問題

**Q：部署後無法訪問 API？**
A：檢查 CORS 代理是否可用。如果 allorigins.win 故障，應用會自動嘗試備用代理。

**Q：能自訂部署域名嗎？**
A：可以。在 Vercel 儀表板中添加自訂域名。

**Q：每次推送 GitHub 都會自動部署嗎？**
A：是的。Vercel 監聽 main 分支，任何推送都會觸發自動部署。

**Q：如何回滾到前一版本？**
A：Vercel 儀表板 → Deployments → 選擇舊版本 → Promote to Production

---

## 部署架構

```
GitHub (nteverysome/stock-analyzer)
        ↓
    Vercel
    ↓
    Build (無需編譯，直接靜態站點)
    ↓
    部署到全球 CDN
    ↓
    https://stock-analyzer-xxx.vercel.app
```

---

## 下一步

✅ 部署完成後：
1. 分享部署 URL 給他人使用
2. （可選）添加自訂域名
3. （可選）啟用 Vercel Analytics 監控訪問

祝使用愉快！🎉

