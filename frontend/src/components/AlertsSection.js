import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Warning as WarningIcon,
    Inventory as InventoryIcon,
    MonetizationOn as MonetizationOnIcon,
    AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

const AlertsSection = ({ alerts = [], loading = false, error = null }) => {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
    }

    const stockAlerts = alerts.filter(a => a?.category === 'stock') || [];
    const loanAlerts = alerts.filter(a => a?.category === 'loan') || [];
    const paymentAlerts = alerts.filter(a => a?.category === 'payment') || [];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStockWarningColor = (quantity) => {
        if (quantity === 0) return 'error.dark';
        if (quantity <= 2) return 'error.main';
        return 'warning.main';
    };

    const getStockWarningText = (quantity) => {
        if (quantity === 0) return 'Out of Stock!';
        if (quantity <= 2) return 'Critical Low Stock!';
        return 'Low Stock';
    };

    return (
        <Grid container spacing={2}>
            {stockAlerts.length > 0 && (
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <InventoryIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="h6">Low Stock Alerts</Typography>
                            </Box>
                            <List>
                                {stockAlerts.map((alert, index) => (
                                    <React.Fragment key={alert.id}>
                                        {index > 0 && <Divider component="li" />}
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: getStockWarningColor(parseInt(alert.details.match(/\d+/)[0])) }}>
                                                    <WarningIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={alert.message}
                                                secondary={alert.details}
                                            />
                                            <Chip
                                                label={getStockWarningText(parseInt(alert.details.match(/\d+/)[0]))}
                                                color={parseInt(alert.details.match(/\d+/)[0]) === 0 ? "error" : "warning"}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {loanAlerts.length > 0 && (
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AccountBalanceIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6">Overdue Loans</Typography>
                            </Box>
                            <List>
                                {loanAlerts.map((alert, index) => (
                                    <React.Fragment key={alert.id}>
                                        {index > 0 && <Divider component="li" />}
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'error.main' }}>
                                                    <MonetizationOnIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={alert.message}
                                                secondary={
                                                    <React.Fragment>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {alert.details}
                                                        </Typography>
                                                        <br />
                                                        <Typography component="span" variant="body2">
                                                            Due Date: {formatDate(alert.dueDate)}
                                                        </Typography>
                                                    </React.Fragment>
                                                }
                                            />
                                            <Chip
                                                label="Overdue"
                                                color="error"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {paymentAlerts.length > 0 && (
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MonetizationOnIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6">Payments Due Today</Typography>
                            </Box>
                            <List>
                                {paymentAlerts.map((alert, index) => (
                                    <React.Fragment key={alert.id}>
                                        {index > 0 && <Divider component="li" />}
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                                    <AccountBalanceIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                                        <Box display="flex" alignItems="center">
                                                            <Typography variant="body1" fontWeight="medium">
                                                                {alert.message}
                                                            </Typography>
                                                            <Chip 
                                                                label="Due Today"
                                                                size="small"
                                                                color="error"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Due: {new Date(alert.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2" color="error.main" fontWeight="medium">
                                                            {alert.details}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {stockAlerts.length === 0 && loanAlerts.length === 0 && paymentAlerts.length === 0 && (
                <Grid item xs={12}>
                    <Alert severity="success">No alerts at this time!</Alert>
                </Grid>
            )}
        </Grid>
    );
};

export default AlertsSection;
