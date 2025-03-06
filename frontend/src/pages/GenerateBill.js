import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    MenuItem,
    Box,
    Autocomplete,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Print as PrintIcon,
    Download as DownloadIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useReactToPrint } from 'react-to-print';

const GenerateBill = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [billData, setBillData] = useState(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    
    const printComponentRef = useRef();

    // Fetch items on component mount
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching items for bill generation...');
            const response = await api.get('/api/items');
            console.log('Items fetched:', response.data);
            setItems(response.data);
        } catch (err) {
            console.error('Error fetching items:', err);
            setError('Failed to fetch items. Please try again.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setSelectedItems([...selectedItems, { 
            item: null, 
            quantity: 1,
            price: 0,
            total: 0
        }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = selectedItems.filter((_, i) => i !== index);
        setSelectedItems(newItems);
    };

    const handleItemChange = (index, item) => {
        if (!item) return;

        const newItems = [...selectedItems];
        const quantity = newItems[index].quantity || 1;
        const price = item.selling_price || 0;
        
        newItems[index] = {
            ...newItems[index],
            item: item,
            price: price,
            quantity: quantity,
            total: price * quantity
        };
        
        // Log the updated item details
        console.log(`Updated Item: ${newItems[index].item.name}, Price: ${newItems[index].price}, Quantity: ${newItems[index].quantity}, Total: ${newItems[index].total}`);
        
        setSelectedItems(newItems);
        setError(''); // Clear any previous errors
    };

    const handleQuantityChange = (index, quantity) => {
        if (quantity <= 0) return;
        
        const newItems = [...selectedItems];
        const item = newItems[index].item;
        
        if (item && quantity > item.quantity) {
            setError(`Only ${item.quantity} units available for ${item.name}`);
            return;
        }
        
        newItems[index] = {
            ...newItems[index],
            quantity: quantity,
            total: (newItems[index].price || 0) * quantity
        };
        
        // Log the updated quantity and total
        console.log(`Quantity changed for Item: ${newItems[index].item.name}, New Quantity: ${quantity}, New Total: ${newItems[index].total}`);
        
        setSelectedItems(newItems);
        setError('');
    };

    const calculateSubtotal = () => {
        return selectedItems.reduce((sum, item) => {
            return sum + (item.total || 0);
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return Math.max(0, subtotal - (parseFloat(discount) || 0));
    };

    const calculateProfit = () => {
        return selectedItems.reduce((sum, item) => {
            const costPrice = item.item?.cost_price || 0;
            const sellingPrice = item.item?.selling_price || 0;
            const quantity = item.quantity || 0;
            return sum + ((sellingPrice - costPrice) * quantity);
        }, 0);
    };

    const handleDiscountChange = (value) => {
        const subtotal = calculateSubtotal();
        if (value > subtotal) {
            setError('Discount cannot be greater than subtotal');
            return;
        }
        setDiscount(value);
    };

    const handlePrint = useReactToPrint({
        content: () => printComponentRef.current,
        onAfterPrint: () => setPrintDialogOpen(false)
    });

    const handleDownload = () => {
        const billContent = document.createElement('a');
        const bill = printComponentRef.current.innerHTML;
        const blob = new Blob([`
            <html>
                <head>
                    <title>Bill</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                    </style>
                </head>
                <body>${bill}</body>
            </html>
        `], { type: 'text/html' });
        
        billContent.href = URL.createObjectURL(blob);
        billContent.download = `bill-${new Date().getTime()}.html`;
        billContent.click();
        URL.revokeObjectURL(billContent.href);
        setPrintDialogOpen(false);
    };

    const validateBill = () => {
        if (!customerName.trim()) {
            setError('Customer name is required');
            return false;
        }

        if (selectedItems.length === 0) {
            setError('Please add at least one item');
            return false;
        }

        for (const item of selectedItems) {
            if (!item.item || !item.item.id) {
                setError('Please select all items');
                return false;
            }
            if (!item.quantity || item.quantity <= 0) {
                setError('Quantity must be greater than 0 for all items');
                return false;
            }
            if (item.quantity > item.item.quantity) {
                setError(`Only ${item.item.quantity} units available for ${item.item.name}`);
                return false;
            }
        }

        return true;
    };

    const handleSaveBill = async () => {
        try {
            if (!validateBill()) return;

            setLoading(true);
            setError('');
            console.log('Selected items:', selectedItems);

            const billItems = selectedItems.map(item => ({
                item_id: item.item.id,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            }));

            console.log('Transformed bill items:', billItems);

            const total = calculateTotal();
            const billPayload = {
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                payment_method: paymentMethod,
                discount: parseFloat(discount) || 0,
                total_amount: total,
                items: billItems
            };

            console.log('Sending bill data:', billPayload);
            const response = await api.post('/api/bills', billPayload);
            console.log('Bill generated:', response.data);

            setBillData(response.data.bill);
            setSuccess('Bill generated successfully!');
            setPrintDialogOpen(true);

            // Reset form
            setSelectedItems([]);
            setCustomerName('');
            setCustomerPhone('');
            setPaymentMethod('cash');
            setDiscount(0);
        } catch (err) {
            console.error('Error generating bill:', err);
            const errorMessage = err.response?.data?.error || err.message;
            console.error('Error details:', errorMessage);
            setError('Failed to generate bill: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const BillPreview = React.forwardRef((props, ref) => (
        <Box ref={ref} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom align="center">
                STORE BILL
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Typography><strong>Customer:</strong> {customerName}</Typography>
                    {customerPhone && (
                        <Typography><strong>Phone:</strong> {customerPhone}</Typography>
                    )}
                </Grid>
                <Grid item xs={6} align="right">
                    <Typography><strong>Date:</strong> {new Date().toLocaleDateString()}</Typography>
                    <Typography><strong>Bill No:</strong> {billData?.id || '-'}</Typography>
                </Grid>
            </Grid>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Item</strong></TableCell>
                            <TableCell align="right"><strong>Quantity</strong></TableCell>
                            <TableCell align="right"><strong>Price</strong></TableCell>
                            <TableCell align="right"><strong>Total</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.item?.name}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">₹{item.price}</TableCell>
                                <TableCell align="right">₹{item.total}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} align="right">
                                <strong>Subtotal:</strong>
                            </TableCell>
                            <TableCell align="right">
                                <strong>₹{calculateSubtotal()}</strong>
                            </TableCell>
                        </TableRow>
                        {discount > 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="right">
                                    <strong>Discount:</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>₹{discount}</strong>
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell colSpan={3} align="right">
                                <strong>Total Amount:</strong>
                            </TableCell>
                            <TableCell align="right">
                                <strong>₹{calculateTotal()}</strong>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
                <Typography><strong>Payment Method:</strong> {paymentMethod.toUpperCase()}</Typography>
            </Box>
        </Box>
    ));

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Generate New Bill
                </Typography>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 2 }}
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => setError('')}
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                    >
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Customer Name"
                            fullWidth
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Customer Phone"
                            fullWidth
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            label="Payment Method"
                            fullWidth
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="upi">UPI</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Discount Amount"
                            type="number"
                            fullWidth
                            value={discount}
                            onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                inputProps: { min: 0 }
                            }}
                        />
                    </Grid>
                </Grid>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedItems.map((selectedItem, index) => (
                            <TableRow key={index}>
                                <TableCell style={{ minWidth: 300 }}>
                                    <Autocomplete
                                        options={items}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={selectedItem.item}
                                        onChange={(e, newValue) => handleItemChange(index, newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Item"
                                                required
                                                error={!selectedItem.item}
                                                helperText={!selectedItem.item ? 'Required' : ''}
                                            />
                                        )}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        value={selectedItem.quantity}
                                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                        InputProps={{ inputProps: { min: 1 } }}
                                        error={selectedItem.item && selectedItem.quantity > selectedItem.item.quantity}
                                        helperText={selectedItem.item && selectedItem.quantity > selectedItem.item.quantity ? 
                                            `Max: ${selectedItem.item.quantity}` : ''}
                                    />
                                </TableCell>
                                <TableCell>
                                    ₹{selectedItem.price}
                                </TableCell>
                                <TableCell>
                                    ₹{selectedItem.total}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleRemoveItem(index)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {selectedItems.length > 0 && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <Typography variant="subtitle1">Subtotal:</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle1">₹{calculateSubtotal()}</Typography>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                                {discount > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="right">
                                            <Typography variant="subtitle1">Discount:</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle1">₹{discount}</Typography>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <Typography variant="h6">Total Amount:</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6">₹{calculateTotal()}</Typography>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>

                <Box sx={{ mt: 2 }}>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="outlined"
                    >
                        Add Item
                    </Button>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/')}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveBill}
                        disabled={selectedItems.length === 0 || loading}
                    >
                        Generate Bill
                    </Button>
                </Box>
            </Paper>

            {/* Print Preview Dialog */}
            <Dialog 
                open={printDialogOpen} 
                onClose={() => setPrintDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Bill Generated Successfully
                </DialogTitle>
                <DialogContent>
                    <BillPreview ref={printComponentRef} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPrintDialogOpen(false)}>
                        Close
                    </Button>
                    <Button 
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                    >
                        Download
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!success}
                autoHideDuration={2000}
                onClose={() => setSuccess('')}
                message={success}
            />
        </Container>
    );
};

export default GenerateBill;
