const db = require('../config/db');
const BillModel = require('../models/billModel');

class BillController {
    // Create new bill
    async createBill(req, res) {
        try {
            const billData = req.body;

            // Validate required fields
            if (!billData.customer_name || !billData.customer_no || 
                !billData.bill_date || !billData.items) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Log the items being processed
            console.log('Items being processed for the bill:', billData.items);

            // Calculate total amount from items
            let totalAmount = 0;
            billData.items.forEach(item => {
                console.log(`Item: ${item.name}, Price: ${item.price}, Quantity: ${item.quantity}`); // Log each item's details
                totalAmount += item.price * item.quantity; // Assuming item has 'price' and 'quantity'
            });

            billData.total_amount = totalAmount; // Set the calculated total amount
            console.log('Total amount calculated:', billData.total_amount); // Log the total amount

            const result = await BillModel.createBill(billData);
            res.status(201).json({
                message: 'Bill created successfully',
                billId: result.billId,
                billNo: result.billNo
            });
        } catch (error) {
            console.error('Error creating bill:', error);
            res.status(500).json({ message: 'Error creating bill' });
        }
    }

    // Get all bills
    async getAllBills(req, res) {
        try {
            const bills = await BillModel.getAllBills();
            res.json(bills);
        } catch (error) {
            console.error('Error getting bills:', error);
            res.status(500).json({ message: 'Error getting bills' });
        }
    }

    // Get bill by ID
    async getBillById(req, res) {
        try {
            const { id } = req.params;
            const bill = await BillModel.getBillById(id);
            
            if (!bill) {
                return res.status(404).json({ message: 'Bill not found' });
            }
            
            res.json(bill);
        } catch (error) {
            console.error('Error getting bill:', error);
            res.status(500).json({ message: 'Error getting bill' });
        }
    }

    // Get bill by bill number
    async getBillByNumber(req, res) {
        try {
            const { billNo } = req.params;
            const bill = await BillModel.getBillByNumber(billNo);
            
            if (!bill) {
                return res.status(404).json({ message: 'Bill not found' });
            }
            
            res.json(bill);
        } catch (error) {
            console.error('Error getting bill:', error);
            res.status(500).json({ message: 'Error getting bill' });
        }
    }

    // Get bills by customer
    async getBillsByCustomer(req, res) {
        try {
            const { customerNo } = req.params;
            const bills = await BillModel.getBillsByCustomer(customerNo);
            res.json(bills);
        } catch (error) {
            console.error('Error getting bills by customer:', error);
            res.status(500).json({ message: 'Error getting bills by customer' });
        }
    }

    // Get bills by date range
    async getBillsByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start date and end date are required' });
            }

            const bills = await BillModel.getBillsByDateRange(startDate, endDate);
            res.json(bills);
        } catch (error) {
            console.error('Error getting bills by date range:', error);
            res.status(500).json({ message: 'Error getting bills by date range' });
        }
    }

    // Get daily sales report
    async getDailySalesReport(req, res) {
        try {
            const { date } = req.query;
            if (!date) {
                return res.status(400).json({ message: 'Date is required' });
            }

            const report = await BillModel.getDailySalesReport(date);
            res.json(report);
        } catch (error) {
            console.error('Error getting daily sales report:', error);
            res.status(500).json({ message: 'Error getting daily sales report' });
        }
    }

    // Get monthly sales report
    async getMonthlySalesReport(req, res) {
        try {
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const report = await BillModel.getMonthlySalesReport(month, year);
            res.json(report);
        } catch (error) {
            console.error('Error getting monthly sales report:', error);
            res.status(500).json({ message: 'Error getting monthly sales report' });
        }
    }
}

module.exports = new BillController();
