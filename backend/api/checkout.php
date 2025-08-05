<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/Cart.php';
require_once __DIR__ . '/../config/config.php';

// Get user from token
function getUserFromToken() {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $authHeader = $headers['authorization'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $userData = base64_decode($token);
        $user = json_decode($userData, true);
        
        if ($user && isset($user['id'])) {
            return intval($user['id']);
        }
    }
    
    return null;
}

try {
    error_log("=== CHECKOUT API START ===");
    error_log("Method: " . $_SERVER['REQUEST_METHOD']);
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
    
    $userId = getUserFromToken();
    error_log("User ID from token: " . ($userId ?: 'NULL'));
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Input data: " . json_encode($input));
    
    // Validate required fields
    $requiredFields = ['shipping_address', 'payment_method'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    // Get current cart items
    $cart = new Cart();
    $cartItems = $cart->getCartItems($userId);
    error_log("Cart items count: " . count($cartItems));
    
    if (empty($cartItems)) {
        http_response_code(400);
        echo json_encode(['error' => 'Cart is empty']);
        exit;
    }
    
    // Calculate totals
    $subtotal = 0;
    $orderItems = [];
    
    foreach ($cartItems as $item) {
        $itemSubtotal = floatval($item['price']) * intval($item['quantity']);
        $subtotal += $itemSubtotal;
        
        $orderItems[] = [
            'product_id' => $item['product_id'],
            'quantity' => $item['quantity'],
            'price' => $item['price'],
            'subtotal' => $itemSubtotal
        ];
    }
    
    $shipping = $subtotal > 100 ? 0 : 19.99;
    $tax = $subtotal * 0.08; // 8% tax
    $total = $subtotal + $shipping + $tax;
    
    error_log("Calculated totals - Subtotal: $subtotal, Shipping: $shipping, Tax: $tax, Total: $total");
    
    // Check user balance
    $userBalance = $cart->getUserBalance($userId);
    error_log("User balance: $userBalance");
    
    if ($userBalance < $total) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Insufficient balance',
            'required' => $total,
            'available' => $userBalance,
            'shortage' => $total - $userBalance
        ]);
        exit;
    }
    
    // Prepare order data
    $orderData = [
        'subtotal' => $subtotal,
        'shipping' => $shipping,
        'tax' => $tax,
        'items' => $orderItems,
        'shipping_address' => $input['shipping_address'],
        'billing_address' => $input['billing_address'] ?? $input['shipping_address'],
        'payment_method' => $input['payment_method']
    ];
    
    error_log("Order data prepared: " . json_encode($orderData));
    
    // Create order
    $order = new Order();
    $result = $order->createOrder($userId, $orderData);
    error_log("Order creation result: " . json_encode($result));
    
    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Order placed successfully',
            'order_number' => $result['order_number'],
            'order_id' => $result['order_id'],
            'total' => $result['total'],
            'new_balance' => $result['new_balance']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create order']);
    }
    
} catch (Exception $e) {
    error_log("Checkout API error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
