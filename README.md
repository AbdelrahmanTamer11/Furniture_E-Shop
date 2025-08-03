# FurniVision - AI-Enhanced Furniture E-Shop

A modern furniture e-commerce platform with AI-powered room design assistance.

## 🚀 Features

- **AI Room Design** - Upload room photos and get furniture recommendations
- **User Authentication** - Register, login with wallet balance system
- **Shopping Cart** - Add items, manage quantities, checkout process
- **Product Catalog** - Browse furniture by categories and styles
- **Responsive Design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 7.3+
- **Database**: MySQL 5.7+
- **Server**: Built-in PHP development server

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Furniture_E-Shop
   ```

2. **Setup Database**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE furniture_eshop;"
   
   # Import schema
   mysql -u root -p furniture_eshop < database/schema.sql
   ```

3. **Configure Database**
   Edit `backend/config/database.php` with your database credentials:
   ```php
   private $host = "localhost";
   private $db_name = "furniture_eshop";
   private $username = "root";
   private $password = "your_password";
   ```

4. **Start Server**
   ```bash
   php -S localhost:8000 index.php
   ```

5. **Open Browser**
   Visit: `http://localhost:8000`

## 📁 Project Structure

```
Furniture_E-Shop/
├── frontend/           # HTML, CSS, JS files
├── backend/           # PHP API and models
├── database/          # SQL schema
├── images/           # Product images
└── index.php         # Main router
```

## 🔧 Key Features

### User Management
- Registration with email verification
- Login/logout with JWT tokens
- User wallet balance system ($5000 default)

### Shopping Experience
- Product browsing by categories
- Add to cart functionality
- Balance-based checkout system
- Order management

### AI Integration
- Room photo upload
- AI-powered furniture suggestions
- Cost estimation for recommended items

## 🎯 Default User Accounts

The schema includes sample users for testing:
- **Email**: `john@example.com` | **Balance**: $1500
- **Email**: `jane@example.com` | **Balance**: $2000  
- **Email**: `admin@furnivision.com` | **Balance**: $5000

**Password for all**: `password` (hashed in database)

## 📱 Usage

1. **Register/Login** - Create account or use sample credentials
2. **Browse Products** - Explore furniture categories
3. **AI Design** - Upload room photo for AI recommendations
4. **Add to Cart** - Select items and quantities
5. **Checkout** - Complete purchase using wallet balance

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

**Developer**: Abdelrahman Tamer  
**Email**: abdelrahmantamer9998@gmail.com  
**Phone**: 01003234615

---

Made with ❤️ for modern furniture shopping experience