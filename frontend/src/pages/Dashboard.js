import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Paper,
    Alert,
    Stack,
    LinearProgress,
    TextField,
    MenuItem,
    Fab,
    CircularProgress
} from '@mui/material';
import {
    MonetizationOn as MonetizationOnIcon,
    Inventory as InventoryIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Add as AddIcon,
    Notifications as NotificationsIcon,
    Refresh as RefreshIcon,
    ShoppingCart as ShoppingCartIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    AccountBalance as AccountBalanceIcon,
    Timer as TimerIcon,
    Info as InfoIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import api from '../config/api';
import axios from 'axios';
import StatCard from '../components/StatCard';
import AlertsSection from '../components/AlertsSection';
import GenerateBill from './GenerateBill';

const Dashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        sales: {
            today: { amount: 0 },
            growth: 0
        },
        inventory: {
            totalItems: 0,
            totalQuantity: 0,
            totalValue: 0,
            lowStockCount: 0
        }
    });
    const [topSelling, setTopSelling] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState('monthly');

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/analytics/dashboard');
            console.log('Dashboard data:', response.data);
            
            if (response.data) {
                setStats(response.data.stats);
                setAlerts(response.data.alerts || []);
                setTopSelling(response.data.topSelling || []);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to fetch dashboard data. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchTopSellingData = async (filter) => {
        try {
            const response = await api.get(`/api/analytics/top-selling?filter=${filter}`);
            if (response.data) {
                setTopSelling(response.data || []);
            }
        } catch (err) {
            console.error('Error fetching top selling data:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchTopSellingData(timeFilter);
    }, [timeFilter]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading dashboard data...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const GenerateBillDialog = () => (
        <Dialog open={billDialogOpen} onClose={() => setBillDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Generate New Bill</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Customer Name"
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Payment Method"
                        select
                        fullWidth
                        margin="normal"
                        defaultValue="cash"
                    >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setBillDialogOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={() => {
                    setBillDialogOpen(false);
                    navigate('/generate-bill');
                }}>
                    Proceed
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Stats Cards Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Sales"
                        value={stats.sales?.today?.amount || 0}
                        subValue={stats.sales?.growth || 0}
                        icon={<MonetizationOnIcon />}
                        color={theme.palette.primary.main}
                        isCurrency={true}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Items"
                        value={stats.inventory?.totalItems || 0}
                        icon={<InventoryIcon />}
                        color={theme.palette.success.main}
                        isCurrency={false}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Low Stock Items"
                        value={stats.inventory?.lowStockCount || 0}
                        icon={<WarningIcon />}
                        color={theme.palette.warning.main}
                        isCurrency={false}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Inventory Value"
                        value={stats.inventory?.totalValue || 0}
                        icon={<TrendingUpIcon />}
                        color={theme.palette.info.main}
                        isCurrency={true}
                    />
                </Grid>
            </Grid>

            {/* Generate Bill Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setBillDialogOpen(true)}
                >
                    Generate Bill
                </Button>
            </Box>

            {/* Alerts Section */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    Alerts & Notifications
                                </Typography>
                                <Tooltip title="Refresh Alerts">
                                    <IconButton onClick={fetchDashboardData} color="primary">
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <AlertsSection alerts={alerts} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Top Selling Items Section */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    Top Selling Items
                                </Typography>
                                <Box>
                                    <Button
                                        size="small"
                                        onClick={() => setTimeFilter('today')}
                                        variant={timeFilter === 'today' ? 'contained' : 'outlined'}
                                        sx={{ mr: 1 }}
                                    >
                                        Today
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => setTimeFilter('weekly')}
                                        variant={timeFilter === 'weekly' ? 'contained' : 'outlined'}
                                        sx={{ mr: 1 }}
                                    >
                                        Weekly
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => setTimeFilter('monthly')}
                                        variant={timeFilter === 'monthly' ? 'contained' : 'outlined'}
                                    >
                                        Monthly
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={topSelling} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={70}
                                            interval={0}
                                        />
                                        <YAxis
                                            label={{ 
                                                value: 'Units Sold', 
                                                angle: -90, 
                                                position: 'insideLeft',
                                                style: { textAnchor: 'middle' }
                                            }}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="soldCount" name="Units Sold" fill={theme.palette.primary.main} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Generate Bill Dialog */}
            <Dialog 
                open={billDialogOpen} 
                onClose={() => setBillDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Generate New Bill</DialogTitle>
                <DialogContent>
                    <GenerateBill onClose={() => setBillDialogOpen(false)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBillDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        setBillDialogOpen(false);
                        navigate('/generate-bill');
                    }}>
                        Proceed
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard;
