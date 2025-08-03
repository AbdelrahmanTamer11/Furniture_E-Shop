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

// Handle images folder
if (strpos($cleanPath, '/images/') === 0) {
    $imageFile = __DIR__ . $cleanPath;
    error_log("Image file check: " . $imageFile);
    if (file_exists($imageFile) && !is_dir($imageFile)) {
        error_log("Serving image: " . $imageFile);
        
        // Set correct MIME type for images
        $extension = strtolower(pathinfo($imageFile, PATHINFO_EXTENSION));
        $mimeTypes = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml'
        ];
        
        if (isset($mimeTypes[$extension])) {
            header('Content-Type: ' . $mimeTypes[$extension]);
        }
        
        readfile($imageFile);
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
        'htm' => 'text/html'
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

// Default: serve main page with horizontal footer
$indexContent = file_get_contents(__DIR__ . '/frontend/index.html');

// Update the hero buttons to include navigation functionality
$heroButtonsReplacement = '
                <div class="hero-buttons">
                    <a href="#ai-assistant" class="btn-primary" onclick="scrollToAIAssistant()">Try AI Design</a>
                    <a href="#products" class="btn-secondary">Browse Furniture</a>
                </div>';

// Replace hero buttons if they exist
$indexContent = preg_replace('/<div class="hero-buttons">.*?<\/div>/s', $heroButtonsReplacement, $indexContent);

// Update footer section to be horizontal
$footerReplacement = '
    <footer id="contact">
        <div class="footer-content">
            <div class="footer-brand">
                <h2>FurniVision</h2>
                <p>Transforming spaces with AI-powered furniture design.</p>
            </div>
            
            <div class="footer-links">
                <h3>Quick Links</h3>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#products">Products</a></li>
                    <li><a href="#ai-assistant">AI Design</a></li>
                    <li><a href="#about">About</a></li>
                </ul>
            </div>
            
            <div class="footer-contact">
                <h3>Contact</h3>
                <div class="contact-info">
                    <div class="contact-item">Email: abdelrahman_tamer@furnivision.com</div>
                    <div class="contact-item">Phone: 01003234615</div>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2025 FurniVision. All rights reserved.</p>
        </div>
    </footer>';

// Replace the existing footer
$indexContent = preg_replace('/<footer[^>]*>.*?<\/footer>/s', $footerReplacement, $indexContent);

echo $indexContent;
?>
