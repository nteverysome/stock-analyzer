// 簡單的 FinMind API 測試
import https from 'https';

const url = 'https://api.finmind.ai/api/v4/data?dataset=TaiwanStockPrice&data_id=2330&start_date=20230101';

console.log('測試 FinMind API 連接...\n');
console.log('URL:', url);
console.log('');

const options = {
  rejectUnauthorized: false,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

https.get(url, options, (res) => {
  console.log(`✅ 連接成功！`);
  console.log(`狀態碼: ${res.statusCode}`);
  console.log(`內容類型: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`✅ 數據有效！`);
      console.log(`返回記錄數: ${json.data ? json.data.length : 0}`);
      if (json.data && json.data.length > 0) {
        console.log(`樣本: ${JSON.stringify(json.data[0], null, 2)}`);
      }
    } catch (e) {
      console.log(`❌ JSON 解析失敗: ${e.message}`);
      console.log(`返回內容: ${data.substring(0, 200)}`);
    }
  });
}).on('error', (err) => {
  console.log(`❌ 連接失敗！`);
  console.log(`錯誤: ${err.message}`);
}).on('timeout', () => {
  console.log(`❌ 超時！`);
});
