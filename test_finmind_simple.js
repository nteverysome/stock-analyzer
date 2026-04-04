/**
 * 快速測試 FinMind API 的相容性和性能
 * 決定在 Vercel 上是否使用 FinMind
 */

const https = require('https');
const fs = require('fs');

function httpsGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    https.get(url, { timeout }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        resolve({ 
          status: res.statusCode, 
          elapsed, 
          size: d.length,
          body: d 
        });
      });
    }).on('error', reject);
  });
}

async function main() {
  const results = {
    環境: { nodejs: process.version },
    測試清單: [],
    性能分析: {},
    建議: []
  };

  console.log('=' .repeat(60));
  console.log('FinMind API 在 Vercel 相容性測試');
  console.log('=' .repeat(60));

  // Test 1: 股票清單
  console.log('\n[1/4] 測試台灣股票清單 API...');
  try {
    const r = await httpsGet('https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo', 15000);
    const data = JSON.parse(r.body);
    const symbolCount = data.data ? data.data.length : 0;
    results.測試清單.push({
      API: 'TaiwanStockInfo',
      status: r.status,
      耗時ms: r.elapsed,
      返回股票數: symbolCount,
      評估: r.status === 200 ? '✅ 可用' : '❌ 失敗'
    });
    console.log(`✓ 成功（${r.elapsed}ms，${symbolCount} 隻股票）`);
  } catch (e) {
    results.測試清單.push({ API: 'TaiwanStockInfo', error: e.message });
    console.log(`✗ 失敗: ${e.message}`);
  }

  // Test 2: 單隻股票 OHLCV（台積電 2330）
  console.log('\n[2/4] 測試單隻股票 OHLCV (台積電 2330)...');
  try {
    const r = await httpsGet('https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=2330&start_date=20260101', 15000);
    const data = JSON.parse(r.body);
    const dataPoints = data.data ? data.data.length : 0;
    results.測試清單.push({
      API: 'TaiwanStockPrice (2330)',
      status: r.status,
      耗時ms: r.elapsed,
      數據點數: dataPoints,
      評估: r.status === 200 ? '✅ 可用' : '❌ 失敗'
    });
    console.log(`✓ 成功（${r.elapsed}ms，${dataPoints} 筆 OHLCV）`);
  } catch (e) {
    results.測試清單.push({ API: 'TaiwanStockPrice', error: e.message });
    console.log(`✗ 失敗: ${e.message}`);
  }

  // Test 3: 模擬並行請求 10 隻股票
  console.log('\n[3/4] 模擬並行請求 10 隻股票 OHLCV...');
  try {
    const symbols = ['2330', '2317', '2454', '2308', '2382', '2891', '1101', '1301', '2002', '0050'];
    const startTime = Date.now();
    
    const promises = symbols.map(sym =>
      httpsGet(`https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=${sym}&start_date=20260101`, 10000)
        .catch(() => ({ status: 500, elapsed: 0 }))
    );
    
    const responses = await Promise.all(promises);
    const totalElapsed = Date.now() - startTime;
    const successCount = responses.filter(r => r.status === 200).length;
    const avgTime = totalElapsed / symbols.length;
    
    results.測試清單.push({
      API: '並行 10 隻 TaiwanStockPrice',
      成功: successCount,
      失敗: symbols.length - successCount,
      總耗時ms: totalElapsed,
      平均ms: avgTime.toFixed(0),
      評估: successCount >= 8 ? '✅ 可用' : '⚠️ 不穩定'
    });
    
    results.性能分析 = {
      單隻耗時ms: avgTime.toFixed(0),
      全市場292隻估計秒: (avgTime * 292 / 1000).toFixed(1),
      Vercel函數限制秒: 60,
      並行策略: '建議每批 20-30 隻'
    };
    
    console.log(`✓ 成功（${totalElapsed}ms，${successCount}/${symbols.length} 成功）`);
    console.log(`  - 平均單隻: ${avgTime.toFixed(0)}ms`);
    console.log(`  - 全市場 292 隻估計: ${(avgTime * 292 / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`✗ 失敗: ${e.message}`);
  }

  // Test 4: 評估
  console.log('\n[4/4] 最終評估...');
  const canUseFinMind = results.性能分析.全市場292隻估計秒 < 60;
  
  if (canUseFinMind) {
    results.建議.push('✅ FinMind API 適合用於 Vercel');
    results.建議.push('推薦方案: 分批並行調用（每批 20-30 隻）+ 前端快取');
    results.建議.push('實現路徑: /api/indicators?symbols=2330,2317,2454');
  } else {
    results.建議.push('❌ FinMind API 實時全市場掃描超過 Vercel 時限');
    results.建議.push('替代方案 1: 每晚定時爬取，存入 Vercel KV Store');
    results.建議.push('替代方案 2: 前端漸進式加載（逐隻加載指標）');
    results.建議.push('替代方案 3: 用戶選擇特定產業或個股（減少請求數）');
  }

  fs.writeFileSync('./test_finmind_result.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n結果已保存到 test_finmind_result.json\n');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => {
  fs.writeFileSync('./test_finmind_result.json', JSON.stringify({ error: e.message }), 'utf8');
  console.error('❌ 測試失敗:', e.message);
  process.exit(1);
});
