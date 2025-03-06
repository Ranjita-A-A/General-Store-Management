const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkAndCreateDatabase() {
    let connection;
    try {
        // First connect without database to check if it exists
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // Check if database exists
        const [rows] = await connection.execute(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${process.env.DB_NAME}'`
        );

        if (rows.length === 0) {
            console.log(`Database ${process.env.DB_NAME} does not exist. Creating it...`);
            await connection.execute(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('Database created successfully');

            // Use the new database
            await connection.execute(`USE ${process.env.DB_NAME}`);

            // Create tables
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS item_types (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    quantity INT NOT NULL DEFAULT 0,
                    threshold INT NOT NULL DEFAULT 5,
                    price DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS loans (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    return_date TIMESTAMP NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            await connection.execute(`
                CREATE TABLE IF NOT EXISTS loan_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    loan_id INT NOT NULL,
                    item_type_id INT NOT NULL,
                    quantity INT NOT NULL,
                    FOREIGN KEY (loan_id) REFERENCES loans(id),
                    FOREIGN KEY (item_type_id) REFERENCES item_types(id)
                )
            `);

            console.log('All tables created successfully');
        } else {
            console.log(`Database ${process.env.DB_NAME} already exists`);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAndCreateDatabase();
