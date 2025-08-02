<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../models/Cart.php';
require_once __DIR__ . '/../config/config.php';

// Get user from JWT token
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
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
    
    $userId = getUserFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    $cart = new Cart();
    $userBalance = $cart->getUserBalance($userId);
    
    error_log("Balance API - User: $userId, Balance: $userBalance");
    
    $response = [
        'success' => true,
        'balance' => floatval($userBalance),
        'timestamp' => time()
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Balance API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>
