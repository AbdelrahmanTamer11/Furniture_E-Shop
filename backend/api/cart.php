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
    // Try multiple header formats
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $authHeader = $headers['authorization'] ?? '';
    
    error_log("Auth header received: " . $authHeader);
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        error_log("Extracted token: " . $token);
        
        // Simple token validation - decode the base64 token
        $userData = base64_decode($token);
        error_log("Decoded token data: " . $userData);
        
        $user = json_decode($userData, true);
        error_log("Parsed user data: " . print_r($user, true));
        
        if ($user && isset($user['id'])) {
            error_log("Returning user ID: " . $user['id']);
            return intval($user['id']);
        }
    }
    
    error_log("No valid user ID found in token");
    return null;
}

// Test database connection and user existence
function testUserExists($userId) {
    try {
        $db = Database::getInstance()->getConnection();
        $sql = "SELECT id, username, email, balance FROM users WHERE id = :user_id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("User test query result: " . print_r($result, true));
        return $result;
    } catch (Exception $e) {
        error_log("Error testing user existence: " . $e->getMessage());
        return false;
    }
}

try {
    $userId = getUserFromToken();
    
    error_log("=== CART API REQUEST ===");
    error_log("Method: " . $method);
    error_log("Extracted User ID: " . ($userId ?: 'NULL'));
    
    if (!$userId) {
        error_log("Authentication failed - no valid user ID");
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required', 'debug' => 'No valid user ID in token']);
        exit;
    }
    
    // Test if user exists in database
    $userTest = testUserExists($userId);
    if (!$userTest) {
        error_log("User ID $userId not found in database");
        http_response_code(401);
        echo json_encode(['error' => 'User not found', 'debug' => "User ID $userId not found"]);
        exit;
    }
    
    error_log("User found in database: " . print_r($userTest, true));

    $cart = new Cart();

    if ($method === 'GET') {
        error_log("Cart GET - Fetching dynamic cart for user: $userId");
        
        // Use the new method that fetches fresh balance
        $cartData = $cart->getCartWithBalance($userId);
        
        // CRITICAL FIX: Force fresh balance fetch
        $freshBalance = $cart->getUserBalance($userId);
        $cartData['balance'] = $freshBalance;
        
        error_log("Cart GET - Fresh balance fetched: $freshBalance");
        error_log("Cart GET - Dynamic data: " . json_encode($cartData));
        
        $response = array_merge(['success' => true], $cartData);
        
        http_response_code(200);
        echo json_encode($response);
        exit;
    }
    
    if ($method === 'POST') {
        $action = $input['action'] ?? '';
        
        if ($action === 'add') {
            $productId = $input['product_id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;
            
            error_log("Adding to cart - User: $userId, Product: $productId, Quantity: $quantity");
            
            $success = $cart->addItem($userId, $productId, $quantity);
            
            if ($success) {
                // Get fresh cart data with updated balance
                $cartData = $cart->getCartWithBalance($userId);
                
                $response = array_merge([
                    'success' => true,
                    'message' => 'Item added to cart successfully'
                ], $cartData);
                
                error_log("Cart POST - Fresh data: " . json_encode($response));
                
                http_response_code(200);
                echo json_encode($response);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to add item to cart']);
            }
            exit;
        }
    }
    
    if ($method === 'PUT') {
        $action = $_GET['action'] ?? $input['action'] ?? '';
        
        if ($action === 'update') {
            $productId = $input['product_id'] ?? 0;
            $quantity = $input['quantity'] ?? 1;
            
            $success = $cart->updateQuantity($userId, $productId, $quantity);
            
            if ($success) {
                // Get fresh cart data with updated balance
                $cartData = $cart->getCartWithBalance($userId);
                
                $response = array_merge(['success' => true], $cartData);
                
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
                $cartItems = $cart->getCartItems($userId);
                $cartTotal = $cart->getCartTotal($userId);
                $cartCount = $cart->getCartCount($userId);
                $userBalance = $cart->getUserBalance($userId);
                
                error_log("Cart DELETE - Fetched balance: $userBalance for user: $userId");
                
                $response = [
                    'success' => true, 
                    'message' => 'Item removed from cart',
                    'items' => $cartItems,
                    'total' => floatval($cartTotal),
                    'count' => intval($cartCount),
                    'balance' => floatval($userBalance)
                ];
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
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
                $cartTotal = $cart->getCartTotal($userId);
                $cartCount = $cart->getCartCount($userId);
                $userBalance = $cart->getUserBalance($userId);
                
                error_log("Cart DELETE - Fetched balance: $userBalance for user: $userId");
                
                $response = [
                    'success' => true, 
                    'message' => 'Item removed from cart',
                    'items' => $cartItems,
                    'total' => floatval($cartTotal),
                    'count' => intval($cartCount),
                    'balance' => floatval($userBalance)
                ];
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
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
