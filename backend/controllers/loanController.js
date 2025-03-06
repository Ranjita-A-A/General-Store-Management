const LoanModel = require('../models/loanModel');

class LoanController {
    // Create new loan
    async createLoan(req, res) {
        try {
            const loanData = req.body;

            // Validate required fields
            if (!loanData.customer_name || !loanData.customer_phone || 
                !loanData.loan_amount || !loanData.due_date) {
                return res.status(400).json({ 
                    message: 'Please provide all required fields: customer_name, customer_phone, loan_amount, and due_date'
                });
            }

            // Validate phone number format
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(loanData.customer_phone)) {
                return res.status(400).json({ 
                    message: 'Invalid phone number format. Please provide a 10-digit phone number.'
                });
            }

            // Validate loan amount
            if (parseFloat(loanData.loan_amount) <= 0) {
                return res.status(400).json({ 
                    message: 'Loan amount must be greater than 0'
                });
            }

            // Validate due date
            const dueDate = new Date(loanData.due_date);
            if (isNaN(dueDate.getTime()) || dueDate <= new Date()) {
                return res.status(400).json({ 
                    message: 'Due date must be a valid future date'
                });
            }

            const result = await LoanModel.createLoan(loanData);
            res.status(201).json({
                message: 'Loan created successfully',
                loanId: result
            });
        } catch (error) {
            console.error('Error creating loan:', error);
            res.status(500).json({ message: 'Error creating loan' });
        }
    }

    // Get all loans
    async getAllLoans(req, res) {
        try {
            const loans = await LoanModel.getAllLoans();
            res.json(loans);
        } catch (error) {
            console.error('Error getting loans:', error);
            res.status(500).json({ message: 'Error getting loans' });
        }
    }

    // Get loans due today
    async getLoansDueToday(req, res) {
        try {
            const loans = await LoanModel.getLoansDueToday();
            res.json(loans);
        } catch (error) {
            console.error('Error getting loans due today:', error);
            res.status(500).json({ message: 'Error getting loans due today' });
        }
    }

    // Get loan by ID
    async getLoanById(req, res) {
        try {
            const { id } = req.params;
            const loan = await LoanModel.getLoanById(id);
            
            if (!loan) {
                return res.status(404).json({ message: 'Loan not found' });
            }
            
            res.json(loan);
        } catch (error) {
            console.error('Error getting loan:', error);
            res.status(500).json({ message: 'Error getting loan' });
        }
    }

    // Update loan status
    async updateLoanStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'paid'].includes(status)) {
                return res.status(400).json({ 
                    message: 'Invalid status. Status must be either "pending" or "paid"'
                });
            }

            const success = await LoanModel.updateLoanStatus(id, status);
            
            if (!success) {
                return res.status(404).json({ message: 'Loan not found' });
            }

            res.json({ 
                message: 'Loan status updated successfully',
                status: status
            });
        } catch (error) {
            console.error('Error updating loan status:', error);
            res.status(500).json({ message: 'Error updating loan status' });
        }
    }

    // Get overdue loans
    async getOverdueLoans(req, res) {
        try {
            const loans = await LoanModel.getOverdueLoans();
            res.json(loans);
        } catch (error) {
            console.error('Error getting overdue loans:', error);
            res.status(500).json({ message: 'Error getting overdue loans' });
        }
    }

    // Get loan statistics
    async getLoanStatistics(req, res) {
        try {
            const stats = await LoanModel.getLoanStatistics();
            res.json(stats);
        } catch (error) {
            console.error('Error getting loan statistics:', error);
            res.status(500).json({ message: 'Error getting loan statistics' });
        }
    }
}

module.exports = new LoanController();