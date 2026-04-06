const fs = require('fs');
const https = require('https');
const TOKEN = process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';

function upload(localPath, remotePath, sha) {
  return new Promise((resolve, reject) => {
    const raw = fs.readFileSync(localPath);
    const body = JSON.stringify({
      message: 'feat: expand screener database to 250+ US stocks + 100+ TW stocks, improve API strategy',
      content: raw.toString('base64'),
      branch: 'main',
      sha
    });
    const opts = {
      hostname: 'api.github.com',
      path: `/repos/nteverysome/stock-analyzer/contents/${remotePath}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'node',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          resolve(res.statusCode === 200 || res.statusCode === 201
            ? { ok: true, sha: j.commit.sha }
            : { ok: false, status: res.statusCode, msg: j.message });
        } catch(e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  const r = await upload('./api/screener.js', 'api/screener.js',
    '2083164e6ca6ea2ddcdcc33b0e3a97f37172fcca');
  fs.writeFileSync('./_upload_final_result.txt', JSON.stringify(r, null, 2), 'utf8');
}
main().catch(e => fs.writeFileSync('./_upload_final_result.txt', 'ERR: ' + e.message, 'utf8'));
