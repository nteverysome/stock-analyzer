import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const logFile = path.join(__dirname, 'quick-check-result.txt');
const logs = [];

function log(msg) {
  logs.push(msg);
  console.log(msg);
}

try {
  const s = await pool.query('SELECT COUNT(*) as count FROM tw_stocks');
  const p = await pool.query('SELECT COUNT(*) as count FROM tw_daily_prices');
  
  log(`\n📊 數據庫狀態：`);
  log(`股票: ${s.rows[0].count}`);
  log(`價格: ${p.rows[0].count}\n`);
  
  fs.writeFileSync(logFile, logs.join('\n'));
} catch (e) {
  log(`❌ ${e.message}`);
} finally {
  await pool.end();
}
