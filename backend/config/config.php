<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'furniture_eshop');
define('DB_USER', 'root');
define('DB_PASS', '');

// Gemini AI API configuration
define('GEMINI_API_KEY', 'AIzaSyD9SLKug4niUl_PP9mSKuNqD-mfQHnCZ34');
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent');

// Application settings
define('APP_URL', 'http://localhost');
define('UPLOAD_PATH', __DIR__ . '/../uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp']);

// Security settings
define('JWT_SECRET', 'your_jwt_secret_key_here');
define('SESSION_LIFETIME', 86400); // 24 hours

// CORS settings
define('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:5500']);

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('UTC');
?>
