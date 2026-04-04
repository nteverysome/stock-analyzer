import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

try {
  console.log('\n📊 檢查數據庫狀態...\n');
  
  const stocks = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
  console.log(`✅ tw_stocks: ${stocks.rows[0].count} 隻股票`);

  const prices = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
  console.log(`✅ tw_daily_prices: ${prices.rows[0].count} 筆記錄`);

  console.log('\n✅ 數據庫連接成功！\n');
  
  if (stocks.rows[0].count > 0) {
    console.log('🎉 數據填充已完成！\n');
  } else {
    console.log('⏳ 數據填充進行中...\n');
  }
  
  await pool.end();
} catch (error) {
  console.error('❌ 錯誤:', error.message);
  await pool.end();
}
