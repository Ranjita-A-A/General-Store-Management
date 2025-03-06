const db = require('../config/db');

class ItemController {
    // Get all items
    async getAllItems(req, res) {
        try {
            const [items] = await db.execute('SELECT * FROM items ORDER BY name');
            res.json(items);
        } catch (error) {
            console.error('Error getting items:', error);
            res.status(500).json({ message: 'Error getting items' });
        }
    }

    // Get profit report
    async getProfitReport(req, res) {
        try {
            console.log('Fetching profit report...');
            const query = `
                SELECT 
                    i.name,
                    i.category,
                    i.cost_price,
                    i.selling_price,
                    COALESCE(SUM(bi.quantity), 0) as total_sold,
                    COALESCE(SUM(bi.total_price), 0) as total_revenue,
                    COALESCE(SUM(bi.quantity * i.cost_price), 0) as total_cost,
                    COALESCE(SUM(bi.total_price - (bi.quantity * i.cost_price)), 0) as total_profit,
                    CASE 
                        WHEN COALESCE(SUM(bi.quantity * i.cost_price), 0) > 0 
                        THEN (COALESCE(SUM(bi.total_price - (bi.quantity * i.cost_price)), 0) / COALESCE(SUM(bi.quantity * i.cost_price), 0)) * 100 
                        ELSE 0 
                    END as profit_margin
                FROM items i
                LEFT JOIN bill_items bi ON i.id = bi.item_id
                GROUP BY i.id, i.name, i.category, i.cost_price, i.selling_price
                ORDER BY total_profit DESC
            `;
            console.log('Profit report query:', query);

            const [results] = await db.execute(query);
            console.log('Profit report results:', results);

            // Calculate totals
            const totals = results.reduce((acc, item) => ({
                total_sold: acc.total_sold + parseInt(item.total_sold || 0),
                total_revenue: acc.total_revenue + parseFloat(item.total_revenue || 0),
                total_cost: acc.total_cost + parseFloat(item.total_cost || 0),
                total_profit: acc.total_profit + parseFloat(item.total_profit || 0)
            }), {
                total_sold: 0,
                total_revenue: 0,
                total_cost: 0,
                total_profit: 0
            });

            // Calculate overall profit margin using cost
            totals.profit_margin = totals.total_cost > 0 
                ? (totals.total_profit / totals.total_cost) * 100 
                : 0;

            // Format the results
            const formattedResults = results.map(item => ({
                name: item.name,
                category: item.category,
                cost_price: parseFloat(item.cost_price).toFixed(2),
                selling_price: parseFloat(item.selling_price).toFixed(2),
                total_sold: parseInt(item.total_sold || 0),
                total_revenue: parseFloat(item.total_revenue || 0).toFixed(2),
                total_cost: parseFloat(item.total_cost || 0).toFixed(2),
                total_profit: parseFloat(item.total_profit || 0).toFixed(2),
                profit_margin: parseFloat(item.profit_margin || 0).toFixed(2)
            }));

            // Format totals
            const formattedTotals = {
                total_sold: totals.total_sold,
                total_revenue: totals.total_revenue.toFixed(2),
                total_cost: totals.total_cost.toFixed(2),
                total_profit: totals.total_profit.toFixed(2),
                profit_margin: totals.profit_margin.toFixed(2)
            };

            res.json({
                items: formattedResults,
                totals: formattedTotals
            });
        } catch (error) {
            console.error('Error generating profit report:', error);
            res.status(500).json({ 
                message: 'Error generating profit report',
                error: error.message 
            });
        }
    }

    // Get all categories
    async getAllCategories(req, res) {
        try {
            const [rows] = await db.execute('SELECT DISTINCT category FROM items ORDER BY category');
            const categories = rows.map(row => row.category).filter(category => category); // Remove null/empty categories
            res.json(categories);
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({ message: 'Error getting categories' });
        }
    }

    // Get sales statistics
    async getSalesStats(req, res) {
        try {
            // Get total sales for last 30 days
            const [totalSales] = await db.execute(`
                SELECT COALESCE(SUM(total_amount), 0) as total_sales
                FROM bills
                WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `);

            // Get total items sold for last 30 days
            const [totalItems] = await db.execute(`
                SELECT COALESCE(SUM(quantity), 0) as total_items
                FROM bill_items bi
                JOIN bills b ON bi.bill_id = b.id
                WHERE b.bill_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `);

            // Get top selling items
            const [topItems] = await db.execute(`
                SELECT 
                    i.item_name,
                    SUM(bi.quantity) as total_quantity,
                    SUM(bi.total_price) as total_sales
                FROM bill_items bi
                JOIN items i ON bi.item_id = i.id
                JOIN bills b ON bi.bill_id = b.id
                WHERE b.bill_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY i.id, i.item_name
                ORDER BY total_quantity DESC
                LIMIT 5
            `);

            res.json({
                total_sales: totalSales[0].total_sales,
                total_items: totalItems[0].total_items,
                top_items: topItems
            });
        } catch (error) {
            console.error('Error getting sales statistics:', error);
            res.status(500).json({ message: 'Error getting sales statistics' });
        }
    }

    // Create new item
    async createItem(req, res) {
        try {
            const itemData = req.body;
            console.log('Received item data:', itemData);

            // Validate required fields
            if (!itemData.name || !itemData.category || 
                !itemData.quantity || !itemData.cost_price || 
                !itemData.selling_price) {
                console.log('Missing required fields:', {
                    name: !itemData.name,
                    category: !itemData.category,
                    quantity: !itemData.quantity,
                    cost_price: !itemData.cost_price,
                    selling_price: !itemData.selling_price,
                    receivedData: itemData
                });
                return res.status(400).json({ 
                    message: 'Please provide all required fields: name, category, quantity, cost_price, and selling_price',
                    receivedData: itemData
                });
            }

            // Parse numeric values
            const processedItemData = {
                name: itemData.name.trim(),
                description: itemData.description?.trim() || '',
                category: itemData.category.trim(),
                quantity: parseInt(itemData.quantity),
                cost_price: parseFloat(itemData.cost_price),
                selling_price: parseFloat(itemData.selling_price)
            };

            // Validate numeric values
            if (isNaN(processedItemData.quantity) || processedItemData.quantity < 0) {
                console.log('Invalid quantity:', processedItemData.quantity);
                return res.status(400).json({ message: 'Quantity must be a non-negative number' });
            }
            if (isNaN(processedItemData.cost_price) || processedItemData.cost_price <= 0) {
                console.log('Invalid cost price:', processedItemData.cost_price);
                return res.status(400).json({ message: 'Cost price must be a positive number' });
            }
            if (isNaN(processedItemData.selling_price) || processedItemData.selling_price <= 0) {
                console.log('Invalid selling price:', processedItemData.selling_price);
                return res.status(400).json({ message: 'Selling price must be a positive number' });
            }
            if (processedItemData.selling_price <= processedItemData.cost_price) {
                console.log('Selling price not greater than cost price:', processedItemData);
                return res.status(400).json({ message: 'Selling price must be greater than cost price' });
            }

            console.log('Processed item data:', processedItemData);

            // Insert into database
            const [result] = await db.execute(
                'INSERT INTO items (name, description, category, quantity, cost_price, selling_price) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    processedItemData.name,
                    processedItemData.description,
                    processedItemData.category,
                    processedItemData.quantity,
                    processedItemData.cost_price,
                    processedItemData.selling_price
                ]
            );

            // Get the inserted item
            const [items] = await db.execute('SELECT * FROM items WHERE id = ?', [result.insertId]);
            const newItem = items[0];

            console.log('Item created successfully:', newItem);
            
            res.status(201).json({
                message: 'Item created successfully',
                item: {
                    ...newItem,
                    item_name: newItem.name // Add item_name for frontend consistency
                }
            });
        } catch (error) {
            console.error('Error creating item:', error);
            res.status(500).json({ 
                message: 'Error creating item',
                error: error.message 
            });
        }
    }

    // Get item by ID
    async getItemById(req, res) {
        try {
            const { id } = req.params;
            const [item] = await db.execute('SELECT * FROM items WHERE id = ?', [id]);
            
            if (!item || item.length === 0) {
                return res.status(404).json({ message: 'Item not found' });
            }
            
            res.json(item[0]);
        } catch (error) {
            console.error('Error getting item:', error);
            res.status(500).json({ message: 'Error getting item' });
        }
    }

    // Update item
    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const itemData = req.body;

            // Validate required fields
            if (!itemData.name || !itemData.category || 
                !itemData.quantity || !itemData.cost_price || 
                !itemData.selling_price) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Create SET clause for the update query
            const updateFields = [
                'name = ?',
                'category = ?',
                'quantity = ?',
                'cost_price = ?',
                'selling_price = ?',
                'description = ?',
                'updated_at = CURRENT_TIMESTAMP'
            ];

            // Create values array for the query
            const values = [
                itemData.name,
                itemData.category,
                itemData.quantity,
                itemData.cost_price,
                itemData.selling_price,
                itemData.description || '',
                id // for WHERE clause
            ];

            const query = `
                UPDATE items 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `;

            console.log('Update query:', query);
            console.log('Update values:', values);

            const [result] = await db.execute(query, values);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Item not found' });
            }

            res.json({ message: 'Item updated successfully' });
        } catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({ 
                message: 'Error updating item',
                error: error.message
            });
        }
    }

    // Delete item
    async deleteItem(req, res) {
        try {
            const { id } = req.params;
            const result = await db.execute('DELETE FROM items WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Item not found' });
            }
            
            res.json({ message: 'Item deleted successfully' });
        } catch (error) {
            console.error('Error deleting item:', error);
            res.status(500).json({ message: 'Error deleting item' });
        }
    }

    // Get items by category
    async getItemsByCategory(req, res) {
        try {
            const { category } = req.params;
            const [items] = await db.execute('SELECT * FROM items WHERE category = ?', [category]);
            res.json(items);
        } catch (error) {
            console.error('Error getting items by category:', error);
            res.status(500).json({ message: 'Error getting items by category' });
        }
    }

    // Get low stock items
    async getLowStockItems(req, res) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    i.id,
                    i.name,
                    i.category,
                    i.quantity,
                    i.cost_price,
                    i.selling_price,
                    i.description,
                    i.created_at,
                    i.updated_at
                FROM items i
                WHERE i.quantity <= 4
                ORDER BY i.quantity ASC
            `);

            // Add warning levels based on quantity
            const itemsWithWarning = rows.map(item => ({
                ...item,
                warningLevel: item.quantity === 0 ? 'critical' : 
                             item.quantity <= 2 ? 'high' : 'medium'
            }));

            res.json(itemsWithWarning);
        } catch (error) {
            console.error('Error getting low stock items:', error);
            res.status(500).json({ 
                message: 'Error fetching low stock items',
                error: error.message 
            });
        }
    }

    // Update item stock
    async updateItemStock(req, res) {
        try {
            const { id } = req.params;
            const { quantity, type } = req.body;

            if (!quantity || !type || !['add', 'remove'].includes(type)) {
                return res.status(400).json({ message: 'Invalid quantity or type' });
            }

            let query;
            if (type === 'add') {
                query = 'UPDATE items SET quantity = quantity + ? WHERE id = ?';
            } else {
                query = 'UPDATE items SET quantity = quantity - ? WHERE id = ?';
            }

            const result = await db.execute(query, [quantity, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Item not found' });
            }

            res.json({ message: 'Item stock updated successfully' });
        } catch (error) {
            console.error('Error updating item stock:', error);
            res.status(500).json({ message: 'Error updating item stock' });
        }
    }

    // Get stock value report
    async getStockValueReport(req, res) {
        try {
            const [report] = await db.execute(`
                SELECT 
                    i.name,
                    i.quantity,
                    i.cost_price,
                    (i.quantity * i.cost_price) as total_value
                FROM items i
                ORDER BY total_value DESC
            `);
            res.json(report);
        } catch (error) {
            console.error('Error getting stock value report:', error);
            res.status(500).json({ message: 'Error getting stock value report' });
        }
    }
}

// Create and export a single instance
const itemController = new ItemController();
module.exports = itemController;