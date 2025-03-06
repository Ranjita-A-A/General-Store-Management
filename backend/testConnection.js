// testConnection.js
const pool = require('./config/db');

async function testConnection() {
    try {
        const [results] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful!');
        console.log('Test query result:', results[0].solution);
    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

testConnection();