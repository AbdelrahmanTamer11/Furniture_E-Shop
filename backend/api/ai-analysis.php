<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Product.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Authenticate user 
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';

if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$userModel = new User();
$user = null;

// Try to validate session if token exists
if (!empty($token)) {
    $user = $userModel->validateSession($token);
}

// For testing purposes, allow requests without authentication
if (!$user) {
    // Create a mock user for testing
    $user = [
        'id' => 1,
        'username' => 'test_user',
        'email' => 'test@example.com'
    ];
}

// Handle file upload
if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Image file required']);
    exit;
}

$file = $_FILES['image'];
$roomType = $_POST['room_type'] ?? 'living_room';
$stylePreference = $_POST['style_preference'] ?? 'Modern';

// Validate file
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, and WebP are allowed']);
    exit;
}

if ($file['size'] > MAX_UPLOAD_SIZE) {
    http_response_code(400);
    echo json_encode(['error' => 'File size too large. Maximum size is 5MB']);
    exit;
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('room_') . '.' . $extension;
$uploadPath = UPLOAD_PATH . $filename;

// Create upload directory if it doesn't exist
if (!is_dir(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save uploaded file']);
    exit;
}

try {
    // Send image to Gemini AI
    error_log("Sending image to Gemini AI: " . $uploadPath);
    error_log("Room type: " . $roomType);
    error_log("Style preference: " . $stylePreference);
    
    $aiResponse = sendToGeminiAI($uploadPath, $roomType, $stylePreference);
    
    error_log("Gemini AI response: " . json_encode($aiResponse));
    
    if (!$aiResponse) {
        http_response_code(500);
        echo json_encode(['error' => 'AI analysis failed']);
        exit;
    }
    
    // Process AI response and match with products
    $productModel = new Product();
    
    $processedResponse = processAIResponse($aiResponse, $productModel);
    
    error_log("Processed response: " . json_encode($processedResponse));
    
    // Save analysis to database (commented out for testing)
    /*$analysisId = $aiAnalysis->saveAnalysis(
        $user['id'],
        $filename,
        $roomType,
        $stylePreference,
        $aiResponse,
        $processedResponse['suggestions'],
        $processedResponse['total_cost']
    );*/
    
    echo json_encode([
        'success' => true,
        'suggestions' => $processedResponse['suggestions'],
        'total_cost' => $processedResponse['total_cost'],
        'style_analysis' => $aiResponse['style_analysis'] ?? 'Room analysis completed.',
        'room_type' => $roomType,
        'style_preference' => $stylePreference,
        'debug_info' => [
            'raw_ai_response' => $aiResponse,
            'image_path' => $uploadPath
        ]
    ]);
    
} catch (Exception $e) {
    error_log('AI analysis failed: ' . $e->getMessage());
    
    // Return error with debug information
    http_response_code(500);
    echo json_encode([
        'error' => 'AI analysis failed: ' . $e->getMessage(),
        'debug_info' => [
            'room_type' => $roomType,
            'style_preference' => $stylePreference,
            'image_path' => $uploadPath,
            'gemini_api_url' => GEMINI_API_URL,
            'api_key_set' => !empty(GEMINI_API_KEY),
            'uploads_dir_exists' => is_dir(UPLOAD_PATH),
            'image_file_exists' => file_exists($uploadPath)
        ]
    ]);
}

function sendToGeminiAI($imagePath, $roomType, $stylePreference) {
    error_log("Starting Gemini AI request");
    
    // Convert image to base64
    $imageData = base64_encode(file_get_contents($imagePath));
    $mimeType = mime_content_type($imagePath);
    
    error_log("Image data prepared. MIME type: " . $mimeType);
    error_log("Image size: " . strlen($imageData) . " characters");
    
    // Prepare dynamic prompt based on room type and style
    $prompt = "You are an expert interior design assistant. 

IMPORTANT: Analyze the uploaded image of this {$roomType} and suggest furniture specifically for the {$stylePreference} style.

Based on the room photo, lighting, existing elements, and the specified {$stylePreference} style, please provide:

1. A brief analysis of the current room (lighting, layout, existing furniture/decor)
2. 3-6 specific furniture recommendations that would work in THIS specific room
3. Consider the room type: {$roomType}
4. Match the style preference: {$stylePreference}

Return ONLY a valid JSON response in this exact format:
{
  \"suggestions\": [
    {
      \"name\": \"Specific furniture item name\",
      \"color\": \"Color that matches the room\",
      \"material\": \"Appropriate material\",
      \"price\": 450.00,
      \"placement\": \"Where to place it in THIS specific room\",
      \"category\": \"{$roomType}\"
    }
  ],
  \"total_cost\": 1250.00,
  \"style_analysis\": \"Detailed analysis of this specific room's lighting, layout, and how {$stylePreference} style would work here\"
}

Be specific to this room image and the {$stylePreference} style. Do not give generic responses.";

    error_log("Prompt prepared: " . substr($prompt, 0, 200) . "...");

    $requestData = [
        'contents' => [
            [
                'parts' => [
                    [
                        'text' => $prompt
                    ],
                    [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $imageData
                        ]
                    ]
                ]
            ]
        ]
    ];
    
    error_log("Making request to Gemini API: " . GEMINI_API_URL);
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => GEMINI_API_URL . '?key=' . GEMINI_API_KEY,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);
    
    error_log("Gemini API response code: " . $httpCode);
    error_log("Curl error: " . $curlError);
    error_log("Raw response: " . substr($response, 0, 500) . "...");
    
    if ($curlError) {
        throw new Exception("CURL error: " . $curlError);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Gemini API request failed with status code: $httpCode. Response: " . $response);
    }
    
    $decodedResponse = json_decode($response, true);
    
    if (!$decodedResponse) {
        throw new Exception("Failed to decode JSON response from Gemini API");
    }
    
    error_log("Decoded response structure: " . json_encode(array_keys($decodedResponse)));
    
    if (!isset($decodedResponse['candidates'][0]['content']['parts'][0]['text'])) {
        throw new Exception("Invalid response structure from Gemini API: " . json_encode($decodedResponse));
    }
    
    $aiText = $decodedResponse['candidates'][0]['content']['parts'][0]['text'];
    error_log("AI text response: " . $aiText);
    
    // Try to extract JSON from the response
    $jsonStart = strpos($aiText, '{');
    $jsonEnd = strrpos($aiText, '}');
    
    if ($jsonStart !== false && $jsonEnd !== false) {
        $jsonStr = substr($aiText, $jsonStart, $jsonEnd - $jsonStart + 1);
        $parsedResponse = json_decode($jsonStr, true);
        
        if ($parsedResponse) {
            return $parsedResponse;
        }
    }
    
    // Fallback: return the raw text for manual processing
    return ['raw_response' => $aiText];
}

function processAIResponse($aiResponse, $productModel) {
    $suggestions = [];
    $totalCost = 0;
    
    if (isset($aiResponse['suggestions'])) {
        foreach ($aiResponse['suggestions'] as $suggestion) {
            // Try to find matching products in our database
            $matchingProducts = findMatchingProducts($productModel, $suggestion);
            
            $processedSuggestion = [
                'ai_suggestion' => $suggestion,
                'matching_products' => $matchingProducts,
                'estimated_price' => $suggestion['price'] ?? 0
            ];
            
            $suggestions[] = $processedSuggestion;
            $totalCost += $suggestion['price'] ?? 0;
        }
    } else {
        // Fallback processing for non-JSON responses
        $suggestions = createFallbackSuggestions($productModel, $aiResponse);
        $totalCost = array_sum(array_column($suggestions, 'estimated_price'));
    }
    
    return [
        'suggestions' => $suggestions,
        'total_cost' => $totalCost
    ];
}

function findMatchingProducts($productModel, $suggestion) {
    $searchTerms = [
        $suggestion['name'] ?? '',
        $suggestion['category'] ?? ''
    ];
    
    $matches = [];
    
    foreach ($searchTerms as $term) {
        if (empty($term)) continue;
        
        $products = $productModel->getAll(['search' => $term, 'limit' => 3]);
        foreach ($products as $product) {
            $matches[] = $product;
        }
    }
    
    // Remove duplicates and limit to 3 matches
    $uniqueMatches = array_unique($matches, SORT_REGULAR);
    return array_slice($uniqueMatches, 0, 3);
}

function createFallbackSuggestions($productModel, $aiResponse) {
    // Create some default suggestions if AI response parsing fails
    $fallbackProducts = $productModel->getFeatured(5);
    
    $suggestions = [];
    foreach ($fallbackProducts as $product) {
        $suggestions[] = [
            'ai_suggestion' => [
                'name' => $product['name'],
                'color' => $product['color'],
                'material' => $product['material'],
                'price' => $product['price'],
                'placement' => 'Recommended for your space',
                'category' => $product['category_name']
            ],
            'matching_products' => [$product],
            'estimated_price' => $product['price']
        ];
    }
    
    return $suggestions;
}
?>
