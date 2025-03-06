const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all bills
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(CONCAT(bi.quantity, 'x ', i.name) SEPARATOR ', ') as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            LEFT JOIN items i ON bi.item_id = i.id
            GROUP BY b.id
            ORDER BY b.bill_date DESC
        `;
        const [bills] = await db.query(query);
        res.json(bills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ message: 'Error fetching bills' });
    }
});

// Get bill details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Get bill header
        const [bills] = await db.query('SELECT * FROM bills WHERE id = ?', [id]);
        if (bills.length === 0) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Get bill items
        const [items] = await db.query(`
            SELECT bi.*, i.name, i.category
            FROM bill_items bi
            JOIN items i ON bi.item_id = i.id
            WHERE bi.bill_id = ?
        `, [id]);

        res.json({
            ...bills[0],
            items
        });
    } catch (error) {
        console.error('Error fetching bill details:', error);
        res.status(500).json({ message: 'Error fetching bill details' });
    }
});

// Generate new bill
router.post('/', async (req, res) => {
    const { customer_name, customer_phone, items, payment_method, discount = 0, total_amount } = req.body;
    const conn = await db.getConnection();
    
    try {
        // Validate required fields
        if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Invalid request',
                error: 'Missing required fields or invalid items array'
            });
        }

        // Start transaction
        await conn.beginTransaction();

        // Validate items and check stock
        for (const item of items) {
            if (!item.item_id) {
                throw new Error('Invalid item: missing item_id');
            }

            const [itemCheck] = await conn.query(
                'SELECT id, quantity, name, selling_price FROM items WHERE id = ?',
                [item.item_id]
            );

            if (itemCheck.length === 0) {
                throw new Error(`Item with id ${item.item_id} not found`);
            }

            const currentItem = itemCheck[0];
            if (currentItem.quantity < item.quantity) {
                throw new Error(`Insufficient stock for item ${currentItem.name}. Available: ${currentItem.quantity}, Requested: ${item.quantity}`);
            }
        }

        // Insert bill header
        const [billResult] = await conn.query(
            'INSERT INTO bills (customer_name, customer_phone, payment_method, discount, total_amount, bill_date) VALUES (?, ?, ?, ?, ?, NOW())',
            [customer_name, customer_phone || null, payment_method, discount, total_amount]
        );
        const billId = billResult.insertId;

        // Insert bill items and update inventory
        for (const item of items) {
            // Insert bill item with all required fields
            const query = 'INSERT INTO bill_items (bill_id, item_id, quantity, price_per_unit, total_price) VALUES (?, ?, ?, ?, ?)';
            const values = [
                billId,
                item.item_id,
                item.quantity,
                item.price,
                item.total
            ];
            console.log('Inserting bill item:', { query, values });
            await conn.query(query, values);

            // Update item quantity
            const result = await conn.query(
                'UPDATE items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
                [item.quantity, item.item_id, item.quantity]
            );

            if (result[0].affectedRows === 0) {
                throw new Error(`Failed to update quantity for item ${item.item_id}. Stock might have changed.`);
            }
        }

        await conn.commit();

        // Fetch the complete bill data
        const [billData] = await conn.query(`
            SELECT 
                b.*,
                GROUP_CONCAT(
                    CONCAT(
                        bi.quantity,
                        'x ',
                        i.name,
                        ' @ ₹',
                        FORMAT(bi.price_per_unit, 2)
                    ) SEPARATOR ', '
                ) as items_display
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            LEFT JOIN items i ON bi.item_id = i.id
            WHERE b.id = ?
            GROUP BY b.id
        `, [billId]);

        // Get detailed items
        const [billItems] = await conn.query(`
            SELECT 
                bi.*,
                i.name as item_name,
                i.category,
                i.selling_price,
                i.cost_price
            FROM bill_items bi
            JOIN items i ON bi.item_id = i.id
            WHERE bi.bill_id = ?
        `, [billId]);

        res.status(201).json({
            message: 'Bill generated successfully',
            bill: {
                ...billData[0],
                items: billItems,
                items_display: billData[0].items_display
            }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error generating bill:', error);
        res.status(500).json({
            message: 'Failed to generate bill',
            error: error.message
        });
    } finally {
        conn.release();
    }
});

module.exports = router;
