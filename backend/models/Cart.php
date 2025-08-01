<?php
require_once __DIR__ . '/../config/database.php';

class Cart {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function addItem($userId, $productId, $quantity = 1) {
        // Check if item already exists in cart
        $existing = $this->getItem($userId, $productId);
        
        if ($existing) {
            // Update quantity
            $sql = "UPDATE cart SET quantity = quantity + :quantity WHERE user_id = :user_id AND product_id = :product_id";
        } else {
            // Insert new item
            $sql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (:user_id, :product_id, :quantity)";
        }
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId,
            ':quantity' => $quantity
        ]);
    }
    
    public function getItem($userId, $productId) {
        $sql = "SELECT * FROM cart WHERE user_id = :user_id AND product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId
        ]);
        return $stmt->fetch();
    }
    
    public function getCartItems($userId) {
        $sql = "SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity,
                       (c.quantity * p.price) as subtotal
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = :user_id AND p.is_active = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }
    
    public function updateQuantity($userId, $productId, $quantity) {
        if ($quantity <= 0) {
            return $this->removeItem($userId, $productId);
        }
        
        $sql = "UPDATE cart SET quantity = :quantity WHERE user_id = :user_id AND product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId,
            ':quantity' => $quantity
        ]);
    }
    
    public function removeItem($userId, $productId) {
        $sql = "DELETE FROM cart WHERE user_id = :user_id AND product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':product_id' => $productId
        ]);
    }
    
    public function clearCart($userId) {
        $sql = "DELETE FROM cart WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':user_id' => $userId]);
    }
    
    public function getCartTotal($userId) {
        $sql = "SELECT SUM(c.quantity * p.price) as total
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = :user_id AND p.is_active = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $result = $stmt->fetch();
        return $result['total'] ?? 0;
    }
    
    public function getCartCount($userId) {
        $sql = "SELECT SUM(quantity) as count FROM cart WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $result = $stmt->fetch();
        return $result['count'] ?? 0;
    }
    
    public function getUserBalance($userId) {
        try {
            error_log("=== DYNAMIC BALANCE FETCH ===");
            error_log("Fetching fresh balance for user ID: " . $userId);
            
            // Ensure userId is an integer
            $userId = intval($userId);
            
            if ($userId <= 0) {
                error_log("Invalid user ID: " . $userId);
                return 0.0;
            }
            
            // Force fresh data by clearing any potential cache
            $sql = "SELECT balance FROM users WHERE id = :user_id LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Fresh balance query result: " . print_r($result, true));
            
            if ($result && isset($result['balance'])) {
                $balance = floatval($result['balance']);
                error_log("Dynamic balance fetched: " . $balance);
                return $balance;
            } else {
                error_log("No balance found for user");
                return 0.0;
            }
            
        } catch (Exception $e) {
            error_log("Error fetching dynamic balance: " . $e->getMessage());
            return 0.0;
        }
    }
    
    // Method to get complete cart data with fresh balance
    public function getCartWithBalance($userId) {
        $cartItems = $this->getCartItems($userId);
        $cartTotal = $this->getCartTotal($userId);
        $cartCount = $this->getCartCount($userId);
        $userBalance = $this->getUserBalance($userId); // Always fetch fresh
        
        return [
            'items' => $cartItems,
            'total' => floatval($cartTotal),
            'count' => intval($cartCount),
            'balance' => floatval($userBalance),
            'timestamp' => time()
        ];
    }
}
?>
