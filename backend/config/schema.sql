-- Drop existing tables if they exist
DROP TABLE IF EXISTS loan_payments;
DROP TABLE IF EXISTS bill_items;
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS items;

-- Create items table
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create bills table
CREATE TABLE bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed',
    profit DECIMAL(10, 2) DEFAULT 0.00
);

-- Create bill_items table
CREATE TABLE bill_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Create loans table
CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    loan_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    remaining_amount DECIMAL(10, 2) NOT NULL,
    loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create loan_payments table
CREATE TABLE loan_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Create inventory_logs table
CREATE TABLE inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    type ENUM('purchase', 'sale', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB;

-- Insert sample data
INSERT INTO items (name, category, quantity, cost_price, selling_price) VALUES
('Rice', 'Groceries', 100, 50.00, 60.00),
('Wheat Flour', 'Groceries', 80, 40.00, 48.00),
('Soap', 'Toiletries', 150, 20.00, 25.00),
('Toothpaste', 'Toiletries', 100, 45.00, 55.00),
('Milk', 'Dairy', 50, 25.00, 30.00),
('Bread', 'Bakery', 30, 35.00, 40.00),
('Eggs', 'Dairy', 200, 5.00, 6.00),
('Sugar', 'Groceries', 120, 38.00, 45.00),
('Salt', 'Groceries', 150, 15.00, 20.00),
('Cooking Oil', 'Groceries', 80, 110.00, 125.00);

-- Insert sample loans
INSERT INTO loans (customer_name, customer_phone, loan_amount, remaining_amount, loan_date, due_date, status) VALUES
('John Doe', '1234567890', 1000.00, 1000.00, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), 'pending'),
('Jane Smith', '9876543210', 2000.00, 2000.00, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 'pending'),
('Mike Johnson', '5555555555', 1500.00, 1500.00, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), 'pending');
