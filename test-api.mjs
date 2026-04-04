#!/usr/bin/env node

/**
 * 測試 FinMind API 連接
 */

import fetch from 'node-fetch';

console.log('🔍 測試 FinMind API...\n');

try {
  console.log('📥 請求股票清單...');
  const res = await fetch('https://api.finmind.ai/api/v4/data?dataset=TaiwanStockInfo');
  
  console.log(`✅ HTTP ${res.status}`);
  
  const data = await res.json();
  
  console.log('\n📊 API 響應:');
  console.log(JSON.stringify(data, null, 2).substring(0, 500));
  
  if (data.data?.length) {
    console.log(`\n✅ 成功獲取 ${data.data.length} 隻股票`);
  } else {
    console.log('\n⚠️ 沒有獲取到股票數據');
    console.log('狀態:', data.status);
    console.log('訊息:', data.msg);
  }
  
} catch (err) {
  console.error('❌ 錯誤:', err.message);
}

console.log('\n');
