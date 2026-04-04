# 🔍 Step 2 驗證指南 - 使用 VS Code 終端

## 情況說明

你的 `.env.local` 已自動配置了 `DATABASE_URL`，現在可以驗證連接。

---

## ✅ 在 VS Code 終端中執行

打開 VS Code 終端（`Ctrl + ``），然後按順序執行：

### 1️⃣ 首先驗證環境變數已加載

```bash
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'YES ✅' : 'NO ❌')"
```

**預期輸出**：
```
DATABASE_URL: YES ✅
```

---

### 2️⃣ 運行完整的 Neon 連接測試

```bash
node test-neon.js
```

**預期輸出**（應該看到）：
```
================================================
🔍 Neon PostgreSQL 連接測試
================================================

[1/3] 檢查 DATABASE_URL...
✅ DATABASE_URL 已設置
   格式: postgresql://neondb_owner:npg_VfDIb21MLkJ...

[2/3] 連接 Neon PostgreSQL...
✅ 連接成功！
   時間: 2026-04-03 XX:XX:XX...

[3/3] 檢查數據庫表...
📊 數據庫表檢查：
   ✅ tw_stocks
   ✅ tw_daily_prices
   ✅ tw_indicators
   ✅ tw_screener_cache
   ✅ tw_update_logs

📈 數據統計：
   X 隻股票已入庫
   Y 筆價格數據
   Z 筆指標數據

================================================
🎉 驗證成功！所有檢查已通過！
================================================

✅ 你的 Neon 數據庫已就緒！
✅ 連接已驗證
✅ 架構已初始化

下一步：進行 Step 3 - 部署 API
```

---

## 🔧 如果出現錯誤

### ❌ 錯誤：DATABASE_URL 未設置

**原因**：`.env.local` 未正確加載

**解決方案**：
```bash
# 檢查 .env.local 文件
cat .env.local
```

應該看到 `DATABASE_URL="postgresql://..."`

---

### ❌ 錯誤：連接失敗 / 無法解析主機名

**原因**：網絡連接問題或 VPN

**解決方案**：
1. 檢查網絡連接
2. 如果使用 VPN，確保已連接
3. 驗證連接字符串是否正確

---

### ❌ 錯誤：認證失敗 / 密碼錯誤

**原因**：DATABASE_URL 中的密碼不正確

**解決方案**：
1. 在 Vercel Dashboard 複製正確的連接字符串
2. 更新 `.env.local` 中的 DATABASE_URL
3. 重新運行測試

---

## 📋 完成檢查清單

執行完測試後，確認：

- [ ] ✅ DATABASE_URL 已設置
- [ ] ✅ 連接成功
- [ ] ✅ 所有 5 個表已創建
- [ ] ✅ 數據統計顯示已有數據

---

## 🎉 完成！

當所有檢查都通過時，Step 2 驗證完成 ✅

**下一步**：告訴我你看到的輸出結果！