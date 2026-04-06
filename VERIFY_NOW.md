# 🔍 立即驗證數據

## ⚡ 3 種驗證方式

### 方式 1️⃣ : Web 界面（最簡單，推薦）

```bash
# 1. 啟動本地開發
npx vercel dev

# 2. 在瀏覽器打開
http://localhost:3000/verify.html

# 3. 點擊「🔍 開始驗證」按鈕

# 4. 自動顯示驗證結果
```

**優點**：
- ✅ 圖形化界面
- ✅ 實時進度條
- ✅ 易於理解
- ✅ 一鍵驗證

---

### 方式 2️⃣ : Node 腳本

```bash
node scripts/verify-data.mjs
```

**顯示詳細的文本報告**

---

### 方式 3️⃣ : API

```bash
# 在瀏覽器打開
http://localhost:3000/api/verify

# 返回 JSON 格式結果
```

---

## 📊 預期驗證結果

### ✅ 補抓完成

```
✅ 補抓完成！數據準備完整！
   • 共 1,962 支股票
   • 10,000,000+ 筆價格記錄
   • 10,000,000+ 筆技術指標

可以開始本地測試：
  npx vercel dev
  訪問：http://localhost:3000/chart.html
```

### ⏳ 進行中

```
⏳ 補抓中或部分完成
   當前進度：45.2%
   請稍候，讓補抓和計算繼續進行
```

### ❌ 未完成

```
❌ 數據補抓未完成
   請檢查補抓腳本是否正在執行
   查看日誌：
     tail -f backfill.log
     tail -f indicators.log
```

---

## 🎯 驗證內容

| 項目 | 預期 | 檢查 |
|------|------|------|
| 價格記錄 | 10,000,000+ | ✅ |
| 技術指標 | 10,000,000+ | ✅ |
| 股票覆蓋 | 1,962 支 | ✅ |
| 交易日 | 1,200+ | ✅ |
| 平均記錄 | 5,000-7,000 | ✅ |

---

## ✅ 驗證成功後

1. **本地測試**
   ```bash
   npx vercel dev
   # 訪問 http://localhost:3000/chart.html
   ```

2. **測試功能**
   - [ ] 輸入股票代碼查詢
   - [ ] K 線圖正常顯示
   - [ ] 技術指標加載
   - [ ] 回測評分計算
   - [ ] 統計數據展示

3. **部署生產**
   ```bash
   git push origin main
   ```

---

## 📞 遇到問題？

**補抓卡住？**
```bash
# 查看進度
tail -f backfill.log

# 查看是否還有進程運行
tasklist | find "node"

# 重新運行（會自動跳過已有數據）
node scripts/fetch-5years-history.mjs
```

**驗證失敗？**
- 確認 `.env.local` 配置正確
- 確認 `npx vercel dev` 已啟動
- 查看數據庫連接日誌

---

## 🚀 現在就驗證！

```bash
npx vercel dev
# 訪問 http://localhost:3000/verify.html
```

---

**補抓完成了嗎？現在就驗證吧！** 🔍
