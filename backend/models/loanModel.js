const db = require('../config/db');

class LoanModel {
    // Create new loan
    async createLoan(loanData) {
        const query = `
            INSERT INTO loans (
                customer_name, customer_phone, loan_amount, 
                loan_date, due_date, status
            ) VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        
        try {
            const [result] = await db.execute(query, [
                loanData.customer_name,
                loanData.customer_phone,
                loanData.loan_amount,
                loanData.loan_date || new Date(),
                loanData.due_date
            ]);
            return result.insertId;
        } catch (error) {
            console.error('Error creating loan:', error);
            throw error;
        }
    }

    // Get all loans
    async getAllLoans() {
        const query = 'SELECT * FROM loans ORDER BY loan_date DESC';
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting loans:', error);
            throw error;
        }
    }

    // Get loans due today
    async getLoansDueToday() {
        const query = `
            SELECT * FROM loans 
            WHERE DATE(due_date) = CURDATE() 
            AND status = 'pending'
            ORDER BY due_date ASC
        `;
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting loans due today:', error);
            throw error;
        }
    }

    // Get loan by ID
    async getLoanById(id) {
        const query = 'SELECT * FROM loans WHERE id = ?';
        try {
            const [rows] = await db.execute(query, [id]);
            return rows[0];
        } catch (error) {
            console.error('Error getting loan by ID:', error);
            throw error;
        }
    }

    // Update loan status
    async updateLoanStatus(id, status) {
        const query = `
            UPDATE loans 
            SET status = ?, 
                payment_date = CASE 
                    WHEN ? = 'paid' THEN CURRENT_TIMESTAMP 
                    ELSE NULL 
                END 
            WHERE id = ?
        `;
        try {
            const [result] = await db.execute(query, [status, status, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating loan status:', error);
            throw error;
        }
    }

    // Get overdue loans
    async getOverdueLoans() {
        const query = `
            SELECT * FROM loans 
            WHERE due_date < CURRENT_TIMESTAMP 
            AND status = 'pending'
            ORDER BY due_date ASC
        `;
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting overdue loans:', error);
            throw error;
        }
    }

    // Get loan statistics
    async getLoanStatistics() {
        const query = `
            SELECT 
                COUNT(*) as total_loans,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_loans,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_loans,
                SUM(loan_amount) as total_amount,
                SUM(CASE WHEN status = 'pending' THEN loan_amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'paid' THEN loan_amount ELSE 0 END) as recovered_amount
            FROM loans
        `;
        try {
            const [rows] = await db.execute(query);
            return rows[0];
        } catch (error) {
            console.error('Error getting loan statistics:', error);
            throw error;
        }
    }
}

module.exports = new LoanModel();