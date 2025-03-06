const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { format } = require('date-fns');

// Helper function to format loan data
const formatLoan = (loan) => ({
    ...loan,
    loan_amount: Number(loan.loan_amount),
    paid_amount: Number(loan.paid_amount || 0),
    remaining_amount: Number(loan.remaining_amount || loan.loan_amount),
    loan_date: loan.loan_date,
    due_date: loan.due_date
});

// Create new loan
router.post('/', async (req, res) => {
    try {
        console.log('Creating new loan:', req.body);
        const { customer_name, customer_phone, loan_amount, due_date } = req.body;

        // Validate required fields
        if (!customer_name || !customer_phone || !loan_amount || !due_date) {
            return res.status(400).json({ 
                message: 'Missing required fields. Please provide customer_name, customer_phone, loan_amount, and due_date' 
            });
        }

        // Validate loan amount
        const amount = Number(loan_amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Invalid loan amount' });
        }

        // Insert new loan
        const query = `
            INSERT INTO loans (
                customer_name, 
                customer_phone, 
                loan_amount, 
                remaining_amount,
                loan_date,
                due_date,
                status
            ) VALUES (?, ?, ?, ?, CURDATE(), ?, 'pending')
        `;

        const [result] = await db.execute(query, [
            customer_name,
            customer_phone,
            amount,
            amount,
            due_date
        ]);

        // Get the created loan
        const [loans] = await db.execute('SELECT * FROM loans WHERE id = ?', [result.insertId]);
        const newLoan = loans[0];

        console.log('Loan created successfully:', newLoan);
        res.status(201).json({
            message: 'Loan created successfully',
            loan: formatLoan(newLoan)
        });
    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({ 
            message: 'Error creating loan',
            error: error.message 
        });
    }
});

// Get all loans
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all loans...');
        const query = `
            SELECT l.*, 
                   COALESCE(SUM(lp.amount), 0) as total_paid,
                   l.loan_amount - COALESCE(SUM(lp.amount), 0) as remaining
            FROM loans l
            LEFT JOIN loan_payments lp ON l.id = lp.loan_id
            GROUP BY l.id
            ORDER BY l.loan_date DESC
        `;
        const [loans] = await db.query(query);
        console.log('Fetched loans:', loans.length);
        res.json(loans.map(formatLoan));
    } catch (error) {
        console.error('Error fetching loans:', error);
        res.status(500).json({ message: 'Error fetching loans', error: error.message });
    }
});

// Get loan payments
router.get('/:id/payments', async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Fetching payments for loan:', id);
        const query = `
            SELECT * FROM loan_payments
            WHERE loan_id = ?
            ORDER BY payment_date DESC
        `;
        const [payments] = await db.query(query, [id]);
        console.log('Fetched payments:', payments.length);
        res.json(payments);
    } catch (error) {
        console.error('Error fetching loan payments:', error);
        res.status(500).json({ message: 'Error fetching loan payments', error: error.message });
    }
});

// Add loan payment
router.post('/:id/payments', async (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, notes } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        console.log('Processing payment for loan:', id, 'Amount:', amount);

        // Get current loan status
        const [loans] = await conn.query('SELECT * FROM loans WHERE id = ?', [id]);
        if (loans.length === 0) {
            throw new Error('Loan not found');
        }
        
        const loan = loans[0];
        const newAmount = Number(amount);
        const currentPaid = Number(loan.paid_amount || 0);
        const newPaidTotal = currentPaid + newAmount;
        const newRemaining = Number(loan.loan_amount) - newPaidTotal;

        console.log('Payment details:', {
            currentPaid,
            newAmount,
            newPaidTotal,
            newRemaining
        });

        // Add payment record
        const paymentQuery = `
            INSERT INTO loan_payments (loan_id, amount, payment_method, notes)
            VALUES (?, ?, ?, ?)
        `;
        await conn.query(paymentQuery, [id, newAmount, payment_method, notes]);

        // Update loan status
        const updateQuery = `
            UPDATE loans 
            SET paid_amount = ?,
                remaining_amount = ?,
                status = CASE WHEN remaining_amount <= 0 THEN 'paid' ELSE 'pending' END
            WHERE id = ?
        `;
        await conn.query(updateQuery, [newPaidTotal, newRemaining, id]);

        await conn.commit();
        console.log('Payment processed successfully');
        
        res.json({ 
            message: 'Payment recorded successfully',
            paid_amount: newPaidTotal,
            remaining_amount: newRemaining,
            status: newRemaining <= 0 ? 'paid' : 'pending'
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Error recording payment', error: error.message });
    } finally {
        conn.release();
    }
});

// Get loans due today
router.get('/due-today', async (req, res) => {
    try {
        console.log('Fetching loans due today...');
        const query = `
            SELECT * FROM loans 
            WHERE DATE(due_date) = CURDATE()
            AND status = 'pending'
            ORDER BY due_date ASC
        `;
        const [loans] = await db.query(query);
        console.log('Fetched due loans:', loans.length);
        res.json(loans.map(formatLoan));
    } catch (error) {
        console.error('Error fetching due loans:', error);
        res.status(500).json({ message: 'Error fetching due loans', error: error.message });
    }
});

// Get loan statistics
router.get('/statistics', async (req, res) => {
    try {
        console.log('Fetching loan statistics...');
        const query = `
            SELECT 
                COUNT(*) as total_loans,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_loans,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_loans,
                SUM(loan_amount) as total_amount,
                SUM(CASE WHEN status = 'pending' THEN remaining_amount ELSE 0 END) as pending_amount,
                SUM(paid_amount) as recovered_amount
            FROM loans
        `;
        const [stats] = await db.query(query);
        
        const formattedStats = {
            ...stats[0],
            total_amount: Number(stats[0].total_amount || 0),
            pending_amount: Number(stats[0].pending_amount || 0),
            recovered_amount: Number(stats[0].recovered_amount || 0),
            total_loans: Number(stats[0].total_loans || 0),
            pending_loans: Number(stats[0].pending_loans || 0),
            paid_loans: Number(stats[0].paid_loans || 0)
        };
        
        console.log('Loan statistics:', formattedStats);
        res.json(formattedStats);
    } catch (error) {
        console.error('Error fetching loan statistics:', error);
        res.status(500).json({ message: 'Error fetching loan statistics', error: error.message });
    }
});

module.exports = router;