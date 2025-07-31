# FurniVision - AI-Enhanced Furniture E-Commerce Platform

A comprehensive furniture e-commerce platform that combines traditional online shopping with AI-powered room analysis and furniture recommendations using Google Gemini Vision API.

## 🎯 Project Overview

FurniVision revolutionizes furniture shopping by allowing users to upload photos of their rooms and receive personalized AI-generated furniture suggestions. The platform matches AI recommendations with actual inventory and provides seamless shopping experience.

### Key Features
- **AI Room Analysis**: Upload room photos for personalized furniture suggestions
- **Smart Product Matching**: AI suggestions matched with real inventory
- **Complete E-Commerce**: Full shopping cart, user accounts, and checkout
- **Responsive Design**: Optimized for all devices
- **Modern UI/UX**: Clean, intuitive interface

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.4+, RESTful APIs
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini Vision API
- **Authentication**: JWT-based sessions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbdelrahmanTamer11/Furniture_E-Shop.git
   cd Furniture_E-Shop
   ```

2. **Set up the database**
   ```sql
   CREATE DATABASE furniture_eshop;
   mysql -u root -p furniture_eshop < database/schema.sql
   ```

3. **Configure the application**
   ```php
   // Edit backend/config/config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'furniture_eshop');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('GEMINI_API_KEY', 'your_gemini_api_key');
   ```

4. **Start the development server**
   ```bash
   cd frontend
   php -S localhost:8000
   ```

5. **Visit the application**
   Open http://localhost:8000 in your browser

## 📖 Documentation

- [Setup Guide](SETUP.md) - Detailed installation instructions
- [API Documentation](README.md#-api-documentation) - Complete API reference
- [Architecture Overview](README.md#-frontend-architecture) - Technical details

## 🎨 Features Showcase

### AI-Powered Room Analysis
- Upload room photos
- Get personalized furniture suggestions
- See estimated costs and placement advice
- Match suggestions with available products

### Complete E-Commerce Experience
- Browse extensive furniture catalog
- Advanced filtering and search
- Shopping cart with real-time updates
- Secure user authentication
- Responsive design for all devices

### Modern Architecture
- Clean RESTful APIs
- Modular JavaScript architecture
- Secure PHP backend
- Optimized database design

## 🔧 Development

### Prerequisites
- PHP 7.4+
- MySQL 8.0+
- Web server (Apache/Nginx)
- Google Gemini API key

### Local Development
```bash
# Install dependencies and start server
./setup.sh

# Or manually:
cd frontend
php -S localhost:8000
```

### API Testing
```bash
# Test products endpoint
curl http://localhost:8000/backend/api/products.php

# Test authentication
curl -X POST http://localhost:8000/backend/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Abdelrahman Tamer**
- GitHub: [@AbdelrahmanTamer11](https://github.com/AbdelrahmanTamer11)

## 🙏 Acknowledgments

- Google Gemini API for AI-powered analysis
- Modern web development best practices
- Open source community contributions

---

Built with ❤️ for the future of furniture shopping
