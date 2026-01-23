const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'domazul',
    user: process.env.DB_USER || 'domazul_user',
    password: process.env.DB_PASSWORD || 'DomAzul@2026',
});

const schema = `
-- 9. FINANCIAL SERVICES (Catálogo de Serviços)
CREATE TABLE IF NOT EXISTS financial_services (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    default_price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. TIME LOGS (Ponto Eletrônico)
CREATE TABLE IF NOT EXISTS time_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    date DATE NOT NULL,
    clock_in BIGINT NOT NULL,
    clock_out BIGINT,
    type VARCHAR(20) DEFAULT 'REGULAR', -- 'REGULAR' or 'MANUAL'
    status VARCHAR(20) DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING', 'REJECTED'
    justification TEXT,
    rejection_reason TEXT,
    related_session_start BIGINT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_services_clinic ON financial_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);
`;

async function applySChema() {
    try {
        console.log('🔌 Connecting to database...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connected.');

        console.log('📜 Applying schema updates (TimeLogs & FinancialServices)...');
        await pool.query(schema);
        console.log('✅ Schema applied successfully.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error applying schema:', err);
        process.exit(1);
    }
}

applySChema();
