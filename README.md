# 四模組股票決策引擎 v4.0

全即時數據版本 — Yahoo Finance + CNN + Claude AI

🚀 **[立即在線使用](https://vercel.com/new?repo=nteverysome/stock-analyzer)** | 📖 [部署指南](./DEPLOYMENT.md) | 💻 [GitHub](https://github.com/nteverysome/stock-analyzer)

## 功能

- ✅ **基本面分析**：PE、PEG、毛利率、FCF、分析師目標（Yahoo Finance 即時）
- ✅ **技術面計算**：RSI、MACD、52週區間（前端計算）
- ✅ **宏觀判斷**：VIX、恐懼貪婪指數、市場環境（Yahoo + CNN 即時）
- ✅ **定性評估**：護城河、風險、催化劑（Claude AI，可選）
- ✅ **凱利倉位**：賠率、動態 K、共振乘數，自動計算建議倉位
- ✅ **出場規劃**：硬性停損、止盈、移動停損、時間停損

## 快速開始

### 1. 線上版（最簡單，無需安裝）

**一鍵部署到 Vercel**（完全免費）：
```
https://vercel.com/new?repo=nteverysome/stock-analyzer
```

或訪問已部署的版本（如果您已部署）

### 2. 本地版（無需 API Key）

直接用瀏覽器開啟：
```
stock_analyzer.html
```

所有 Yahoo Finance 數據（PE、毛利率、股價、RSI、MACD）完全免費，立即可用。

### 3. 啟用 Claude 定性分析（可選）

步驟 A：獲取 API Key
```
1. 訪問 https://console.anthropic.com/account/keys
2. 建立新的 API Key
3. 複製 API Key
```

步驟 B：在網頁設定 API Key
```javascript
// 在瀏覽器 DevTools Console 執行：
localStorage.setItem('anthropic_api_key', 'sk-ant-...');

// 驗證
console.log(localStorage.getItem('anthropic_api_key'));
```

步驟 C：重新分析
刷新頁面，再次分析股票，Claude 即會自動調用。

## 數據來源

| 數據 | 來源 | 更新頻率 | 成本 |
|------|------|--------|------|
| PE、PEG、毛利率、FCF | Yahoo Finance | 即時 | 🟢 免費 |
| 股價、RSI、MACD | Yahoo Finance | 即時 | 🟢 免費 |
| VIX、短期利率 | Yahoo Finance | 即時 | 🟢 免費 |
| 恐懼貪婪指數 | CNN | 快取 30 分鐘 | 🟢 免費 |
| 護城河、風險、催化劑 | Claude AI | 按需 | 🔵 按使用量計費 |

## 框架計算

5 模組加權評分：

```
總分 = M1 × 20% + M2 × 30% + M3 × 25% + M4 × 15% + M5 × 10%

M1 (宏觀環境)   ← VIX、恐懼貪婪、Fed 利率、市場環境
M2 (估值護城河)  ← PEG、毛利率、上行空間、EPS 成長、盈餘品質
M3 (技術籌碼)   ← RSI、MACD、護城河得分
M4 (凱利倉位)   ← 賠率、動態 K、共振乘數（自動計算）
M5 (出場規劃)   ← R:R 比例（停損至目標的收益比）
```

## 使用建議

### ✅ 適合用途
- 學習股票分析框架
- 快速篩選股票進入條件
- 理解宏觀 × 基本面 × 技術面的融合邏輯
- 個人投資組合監控

### ⚠️ 限制
- **不進行實時監控**（無警報功能）
- **不處理中文名稱查詢**（必須用英文代號如 MSFT）
- **無盤中更新**（靠 F5 重新整理）
- **CORS 代理依賴**（若代理故障會無法抓取數據）

## 部署到伺服器

### Node.js + Express（推薦用於生產）

```bash
# 1. 初始化 Node 專案
npm init -y
npm install express cors dotenv

# 2. 建立 server.js
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));

app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(400).json({ error: '未設定 API Key' });
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.json(data);
});

app.listen(8080, () => console.log('Server at http://localhost:8080'));
EOF

# 3. 創建 .env 文件
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 4. 啟動
node server.js
```

### Python + Flask

```bash
pip install flask flask-cors python-dotenv

cat > app.py << 'EOF'
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

@app.route('/api/claude', methods=['POST'])
def claude():
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        return jsonify({'error': 'API Key not set'}), 400
    
    resp = requests.post('https://api.anthropic.com/v1/messages',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01'
        },
        json=request.json)
    
    return jsonify(resp.json())

if __name__ == '__main__':
    app.run(debug=True, port=8080)
EOF

export ANTHROPIC_API_KEY=sk-ant-...
python app.py
```

## 文件結構

```
stock-analyzer/
├── stock_analyzer.html      # 主應用（完整前端）
├── .env.example             # 環境變數模板
├── .gitignore              # Git 排除規則
├── README.md               # 本說明文件
├── proxy-server.js         # （可選）Node 後端代理
└── app.py                  # （可選）Python 後端代理
```

## 安全提醒

⚠️ **永遠不要在代碼中嵌入 API Key！**

**推薦做法：**
1. 使用環境變數存儲敏感資訊
2. 加入 `.gitignore` 排除 `.env` 文件
3. 在本地 localStorage 或後端代理中安全管理密鑰

**如果意外洩露 API Key：**
1. 立即訪問 https://console.anthropic.com/account/keys 撤銷密鑰
2. 檢查消費記錄
3. 生成新密鑰

## 常見問題

**Q：為什麼股票代號查不到？**
A：Yahoo Finance 只支持英文代號（MSFT、AAPL）。確保拼寫正確。

**Q：能不能自動每天重跑？**
A：這個工具是單頁應用，無內置排程。建議用瀏覽器自動化工具（Playwright、Puppeteer）定時執行。

**Q：CORS 代理故障怎麼辦？**
A：改用本地伺服器：`python -m http.server 8080`

**Q：沒有 Claude API Key 會怎樣？**
A：護城河評分給預設值 60，其他四模組完全正常。不影響決策。

## 開源協議

MIT License — 自由使用、修改、分享

## 支持

有問題或改進建議？提交 Issue 或 PR！

