/**
 * 建立 tw_fundamentals 表
 */
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });

try {
  console.log('📦 建立 tw_fundamentals 表...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tw_fundamentals (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      update_date DATE NOT NULL DEFAULT CURRENT_DATE,
      
      -- 估值
      pe_ttm DECIMAL(10, 2),
      pe_fwd DECIMAL(10, 2),
      peg DECIMAL(10, 3),
      peg_growth_used DECIMAL(10, 2),
      
      -- 利潤率
      gross_margin DECIMAL(8, 4),
      operating_margin DECIMAL(8, 4),
      net_margin DECIMAL(8, 4),
      
      -- 成長
      rev_growth DECIMAL(8, 4),
      eps_growth DECIMAL(8, 4),
      
      -- 分析師
      analyst_target DECIMAL(10, 2),
      analyst_low DECIMAL(10, 2),
      analyst_high DECIMAL(10, 2),
      analyst_count INT,
      recommendation VARCHAR(20),
      
      -- 其他
      market_cap BIGINT,
      beta DECIMAL(6, 3),
      dividend_yield DECIMAL(8, 4),
      free_cashflow BIGINT,
      sector VARCHAR(100),
      industry VARCHAR(100),
      next_earnings DATE,
      
      -- 元數據
      source VARCHAR(20) DEFAULT 'yahoo',
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(symbol, update_date),
      FOREIGN KEY (symbol) REFERENCES tw_stocks(symbol) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tw_fund_symbol_date 
    ON tw_fundamentals(symbol, update_date DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tw_fund_peg 
    ON tw_fundamentals(peg) WHERE peg IS NOT NULL;
  `);

  // 驗證
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tw_fundamentals'
  `);

  if (tables.rows.length > 0) {
    console.log('✅ tw_fundamentals 表建立成功！');
    
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'tw_fundamentals' ORDER BY ordinal_position
    `);
    console.log(`\n📋 欄位 (${cols.rows.length} 個):`);
    cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
  }

  await pool.end();
  console.log('\n✅ 完成！');
} catch (err) {
  console.error('❌ 錯誤:', err.message);
  await pool.end();
  process.exit(1);
}
