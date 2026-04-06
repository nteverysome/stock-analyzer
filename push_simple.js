#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
const file = fs.readFileSync('./api/screener.js');
const b64 = file.toString('base64');

const data = JSON.stringify({
  message: 'feat: expand to 270+ US stocks + 100+ TW stocks with 8 concurrent screeners',
  content: b64,
  branch: 'main',
  sha: '25e41ced9c6d12089fb81e5efa294debf900848b'
});

const req = https.request({
  hostname: 'api.github.com', path: '/repos/nteverysome/stock-analyzer/contents/api/screener.js',
  method: 'PUT',
  headers: {
    'Authorization': 'token ' + TOKEN,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'node'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const result = { code: res.statusCode, success: res.statusCode === 200 || res.statusCode === 201 };
    try { const j = JSON.parse(body); result.sha = j.commit?.sha; } catch(_) {}
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
  });
});

req.on('error', e => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});

req.write(data);
req.end();
