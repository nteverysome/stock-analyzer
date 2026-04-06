# ✅ CORS OPTIONS 問題修復 - 部署版本

## 🎯 問題診斷

你正在使用 **Vercel 部署的線上版本**（而不是本地 npm run dev）。

OPTIONS 預檢請求無法正確處理，因為 Vercel serverless functions 的行為不同。

---

## ✅ 修復方案

我已經改進了 OPTIONS 請求的處理方式：

**舊的方式**（不工作）：
```javascript
if (req.method === 'OPTIONS') {
  return res.status(200).end();  // ❌ Vercel 可能不支持
}
```

**新的方式**（應該工作）：
```javascript
if (req.method === 'OPTIONS') {
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).json({ ok: true });  // ✅ 返回 JSON
  return;
}
```

---

## 🚀 部署修復

### **Step 1️⃣ : 提交更改**

```bash
git add -A
git commit -m "fix: improve CORS OPTIONS handling for Vercel"
```

### **Step 2️⃣ : 推送到 GitHub**

```bash
git push origin main
```

Vercel 會自動重新部署。

### **Step 3️⃣ : 等待部署完成**

訪問 Vercel 控制面板查看部署狀態。

### **Step 4️⃣ : 刷新瀏覽器**

訪問你的部署 URL，硬刷新（**Ctrl+Shift+R**）清除緩存。

---

## 📝 修改的文件

所有 API 文件都已更新：

- ✅ `api/chart-data.js`
- ✅ `api/backtest.js`
- ✅ `api/verify.js`
- ✅ `api/progress.js`

每個文件都添加了：

```javascript
// 完整的 CORS 配置
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Max-Age', '86400');

// 正確的 OPTIONS 處理
if (req.method === 'OPTIONS') {
  res.status(200).json({ ok: true });
  return;
}
```

---

## 🔍 如果還是不工作

### 方案 1: 檢查部署日誌

1. 訪問 Vercel 控制面板
2. 進入你的項目
3. 查看 **Deployments** → **Logs**
4. 搜索 OPTIONS 相關的錯誤

### 方案 2: 使用本地開發

如果線上版本有問題，先用本地開發：

```bash
npm run dev
# 訪問 http://localhost:8080/chart.html
```

本地版本使用自己的伺服器，不依賴 Vercel。

### 方案 3: 清除瀏覽器緩存

完全清除所有緩存：

1. 按 **Ctrl+Shift+Delete**
2. 選擇「所有時間」
3. 勾選「Cookie 和其他網站數據」
4. 清除
5. 訪問網站
6. 按 **Ctrl+Shift+R**（硬刷新）

### 方案 4: 檢查瀏覽器控制台

按 **F12**，查看 **Console** 標籤：

```
❌ Access to XMLHttpRequest at 'https://...' 
   from origin 'https://...' 
   has been blocked by CORS policy: 
   Response to preflight request doesn't pass access control check
```

這說明 OPTIONS 請求失敗。

---

## 🎯 測試 OPTIONS 請求

在瀏覽器控制台運行：

```javascript
fetch('https://your-vercel-url.vercel.app/api/chart-data?symbol=2330', {
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'GET'
  }
})
.then(r => {
  console.log('✅ OPTIONS 成功');
  console.log('狀態碼:', r.status);
  console.log('CORS 頭:', r.headers.get('Access-Control-Allow-Origin'));
})
.catch(e => console.error('❌ OPTIONS 失敗:', e))
```

---

## 📝 預期結果

修復後應該看到：

```
✅ OPTIONS 預檢成功
✅ GET 請求成功
✅ K 線圖正常加載
✅ 技術指標正常顯示
✅ 沒有 CORS 錯誤
```

---

## 🚀 現在就部署！

```bash
# 1. 提交更改
git add -A
git commit -m "fix: improve CORS OPTIONS handling"

# 2. 推送到 GitHub
git push origin main

# 3. 等待 Vercel 自動部署

# 4. 刷新瀏覽器並測試
```

---

## 💡 關於本地 vs 部署

| 環境 | 命令 | 優點 | 缺點 |
|------|------|------|------|
| **本地** | `npm run dev` | 快速測試，完全控制 | 只在本地可用 |
| **Vercel** | `git push origin main` | 線上可訪問，可分享 | 部署有延遲 |

如果線上版本有問題，可以先用本地測試！

---

**現在部署修復，應該能解決 OPTIONS 問題！** 🚀
