import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Divider,
    useTheme,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    LocalAtm as LocalAtmIcon,
    Receipt as ReceiptIcon,
    LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../config/api';

const ProfitReport = () => {
    const [profitData, setProfitData] = useState({
        items: [],
        totals: {
            total_sold: 0,
            total_revenue: '0.00',
            total_cost: '0.00',
            total_profit: '0.00',
            profit_margin: '0.00'
        }
    });
    const [error, setError] = useState('');
    const theme = useTheme();

    const fetchProfitReport = async () => {
        try {
            console.log('Fetching profit report...');
            const response = await api.get('/api/items/profit-report');
            console.log('Profit report response:', response.data);
            setProfitData(response.data);
        } catch (error) {
            console.error('Error fetching profit report:', error);
            setError('Failed to fetch profit report: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        fetchProfitReport();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Icon sx={{ color, mr: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4" color={color}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Profit"
                        value={`₹${profitData.totals.total_profit}`}
                        icon={TrendingUpIcon}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Revenue"
                        value={`₹${profitData.totals.total_revenue}`}
                        icon={LocalAtmIcon}
                        color="primary.main"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Total Cost"
                        value={`₹${profitData.totals.total_cost}`}
                        icon={ReceiptIcon}
                        color="error.main"
                    />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <StatCard
                        title="Profit Margin"
                        value={`${profitData.totals.profit_margin}%`}
                        icon={LocalOfferIcon}
                        color="warning.main"
                    />
                </Grid>
            </Grid>

            <Paper sx={{ mt: 4, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Item-wise Profit Analysis
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Item Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell align="right">Cost Price</TableCell>
                                <TableCell align="right">Selling Price</TableCell>
                                <TableCell align="right">Units Sold</TableCell>
                                <TableCell align="right">Revenue</TableCell>
                                <TableCell align="right">Cost</TableCell>
                                <TableCell align="right">Profit</TableCell>
                                <TableCell align="right">Margin (%)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {profitData.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell align="right">₹{item.cost_price}</TableCell>
                                    <TableCell align="right">₹{item.selling_price}</TableCell>
                                    <TableCell align="right">{item.total_sold}</TableCell>
                                    <TableCell align="right">₹{item.total_revenue}</TableCell>
                                    <TableCell align="right">₹{item.total_cost}</TableCell>
                                    <TableCell align="right">₹{item.total_profit}</TableCell>
                                    <TableCell align="right">{item.profit_margin}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default ProfitReport;
