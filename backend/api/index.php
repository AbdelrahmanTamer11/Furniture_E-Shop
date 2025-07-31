<?php
// CORS headers for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// API Router - Routes requests to appropriate handlers
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove base path if running in subdirectory
$basePath = '/backend/api';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Route to appropriate API file
switch ($path) {
    case '/auth':
    case '/auth.php':
        require_once __DIR__ . '/auth.php';
        break;
        
    case '/products':
    case '/products.php':
        require_once __DIR__ . '/products.php';
        break;
        
    case '/cart':
    case '/cart.php':
        require_once __DIR__ . '/cart.php';
        break;
        
    case '/ai-analysis':
    case '/ai-analysis.php':
        require_once __DIR__ . '/ai-analysis.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found']);
}
?>
