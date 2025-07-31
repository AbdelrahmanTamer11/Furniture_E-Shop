#!/bin/bash

# FurniVision Setup Script
# This script helps set up the development environment

echo "🏠 FurniVision Setup Script"
echo "=========================="

# Check for required tools
check_requirement() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install $1 first."
        exit 1
    else
        echo "✅ $1 is available"
    fi
}

echo "Checking requirements..."
check_requirement "php"
check_requirement "mysql"

# Create uploads directory if it doesn't exist
echo "Creating directories..."
mkdir -p backend/uploads
chmod 755 backend/uploads
echo "✅ Upload directory created"

# Create placeholder images directory
mkdir -p frontend/images/products
echo "✅ Images directory created"

# Check if database exists
echo "Checking database setup..."
DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE 'furniture_eshop';" 2>/dev/null | grep furniture_eshop)

if [ -z "$DB_EXISTS" ]; then
    echo "Database 'furniture_eshop' not found."
    read -p "Would you like to create it now? (y/n): " CREATE_DB
    
    if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
        echo "Creating database..."
        mysql -u root -p -e "CREATE DATABASE furniture_eshop;"
        echo "Importing schema..."
        mysql -u root -p furniture_eshop < database/schema.sql
        echo "✅ Database setup complete"
    else
        echo "⚠️  Please create the database manually and import schema.sql"
    fi
else
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
