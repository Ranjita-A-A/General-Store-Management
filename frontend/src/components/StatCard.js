import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Avatar
} from '@mui/material';
import {
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const StatCard = ({ title, value = 0, subValue, icon, color, isCurrency = false }) => {
    const theme = useTheme();

    const formatValue = (val) => {
        if (typeof val !== 'number') {
            val = Number(val) || 0;
        }
        
        if (isCurrency) {
            return val.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            });
        }
        
        return val.toLocaleString('en-IN');
    };
    
    return (
        <Card elevation={3} sx={{ height: '100%', background: `linear-gradient(45deg, ${color}22 30%, ${theme.palette.background.paper} 90%)` }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {formatValue(value)}
                        </Typography>
                        {subValue !== undefined && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {subValue > 0 ? (
                                    <ArrowUpwardIcon style={{ color: theme.palette.success.main }} />
                                ) : subValue < 0 ? (
                                    <ArrowDownwardIcon style={{ color: theme.palette.error.main }} />
                                ) : null}
                                {subValue !== 0 && (
                                    <Typography
                                        variant="body2"
                                        color={subValue > 0 ? "success" : subValue < 0 ? "error" : "textSecondary"}
                                    >
                                        {Math.abs(subValue)}%
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            backgroundColor: color,
                            width: 48,
                            height: 48
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatCard;
