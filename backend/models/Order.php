<?php
require_once __DIR__ . '/../config/database.php';

class Order {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function createOrder($userId, $orderData) {
        try {
            $this->db->beginTransaction();
            
            // Calculate totals
            $subtotal = floatval($orderData['subtotal']);
            $shipping = floatval($orderData['shipping']);
            $tax = floatval($orderData['tax']);
            $total = $subtotal + $shipping + $tax;
            
            // Check user balance
            $userBalance = $this->getUserBalance($userId);
            if ($userBalance < $total) {
                throw new Exception('Insufficient balance');
            }
            
            // Check stock availability and reserve products
            foreach ($orderData['items'] as $item) {
                $productId = $item['product_id'];
                $quantity = intval($item['quantity']);
                
                // Get current stock
                $sql = "SELECT stock_quantity FROM products WHERE id = :product_id FOR UPDATE";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([':product_id' => $productId]);
                $product = $stmt->fetch();
                
                if (!$product) {
                    throw new Exception("Product ID $productId not found");
                }
                
                $currentStock = intval($product['stock_quantity']);
                if ($currentStock < $quantity) {
                    throw new Exception("Insufficient stock for product ID $productId. Available: $currentStock, Requested: $quantity");
                }
                
                // Update stock quantity
                $sql = "UPDATE products SET stock_quantity = stock_quantity - :quantity WHERE id = :product_id";
                $stmt = $this->db->prepare($sql);
                $updateSuccess = $stmt->execute([
                    ':quantity' => $quantity,
                    ':product_id' => $productId
                ]);
                
                if (!$updateSuccess) {
                    throw new Exception("Failed to update stock for product ID $productId");
                }
                
                error_log("Stock updated for product $productId: reduced by $quantity");
            }
            
            // Create order
            $sql = "INSERT INTO orders (
                user_id, order_number, subtotal, shipping_cost, tax_amount, total_amount, 
                status, shipping_address, billing_address, payment_method, created_at
            ) VALUES (
                :user_id, :order_number, :subtotal, :shipping, :tax, :total,
                'pending', :shipping_address, :billing_address, :payment_method, NOW()
            )";
            
            $orderNumber = 'ORD-' . time() . '-' . $userId;
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':user_id' => $userId,
                ':order_number' => $orderNumber,
                ':subtotal' => $subtotal,
                ':shipping' => $shipping,
                ':tax' => $tax,
                ':total' => $total,
                ':shipping_address' => json_encode($orderData['shipping_address']),
                ':billing_address' => json_encode($orderData['billing_address']),
                ':payment_method' => $orderData['payment_method']
            ]);
            
            $orderId = $this->db->lastInsertId();
            
            // Add order items
            foreach ($orderData['items'] as $item) {
                $sql = "INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) 
                        VALUES (:order_id, :product_id, :quantity, :price, :subtotal)";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':order_id' => $orderId,
                    ':product_id' => $item['product_id'],
                    ':quantity' => $item['quantity'],
                    ':price' => $item['price'],
                    ':subtotal' => $item['subtotal']
                ]);
            }
            
            // Deduct amount from user balance
            $sql = "UPDATE users SET balance = balance - :amount WHERE id = :user_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':amount' => $total,
                ':user_id' => $userId
            ]);
            
            // Clear user's cart
            $sql = "DELETE FROM cart WHERE user_id = :user_id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            
            $this->db->commit();
            
            error_log("Order created successfully: $orderNumber");
            
            return [
                'success' => true,
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'total' => $total,
                'new_balance' => $userBalance - $total
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Order creation error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getUserBalance($userId) {
        $sql = "SELECT balance FROM users WHERE id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $result = $stmt->fetch();
        return $result ? floatval($result['balance']) : 0.0;
    }
    
    public function getUserOrders($userId, $limit = 10) {
        $sql = "SELECT o.*, 
                       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
                FROM orders o 
                WHERE o.user_id = :user_id 
                ORDER BY o.created_at DESC 
                LIMIT :limit";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':limit' => $limit
        ]);
        return $stmt->fetchAll();
    }
    
    public function getOrderDetails($orderId, $userId) {
        // Get order info
        $sql = "SELECT * FROM orders WHERE id = :order_id AND user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':order_id' => $orderId, ':user_id' => $userId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            return null;
        }
        
        // Get order items
        $sql = "SELECT oi.*, p.name, p.image_url 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = :order_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':order_id' => $orderId]);
        $items = $stmt->fetchAll();
        
        $order['items'] = $items;
        return $order;
    }
}
?>
