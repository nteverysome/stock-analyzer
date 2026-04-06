const https = require('https'), fs = require('fs');
const content = fs.readFileSync('./api/screener.js');
const b64 = content.toString('base64');

const payload = JSON.stringify({
  message: 'feat: expand screener database to 250+ US stocks + 100+ TW stocks, improve API strategy with 8 concurrent screeners',
  content: b64,
  branch: 'main',
  sha: '2083164e6ca6ea2ddcdcc33b0e3a97f37172fcca'
});

const options = {
  hostname: 'api.github.com', path: '/repos/nteverysome/stock-analyzer/contents/api/screener.js',
  method: 'PUT', headers: {
    'Authorization': 'token YOUR_GITHUB_TOKEN_HERE',
    'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'node', 'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const result = { status: res.statusCode, success: res.statusCode === 200 || res.statusCode === 201 };
    try { const j = JSON.parse(d); result.sha = j.commit?.sha || j.sha; } catch(_) {}
    fs.writeFileSync('./upload_ok.txt', JSON.stringify(result));
  });
});
req.on('error', e => fs.writeFileSync('./upload_ok.txt', 'ERROR: ' + e.message));
req.write(payload);
req.end();
