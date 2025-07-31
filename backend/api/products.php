<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../models/Product.php';

$method = $_SERVER['REQUEST_METHOD'];
$productModel = new Product();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            handleGetProduct($productModel, $_GET['id']);
        } elseif (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'categories':
                    handleGetCategories($productModel);
                    break;
                case 'styles':
                    handleGetStyles($productModel);
                    break;
                case 'featured':
                    $limit = $_GET['limit'] ?? 8;
                    handleGetFeatured($productModel, $limit);
                    break;
                default:
                    handleGetProducts($productModel, $_GET);
            }
        } else {
            handleGetProducts($productModel, $_GET);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function handleGetProducts($productModel, $filters) {
    $products = $productModel->getAll($filters);
    echo json_encode(['products' => $products]);
}

function handleGetProduct($productModel, $id) {
    $product = $productModel->getById($id);
    
    if ($product) {
        echo json_encode(['product' => $product]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
    }
}

function handleGetCategories($productModel) {
    $categories = $productModel->getCategories();
    echo json_encode(['categories' => $categories]);
}

function handleGetStyles($productModel) {
    $styles = $productModel->getStyles();
    echo json_encode(['styles' => $styles]);
}

function handleGetFeatured($productModel, $limit) {
    $products = $productModel->getFeatured($limit);
    echo json_encode(['products' => $products]);
}
?>
