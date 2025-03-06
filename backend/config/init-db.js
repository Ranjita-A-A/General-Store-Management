const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initializeDatabase() {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('Database created or already exists');

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Read and execute schema.sql
        const schemaSQL = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        
        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed SQL statement');
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the initialization
initializeDatabase();
