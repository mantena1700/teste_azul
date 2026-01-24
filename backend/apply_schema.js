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

async function applySChema() {
    try {
        console.log('🔌 Connecting to database...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connected.');

        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            console.log('📜 Reading schema.sql...');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            console.log('🚀 Applying full database schema...');
            await pool.query(schema);
            console.log('✅ Schema applied successfully.');
        } else {
            console.error('❌ schema.sql not found at:', schemaPath);
            process.exit(1);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error applying schema:', err);
        process.exit(1);
    }
}

applySChema();
