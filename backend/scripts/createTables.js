const db = require('../config/db');

async function createTables() {
    try {
        // Create item_types table
        await db.query(`
            CREATE TABLE IF NOT EXISTS item_types (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                quantity INT DEFAULT 0,
                price DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Tables created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
}

createTables();
