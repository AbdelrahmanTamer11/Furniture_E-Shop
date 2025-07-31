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
require_once __DIR__ . '/../models/AIAnalysis.php';
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
$user = $userModel->validateSession($token);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
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
    $aiResponse = sendToGeminiAI($uploadPath, $roomType, $stylePreference);
    
    if (!$aiResponse) {
        http_response_code(500);
        echo json_encode(['error' => 'AI analysis failed']);
        exit;
    }
    
    // Process AI response and match with products
    $aiAnalysis = new AIAnalysis();
    $productModel = new Product();
    
    $processedResponse = processAIResponse($aiResponse, $productModel);
    
    // Save analysis to database
    $analysisId = $aiAnalysis->saveAnalysis(
        $user['id'],
        $filename,
        $roomType,
        $stylePreference,
        $aiResponse,
        $processedResponse['suggestions'],
        $processedResponse['total_cost']
    );
    
    echo json_encode([
        'success' => true,
        'analysis_id' => $analysisId,
        'suggestions' => $processedResponse['suggestions'],
        'total_cost' => $processedResponse['total_cost'],
        'room_type' => $roomType,
        'style_preference' => $stylePreference
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'AI analysis failed: ' . $e->getMessage()]);
}

function sendToGeminiAI($imagePath, $roomType, $stylePreference) {
    // Convert image to base64
    $imageData = base64_encode(file_get_contents($imagePath));
    $mimeType = mime_content_type($imagePath);
    
    // Prepare prompt for Gemini
    $prompt = "You are an expert interior design assistant. Analyze the uploaded image of a {$roomType} and suggest a furniture set that matches the {$stylePreference} style.

Please return a JSON response with the following structure:
{
  \"suggestions\": [
    {
      \"name\": \"Furniture item name\",
      \"color\": \"Recommended color\",
      \"material\": \"Recommended material\",
      \"price\": 450.00,
      \"placement\": \"Suggested placement in the room\",
      \"category\": \"furniture category\"
    }
  ],
  \"total_cost\": 1250.00,
  \"style_analysis\": \"Brief analysis of the room's current style and lighting\"
}

Please suggest 3-5 furniture items that would work well in this space. Focus on items that complement the existing lighting, layout, and any visible furniture or decor.";

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
    
    $curl = curl_init();
    
    curl_setopt_array($curl, [
        CURLOPT_URL => GEMINI_API_URL . '?key=' . GEMINI_API_KEY,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ]
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($httpCode !== 200) {
        throw new Exception("Gemini API request failed with status code: $httpCode");
    }
    
    $decodedResponse = json_decode($response, true);
    
    if (!$decodedResponse || !isset($decodedResponse['candidates'][0]['content']['parts'][0]['text'])) {
        throw new Exception("Invalid response from Gemini API");
    }
    
    $aiText = $decodedResponse['candidates'][0]['content']['parts'][0]['text'];
    
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
