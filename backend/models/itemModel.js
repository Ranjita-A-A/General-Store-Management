const db = require('../config/db');

class ItemModel {
    // Create new item
    async createItem(itemData) {
        const query = `
            INSERT INTO items (
                name, category, quantity, 
                cost_price, selling_price, description
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const [result] = await db.execute(query, [
                itemData.item_name,  
                itemData.category,
                itemData.quantity,
                itemData.cost_price,
                itemData.selling_price,
                itemData.description || null
            ]);
            return result.insertId;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }

    // Get all items
    async getAllItems() {
        const query = 'SELECT *, name as item_name FROM items ORDER BY name ASC';
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get item by ID
    async getItemById(id) {
        const query = 'SELECT *, name as item_name FROM items WHERE id = ?';
        try {
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update item
    async updateItem(id, itemData) {
        const query = `
            UPDATE items 
            SET 
                name = ?,
                category = ?,
                quantity = ?,
                cost_price = ?,
                selling_price = ?,
                description = ?
            WHERE id = ?
        `;
        
        try {
            const [result] = await db.execute(query, [
                itemData.item_name,
                itemData.category,
                itemData.quantity,
                itemData.cost_price,
                itemData.selling_price,
                itemData.description || null,
                id
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete item
    async deleteItem(id) {
        const query = 'DELETE FROM items WHERE id = ?';
        try {
            const [result] = await db.execute(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Get items by category
    async getItemsByCategory(category) {
        const query = 'SELECT *, name as item_name FROM items WHERE category = ? ORDER BY name ASC';
        try {
            const [rows] = await db.execute(query, [category]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get low stock items
    async getLowStockItems(threshold) {
        const query = 'SELECT *, name as item_name FROM items WHERE quantity <= ? ORDER BY quantity ASC';
        try {
            const [rows] = await db.execute(query, [threshold]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Update item stock
    async updateItemStock(id, quantity, type) {
        const query = type === 'add' ?
            'UPDATE items SET quantity = quantity + ? WHERE id = ?' :
            'UPDATE items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?';
        
        try {
            const [result] = await db.execute(
                query, 
                type === 'add' ? [quantity, id] : [quantity, id, quantity]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Get stock value report
    async getStockValueReport() {
        const query = `
            SELECT 
                category,
                COUNT(*) as total_items,
                SUM(quantity) as total_quantity,
                SUM(quantity * cost_price) as total_cost_value,
                SUM(quantity * selling_price) as total_selling_value,
                SUM(quantity * (selling_price - cost_price)) as potential_profit
            FROM items
            GROUP BY category
            WITH ROLLUP
        `;
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ItemModel();