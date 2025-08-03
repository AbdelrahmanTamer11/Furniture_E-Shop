# FurniVision Setup Guide

## 🎯 What You're Building

AI-enhanced furniture e-commerce platform:
- Upload room photos → Get AI furniture suggestions
- Shop real furniture based on AI recommendations
- Complete e-commerce with cart and checkout

## 🚀 Quick Setup

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in and click "Get API Key"
3. Copy your API key

### 2. Configure API Key

```php
// Edit backend/config/config.php
define('GEMINI_API_KEY', 'your_actual_api_key_here');
```

### 3. Setup Database

```sql
CREATE DATABASE furniture_eshop;
USE furniture_eshop;
SOURCE database/schema.sql;
```

### 4. Start Server

```bash
php -S localhost:8000 index.php
```

### 5. Test Platform

Visit http://localhost:8000 and test:
- ✅ Browse products
- ✅ Create account/login
- ✅ Add to cart
- ✅ Upload room photo (needs API key)
- ✅ Get AI suggestions

## 📁 File Structure

```
Furniture_E-Shop/
├── frontend/
│   ├── index.html              # Main application page
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   └── components.css     # Component styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── auth.js           # Authentication handling
│   │   ├── cart.js           # Shopping cart logic
│   │   ├── products.js       # Product management
│   │   └── ai-design.js      # AI analysis features
│   ├── images/               # Product images directory
│   └── .htaccess            # Server configuration
├── backend/
│   ├── api/
│   │   ├── auth.php         # Authentication API
│   │   ├── products.php     # Products API
│   │   ├── cart.php         # Cart API
│   │   └── ai-analysis.php  # AI analysis API
│   ├── models/
│   │   ├── User.php         # User model
│   │   ├── Product.php      # Product model
│   │   ├── Cart.php         # Cart model
│   │   └── AIAnalysis.php   # AI analysis model
│   ├── config/
│   │   ├── config.php       # Database & API configuration
│   │   └── database.php     # Database connection
│   └── .htaccess           # API routing configuration
├── database/
│   └── schema.sql          # Complete database schema
├── setup.sh               # Automated setup script
├── SETUP.md              # This setup guide
└── README.md             # Complete documentation
```

## 🎨 What Your Platform Includes

### Frontend Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Product Catalog**: Browse furniture by category with filtering
- **AI Room Analysis**: Upload room photos for suggestions
- **Shopping Cart**: Real-time cart updates and management
- **User Authentication**: Secure login and registration
- **Modern UI**: Clean, professional design

### Backend Features
- **RESTful APIs**: Well-structured API endpoints
- **Secure Authentication**: JWT-based user sessions
- **Database Integration**: Efficient MySQL operations
- **AI Integration**: Google Gemini Vision API
- **Error Handling**: Comprehensive error management

### Database Features
- **Complete Schema**: Users, products, categories, cart, orders
- **Sample Data**: Pre-loaded with furniture categories and products
- **Relationships**: Proper foreign keys and constraints
- **Security**: Prepared statements for SQL injection prevention

## 🔧 Customization Options

### Adding Products
Add new products through the database or create an admin interface:

```sql
INSERT INTO products (name, description, price, category_id, style_id, image_url) 
VALUES ('New Sofa', 'Comfortable 3-seater', 899.99, 1, 1, '/images/products/new-sofa.jpg');
```

### Styling Changes
- Edit `frontend/css/style.css` for main styles
- Edit `frontend/css/components.css` for component-specific styles
- All CSS uses modern flexbox and grid layouts

### Adding New Features
- Frontend: Add new JavaScript modules in `frontend/js/`
- Backend: Create new API endpoints in `backend/api/`
- Database: Add new tables or modify `database/schema.sql`

## 🚀 Going to Production

### Security Checklist
- [ ] Change all default passwords
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure proper file permissions
- [ ] Set up database backups
- [ ] Enable error logging
- [ ] Configure CORS properly

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Set up image optimization
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Consider CDN for static assets

## 🆘 Troubleshooting

### Common Issues

**"Database connection failed"**
- Check your database credentials in `backend/config/config.php`
- Ensure MySQL is running
- Verify database exists and schema is loaded

**"AI analysis not working"**
- Verify your Gemini API key is correct
- Check internet connection
- Ensure API key has proper permissions

**"Images not loading"**
- Add product images to `frontend/images/products/`
- Check file permissions
- Verify image paths in database

**"API endpoints returning 404"**
- Ensure `.htaccess` files are in place
- Check web server configuration
- Verify file paths are correct

## 📞 Support

Your platform is built with industry best practices and should work out of the box once configured. The code includes:

- Comprehensive error handling
- Security best practices
- Modern web standards
- Clean, maintainable architecture

## 🎉 You're Ready!

Once you've added your Gemini API key and started the server, you'll have a fully functional AI-enhanced furniture e-commerce platform. The system is designed to be:

- **Scalable**: Easy to add new features
- **Secure**: Industry-standard security practices
- **Maintainable**: Clean, well-documented code
- **Modern**: Latest web development standards

Happy coding! 🚀
   - Verify product suggestions

## Performance Optimization

### For Development
- Enable PHP error reporting
- Use browser dev tools
- Monitor network requests

### For Production
- Enable PHP OPcache
- Compress images
- Minify CSS/JS
- Use CDN for static assets
- Configure database caching

## Security Checklist

- [ ] Update all default passwords
- [ ] Enable HTTPS in production
- [ ] Validate all user inputs
- [ ] Use prepared statements
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Backup strategy in place

## Environment Variables

Create `.env` file (optional):
```env
DB_HOST=localhost
DB_NAME=furniture_eshop
DB_USER=your_user
DB_PASS=your_password
GEMINI_API_KEY=your_api_key
APP_ENV=development
DEBUG=true
```
