-- Drop existing tables if they exist
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS items;

-- Create items table with composite primary key
CREATE TABLE items (
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, item_name)
);

-- Create bills table
CREATE TABLE bills (
    id INT AUTO_INCREMENT,
    bill_id VARCHAR(20) NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi') DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_bill_id (bill_id),
    FOREIGN KEY (item_id, item_name) REFERENCES items(item_id, item_name)
);

-- Create loans table
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_no VARCHAR(20) NOT NULL,
    loan_amount DECIMAL(10, 2) NOT NULL,
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
