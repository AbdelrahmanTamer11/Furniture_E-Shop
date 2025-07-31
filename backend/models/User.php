<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function create($userData) {
        $sql = "INSERT INTO users (username, email, password_hash, first_name, last_name, phone, address) 
                VALUES (:username, :email, :password_hash, :first_name, :last_name, :phone, :address)";
        
        $stmt = $this->db->prepare($sql);
        $passwordHash = password_hash($userData['password'], PASSWORD_DEFAULT);
        
        return $stmt->execute([
            ':username' => $userData['username'],
            ':email' => $userData['email'],
            ':password_hash' => $passwordHash,
            ':first_name' => $userData['first_name'],
            ':last_name' => $userData['last_name'],
            ':phone' => $userData['phone'] ?? null,
            ':address' => $userData['address'] ?? null
        ]);
    }
    
    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        return $stmt->fetch();
    }
    
    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = :username";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':username' => $username]);
        return $stmt->fetch();
    }
    
    public function findById($id) {
        $sql = "SELECT id, username, email, first_name, last_name, phone, address, created_at FROM users WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }
    
    public function verifyPassword($email, $password) {
        $user = $this->findByEmail($email);
        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }
        return false;
    }
    
    public function createSession($userId) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        $sql = "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (:user_id, :session_token, :expires_at)";
        $stmt = $this->db->prepare($sql);
        
        if ($stmt->execute([
            ':user_id' => $userId,
            ':session_token' => $sessionToken,
            ':expires_at' => $expiresAt
        ])) {
            return $sessionToken;
        }
        return false;
    }
    
    public function validateSession($sessionToken) {
        $sql = "SELECT u.* FROM users u 
                JOIN user_sessions s ON u.id = s.user_id 
                WHERE s.session_token = :token AND s.expires_at > NOW()";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':token' => $sessionToken]);
        return $stmt->fetch();
    }
    
    public function deleteSession($sessionToken) {
        $sql = "DELETE FROM user_sessions WHERE session_token = :token";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':token' => $sessionToken]);
    }
}
?>
