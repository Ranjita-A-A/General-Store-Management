-- Drop existing tables if they exist
DROP TABLE IF EXISTS loan_payments;
DROP TABLE IF EXISTS loan_items;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS bill_items;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- Create users table for store owner/staff login
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('owner', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    credit_limit DECIMAL(10, 2) DEFAULT 5000.00,
    total_credit DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT unique_phone UNIQUE (phone)
);

-- Create items table for inventory
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    threshold INT NOT NULL DEFAULT 10,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_quantity (quantity)
);

-- Create bills table for direct sales
CREATE TABLE bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(20) NOT NULL,
    customer_id INT,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_method ENUM('cash', 'card', 'upi') DEFAULT 'cash',
    payment_status ENUM('paid', 'pending') DEFAULT 'paid',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT unique_bill_number UNIQUE (bill_number)
);

-- Create bill_items table for items in each bill
CREATE TABLE bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Create loans table for credit sales
CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_number VARCHAR(20) NOT NULL,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'paid', 'overdue') DEFAULT 'active',
    due_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT unique_loan_number UNIQUE (loan_number)
);

-- Create loan_items table for items in each loan
CREATE TABLE loan_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Create loan_payments table to track loan repayments
CREATE TABLE loan_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi') DEFAULT 'cash',
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    received_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2b$10$5QpxjTgZzOqWKxkqF3kxQePXk9xzJDKkHBvZHrN2aB0FX9yNnWmJi', 'Store Owner', 'owner');

-- Insert some sample categories as items
INSERT INTO items (name, category, quantity, threshold, cost_price, selling_price, description) VALUES
('Toor Dal', 'Pulses', 100, 20, 120.00, 140.00, '1kg premium quality'),
('Basmati Rice', 'Rice', 150, 30, 80.00, 95.00, '1kg premium quality'),
('Sugar', 'Groceries', 200, 50, 40.00, 45.00, '1kg'),
('Salt', 'Groceries', 300, 50, 20.00, 22.00, '1kg iodized'),
('Sunflower Oil', 'Oils', 80, 20, 180.00, 195.00, '1L refined'),
('Wheat Flour', 'Flour', 120, 30, 45.00, 50.00, '1kg'),
('Tea Powder', 'Beverages', 50, 15, 90.00, 100.00, '250g premium blend'),
('Soap', 'Personal Care', 100, 20, 25.00, 30.00, 'Bath soap 100g'),
('Toothpaste', 'Personal Care', 80, 20, 45.00, 50.00, '100g mint fresh'),
('Detergent', 'Cleaning', 70, 15, 55.00, 60.00, '500g powder');
