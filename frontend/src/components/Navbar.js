import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    useTheme as useMuiTheme,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    ShowChart as ShowChartIcon,
    LightMode as LightModeIcon,
    DarkMode as DarkModeIcon,
    AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useTheme } from '../theme/ThemeContext';
import { alpha } from '@mui/material/styles';

const drawerWidth = 240;

const Navbar = () => {
    const muiTheme = useMuiTheme();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
        { text: 'Profit Report', icon: <ShowChartIcon />, path: '/profit-report' },
        { text: 'Loan Management', icon: <AccountBalanceIcon />, path: '/loans' }
    ];

    const drawer = (
        <Box>
            <Toolbar />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        selected={location.pathname === item.path}
                        sx={{
                            mx: 1,
                            my: 0.5,
                            borderRadius: 1,
                            '&.Mui-selected': {
                                bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                                '&:hover': {
                                    bgcolor: alpha(muiTheme.palette.primary.main, 0.2),
                                },
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                color: location.pathname === item.path
                                    ? 'primary.main'
                                    : 'inherit'
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            sx={{
                                color: location.pathname === item.path
                                    ? 'primary.main'
                                    : 'inherit'
                            }}
                        />
                    </ListItem>
                ))}
                <ListItem sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isDarkMode}
                                onChange={toggleTheme}
                                icon={<LightModeIcon />}
                                checkedIcon={<DarkModeIcon />}
                            />
                        }
                        label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        General Store Management
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
        </>
    );
};

export default Navbar;
