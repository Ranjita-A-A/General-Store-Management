const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isOwner } = require('../middleware/authMiddleware');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT 
                c.*,
                COALESCE(SUM(l.remaining_amount), 0) as current_credit,
                (c.credit_limit - COALESCE(SUM(l.remaining_amount), 0)) as available_credit
            FROM customers c
            LEFT JOIN loans l ON c.id = l.customer_id AND l.status = 'active'
            GROUP BY c.id
            ORDER BY c.name ASC
        `);
        
        res.json({
            success: true,
            customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
});

// Get customer by ID with credit history
router.get('/:id', async (req, res) => {
    try {
        // Get customer details
        const [customers] = await db.query(`
            SELECT 
                c.*,
                COALESCE(SUM(l.remaining_amount), 0) as current_credit,
                (c.credit_limit - COALESCE(SUM(l.remaining_amount), 0)) as available_credit
            FROM customers c
            LEFT JOIN loans l ON c.id = l.customer_id AND l.status = 'active'
            WHERE c.id = ?
            GROUP BY c.id
        `, [req.params.id]);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get loan history
        const [loans] = await db.query(`
            SELECT 
                l.*,
                u.name as created_by_name
            FROM loans l
            JOIN users u ON l.created_by = u.id
            WHERE l.customer_id = ?
            ORDER BY l.created_at DESC
        `, [req.params.id]);

        // Get payment history
        const [payments] = await db.query(`
            SELECT 
                p.*,
                u.name as received_by_name,
                l.loan_number
            FROM loan_payments p
            JOIN loans l ON p.loan_id = l.id
            JOIN users u ON p.received_by = u.id
            WHERE l.customer_id = ?
            ORDER BY p.payment_date DESC
        `, [req.params.id]);

        res.json({
            success: true,
            customer: customers[0],
            loans,
            payments
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer details'
        });
    }
});

// Create new customer
router.post('/', async (req, res) => {
    const { name, phone, address, credit_limit } = req.body;

    try {
        // Check if phone number already exists
        const [existing] = await db.query('SELECT id FROM customers WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        const [result] = await db.query(
            'INSERT INTO customers (name, phone, address, credit_limit) VALUES (?, ?, ?, ?)',
            [name, phone, address, credit_limit || 5000.00]
        );

        res.json({
            success: true,
            message: 'Customer created successfully',
            customerId: result.insertId
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer'
        });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    const { name, phone, address, credit_limit } = req.body;

    try {
        // Check if phone number already exists for other customers
        const [existing] = await db.query(
            'SELECT id FROM customers WHERE phone = ? AND id != ?',
            [phone, req.params.id]
        );
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered with another customer'
            });
        }

        await db.query(
            'UPDATE customers SET name = ?, phone = ?, address = ?, credit_limit = ? WHERE id = ?',
            [name, phone, address, credit_limit, req.params.id]
        );

        res.json({
            success: true,
            message: 'Customer updated successfully'
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer'
        });
    }
});

// Update credit limit (owner only)
router.patch('/:id/credit-limit', isOwner, async (req, res) => {
    const { credit_limit } = req.body;

    try {
        await db.query(
            'UPDATE customers SET credit_limit = ? WHERE id = ?',
            [credit_limit, req.params.id]
        );

        res.json({
            success: true,
            message: 'Credit limit updated successfully'
        });
    } catch (error) {
        console.error('Error updating credit limit:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating credit limit'
        });
    }
});

// Get customers with overdue loans
router.get('/overdue/list', async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT 
                c.*,
                COUNT(l.id) as overdue_loans,
                SUM(l.remaining_amount) as total_overdue
            FROM customers c
            JOIN loans l ON c.id = l.customer_id
            WHERE l.status = 'overdue'
            GROUP BY c.id
            ORDER BY total_overdue DESC
        `);

        res.json({
            success: true,
            customers
        });
    } catch (error) {
        console.error('Error fetching overdue customers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching overdue customers'
        });
    }
});

module.exports = router;
