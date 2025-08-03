-- Active: 1730742563437@@127.0.0.1@3306@furniture_eshop
-- Furniture E-Shop Database Schema
-- Created for AI-Enhanced E-commerce Platform

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    balance DECIMAL(10, 2) DEFAULT 5000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    style VARCHAR(50), -- Modern, Classic, Scandinavian, etc.
    color VARCHAR(50),
    material VARCHAR(100),
    dimensions VARCHAR(100), -- e.g., "120x80x75 cm"
    weight DECIMAL(8, 2),
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(255),
    gallery_images JSON, -- Array of additional image URLs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_style (style),
    INDEX idx_price (price)
);

-- Shopping cart table
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address JSON NOT NULL,
    billing_address JSON,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) AS (quantity * price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- User sessions table for login management
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI room analysis table
CREATE TABLE room_analysis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_image_path VARCHAR(255) NOT NULL,
    room_type VARCHAR(50),
    style_preference VARCHAR(50),
    ai_response JSON,
    suggested_products JSON,
    total_estimated_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Living Room', 'Furniture for living spaces including sofas, coffee tables, and entertainment units'),
('Bedroom', 'Bedroom furniture including beds, wardrobes, and nightstands'),
('Dining Room', 'Dining tables, chairs, and dining room storage'),
('Office', 'Home office furniture including desks and office chairs'),
('Storage', 'Storage solutions and organizational furniture'),
('Outdoor', 'Outdoor and patio furniture');

-- Insert sample products
INSERT INTO products (name, description, price, category_id, style, color, material, dimensions, stock_quantity, image_url) VALUES
('Modern Sectional Sofa', 'Comfortable L-shaped sectional sofa perfect for modern living rooms', 899.99, 1, 'Modern', 'Light Gray', 'Fabric', '250x180x85 cm', 15, '/images/products/modern-sectional-sofa.jpg'),
('Scandinavian Coffee Table', 'Minimalist wooden coffee table with clean lines', 299.99, 1, 'Scandinavian', 'Natural Wood', 'Oak', '120x60x45 cm', 25, '/images/products/scandinavian-coffee-table.jpg'),
('Classic Dining Set', '6-person dining table with matching chairs', 1299.99, 3, 'Classic', 'Dark Brown', 'Mahogany', '180x90x75 cm', 8, '/images/products/classic-dining-set.jpg'),
('Platform Bed Frame', 'Modern platform bed with built-in nightstands', 649.99, 2, 'Modern', 'White', 'MDF', '200x160x35 cm', 12, '/images/products/platform-bed-frame.jpg'),
('Ergonomic Office Chair', 'High-back ergonomic chair with lumbar support', 399.99, 4, 'Modern', 'Black', 'Mesh/Plastic', '70x70x120 cm', 30, '/images/products/ergonomic-office-chair.jpg'),
('Industrial Bookshelf', 'Multi-tier bookshelf with industrial design', 199.99, 5, 'Industrial', 'Black/Wood', 'Metal/Wood', '80x30x180 cm', 20, '/images/products/industrial-bookshelf.jpg'),
('Minimalist Desk', 'Clean modern desk perfect for home office', 459.99, 4, 'Minimalist', 'White', 'Wood/Metal', '140x70x75 cm', 18, '/images/products/minimalist-desk.jpg'),
('Leather Armchair', 'Comfortable leather armchair for reading corner', 549.99, 1, 'Classic', 'Brown', 'Leather', '90x85x95 cm', 10, '/images/products/leather-armchair.jpg'),
('Storage Ottoman', 'Multi-functional storage ottoman with cushioned top', 129.99, 5, 'Modern', 'Beige', 'Fabric/Wood', '80x40x40 cm', 35, '/images/products/storage-ottoman.jpg'),
('Glass Dining Table', 'Modern glass-top dining table with metal legs', 699.99, 3, 'Modern', 'Clear/Silver', 'Glass/Metal', '150x90x75 cm', 12, '/images/products/glass-dining-table.jpg');

-- Insert sample users for testing
INSERT INTO users (username, email, password_hash, first_name, last_name, balance) VALUES
('john_doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 1500.00),
('jane_smith', 'jane@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 2000.00),
('admin_user', 'admin@furnivision.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 5000.00);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_style ON products(style);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);


