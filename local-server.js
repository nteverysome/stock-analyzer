// 本地開發伺服器 - 支援 /api/claude 路由
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const PORT = 8080;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 發送 JSON 回應的工具函數
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// 直接處理 /api/chart-data
async function handleChartData(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const symbol = url.searchParams.get('symbol');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  if (!symbol) return sendJSON(res, 400, { error: 'symbol required' });
  if (!process.env.DATABASE_URL) return sendJSON(res, 500, { error: 'DATABASE_URL not configured' });

  const sql = neon(process.env.DATABASE_URL);

  let rows;
  if (start_date && end_date) {
    rows = await sql`
      SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
             i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date} AND p.price_date <= ${end_date}
      ORDER BY p.price_date ASC
    `;
  } else if (start_date) {
    rows = await sql`
      SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
             i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date}
      ORDER BY p.price_date ASC
    `;
  } else if (end_date) {
    rows = await sql`
      SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
             i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date <= ${end_date}
      ORDER BY p.price_date ASC
    `;
  } else {
    rows = await sql`
      SELECT p.symbol, p.price_date, p.open, p.high, p.low, p.close, p.volume,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal, i.macd_histogram,
             i.m1 AS ma5, i.m2 AS ma10, i.m3 AS ma20, i.m4 AS ma60, i.m5 AS ma120
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol}
      ORDER BY p.price_date ASC
    `;
  }

  const candles = rows.map(r => ({
    date: r.price_date,
    open: parseFloat(r.open),  high: parseFloat(r.high),
    low:  parseFloat(r.low),   close: parseFloat(r.close),
    volume: parseInt(r.volume),
    rsi: r.rsi != null ? parseFloat(r.rsi) : null,
    kdFast: r.kd_fast != null ? parseFloat(r.kd_fast) : null,
    kdSlow: r.kd_slow != null ? parseFloat(r.kd_slow) : null,
    macd: r.macd != null ? parseFloat(r.macd) : null,
    macdSignal: r.macd_signal != null ? parseFloat(r.macd_signal) : null,
    macdHistogram: r.macd_histogram != null ? parseFloat(r.macd_histogram) : null,
    ma5: r.ma5 != null ? parseFloat(r.ma5) : null,
    ma10: r.ma10 != null ? parseFloat(r.ma10) : null,
    ma20: r.ma20 != null ? parseFloat(r.ma20) : null,
    ma60: r.ma60 != null ? parseFloat(r.ma60) : null,
    ma120: r.ma120 != null ? parseFloat(r.ma120) : null,
  }));
  sendJSON(res, 200, { success: true, symbol, count: candles.length, candles });
}

// 直接處理 /api/backtest
async function handleBacktest(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const symbol = url.searchParams.get('symbol');
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  if (!symbol) return sendJSON(res, 400, { error: 'symbol required' });
  if (!process.env.DATABASE_URL) return sendJSON(res, 500, { error: 'DATABASE_URL not configured' });

  const sql = neon(process.env.DATABASE_URL);

  let rows;
  if (start_date && end_date) {
    rows = await sql`
      SELECT p.price_date, p.close,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal,
             i.m1 AS ma5, i.m3 AS ma20
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date} AND p.price_date <= ${end_date}
      ORDER BY p.price_date ASC
    `;
  } else if (start_date) {
    rows = await sql`
      SELECT p.price_date, p.close,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal,
             i.m1 AS ma5, i.m3 AS ma20
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date >= ${start_date}
      ORDER BY p.price_date ASC
    `;
  } else if (end_date) {
    rows = await sql`
      SELECT p.price_date, p.close,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal,
             i.m1 AS ma5, i.m3 AS ma20
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol} AND p.price_date <= ${end_date}
      ORDER BY p.price_date ASC
    `;
  } else {
    rows = await sql`
      SELECT p.price_date, p.close,
             i.rsi, i.kd_fast, i.kd_slow, i.macd, i.macd_signal,
             i.m1 AS ma5, i.m3 AS ma20
      FROM tw_daily_prices p
      LEFT JOIN tw_indicators i ON p.symbol = i.symbol AND p.price_date = i.indicator_date
      WHERE p.symbol = ${symbol}
      ORDER BY p.price_date ASC
    `;
  }

  sendJSON(res, 200, { success: true, symbol, count: rows.length, rows });
}

const server = http.createServer(async (req, res) => {
  // 每個請求都打印日誌（確認版本）
  console.log(`[v3] ${req.method} ${req.url}`);

  // /api/chart-data 路由
  if (req.url.startsWith('/api/chart-data')) {
    try {
      await handleChartData(req, res);
    } catch (err) {
      console.error('❌ /api/chart-data 錯誤:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
    return;
  }

  // /api/backtest 路由
  if (req.url.startsWith('/api/backtest')) {
    try {
      await handleBacktest(req, res);
    } catch (err) {
      console.error('❌ /api/backtest 錯誤:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
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
  console.log(`====================================`);
  console.log(`🚀 [v3] 伺服器啟動 http://localhost:${PORT}`);
  console.log(`✅ /api/chart-data → 直接查詢數據庫`);
  console.log(`✅ /api/backtest → 直接查詢數據庫`);
  console.log(`====================================`);
});

