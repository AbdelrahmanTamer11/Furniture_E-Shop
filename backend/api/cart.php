<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/Cart.php';
require_once __DIR__ . '/../config/config.php';

// Get request method and data
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Get user from JWT token
function getUserFromToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        // Simple token validation - in production use proper JWT
        $userData = base64_decode($token);
        $user = json_decode($userData, true);
        return $user['id'] ?? null;
    }
    
    return null;
}

try {
    $userId = getUserFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    $cart = new Cart();

    if ($method === 'POST') {
        $action = $input['action'] ?? '';
        
        if ($action === 'add') {
            $productId = $input['product_id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;
            
            error_log("Adding to cart - User: $userId, Product: $productId, Quantity: $quantity");
            
            $success = $cart->addItem($userId, $productId, $quantity);
            
            if ($success) {
                $cartItems = $cart->getCartItems($userId);
                $cartTotal = $cart->getCartTotal($userId);
                $cartCount = $cart->getCartCount($userId);
                
                $response = [
                    'success' => true,
                    'message' => 'Item added to cart successfully',
                    'items' => $cartItems,
                    'total' => $cartTotal,
                    'count' => $cartCount
                ];
                
                http_response_code(200);
                echo json_encode($response);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add item to cart']);
            }
            exit;
        }
    }
    
    if ($method === 'GET') {
        $cartItems = $cart->getCartItems($userId);
        $cartTotal = $cart->getCartTotal($userId);
        $cartCount = $cart->getCartCount($userId);
        
        $response = [
            'success' => true,
            'items' => $cartItems,
            'total' => $cartTotal,
            'count' => $cartCount
        ];
        
        http_response_code(200);
        echo json_encode($response);
        exit;
    }
    
    if ($method === 'PUT') {
        $action = $input['action'] ?? '';
        
        if ($action === 'update') {
            $productId = $input['product_id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;
            
            $success = $cart->updateQuantity($userId, $productId, $quantity);
            
            if ($success) {
                $cartItems = $cart->getCartItems($userId);
                $cartTotal = $cart->getCartTotal($userId);
                $cartCount = $cart->getCartCount($userId);
                
                $response = [
                    'success' => true,
                    'items' => $cartItems,
                    'total' => $cartTotal,
                    'count' => $cartCount
                ];
                
                http_response_code(200);
                echo json_encode($response);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update cart']);
            }
            exit;
        }
    }
    
    if ($method === 'DELETE') {
        $productId = $_GET['product_id'] ?? 0;
        
        if ($productId) {
            $success = $cart->removeItem($userId, $productId);
            
            if ($success) {
                $response = ['success' => true, 'message' => 'Item removed from cart'];
                http_response_code(200);
                echo json_encode($response);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to remove item']);
            }
            exit;
        }
    }
    
    // If we get here, the action wasn't recognized
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action or method']);
    
} catch (Exception $e) {
    error_log("Cart API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
