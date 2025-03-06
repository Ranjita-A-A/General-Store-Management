import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Box,
    Autocomplete,
    Alert,
    Snackbar,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../config/api';

const initialItemState = {
    name: '',
    description: '',
    category: '',
    quantity: '',
    cost_price: '',
    selling_price: ''
};

const InventoryManagement = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newItem, setNewItem] = useState(initialItemState);

    // Fetch items from the API
    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/items');
            setItems(response.data);
        } catch (err) {
            console.error('Error fetching items:', err);
            setError('Failed to fetch items');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/api/items/categories');
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        fetchCategories();
    }, [fetchItems, fetchCategories]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleCategoryChange = useCallback((event, newValue) => {
        setNewItem(prev => ({
            ...prev,
            category: newValue || ''
        }));
    }, []);

    const validateItem = useCallback((item) => {
        if (!item.name?.trim()) {
            setError('Item name is required');
            return false;
        }
        if (!item.category?.trim()) {
            setError('Category is required');
            return false;
        }
        if (!item.quantity) {
            setError('Quantity is required');
            return false;
        }
        if (!item.cost_price) {
            setError('Cost price is required');
            return false;
        }
        if (!item.selling_price) {
            setError('Selling price is required');
            return false;
        }
        if (parseFloat(item.selling_price) <= parseFloat(item.cost_price)) {
            setError('Selling price must be greater than cost price');
            return false;
        }
        if (parseInt(item.quantity) < 0) {
            setError('Quantity cannot be negative');
            return false;
        }
        return true;
    }, []);

    const resetForm = useCallback(() => {
        setNewItem(initialItemState);
        setOpenDialog(false);
    }, []);

    const handleAddItem = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/items', {
                name: newItem.name.trim(),
                description: newItem.description.trim(),
                category: newItem.category.trim(),
                quantity: parseInt(newItem.quantity),
                cost_price: parseFloat(newItem.cost_price),
                selling_price: parseFloat(newItem.selling_price)
            });

            // Add the new item to the items list
            setItems(prevItems => [...prevItems, response.data.item]);
            
            // Reset form
            setNewItem({
                name: '',
                description: '',
                category: '',
                quantity: '',
                cost_price: '',
                selling_price: ''
            });
            
            // Show success message
            setSuccess('Item added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error adding item:', err);
            setError(err.response?.data?.message || 'Error adding item. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [newItem]);

    const handleUpdateItem = useCallback(async () => {
        if (!editingItem || !validateItem(editingItem)) return;

        try {
            await api.put(`/api/items/${editingItem.id}`, editingItem);
            setSuccess('Item updated successfully');
            setEditingItem(null);
            fetchItems(); // Refresh the list
        } catch (err) {
            console.error('Error updating item:', err);
            setError('Failed to update item');
        }
    }, [editingItem, fetchItems, validateItem]);

    const handleDeleteItem = useCallback(async (id) => {
        try {
            await api.delete(`/api/items/${id}`);
            setSuccess('Item deleted successfully');
            fetchItems(); // Refresh the list
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item');
        }
    }, [fetchItems]);

    const handleCloseDialog = useCallback(() => {
        resetForm();
    }, [resetForm]);

    const AddItemDialog = useMemo(() => (
        <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog}
            maxWidth="md" 
            fullWidth
            keepMounted={false}
        >
            <DialogTitle>Add New Item</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            name="name"
                            label="Item Name"
                            value={newItem.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            freeSolo
                            options={categories}
                            value={newItem.category}
                            onChange={handleCategoryChange}
                            onInputChange={(event, newValue) => {
                                setNewItem(prev => ({
                                    ...prev,
                                    category: newValue || ''
                                }));
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Category"
                                    name="category"
                                    required
                                    helperText="Select existing or type new category"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="description"
                            label="Description"
                            value={newItem.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="quantity"
                            label="Quantity"
                            type="number"
                            value={newItem.quantity}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="cost_price"
                            label="Cost Price"
                            type="number"
                            value={newItem.cost_price}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: "0.01" }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="selling_price"
                            label="Selling Price"
                            type="number"
                            value={newItem.selling_price}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: "0.01" }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleAddItem} variant="contained" color="primary">
                    Add Item
                </Button>
            </DialogActions>
        </Dialog>
    ), [openDialog, newItem, categories, handleInputChange, handleCategoryChange, handleAddItem, handleCloseDialog]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Inventory Management
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Add New Item
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Cost Price</TableCell>
                            <TableCell align="right">Selling Price</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {editingItem?.id === item.id ? (
                                        <TextField
                                            value={editingItem.name}
                                            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                            size="small"
                                        />
                                    ) : (
                                        item.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingItem?.id === item.id ? (
                                        <TextField
                                            value={editingItem.description || ''}
                                            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                            size="small"
                                            multiline
                                        />
                                    ) : (
                                        item.description || '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingItem?.id === item.id ? (
                                        <Autocomplete
                                            freeSolo
                                            options={categories}
                                            value={editingItem.category}
                                            onChange={(event, newValue) => 
                                                setEditingItem({...editingItem, category: newValue || ''})
                                            }
                                            renderInput={(params) => (
                                                <TextField {...params} size="small" />
                                            )}
                                            size="small"
                                        />
                                    ) : (
                                        item.category
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {editingItem?.id === item.id ? (
                                        <TextField
                                            type="number"
                                            value={editingItem.quantity}
                                            onChange={(e) => setEditingItem({...editingItem, quantity: e.target.value})}
                                            size="small"
                                            inputProps={{ min: 0 }}
                                        />
                                    ) : (
                                        item.quantity
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {editingItem?.id === item.id ? (
                                        <TextField
                                            type="number"
                                            value={editingItem.cost_price}
                                            onChange={(e) => setEditingItem({...editingItem, cost_price: e.target.value})}
                                            size="small"
                                            inputProps={{ min: 0, step: "0.01" }}
                                        />
                                    ) : (
                                        `₹${parseFloat(item.cost_price).toFixed(2)}`
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {editingItem?.id === item.id ? (
                                        <TextField
                                            type="number"
                                            value={editingItem.selling_price}
                                            onChange={(e) => setEditingItem({...editingItem, selling_price: e.target.value})}
                                            size="small"
                                            inputProps={{ min: 0, step: "0.01" }}
                                        />
                                    ) : (
                                        `₹${parseFloat(item.selling_price).toFixed(2)}`
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    {editingItem?.id === item.id ? (
                                        <>
                                            <Tooltip title="Save">
                                                <IconButton 
                                                    onClick={handleUpdateItem}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <SaveIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Cancel">
                                                <IconButton
                                                    onClick={() => setEditingItem(null)}
                                                    color="default"
                                                    size="small"
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    ) : (
                                        <>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    onClick={() => setEditingItem(item)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {AddItemDialog}

            <Snackbar
                open={!!error || !!success}
                autoHideDuration={6000}
                onClose={() => {
                    setError('');
                    setSuccess('');
                }}
            >
                <Alert 
                    severity={error ? "error" : "success"} 
                    variant="filled"
                    onClose={() => {
                        setError('');
                        setSuccess('');
                    }}
                >
                    {error || success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default InventoryManagement;
