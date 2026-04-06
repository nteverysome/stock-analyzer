# 🚀 用任何有網路的電腦部署

你的本地電腦無法連外網，但你可以用**另一台電腦、手機、或雲端代碼編輯器**來執行部署。

## 方案 A：用 GitHub Web UI（最簡單）

1. 用任何有網路的電腦登入 GitHub
2. 逐個編輯這 3 個檔案（見下方），貼上新代碼
3. 每個都 commit 就完成了

## 方案 B：用 Google Colab（免費雲端 Python）

1. 開啟 https://colab.research.google.com
2. 新增程式碼框，執行：

```python
import subprocess
import os

token = "YOUR_GITHUB_TOKEN_HERE"  # Replace with your own token
owner = "nteverysome"
repo = "stock-analyzer"

files = {
    "api/chart-data.js": "fix: Update chart-data API to neon HTTP mode",
    "api/backtest.js": "fix: Update backtest API to neon HTTP mode",
    "api/health.js": "feat: Add health check endpoint",
    "public/chart.html": "feat: Redesign chart UI with M3 technical analysis"
}

for filepath, message in files.items():
    # 這裡需要檔案內容，見下方
    content = "..." # 貼上完整檔案內容
    
    import base64
    import requests
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{filepath}"
    headers = {"Authorization": f"token {token}"}
    
    # 取得 SHA
    resp = requests.get(url, headers=headers)
    sha = resp.json().get("sha") if resp.status_code == 200 else None
    
    # 更新
    data = {
        "message": message,
        "content": base64.b64encode(content.encode()).decode(),
        "branch": "main"
    }
    if sha:
        data["sha"] = sha
    
    resp = requests.put(url, json=data, headers=headers)
    print(f"{filepath}: {resp.status_code}")
```

## 方案 C：用 Codespaces（GitHub 線上開發環境）

1. 進入 https://github.com/nteverysome/stock-analyzer
2. 點綠色 "<> Code" → "Codespaces" → "Create codespace on main"
3. 等待環境啟動（約 1 分鐘）
4. 在終端執行：

```bash
git config user.email "admin@localhost"
git config user.name "Administrator"
git add api/chart-data.js api/backtest.js api/health.js public/chart.html
git commit -m "fix: Update APIs and redesign chart UI"
git push origin main
```

## 方案 D：用手機（iOS/Android）

用 GitHub 官方 App：
1. 打開 GitHub App
2. 進入 stock-analyzer repo
3. 點右上角 "..." → "Edit file"
4. 貼上新代碼
5. 提交

---

**你有其他電腦或手機可以用嗎？**

如果用 Google Colab，我可以幫你準備完整的 Python 腳本。
如果用 Codespaces，就跟著上面的指令做。
如果用 GitHub Web UI，我給你 4 個檔案的完整代碼。

告訴我你選哪個方式！
