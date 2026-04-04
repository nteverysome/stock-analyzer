// 本地開發伺服器 - 支援 /api/claude 路由
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer(async (req, res) => {
  // 啟用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // /api/claude 路由
  if (req.method === 'POST' && req.url === '/api/claude') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { apiKey, prompt } = JSON.parse(body);
        if (!apiKey || !prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'apiKey and prompt required' }));
          return;
        }

        console.log('[Local /api/claude] 調用 Claude API');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const err = await response.json();
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.error?.message || `API ${response.status}` }));
          return;
        }

        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch(e) {
        console.error('[Local /api/claude Error]', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 靜態文件（同時支持根目錄和 public 目錄）
  let filePath;
  const requestPath = req.url === '/' ? 'index.html' : req.url;

  // 優先查找 public 目錄
  if (fs.existsSync(path.join(PUBLIC_DIR, requestPath))) {
    filePath = path.join(PUBLIC_DIR, requestPath);
  } else {
    // 備用查找根目錄
    filePath = path.join(ROOT_DIR, requestPath);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 回退到 index.html
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
      }[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 本地開發伺服器運行在 http://localhost:${PORT}`);
  console.log(`✅ 支援 /api/claude 路由（Claude API 代理）`);
  console.log(`📂 靜態文件目錄：${PUBLIC_DIR}`);
});

