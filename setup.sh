#!/bin/bash

echo "🏠 FurniVision Setup"
echo "==================="

# Check requirements
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 not found. Please install $1"
        exit 1
    fi
    echo "✅ $1 found"
}

echo "Checking requirements..."
check_tool "php"
check_tool "mysql"

# Create directories
echo "Setting up directories..."
mkdir -p backend/uploads frontend/images/products
chmod 755 backend/uploads
echo "✅ Directories created"

# Database setup
echo "Setting up database..."
DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE 'furniture_eshop';" 2>/dev/null | grep furniture_eshop)

if [ -z "$DB_EXISTS" ]; then
    read -p "Create database? (y/n): " CREATE_DB
    if [ "$CREATE_DB" = "y" ]; then
        mysql -u root -p -e "CREATE DATABASE furniture_eshop;"
        mysql -u root -p furniture_eshop < database/schema.sql
        echo "✅ Database created"
    fi
else
    echo "✅ Database exists"
fi

# Check API key
if grep -q "your_gemini_api_key_here" backend/config/config.php; then
    echo "⚠️  Add Gemini API key to backend/config/config.php"
    echo "   Get key from: https://aistudio.google.com/"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Start server: php -S localhost:8000 index.php"
echo "Visit: http://localhost:8000"
    echo "✅ Database 'furniture_eshop' exists"
fi

# Check API key configuration
if grep -q "your_gemini_api_key_here" backend/config/config.php; then
    echo "⚠️  Please update your Gemini API key in backend/config/config.php"
    echo "   Get your API key from: https://makersuite.google.com/"
else
    echo "✅ Gemini API key configured"
fi

# Start development server
echo ""
echo "Setup complete! 🎉"
echo ""
echo "To start the development server:"
echo "  cd frontend"
echo "  php -S localhost:8000"
echo ""
echo "Then visit: http://localhost:8000"
echo ""
echo "Don't forget to:"
echo "1. Update your Gemini API key in backend/config/config.php"
echo "2. Configure your database credentials in backend/config/config.php"
echo "3. Add product images to frontend/images/products/"
