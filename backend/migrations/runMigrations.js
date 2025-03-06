const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');

async function runMigration() {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'create_required_tables.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        // Split the SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);

        // Execute each statement
        for (const statement of statements) {
            await db.execute(statement);
            console.log('Executed:', statement.substring(0, 50) + '...');
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
