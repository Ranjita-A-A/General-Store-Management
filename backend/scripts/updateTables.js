const db = require('../config/db');

async function updateTables() {
    try {
        // Modify item_types table to add cost_price and selling_price
        await db.query(`
            ALTER TABLE item_types 
            ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00,
            ADD COLUMN selling_price DECIMAL(10,2) DEFAULT 0.00
        `);

        // Create sales_history table to track profits
        await db.query(`
            CREATE TABLE IF NOT EXISTS sales_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                item_id INT NOT NULL,
                quantity_sold INT NOT NULL,
                cost_price DECIMAL(10,2) NOT NULL,
                selling_price DECIMAL(10,2) NOT NULL,
                profit DECIMAL(10,2) NOT NULL,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES item_types(id)
            )
        `);
        
        console.log('Tables updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating tables:', error);
        process.exit(1);
    }
}

updateTables();
