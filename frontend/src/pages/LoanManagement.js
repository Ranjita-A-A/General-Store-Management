import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Box,
    Paper,
    Alert,
    Snackbar,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import api from '../config/api';

const safeFormatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy') : '';
};

export default function LoanManagement() {
    const [loans, setLoans] = useState([]);
    const [dueTodayLoans, setDueTodayLoans] = useState([]);
    const [loanStats, setLoanStats] = useState({
        total_loans: 0,
        pending_loans: 0,
        paid_loans: 0,
        total_amount: 0,
        pending_amount: 0,
        recovered_amount: 0
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        loan_amount: '',
        due_date: ''
    });

    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const fetchAllData = async () => {
        try {
            const [loansRes, dueLoansRes, statsRes] = await Promise.all([
                api.get('/api/loans'),
                api.get('/api/loans/due-today'),
                api.get('/api/loans/statistics')
            ]);
            setLoans(loansRes.data);
            setDueTodayLoans(dueLoansRes.data);
            setLoanStats(statsRes.data);
        } catch (error) {
            setError('Failed to fetch loan data');
            console.error('Error fetching loan data:', error);
        }
    };

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleDialogOpen = () => {
        setSelectedLoan(null);
        setFormData({
            customer_name: '',
            customer_phone: '',
            loan_amount: '',
            due_date: ''
        });
        setOpenDialog(true);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(formData.customer_phone)) {
                setError('Please enter a valid 10-digit phone number');
                return;
            }

            if (parseFloat(formData.loan_amount) <= 0) {
                setError('Loan amount must be greater than 0');
                return;
            }

            const dueDate = new Date(formData.due_date);
            if (isNaN(dueDate.getTime()) || dueDate <= new Date()) {
                setError('Due date must be a future date');
                return;
            }

            const response = await api.post('/api/loans', formData);
            setSnackbar({
                open: true,
                message: 'Loan created successfully',
                severity: 'success'
            });
            setOpenDialog(false);
            fetchAllData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create loan');
            console.error('Error creating loan:', error);
        }
    };

    const handlePaymentClick = (loan) => {
        setSelectedLoan(loan);
        setPaymentAmount('');
        setPaymentMethod('cash');
        setPaymentNotes('');
        setPaymentDialogOpen(true);
    };

    const handlePaymentClose = () => {
        setPaymentDialogOpen(false);
        setSelectedLoan(null);
        setPaymentAmount('');
        setPaymentMethod('cash');
        setPaymentNotes('');
    };

    const handlePaymentSubmit = async () => {
        if (!selectedLoan || !paymentAmount) return;

        try {
            await api.post(`/api/loans/${selectedLoan.id}/payments`, {
                amount: paymentAmount,
                payment_method: paymentMethod,
                notes: paymentNotes
            });
            setSnackbar({
                open: true,
                message: 'Payment recorded successfully',
                severity: 'success'
            });
            setPaymentDialogOpen(false);
            setPaymentAmount('');
            setPaymentMethod('cash');
            setPaymentNotes('');
            fetchAllData();
        } catch (error) {
            setError('Failed to record payment');
            console.error('Error recording payment:', error);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const columns = [
        { field: 'customer_name', headerName: 'Customer Name', flex: 1 },
        { field: 'customer_phone', headerName: 'Phone Number', flex: 1 },
        { 
            field: 'loan_amount', 
            headerName: 'Total Amount', 
            flex: 1,
            valueFormatter: (params) => {
                const amount = Number(params.value);
                return isNaN(amount) ? '₹0.00' : `₹${amount.toFixed(2)}`;
            }
        },
        { 
            field: 'paid_amount', 
            headerName: 'Paid Amount', 
            flex: 1,
            valueFormatter: (params) => {
                const amount = Number(params.value);
                return isNaN(amount) ? '₹0.00' : `₹${amount.toFixed(2)}`;
            }
        },
        { 
            field: 'remaining_amount', 
            headerName: 'Remaining', 
            flex: 1,
            valueFormatter: (params) => {
                const amount = Number(params.value);
                return isNaN(amount) ? '₹0.00' : `₹${amount.toFixed(2)}`;
            }
        },
        {
            field: 'loan_date',
            headerName: 'Loan Date',
            flex: 1,
            valueFormatter: (params) => safeFormatDate(params.value)
        },
        {
            field: 'due_date',
            headerName: 'Due Date',
            flex: 1,
            valueFormatter: (params) => safeFormatDate(params.value)
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={params.value === 'paid' ? 'success' : 'warning'}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            renderCell: (params) => (
                params.row.status === 'pending' && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handlePaymentClick(params.row)}
                    >
                        Add Payment
                    </Button>
                )
            )
        }
    ];

    const renderDueLoans = () => {
        if (!dueTodayLoans || dueTodayLoans.length === 0) return null;
        
        return (
            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Loans Due Today ({dueTodayLoans.length})
                </Typography>
                {dueTodayLoans.map((loan) => (
                    <Box key={loan.id} sx={{ mb: 1 }}>
                        {loan.customer_name} - ₹{Number(loan.loan_amount).toFixed(2)} - {loan.customer_phone}
                        {loan.due_date && ` - Due: ${safeFormatDate(loan.due_date)}`}
                    </Box>
                ))}
            </Alert>
        );
    };

    const renderAddLoanDialog = () => (
        <Dialog open={openDialog} onClose={handleDialogClose}>
            <DialogTitle>Add New Loan</DialogTitle>
            <DialogContent>
                <TextField
                    margin="normal"
                    label="Customer Name"
                    fullWidth
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
                <TextField
                    margin="normal"
                    label="Phone Number"
                    fullWidth
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    helperText="Enter 10-digit phone number"
                />
                <TextField
                    margin="normal"
                    label="Loan Amount"
                    type="number"
                    fullWidth
                    required
                    value={formData.loan_amount}
                    onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                    inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                    margin="normal"
                    label="Due Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained" 
                    color="primary"
                    disabled={!formData.customer_name || !formData.customer_phone || !formData.loan_amount || !formData.due_date}
                >
                    Create Loan
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderPaymentDialog = () => (
        <Dialog open={paymentDialogOpen} onClose={handlePaymentClose}>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogContent>
                {selectedLoan && (
                    <DialogContentText>
                        Recording payment for {selectedLoan.customer_name}
                        <br />
                        Remaining Amount: ₹{Number(selectedLoan.remaining_amount).toFixed(2)}
                    </DialogContentText>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Payment Amount"
                    type="number"
                    fullWidth
                    value={paymentAmount}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        if (selectedLoan && value <= selectedLoan.remaining_amount) {
                            setPaymentAmount(e.target.value);
                        }
                    }}
                    inputProps={{
                        min: 0,
                        max: selectedLoan?.remaining_amount,
                        step: "0.01"
                    }}
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    margin="dense"
                    label="Notes"
                    fullWidth
                    multiline
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handlePaymentClose}>Cancel</Button>
                <Button 
                    onClick={handlePaymentSubmit}
                    disabled={!paymentAmount || Number(paymentAmount) <= 0}
                >
                    Record Payment
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Loan Management</Typography>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">Total Loans</Typography>
                        <Typography variant="h4">{loanStats.total_loans || 0}</Typography>
                        <Box sx={{ mt: 1 }}>
                            <Chip label={`Pending: ${loanStats.pending_loans || 0}`} color="warning" sx={{ mr: 1 }} />
                            <Chip label={`Paid: ${loanStats.paid_loans || 0}`} color="success" />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">Total Amount</Typography>
                        <Typography variant="h4">₹{(Number(loanStats.total_amount) || 0).toFixed(2)}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Pending: ₹{(Number(loanStats.pending_amount) || 0).toFixed(2)}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">Recovered Amount</Typography>
                        <Typography variant="h4">₹{(Number(loanStats.recovered_amount) || 0).toFixed(2)}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Loans Due Today */}
            {renderDueLoans()}

            {/* Add New Loan Button */}
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleDialogOpen}
                sx={{ mb: 3 }}
            >
                Add New Loan
            </Button>

            {/* Loan List */}
            <DataGrid
                rows={loans}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
                autoHeight
                sx={{ mb: 3 }}
            />

            {/* Dialogs */}
            {renderAddLoanDialog()}
            {renderPaymentDialog()}
        </Container>
    );
}
