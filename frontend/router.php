<?php
// Simple router for PHP built-in server
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

// Remove query parameters for routing
$cleanPath = strtok($path, '?');

// Handle backend API requests
if (strpos($cleanPath, '/backend/') === 0) {
    // Remove '/backend' from the path and serve from backend directory
    $backendPath = 'E:\BONDOK\Megasoft Task\Furniture_E-Shop\backend' . substr($cleanPath, 8);
    if (file_exists($backendPath)) {
        include $backendPath;
        return true;
    }
}

// Handle static files
if ($cleanPath !== '/' && file_exists(__DIR__ . $cleanPath)) {
    return false; // Let PHP serve the static file
}

// For all other requests, serve index.html (SPA routing)
include __DIR__ . '/index.html';
return true;
?>
