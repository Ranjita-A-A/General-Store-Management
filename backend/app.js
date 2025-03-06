const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const itemRoutes = require('./routes/itemRoutes');
const billRoutes = require('./routes/billRoutes');
const loanRoutes = require('./routes/loanRoutes');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');

// Import middleware
const { authenticateToken } = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    console.log('======================\n');
    next();
});

// Routes
app.get('/api/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is running!' });
});

app.use('/api/items', itemRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
console.log('Starting server on port:', PORT);

const server = app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('Error starting server:', err);
        return;
    }
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- /api/items/*');
    console.log('- /api/bills/*');
    console.log('- /api/loans/*');
    console.log('- /api/analytics/*');
    console.log('- /api/auth/*');
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try these steps:`);
        console.error('1. Kill any existing node processes');
        console.error('2. Wait a few seconds');
        console.error('3. Try starting the server again');
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});