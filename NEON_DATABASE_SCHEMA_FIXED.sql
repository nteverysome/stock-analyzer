-- ============================================
-- 🇹🇼 全台灣股市數據庫架構 (Neon PostgreSQL)
-- ✅ PostgreSQL 相容版本
-- ============================================

-- 1️⃣ 股票基本信息表
CREATE TABLE IF NOT EXISTS tw_stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    industry VARCHAR(50),
    market_cap BIGINT,
    sector VARCHAR(50),
    listed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tw_stocks_symbol ON tw_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_tw_stocks_industry ON tw_stocks(industry);

-- 2️⃣ 每日股價數據表
CREATE TABLE IF NOT EXISTS tw_daily_prices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    price_date DATE NOT NULL,
    open DECIMAL(10, 2),
    high DECIMAL(10, 2),
    low DECIMAL(10, 2),
    close DECIMAL(10, 2) NOT NULL,
    volume BIGINT,
    turnover BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, price_date),
    FOREIGN KEY (symbol) REFERENCES tw_stocks(symbol) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tw_daily_prices_symbol_date 
    ON tw_daily_prices(symbol, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_tw_daily_prices_date 
    ON tw_daily_prices(price_date DESC);

-- 3️⃣ 技術指標表
CREATE TABLE IF NOT EXISTS tw_indicators (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    indicator_date DATE NOT NULL,
    m1 DECIMAL(10, 2),
    m2 DECIMAL(10, 2),
    m3 DECIMAL(10, 2),
    m4 DECIMAL(10, 2),
    m5 DECIMAL(10, 2),
    kd_fast DECIMAL(10, 2),
    kd_slow DECIMAL(10, 2),
    rsi DECIMAL(10, 2),
    macd DECIMAL(10, 4),
    macd_signal DECIMAL(10, 4),
    macd_histogram DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, indicator_date),
    FOREIGN KEY (symbol) REFERENCES tw_stocks(symbol) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tw_indicators_symbol_date 
    ON tw_indicators(symbol, indicator_date DESC);
CREATE INDEX IF NOT EXISTS idx_tw_indicators_kd 
    ON tw_indicators(symbol, kd_fast);

-- 4️⃣ 篩選結果快取表
CREATE TABLE IF NOT EXISTS tw_screener_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    filter_criteria JSONB,
    results JSONB,
    result_count INT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tw_screener_cache_expires 
    ON tw_screener_cache(expires_at);

-- 5️⃣ 更新日誌表
CREATE TABLE IF NOT EXISTS tw_update_logs (
    id SERIAL PRIMARY KEY,
    update_type VARCHAR(50),
    symbol VARCHAR(10),
    record_count INT,
    status VARCHAR(20),
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tw_update_logs_status_date 
    ON tw_update_logs(status, completed_at DESC);

-- ============================================
-- 視圖：最新股價 + 最新指標
-- ============================================

CREATE OR REPLACE VIEW v_latest_stock_data AS
SELECT 
    s.symbol,
    s.name,
    s.industry,
    p.close,
    p.high,
    p.low,
    p.price_date,
    i.m1, i.m2, i.m3, i.m4, i.m5,
    i.kd_fast, i.kd_slow,
    i.rsi, i.macd,
    i.indicator_date
FROM tw_stocks s
LEFT JOIN LATERAL (
    SELECT * FROM tw_daily_prices 
    WHERE symbol = s.symbol 
    ORDER BY price_date DESC LIMIT 1
) p ON TRUE
LEFT JOIN LATERAL (
    SELECT * FROM tw_indicators 
    WHERE symbol = s.symbol 
    ORDER BY indicator_date DESC LIMIT 1
) i ON TRUE;

-- ============================================
-- 初始化樣本數據
-- ============================================

INSERT INTO tw_stocks (symbol, name, name_en, industry, sector) VALUES
('2330', '台積電', 'TSMC', '半導體', '電子'),
('2317', '鴻海', 'Hon Hai', '電子零件', '電子'),
('2454', '聯發科', 'MediaTek', '半導體', '電子'),
('1101', '台泥', 'Taiwan Cement', '水泥', '營建'),
('1301', '台塑', 'Formosa Plastics', '化學', '化學'),
('2002', '中鋼', 'China Steel', '鋼鐵', '鋼鐵'),
('0050', '元大台灣50', 'TW50', 'ETF', 'ETF'),
('3008', '大立光', 'Largan', '光電', '電子'),
('2881', '富邦金', 'Fubon', '金融', '金融'),
('2882', '國泰金', 'Cathay', '金融', '金融')
ON CONFLICT (symbol) DO NOTHING;

-- ============================================
-- 完成！
-- ============================================
-- ✅ 所有表已創建
-- ✅ 所有索引已建立
-- ✅ 樣本數據已插入
-- ✅ 視圖已建立
