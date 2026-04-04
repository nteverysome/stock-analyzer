#!/usr/bin/env node

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const output = [];

try {
  output.push('=== 完整驗證報告 ===\n');
  
  // 檢查連接
  output.push('✅ 1. 數據庫連接驗證');
  const conn = await pool.query('SELECT NOW()');
  output.push(`   時間: ${conn.rows[0].now}\n`);

  // 檢查表
  output.push('✅ 2. 表結構檢查');
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' ORDER BY table_name`
  );
  output.push(`   表數量: ${tables.rows.length}`);
  tables.rows.forEach(t => output.push(`   • ${t.table_name}`));
  output.push('');

  // 數據統計
  output.push('✅ 3. 數據統計');
  const s = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
  const p = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
  const i = await pool.query('SELECT COUNT(*) as count FROM tw_indicators');
  
  output.push(`   股票: ${s.rows[0].count}`);
  output.push(`   價格: ${p.rows[0].count}`);
  output.push(`   指標: ${i.rows[0].count}`);
  output.push('');

  // 樣本數據
  output.push('✅ 4. 樣本股票');
  const stocks = await pool.query('SELECT symbol, name FROM tw_stocks LIMIT 3');
  stocks.rows.forEach(st => output.push(`   ${st.symbol} - ${st.name}`));
  output.push('');

  // 完成
  output.push('=== 驗證完成 ===');
  output.push(`🎉 系統狀態: 就緒`);
  output.push(`📱 應用可以開始使用`);

  const content = output.join('\n');
  console.log(content);
  fs.writeFileSync('final-check-result.txt', content, 'utf8');

} catch (err) {
  console.error('❌ 錯誤:', err.message);
} finally {
  await pool.end();
}
