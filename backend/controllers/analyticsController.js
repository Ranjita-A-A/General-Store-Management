const pool = require('../config/db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get today's sales with error handling
        let todayAmount = 0, yesterdayAmount = 0;
        try {
            const [todaySalesResult] = await pool.query(`
                SELECT COALESCE(SUM(total_amount), 0) as total_amount
                FROM bills
                WHERE DATE(bill_date) = CURDATE()
            `);
            todayAmount = parseFloat(todaySalesResult[0]?.total_amount || 0);
            console.log('Today sales:', { result: todaySalesResult[0], amount: todayAmount });
        } catch (error) {
            console.error('Error fetching today sales:', error);
        }

        // Get yesterday's sales with error handling
        try {
            const [yesterdaySalesResult] = await pool.query(`
                SELECT COALESCE(SUM(total_amount), 0) as total_amount
                FROM bills
                WHERE DATE(bill_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            `);
            yesterdayAmount = parseFloat(yesterdaySalesResult[0]?.total_amount || 0);
            console.log('Yesterday sales:', { result: yesterdaySalesResult[0], amount: yesterdayAmount });
        } catch (error) {
            console.error('Error fetching yesterday sales:', error);
        }

        // Calculate growth percentage
        const growth = yesterdayAmount === 0 ? 0 : ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100;

        // Get inventory stats with error handling
        let inventoryStats = { total_items: 0, total_quantity: 0, total_value: 0 };
        try {
            const [inventoryStatsResult] = await pool.query(`
                SELECT 
                    COUNT(*) as total_items,
                    COALESCE(SUM(quantity), 0) as total_quantity,
                    COALESCE(SUM(selling_price * quantity), 0) as total_value
                FROM items
                WHERE is_deleted = 0
            `);
            inventoryStats = inventoryStatsResult[0] || inventoryStats;
            console.log('Inventory stats:', { result: inventoryStatsResult[0], stats: inventoryStats });
        } catch (error) {
            console.error('Error fetching inventory stats:', error);
        }

        // Get low stock items with error handling
        let lowStockItems = [];
        try {
            const [lowStockResult] = await pool.query(`
                SELECT id, name, quantity, minimum_quantity, selling_price
                FROM items
                WHERE quantity <= COALESCE(minimum_quantity, 10)
                AND is_deleted = 0
                ORDER BY quantity ASC
            `);
            lowStockItems = lowStockResult;
            console.log('Low stock items:', { count: lowStockItems.length, items: lowStockItems });
        } catch (error) {
            console.error('Error fetching low stock items:', error);
        }

        // Get overdue loans with error handling
        let overdueLoans = [];
        try {
            const [overdueLoanResult] = await pool.query(`
                SELECT 
                    l.id,
                    l.customer_name,
                    l.total_amount,
                    l.due_date,
                    l.status,
                    COALESCE(SUM(lp.amount), 0) as paid_amount
                FROM loans l
                LEFT JOIN loan_payments lp ON l.id = lp.loan_id
                WHERE l.status = 'pending'
                AND l.due_date < CURDATE()
                GROUP BY l.id
                HAVING l.total_amount > COALESCE(SUM(lp.amount), 0)
                ORDER BY l.due_date ASC
            `);
            overdueLoans = overdueLoanResult;
            console.log('Overdue loans:', { count: overdueLoans.length, loans: overdueLoans });
        } catch (error) {
            console.error('Error fetching overdue loans:', error);
        }

        // Format the response
        const response = {
            stats: {
                sales: {
                    today: {
                        amount: todayAmount
                    },
                    growth: parseFloat(growth.toFixed(2))
                },
                inventory: {
                    totalItems: parseInt(inventoryStats.total_items || 0),
                    totalQuantity: parseInt(inventoryStats.total_quantity || 0),
                    totalValue: parseFloat(inventoryStats.total_value || 0),
                    lowStockCount: lowStockItems.length
                }
            },
            alerts: [
                ...lowStockItems.map(item => ({
                    id: `stock_${item.id}`,
                    category: 'stock',
                    type: 'warning',
                    message: item.name,
                    details: `Current Stock: ${item.quantity} units (Min: ${item.minimum_quantity || 10})`,
                    value: item.selling_price * item.quantity,
                    timestamp: new Date()
                })),
                ...overdueLoans.map(loan => ({
                    id: `loan_${loan.id}`,
                    category: 'loan',
                    type: 'error',
                    message: loan.customer_name,
                    details: `Due Amount: ₹${loan.total_amount - loan.paid_amount}`,
                    value: loan.total_amount - loan.paid_amount,
                    dueDate: loan.due_date,
                    timestamp: new Date(loan.due_date)
                }))
            ]
        };

        // Log the complete response for debugging
        console.log('Final Response:', JSON.stringify(response, null, 2));

        res.json(response);

    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ 
            message: 'Error fetching dashboard statistics',
            error: error.message 
        });
    }
};

// Get top selling items
const getTopSellingItems = async (req, res) => {
    try {
        const filter = req.query.filter || 'today';
        let dateCondition;

        switch (filter) {
            case 'weekly':
                dateCondition = 'DATE(b.bill_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'monthly':
                dateCondition = 'DATE(b.bill_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            default: // today
                dateCondition = 'DATE(b.bill_date) = CURDATE()';
                break;
        }

        const query = `
            SELECT 
                i.name,
                COUNT(DISTINCT bi.bill_id) as sold_count,
                COALESCE(SUM(bi.quantity), 0) as total_quantity,
                COALESCE(SUM(bi.total_price), 0) as total_revenue
            FROM items i
            LEFT JOIN bill_items bi ON i.id = bi.item_id
            LEFT JOIN bills b ON bi.bill_id = b.id
            WHERE ${dateCondition}
            AND (b.payment_status IS NULL OR b.payment_status != 'cancelled')
            AND i.is_deleted = 0
            GROUP BY i.id, i.name
            ORDER BY total_quantity DESC
            LIMIT 5
        `;

        const [topSelling] = await pool.query(query);

        const formattedData = topSelling.map(item => ({
            name: item.name,
            soldCount: parseInt(item.total_quantity || 0),
            totalQuantity: parseInt(item.total_quantity || 0),
            totalRevenue: parseFloat(item.total_revenue || 0)
        }));

        res.json(formattedData);

    } catch (error) {
        console.error('Error in getTopSellingItems:', error);
        res.status(500).json({
            message: 'Error fetching top selling items',
            error: error.message
        });
    }
};

// Get category distribution
const getCategoryDistribution = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(category, 'Uncategorized') as category,
                COUNT(*) as item_count,
                SUM(quantity) as total_quantity,
                SUM(quantity * selling_price) as total_value
            FROM items
            GROUP BY category
            ORDER BY total_value DESC
        `;

        const [results] = await pool.query(query);
        
        // Format the results for the pie chart
        const formattedResults = results.map(item => ({
            category: item.category,
            total_quantity: parseInt(item.total_quantity),
            total_value: parseFloat(item.total_value),
            item_count: parseInt(item.item_count)
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Error fetching category distribution:', error);
        res.status(500).json({ message: 'Error fetching category distribution' });
    }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
    try {
        const query = `
            SELECT 
                b.id,
                b.customer_name,
                b.total_amount,
                b.bill_date,
                GROUP_CONCAT(CONCAT(bi.quantity, 'x ', i.name)) as items
            FROM bills b
            JOIN bill_items bi ON b.id = bi.bill_id
            JOIN items i ON bi.item_id = i.id
            GROUP BY b.id, b.customer_name, b.total_amount, b.bill_date
            ORDER BY b.bill_date DESC
            LIMIT 10
        `;
        
        const [results] = await pool.query(query);
        
        const formattedResults = results.map(activity => ({
            id: activity.id,
            customerName: activity.customer_name,
            amount: parseFloat(activity.total_amount || 0).toFixed(2),
            date: activity.bill_date,
            items: activity.items ? activity.items.split(',') : []
        }));
        
        res.json(formattedResults);
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ 
            message: 'Error fetching recent activities',
            error: error.message
        });
    }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
    try {
        console.log('Fetching inventory stats...');
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN quantity < 10 THEN 1 ELSE 0 END) as lowStock,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStock
            FROM items
        `;
        console.log('Inventory stats query:', query);
        const [results] = await pool.query(query);
        console.log('Inventory stats results:', results);
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching inventory stats',
            error: error.message 
        });
    }
};

// Get monthly revenue
const getMonthlyRevenue = async (req, res) => {
    try {
        console.log('Fetching monthly revenue...');
        const query = `
            SELECT 
                DATE_FORMAT(loan_date, '%Y-%m') as month,
                SUM(amount) as revenue
            FROM loans
            WHERE loan_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `;
        console.log('Monthly revenue query:', query);
        const [results] = await pool.query(query);
        console.log('Monthly revenue results:', results);
        
        // Format the results for the chart
        const formattedResults = results.map(item => ({
            month: format(new Date(item.month), 'MMM yyyy'),
            revenue: parseFloat(item.revenue)
        }));
        
        res.json(formattedResults);
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching monthly revenue',
            error: error.message 
        });
    }
};

// Get top selling items
const getTopSellingItemsAnalytics = async (req, res) => {
    try {
        console.log('Fetching top selling items analytics...');
        const query = `
            SELECT 
                i.name,
                SUM(bi.quantity) as quantity
            FROM items i
            JOIN bill_items bi ON i.id = bi.item_id
            JOIN bills b ON bi.bill_id = b.id
            WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY i.id, i.name
            ORDER BY quantity DESC
            LIMIT 10
        `;
        console.log('Top selling items analytics query:', query);
        
        const [results] = await pool.query(query);
        console.log('Top selling items analytics results:', results);
        
        res.json({
            items: results
        });
    } catch (error) {
        console.error('Error fetching top selling items analytics:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching top selling items analytics',
            error: error.message 
        });
    }
};

// Get category distribution
const getCategoryDistributionAnalytics = async (req, res) => {
    try {
        console.log('Fetching category distribution analytics...');
        const query = `
            SELECT 
                i.category as name,
                COUNT(*) as count,
                COALESCE(SUM(bi.quantity * bi.unit_price), 0) as total
            FROM items i
            LEFT JOIN bill_items bi ON i.id = bi.item_id
            LEFT JOIN bills b ON bi.bill_id = b.id
            WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY i.category
            ORDER BY total DESC
        `;
        console.log('Category distribution analytics query:', query);
        
        const [results] = await pool.query(query);
        console.log('Category distribution analytics results:', results);
        
        res.json({
            categories: results
        });
    } catch (error) {
        console.error('Error fetching category distribution analytics:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching category distribution analytics',
            error: error.message 
        });
    }
};

// Get recent activities for analytics
const getRecentActivitiesAnalytics = async (req, res) => {
    try {
        console.log('Fetching recent activities for analytics...');
        const salesQuery = `
            SELECT 
                'sale' as type,
                b.id as reference_id,
                b.customer_name,
                SUM(bi.total_price) as amount,
                b.bill_date as activity_date,
                GROUP_CONCAT(CONCAT(i.name, ' (', bi.quantity, ')')) as details
            FROM bills b
            JOIN bill_items bi ON b.id = bi.bill_id
            JOIN items i ON bi.item_id = i.id
            GROUP BY b.id, b.customer_name, b.bill_date
            ORDER BY b.bill_date DESC
            LIMIT 5
        `;

        const loansQuery = `
            SELECT 
                'loan' as type,
                l.id as reference_id,
                l.borrower_name,
                l.loan_amount as amount,
                l.loan_date as activity_date,
                CONCAT('Due Date: ', DATE_FORMAT(l.due_date, '%Y-%m-%d')) as details
            FROM loans l
            ORDER BY l.loan_date DESC
            LIMIT 5
        `;

        const paymentsQuery = `
            SELECT 
                'payment' as type,
                lp.id as reference_id,
                l.borrower_name,
                lp.amount,
                lp.payment_date as activity_date,
                CONCAT('Payment Method: ', lp.payment_method) as details
            FROM loan_payments lp
            JOIN loans l ON lp.loan_id = l.id
            ORDER BY lp.payment_date DESC
            LIMIT 5
        `;

        // Execute all queries
        const [sales, loans, payments] = await Promise.all([
            pool.query(salesQuery),
            pool.query(loansQuery),
            pool.query(paymentsQuery)
        ]);

        // Combine and sort results
        const allActivities = [
            ...sales[0].map(s => ({ ...s, category: 'Sale' })),
            ...loans[0].map(l => ({ ...l, category: 'Loan' })),
            ...payments[0].map(p => ({ ...p, category: 'Payment' }))
        ].sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
        .slice(0, 10)
        .map(activity => ({
            ...activity,
            amount: parseFloat(activity.amount || 0),
            details: activity.details ? 
                activity.type === 'sale' ? activity.details.split(',') : activity.details
                : null
        }));

        res.json(allActivities);
    } catch (error) {
        console.error('Error fetching recent activities for analytics:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error fetching recent activities for analytics',
            error: error.message 
        });
    }
};

module.exports = {
    getDashboardStats,
    getTopSellingItems,
    getCategoryDistribution,
    getRecentActivities,
    getInventoryStats,
    getMonthlyRevenue,
    getTopSellingItemsAnalytics,
    getCategoryDistributionAnalytics,
    getRecentActivitiesAnalytics
};
