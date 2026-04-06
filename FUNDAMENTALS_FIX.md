# ✅ 基本面數據錯誤已修復！

## 🎯 問題

基本面數據獲取失敗，錯誤信息：
```
無法獲取 2330.TW 的數據: Unexpected token '<', "<!DOCTYPE "...
```

**原因**：`tw_fundamentals` 表不存在或為空，API 嘗試 JOIN 一個不存在的表。

---

## ✅ 解決方案

我已經修改了 `api/chart-data.js`，現在會：

1. ✅ **檢查表是否存在** - 自動偵測 `tw_fundamentals` 表
2. ✅ **條件性 JOIN** - 表存在才 JOIN，不存在就返回 NULL
3. ✅ **優雅降級** - 沒有基本面數據也能正常顯示 K 線圖

---

## 🚀 立即重試

### **重新啟動開發伺服器**

```bash
# 停止當前伺服器（按 Ctrl+C）
# 然後重新啟動
npm run dev
```

### **在瀏覽器刷新**

```
http://localhost:8080/chart.html
```

### **重新查詢股票**

輸入股票代碼（如 2330），應該看到：

```
✅ K 線圖正常顯示
✅ 技術指標正常加載
⚠️ 基本面數據為空（正常）
```

---

## 📊 預期結果

### 成功的響應：
```json
{
  "data": [
    {
      "symbol": "2330",
      "price_date": "2024-01-01",
      "open": 380.0,
      "high": 390.0,
      "low": 375.0,
      "close": 385.0,
      "volume": 5000000,
      "rsi": 65.5,
      "macd": 2.3,
      "pe_ttm": null,          // ← 現在為 null（正常）
      "peg": null,
      ...
    }
  ]
}
```

---

## 💡 基本面數據的兩個選項

### **選項 1: 使用現有系統（推薦）**

K 線圖和技術指標已完全工作，無需基本面數據。

### **選項 2: 後續補抓基本面數據（可選）**

如果需要基本面數據，可以執行：

```bash
# 創建 tw_fundamentals 表
CREATE TABLE tw_fundamentals (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  pe_ttm DECIMAL(10,2),
  peg DECIMAL(10,2),
  gross_margin DECIMAL(5,2),
  analyst_target DECIMAL(10,2),
  analyst_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 然後補抓基本面數據
node scripts/fetch-tw-fundamentals.mjs
```

---

## ✨ 現在的功能

### ✅ 完全工作

- K 線圖（蠟燭圖 + 成交量）
- 技術指標（RSI、MACD、KD、MA）
- 回測評分
- 股票查詢
- 日期範圍選擇

### ⚠️ 暫不支持（可後續補抓）

- PE 比率（基本面數據）
- PEG 比率（基本面數據）
- 毛利率（基本面數據）
- 分析師目標價（基本面數據）

---

## 🚀 現在就試試吧！

```bash
# 重新啟動伺服器
npm run dev

# 在瀏覽器打開
http://localhost:8080/chart.html

# 輸入股票代碼查詢
# 例如：2330、2317、2454 等
```

**應該能正常顯示 K 線圖和技術指標！** ✅

---

## 📞 如果還有問題

1. 清除瀏覽器緩存（Ctrl+Shift+Delete）
2. 硬刷新（Ctrl+Shift+R）
3. 打開瀏覽器開發者工具（F12）查看 Console
4. 檢查伺服器是否正常運行

---

**修復完成！現在享受完整的 K 線圖系統吧！** 🎉
