/**
 * 台灣股票應用路由
 */

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>台灣股票分析 - TW Stock Analyzer</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; }
h1 { margin-bottom: 20px; color: #1a1a1a; }
.search { margin-bottom: 20px; }
.search input { padding: 12px; width: 100%; max-width: 400px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.stocks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-bottom: 30px; }
.stock-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s; }
.stock-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
.stock-symbol { font-size: 18px; font-weight: bold; color: #1a1a1a; }
.stock-name { font-size: 14px; color: #666; margin-top: 4px; }
.stock-sector { font-size: 12px; color: #999; margin-top: 8px; background: #f9f9f9; padding: 4px 8px; border-radius: 4px; display: inline-block; }
.details { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.detail-row:last-child { border-bottom: none; }
.detail-label { color: #666; }
.detail-value { font-weight: bold; color: #1a1a1a; }
.chart { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.loading { text-align: center; padding: 40px; color: #666; }
.error { background: #fee; color: #c33; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
.success { background: #efe; color: #3c3; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
</style>
</head>
<body>
<div class="container">
  <h1>📊 台灣股票分析系統</h1>
  
  <div id="message"></div>
  
  <div class="search">
    <input type="text" id="search" placeholder="搜尋股票代號或名稱 (如: 2330, 台積電)">
  </div>

  <div id="stocks" class="stocks-grid">
    <div class="loading">加載中...</div>
  </div>

  <div id="details" style="display:none;">
    <h2 id="detailTitle" style="margin-bottom: 15px;"></h2>
    <div class="details" id="detailContent"></div>
    <div class="chart" id="chart"></div>
    <button onclick="closeDetails()" style="padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 6px; cursor: pointer;">返回列表</button>
  </div>
</div>

<script>
let allStocks = [];
let selectedStock = null;

async function init() {
  try {
    const response = await fetch('/api/stocks');
    const data = await response.json();
    
    if (data.success) {
      allStocks = data.stocks || [];
      renderStocks(allStocks);
      
      if (allStocks.length === 0) {
        showMessage('未找到股票數據', 'error');
      } else {
        showMessage(\`✅ 成功加載 \${allStocks.length} 隻股票\`, 'success');
      }
    } else {
      showMessage('無法加載數據：' + (data.message || '未知錯誤'), 'error');
    }
  } catch (err) {
    showMessage('加載失敗：' + err.message, 'error');
  }
}

function renderStocks(stocks) {
  const container = document.getElementById('stocks');
  if (stocks.length === 0) {
    container.innerHTML = '<div class="loading">未找到符合的股票</div>';
    return;
  }
  
  container.innerHTML = stocks.map(s => \`
    <div class="stock-card" onclick="viewStock('\${s.symbol}', '\${s.name}')">
      <div class="stock-symbol">\${s.symbol}</div>
      <div class="stock-name">\${s.name}</div>
      <div class="stock-sector">\${s.sector || '其他'} / \${s.industry || '未分類'}</div>
    </div>
  \`).join('');
}

async function viewStock(symbol, name) {
  selectedStock = symbol;
  document.getElementById('stocks').style.display = 'none';
  document.getElementById('details').style.display = 'block';
  document.getElementById('detailTitle').textContent = \`\${symbol} - \${name}\`;
  
  try {
    const response = await fetch(\`/api/stock-detail?symbol=\${symbol}\`);
    const data = await response.json();
    
    if (data.success) {
      renderDetails(data);
    } else {
      showMessage('無法加載詳情：' + data.message, 'error');
    }
  } catch (err) {
    showMessage('加載詳情失敗：' + err.message, 'error');
  }
}

function renderDetails(data) {
  const stock = data.stock;
  const prices = data.prices || [];
  
  const detailContent = document.getElementById('detailContent');
  detailContent.innerHTML = \`
    <div class="detail-row">
      <span class="detail-label">股票代號</span>
      <span class="detail-value">\${stock.symbol}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">股票名稱</span>
      <span class="detail-value">\${stock.name}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">產業</span>
      <span class="detail-value">\${stock.industry || '未分類'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">部門</span>
      <span class="detail-value">\${stock.sector || '未分類'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">價格數據筆數</span>
      <span class="detail-value">\${prices.length} 筆</span>
    </div>
    \${prices.length > 0 ? \`
    <div class="detail-row">
      <span class="detail-label">最新股價</span>
      <span class="detail-value">$\${prices[prices.length-1].close}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">最高價</span>
      <span class="detail-value">$\${Math.max(...prices.map(p => p.high)).toFixed(2)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">最低價</span>
      <span class="detail-value">$\${Math.min(...prices.map(p => p.low)).toFixed(2)}</span>
    </div>
    \` : ''}
  \`;

  if (prices.length > 0) {
    const chart = document.getElementById('chart');
    const closes = prices.map(p => p.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const range = maxPrice - minPrice || 1;
    
    const chartHTML = \`
      <h3 style="margin-bottom: 15px;">股價趨勢（\${prices.length}天）</h3>
      <div style="height: 200px; position: relative; border: 1px solid #eee; border-radius: 4px; padding: 10px;">
        <svg width="100%" height="100%" style="display: block;">
          \${closes.map((price, i) => {
            const x = (i / (closes.length - 1 || 1)) * 100;
            const y = 100 - ((price - minPrice) / range) * 100;
            return \`<circle cx="\${x}%" cy="\${y}%" r="2" fill="#378ADD" opacity="0.6"/>\`;
          }).join('')}
        </svg>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">
        價格範圍: $\${minPrice.toFixed(2)} - $\${maxPrice.toFixed(2)}
      </div>
    \`;
    chart.innerHTML = chartHTML;
  }
}

function closeDetails() {
  document.getElementById('stocks').style.display = 'grid';
  document.getElementById('details').style.display = 'none';
}

document.getElementById('search').addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allStocks.filter(s => 
    s.symbol.includes(keyword) || s.name.includes(keyword)
  );
  renderStocks(filtered);
});

function showMessage(msg, type) {
  const msgDiv = document.getElementById('message');
  msgDiv.className = type;
  msgDiv.textContent = msg;
  msgDiv.style.display = 'block';
}

window.addEventListener('load', init);
</script>
</body>
</html>`;

  res.status(200).send(html);
}
