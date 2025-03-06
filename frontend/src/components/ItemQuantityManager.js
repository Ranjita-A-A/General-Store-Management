import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Alert,
    Snackbar,
    Typography
} from '@mui/material';

const ItemQuantityManager = () => {
    const [items, setItems] = useState([]);
    const [alert, setAlert] = useState(null);
    const [quantityInputs, setQuantityInputs] = useState({});

    // Fetch items from the backend
    const fetchItems = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/item-types');
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
            setAlert({
                type: 'error',
                message: 'Failed to fetch items'
            });
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Handle quantity reduction
    const handleReduceQuantity = async (itemId) => {
        const quantity = parseInt(quantityInputs[itemId] || 0);
        
        if (!quantity || quantity <= 0) {
            setAlert({
                type: 'error',
                message: 'Please enter a valid quantity'
            });
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/api/item-types/reduce', {
                id: itemId,
                quantity: quantity
            });

            // Clear the input
            setQuantityInputs(prev => ({
                ...prev,
                [itemId]: ''
            }));

            // Show success message
            setAlert({
                type: 'success',
                message: 'Quantity updated successfully'
            });

            // If there's a low stock alert, show it
            if (response.data.alert) {
                setTimeout(() => {
                    setAlert({
                        type: 'warning',
                        message: response.data.alert.message
                    });
                }, 2000);
            }

            // Refresh the items list
            fetchItems();
        } catch (error) {
            console.error('Error reducing quantity:', error);
            setAlert({
                type: 'error',
                message: error.response?.data?.message || 'Failed to reduce quantity'
            });
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <Typography variant="h4" gutterBottom>
                Item Quantity Manager
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Current Quantity</TableCell>
                            <TableCell>Reduce Quantity</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow 
                                key={item.id}
                                style={{ 
                                    backgroundColor: item.quantity < 5 ? '#fff3e0' : 'inherit'
                                }}
                            >
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>
                                    {item.quantity}
                                    {item.quantity < 5 && (
                                        <Typography 
                                            color="error" 
                                            variant="caption" 
                                            display="block"
                                        >
                                            Low Stock!
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={quantityInputs[item.id] || ''}
                                        onChange={(e) => setQuantityInputs(prev => ({
                                            ...prev,
                                            [item.id]: e.target.value
                                        }))}
                                        inputProps={{ min: 1 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleReduceQuantity(item.id)}
                                        disabled={!quantityInputs[item.id]}
                                    >
                                        Reduce
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={!!alert}
                autoHideDuration={6000}
                onClose={() => setAlert(null)}
            >
                <Alert 
                    onClose={() => setAlert(null)} 
                    severity={alert?.type || 'info'} 
                    sx={{ width: '100%' }}
                >
                    {alert?.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ItemQuantityManager;
