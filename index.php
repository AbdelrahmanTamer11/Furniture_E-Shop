<?php
// Simple routing for development server
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove query parameters for clean path
$cleanPath = strtok($path, '?');

// Debug logging
error_log("Requested path: " . $cleanPath);

// Handle backend API requests
if (strpos($cleanPath, '/backend/') === 0) {
    $backendFile = __DIR__ . $cleanPath;
    error_log("Backend file: " . $backendFile);
    if (file_exists($backendFile)) {
        include $backendFile;
        exit;
    }
}

// Handle static files from frontend
$frontendFile = __DIR__ . '/frontend' . $cleanPath;
error_log("Frontend file check: " . $frontendFile);

if ($cleanPath !== '/' && file_exists($frontendFile) && !is_dir($frontendFile)) {
    error_log("Serving static file: " . $frontendFile);
    
    // Set correct MIME type
    $extension = strtolower(pathinfo($frontendFile, PATHINFO_EXTENSION));
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'html' => 'text/html',
        'htm' => 'text/html',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf'
    ];
    
    if (isset($mimeTypes[$extension])) {
        header('Content-Type: ' . $mimeTypes[$extension]);
    }
    
    // Add cache-busting headers for JavaScript and CSS files
    if (in_array($extension, ['js', 'css'])) {
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    readfile($frontendFile);
    exit;
}

// Default: serve main page
error_log("Serving main page for path: " . $cleanPath);
include __DIR__ . '/frontend/index.html';
?>
