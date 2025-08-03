# FurniVision - AI Furniture E-Shop

AI-powered furniture e-commerce platform with room analysis and personalized recommendations.

## ✨ Features

- **AI Room Analysis** - Upload photos, get furniture suggestions
- **Smart Matching** - AI recommendations matched with real inventory
- **Full E-Commerce** - Cart, accounts, checkout system
- **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: PHP 7.4+, MySQL 8.0+
- **AI**: Google Gemini Vision API

## 🚀 Quick Setup

1. **Clone & Setup**
   ```bash
   git clone https://github.com/AbdelrahmanTamer11/Furniture_E-Shop.git
   cd Furniture_E-Shop
   ```

2. **Database**
   ```sql
   CREATE DATABASE furniture_eshop;
   mysql -u root -p furniture_eshop < database/schema.sql
   ```

3. **Configure**
   ```php
   // Edit backend/config/config.php
   define('GEMINI_API_KEY', 'your_api_key_here');
   ```

4. **Run**
   ```bash
   php -S localhost:8000 index.php
   ```

## 📞 Contact

**Abdelrahman Tamer**  
GitHub: [@AbdelrahmanTamer11](https://github.com/AbdelrahmanTamer11)

---

Built with ❤️ for modern furniture shopping
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
