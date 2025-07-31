<?php
require_once __DIR__ . '/../config/database.php';

class AIAnalysis {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function saveAnalysis($userId, $imagePath, $roomType, $stylePreference, $aiResponse, $suggestedProducts, $totalCost) {
        $sql = "INSERT INTO room_analysis (user_id, room_image_path, room_type, style_preference, ai_response, suggested_products, total_estimated_cost) 
                VALUES (:user_id, :room_image_path, :room_type, :style_preference, :ai_response, :suggested_products, :total_estimated_cost)";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':user_id' => $userId,
            ':room_image_path' => $imagePath,
            ':room_type' => $roomType,
            ':style_preference' => $stylePreference,
            ':ai_response' => json_encode($aiResponse),
            ':suggested_products' => json_encode($suggestedProducts),
            ':total_estimated_cost' => $totalCost
        ]);
    }
    
    public function getUserAnalyses($userId, $limit = 10) {
        $sql = "SELECT * FROM room_analysis WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $results = $stmt->fetchAll();
        
        // Decode JSON fields
        foreach ($results as &$result) {
            $result['ai_response'] = json_decode($result['ai_response'], true);
            $result['suggested_products'] = json_decode($result['suggested_products'], true);
        }
        
        return $results;
    }
    
    public function getAnalysisById($id, $userId = null) {
        $sql = "SELECT * FROM room_analysis WHERE id = :id";
        $params = [':id' => $id];
        
        if ($userId) {
            $sql .= " AND user_id = :user_id";
            $params[':user_id'] = $userId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        if ($result) {
            $result['ai_response'] = json_decode($result['ai_response'], true);
            $result['suggested_products'] = json_decode($result['suggested_products'], true);
        }
        
        return $result;
    }
    
    public function processGeminiResponse($geminiResponse) {
        // Parse the Gemini AI response and extract furniture suggestions
        $suggestions = [];
        $totalCost = 0;
        
        // This would contain logic to parse the structured response from Gemini
        // For now, we'll assume the response is already structured
        if (isset($geminiResponse['suggestions'])) {
            foreach ($geminiResponse['suggestions'] as $suggestion) {
                $suggestions[] = [
                    'name' => $suggestion['name'],
                    'color' => $suggestion['color'],
                    'material' => $suggestion['material'] ?? '',
                    'price' => $suggestion['price'],
                    'placement' => $suggestion['placement'],
                    'product_id' => $this->findMatchingProduct($suggestion)
                ];
                $totalCost += $suggestion['price'];
            }
        }
        
        return [
            'suggestions' => $suggestions,
            'total_cost' => $totalCost
        ];
    }
    
    private function findMatchingProduct($suggestion) {
        // Try to match the AI suggestion with actual products in our database
        $sql = "SELECT id FROM products WHERE 
                (name LIKE :name OR description LIKE :name) AND 
                (style LIKE :style OR color LIKE :color) AND 
                is_active = 1 
                ORDER BY 
                    CASE 
                        WHEN name LIKE :exact_name THEN 1
                        WHEN name LIKE :name THEN 2
                        ELSE 3
                    END
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':name' => '%' . $suggestion['name'] . '%',
            ':exact_name' => $suggestion['name'],
            ':style' => '%' . ($suggestion['style'] ?? '') . '%',
            ':color' => '%' . ($suggestion['color'] ?? '') . '%'
        ]);
        
        $result = $stmt->fetch();
        return $result ? $result['id'] : null;
    }
}
?>
