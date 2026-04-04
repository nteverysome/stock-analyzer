# Vercel 環境變數設定指南

## 🎯 快速設定（2 分鐘）

### 方式 1：Vercel Web Dashboard（推薦）

1. **登入 Vercel**
   ```
   https://vercel.com/minamisums-projects/stock-analyzer/settings/environment-variables
   ```

2. **點擊 "Add New" 按鈕**

3. **填入以下資訊**
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: 你的 Claude API Key（從 https://console.anthropic.com/account/keys 複製）
   - **Environments**: 勾選 **Production**（可選勾選 Preview）

4. **點擊 "Add"**

5. **重新部署**
   - 進入 **Deployments** 標籤
   - 點擊最新部署 → 右上角三點菜單
   - 選擇 **Redeploy**

---

### 方式 2：Vercel CLI

如果已安裝 Vercel CLI，可用命令行設定：

```bash
cd C:\Users\Administrator\Desktop\sotke4

# 首次需要授權
vercel link

# 設定環境變數
vercel env add ANTHROPIC_API_KEY
# 然後輸入你的 API Key

# 重新部署
vercel --prod
```

---

## 🔑 API Key 安全提示

### ⚠️ 重要：保護你的 API Key

**永遠不要：**
- 🚫 在代碼中硬編碼 API Key
- 🚫 在 GitHub 提交中暴露 API Key
- 🚫 分享你的 API Key 給他人

**應該做的：**
- ✅ 使用 Vercel 環境變數（本應用推薦）
- ✅ 使用 `.env` 文件（本地開發，不提交到 Git）
- ✅ 定期輪換 API Key
- ✅ 如果懷疑泄露，立即撤銷舊 Key

### ✅ 如何獲取 API Key

1. 訪問 https://console.anthropic.com/account/keys
2. 點擊 "Create Key"
3. 給密鑰命名（如 "Stock Analyzer - Vercel"）
4. 複製密鑰值
5. 在 Vercel 環境變數中設定
6. 確認部署成功
7. 完成！

---

## 🧪 驗證部署

部署完成後，訪問：
```
https://stock-analyzer-qfks.vercel.app/
```

1. 輸入股票代號（如 `MSFT`）
2. 點擊「分析」
3. 應該能看到：
   - ✅ 基本面數據（PE、毛利率等）
   - ✅ 技術面數據（RSI、MACD）
   - ✅ **Claude 定性分析**（使用環境變數的 API Key）

---

## 📝 環境變數設定確認

設定完成後，你可以在 Vercel Dashboard 中看到：

```
Name: ANTHROPIC_API_KEY
Value: sk-ant-... (隱藏)
Environments: Production, Preview
Created: 2026-03-30
Last modified: 2026-03-30
```

---

## 🚀 完成！

恭喜！你的應用現在能：
- ✅ 在本地使用（localhost:8080）
- ✅ 在 Vercel 上部署使用（vercel.app）
- ✅ 自動使用環境變數的 API Key
- ✅ 無需在前端硬編碼敏感信息

---

## 常見問題

**Q: Claude 分析還是顯示預設值？**
A: 檢查：
1. Vercel Dashboard 確認環境變數已添加
2. 重新部署是否完成
3. 刷新頁面（Ctrl+Shift+R）

**Q: 可以同時設定本地和 Vercel 不同的 Key 嗎？**
A: 可以！
- 本地：在應用中點擊🔑按鈕輸入（存到 localStorage）
- Vercel：使用環境變數（自動優先）

**Q: 忘記了 API Key 怎麼辦？**
A: 在 Anthropic 控制台生成新的，更新 Vercel 環境變數，重新部署。

---

**現在就去設定吧！** 🎉

