const db = require('../config/db');

class BillModel {
    // Generate bill number
    async generateBillNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Get count of bills for today
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM bills WHERE DATE(bill_date) = CURDATE()'
        );
        const count = (rows[0].count + 1).toString().padStart(4, '0');
        
        return `BILL${year}${month}${day}${count}`;
    }

    // Create new bill
    async createBill(billData) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Generate bill number
            const billNo = await this.generateBillNumber();

            // Log the bill data being inserted
            console.log('Inserting bill data:', {
                billNo,
                customer_name: billData.customer_name,
                customer_no: billData.customer_no,
                total_amount: billData.total_amount,
                bill_date: billData.bill_date
            });

            // Insert bill
            const [billResult] = await connection.execute(
                `INSERT INTO bills (
                    bill_no, customer_name, customer_no, 
                    total_amount, bill_date
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    billNo,
                    billData.customer_name,
                    billData.customer_no,
                    billData.total_amount,
                    billData.bill_date
                ]
            );

            // Insert bill items
            for (const item of billData.items) {
                console.log('Inserting bill item:', item);
                await connection.execute(
                    `INSERT INTO bill_items (
                        bill_id, item_id, item_name, 
                        quantity, unit_price, total_price
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        billResult.insertId,
                        item.item_id,
                        item.name || '',
                        item.quantity,
                        item.price,
                        item.total || (item.price * item.quantity)
                    ]
                );

                // Update item stock
                await connection.execute(
                    'UPDATE items SET quantity = quantity - ? WHERE id = ?',
                    [item.quantity, item.item_id]
                );
            }

            await connection.commit();
            return { billId: billResult.insertId, billNo };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating bill in database:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all bills
    async getAllBills() {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'item_id', bi.item_id,
                           'item_name', bi.item_name,
                           'quantity', bi.quantity,
                           'unit_price', bi.unit_price,
                           'total_price', bi.total_price
                       )
                   ) as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            GROUP BY b.id
            ORDER BY b.bill_date DESC
        `;
        try {
            const [rows] = await db.execute(query);
            return rows.map(row => ({
                ...row,
                items: JSON.parse(`[${row.items}]`)
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get bill by ID
    async getBillById(id) {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'item_id', bi.item_id,
                           'item_name', bi.item_name,
                           'quantity', bi.quantity,
                           'unit_price', bi.unit_price,
                           'total_price', bi.total_price
                       )
                   ) as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            WHERE b.id = ?
            GROUP BY b.id
        `;
        try {
            const [rows] = await db.execute(query, [id]);
            if (rows.length === 0) return null;
            
            const bill = rows[0];
            return {
                ...bill,
                items: JSON.parse(`[${bill.items}]`)
            };
        } catch (error) {
            throw error;
        }
    }

    // Get bill by bill number
    async getBillByNumber(billNo) {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'item_id', bi.item_id,
                           'item_name', bi.item_name,
                           'quantity', bi.quantity,
                           'unit_price', bi.unit_price,
                           'total_price', bi.total_price
                       )
                   ) as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            WHERE b.bill_no = ?
            GROUP BY b.id
        `;
        try {
            const [rows] = await db.execute(query, [billNo]);
            if (rows.length === 0) return null;
            
            const bill = rows[0];
            return {
                ...bill,
                items: JSON.parse(`[${bill.items}]`)
            };
        } catch (error) {
            throw error;
        }
    }

    // Get bills by customer
    async getBillsByCustomer(customerNo) {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'item_id', bi.item_id,
                           'item_name', bi.item_name,
                           'quantity', bi.quantity,
                           'unit_price', bi.unit_price,
                           'total_price', bi.total_price
                       )
                   ) as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            WHERE b.customer_no = ?
            GROUP BY b.id
            ORDER BY b.bill_date DESC
        `;
        try {
            const [rows] = await db.execute(query, [customerNo]);
            return rows.map(row => ({
                ...row,
                items: JSON.parse(`[${row.items}]`)
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get bills by date range
    async getBillsByDateRange(startDate, endDate) {
        const query = `
            SELECT b.*, 
                   GROUP_CONCAT(
                       JSON_OBJECT(
                           'item_id', bi.item_id,
                           'item_name', bi.item_name,
                           'quantity', bi.quantity,
                           'unit_price', bi.unit_price,
                           'total_price', bi.total_price
                       )
                   ) as items
            FROM bills b
            LEFT JOIN bill_items bi ON b.id = bi.bill_id
            WHERE DATE(b.bill_date) BETWEEN ? AND ?
            GROUP BY b.id
            ORDER BY b.bill_date DESC
        `;
        try {
            const [rows] = await db.execute(query, [startDate, endDate]);
            return rows.map(row => ({
                ...row,
                items: JSON.parse(`[${row.items}]`)
            }));
        } catch (error) {
            throw error;
        }
    }

    // Get daily sales report
    async getDailySalesReport(date) {
        const query = `
            SELECT 
                DATE(bill_date) as date,
                COUNT(*) as total_bills,
                SUM(total_amount) as total_sales,
                COUNT(DISTINCT customer_no) as unique_customers,
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'item_name', bi.item_name,
                            'total_quantity', SUM(bi.quantity),
                            'total_sales', SUM(bi.total_price)
                        )
                    )
                    FROM bill_items bi
                    JOIN bills b2 ON bi.bill_id = b2.id
                    WHERE DATE(b2.bill_date) = DATE(?)
                    GROUP BY bi.item_name
                ) as item_wise_sales
            FROM bills b
            WHERE DATE(bill_date) = DATE(?)
            GROUP BY DATE(bill_date)
        `;
        try {
            const [rows] = await db.execute(query, [date, date]);
            if (rows.length === 0) return null;
            
            const report = rows[0];
            return {
                ...report,
                item_wise_sales: report.item_wise_sales ? 
                    JSON.parse(`[${report.item_wise_sales}]`) : []
            };
        } catch (error) {
            throw error;
        }
    }

    // Get monthly sales report
    async getMonthlySalesReport(month, year) {
        const query = `
            SELECT 
                DATE_FORMAT(bill_date, '%Y-%m') as month,
                COUNT(*) as total_bills,
                SUM(total_amount) as total_sales,
                COUNT(DISTINCT customer_no) as unique_customers,
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'item_name', bi.item_name,
                            'total_quantity', SUM(bi.quantity),
                            'total_sales', SUM(bi.total_price)
                        )
                    )
                    FROM bill_items bi
                    JOIN bills b2 ON bi.bill_id = b2.id
                    WHERE MONTH(b2.bill_date) = ? AND YEAR(b2.bill_date) = ?
                    GROUP BY bi.item_name
                ) as item_wise_sales,
                (
                    SELECT GROUP_CONCAT(
                        JSON_OBJECT(
                            'date', DATE(b3.bill_date),
                            'total_sales', SUM(b3.total_amount)
                        )
                    )
                    FROM bills b3
                    WHERE MONTH(b3.bill_date) = ? AND YEAR(b3.bill_date) = ?
                    GROUP BY DATE(b3.bill_date)
                ) as daily_sales
            FROM bills b
            WHERE MONTH(bill_date) = ? AND YEAR(bill_date) = ?
            GROUP BY DATE_FORMAT(bill_date, '%Y-%m')
        `;
        try {
            const [rows] = await db.execute(query, [month, year, month, year, month, year]);
            if (rows.length === 0) return null;
            
            const report = rows[0];
            return {
                ...report,
                item_wise_sales: report.item_wise_sales ? 
                    JSON.parse(`[${report.item_wise_sales}]`) : [],
                daily_sales: report.daily_sales ? 
                    JSON.parse(`[${report.daily_sales}]`) : []
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new BillModel();
