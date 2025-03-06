const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, isOwner } = require('../middleware/authMiddleware');

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Get user from database
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, name, role FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        // Get user from database
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password'
        });
    }
});

// Create new user (owner only)
router.post('/create-user', authenticateToken, isOwner, async (req, res) => {
    const { username, password, name, role } = req.body;

    try {
        // Check if username already exists
        const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await db.query(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, name, role]
        );

        res.json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating user'
        });
    }
});

module.exports = router;
