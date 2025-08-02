<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../models/User.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

$userModel = new User();

switch ($method) {
    case 'POST':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'register':
                    handleRegister($userModel, $input);
                    break;
                case 'login':
                    handleLogin($userModel, $input);
                    break;
                case 'logout':
                    handleLogout($userModel, $input);
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid action']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Action required']);
        }
        break;
        
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'profile') {
            handleGetProfile($userModel);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function handleRegister($userModel, $input) {
    $required = ['username', 'email', 'password', 'first_name', 'last_name'];
    
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field '$field' is required"]);
            return;
        }
    }
    
    // Validate email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    // Check if user already exists
    if ($userModel->findByEmail($input['email'])) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }
    
    if ($userModel->findByUsername($input['username'])) {
        http_response_code(409);
        echo json_encode(['error' => 'Username already taken']);
        return;
    }
    
    // Create user
    if ($userModel->create($input)) {
        http_response_code(201);
        echo json_encode(['message' => 'User registered successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed']);
    }
}

function handleLogin($userModel, $input) {
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password required']);
        return;
    }
    
    $user = $userModel->verifyPassword($input['email'], $input['password']);
    
    if ($user) {
        // Create a simple token (in production, use proper JWT)
        $tokenData = [
            'id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ];
        
        $token = base64_encode(json_encode($tokenData));
        
        unset($user['password']); // Remove password from response
        
        $response = [
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ];
        
        http_response_code(200);
        echo json_encode($response);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
}

function handleLogout($userModel, $input) {
    if (empty($input['token'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Token required']);
        return;
    }
    
    if ($userModel->deleteSession($input['token'])) {
        echo json_encode(['message' => 'Logout successful']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid token']);
    }
}

function handleGetProfile($userModel) {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if (strpos($token, 'Bearer ') === 0) {
        $token = substr($token, 7);
    }
    
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token required']);
        return;
    }
    
    $user = $userModel->validateSession($token);
    
    if ($user) {
        echo json_encode([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'phone' => $user['phone'],
                'address' => $user['address']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
    }
}
?>
