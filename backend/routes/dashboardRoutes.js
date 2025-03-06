const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);

        // Get yesterday's date range
        const yesterdayStart = startOfDay(subDays(today, 1));
        const yesterdayEnd = endOfDay(subDays(today, 1));

        // Get today's sales
        const [todaySales] = await db.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(final_amount), 0) as amount
            FROM bills
            WHERE created_at BETWEEN ? AND ?
        `, [todayStart, todayEnd]);

        // Get yesterday's sales
        const [yesterdaySales] = await db.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(final_amount), 0) as amount
            FROM bills
            WHERE created_at BETWEEN ? AND ?
        `, [yesterdayStart, yesterdayEnd]);

        // Get active loans
        const [activeLoans] = await db.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(remaining_amount), 0) as total_amount
            FROM loans
            WHERE status = 'active'
        `);

        // Get overdue loans
        const [overdueLoans] = await db.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(remaining_amount), 0) as total_amount
            FROM loans
            WHERE status = 'overdue'
        `);

        // Get low stock items
        const [lowStock] = await db.query(`
            SELECT COUNT(*) as count
            FROM items
            WHERE quantity <= threshold
        `);

        // Get out of stock items
        const [outOfStock] = await db.query(`
            SELECT COUNT(*) as count
            FROM items
            WHERE quantity = 0
        `);

        // Calculate sales growth
        const salesGrowth = yesterdaySales[0].amount > 0
            ? ((todaySales[0].amount - yesterdaySales[0].amount) / yesterdaySales[0].amount) * 100
            : 0;

        res.json({
            success: true,
            stats: {
                sales: {
                    today: {
                        count: todaySales[0].count,
                        amount: parseFloat(todaySales[0].amount)
                    },
                    yesterday: {
                        count: yesterdaySales[0].count,
                        amount: parseFloat(yesterdaySales[0].amount)
                    },
                    growth: salesGrowth
                },
                loans: {
                    active: {
                        count: activeLoans[0].count,
                        amount: parseFloat(activeLoans[0].total_amount)
                    },
                    overdue: {
                        count: overdueLoans[0].count,
                        amount: parseFloat(overdueLoans[0].total_amount)
                    }
                },
                inventory: {
                    lowStock: lowStock[0].count,
                    outOfStock: outOfStock[0].count
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
});

// Get top selling items
router.get('/top-selling', async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT 
                i.id,
                i.name,
                i.category,
                COUNT(bi.id) as sale_count,
                SUM(bi.quantity) as total_quantity,
                SUM(bi.total_price) as total_amount
            FROM items i
            JOIN bill_items bi ON i.id = bi.item_id
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY i.id, i.name, i.category
            ORDER BY total_quantity DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Error fetching top selling items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top selling items'
        });
    }
});

// Get category-wise sales
router.get('/category-sales', async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT 
                i.category,
                COUNT(DISTINCT b.id) as order_count,
                SUM(bi.quantity) as total_quantity,
                SUM(bi.total_price) as total_amount
            FROM items i
            JOIN bill_items bi ON i.id = bi.item_id
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY i.category
            ORDER BY total_amount DESC
        `);

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching category sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category sales'
        });
    }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
    try {
        // Get recent bills
        const [bills] = await db.query(`
            SELECT 
                'sale' as type,
                b.id,
                b.bill_number as reference,
                b.final_amount as amount,
                c.name as customer_name,
                b.created_at as timestamp
            FROM bills b
            LEFT JOIN customers c ON b.customer_id = c.id
            ORDER BY b.created_at DESC
            LIMIT 5
        `);

        // Get recent loans
        const [loans] = await db.query(`
            SELECT 
                'loan' as type,
                l.id,
                l.loan_number as reference,
                l.total_amount as amount,
                c.name as customer_name,
                l.created_at as timestamp
            FROM loans l
            JOIN customers c ON l.customer_id = c.id
            ORDER BY l.created_at DESC
            LIMIT 5
        `);

        // Get recent payments
        const [payments] = await db.query(`
            SELECT 
                'payment' as type,
                p.id,
                l.loan_number as reference,
                p.amount,
                c.name as customer_name,
                p.payment_date as timestamp
            FROM loan_payments p
            JOIN loans l ON p.loan_id = l.id
            JOIN customers c ON l.customer_id = c.id
            ORDER BY p.payment_date DESC
            LIMIT 5
        `);

        // Combine and sort all activities
        const activities = [...bills, ...loans, ...payments]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activities'
        });
    }
});

module.exports = router;
