<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Cart.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Authenticate user
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';

if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$userModel = new User();
$user = $userModel->validateSession($token);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$cartModel = new Cart();

switch ($method) {
    case 'GET':
        handleGetCart($cartModel, $user['id']);
        break;
        
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'add') {
            handleAddToCart($cartModel, $user['id'], $input);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    case 'PUT':
        if (isset($_GET['action']) && $_GET['action'] === 'update') {
            handleUpdateCart($cartModel, $user['id'], $input);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['product_id'])) {
            handleRemoveFromCart($cartModel, $user['id'], $_GET['product_id']);
        } elseif (isset($_GET['action']) && $_GET['action'] === 'clear') {
            handleClearCart($cartModel, $user['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required or use action=clear']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function handleGetCart($cartModel, $userId) {
    $items = $cartModel->getCartItems($userId);
    $total = $cartModel->getCartTotal($userId);
    $count = $cartModel->getCartCount($userId);
    
    echo json_encode([
        'items' => $items,
        'total' => $total,
        'count' => $count
    ]);
}

function handleAddToCart($cartModel, $userId, $input) {
    if (empty($input['product_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID required']);
        return;
    }
    
    $quantity = $input['quantity'] ?? 1;
    
    if ($cartModel->addItem($userId, $input['product_id'], $quantity)) {
        echo json_encode(['message' => 'Item added to cart']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add item to cart']);
    }
}

function handleUpdateCart($cartModel, $userId, $input) {
    if (empty($input['product_id']) || !isset($input['quantity'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Product ID and quantity required']);
        return;
    }
    
    if ($cartModel->updateQuantity($userId, $input['product_id'], $input['quantity'])) {
        echo json_encode(['message' => 'Cart updated']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update cart']);
    }
}

function handleRemoveFromCart($cartModel, $userId, $productId) {
    if ($cartModel->removeItem($userId, $productId)) {
        echo json_encode(['message' => 'Item removed from cart']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to remove item from cart']);
    }
}

function handleClearCart($cartModel, $userId) {
    if ($cartModel->clearCart($userId)) {
        echo json_encode(['message' => 'Cart cleared']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to clear cart']);
    }
}
?>
