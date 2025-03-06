const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'create_all_tables.sql'), 'utf8');
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
            console.log('Executing:', statement.slice(0, 50) + '...');
            await db.query(statement);
            console.log('Success!');
        }
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
