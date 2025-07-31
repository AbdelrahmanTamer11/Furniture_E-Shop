# FurniVision - AI-Enhanced Furniture E-Commerce Platform

🏠 **Transform Your Space with AI-Powered Furniture Design**

FurniVision is a modern e-commerce platform that combines traditional furniture shopping with cutting-edge AI technology. Users can upload photos of their rooms and receive personalized furniture recommendations powered by Google Gemini Vision API.

## 🌟 Features

### Core E-Commerce Features
- **Product Catalog**: Browse furniture by categories, styles, and price ranges
- **Advanced Filtering**: Search by category, style, price, and keywords
- **Shopping Cart**: Add, update, and remove items with real-time totals
- **User Authentication**: Secure registration and login system
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### AI-Powered Features
- **Room Analysis**: Upload room photos for AI-powered furniture suggestions
- **Style Matching**: Get recommendations based on your room's existing style
- **Smart Suggestions**: AI suggests 3-5 furniture items with placement advice
- **Cost Estimation**: See total estimated costs for suggested furniture sets
- **Product Matching**: AI suggestions are matched with actual inventory

### Technical Features
- **RESTful APIs**: Clean, documented API endpoints
- **Session Management**: Secure token-based authentication
- **File Upload**: Secure image upload with validation
- **Real-time Updates**: Dynamic cart and UI updates
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+
- **Database**: MySQL 8.0+
- **AI Integration**: Google Gemini Vision API
- **Authentication**: JWT-based sessions
- **File Storage**: Local file system with upload validation

## 📁 Project Structure

```
Furniture_E-Shop/
├── README.md
├── frontend/
│   ├── index.html              # Main application page
│   ├── css/
│   │   ├── style.css          # Main stylesheet
│   │   └── components.css     # Component-specific styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── auth.js           # Authentication management
│   │   ├── cart.js           # Shopping cart functionality
│   │   ├── products.js       # Product management
│   │   └── ai-design.js      # AI analysis features
│   └── images/               # Static images and uploads
├── backend/
│   ├── api/
│   │   ├── auth.php          # Authentication endpoints
│   │   ├── products.php      # Product CRUD operations
│   │   ├── cart.php          # Shopping cart API
│   │   └── ai-analysis.php   # AI analysis endpoint
│   ├── config/
│   │   ├── config.php        # Application configuration
│   │   └── database.php      # Database connection
│   ├── models/
│   │   ├── User.php          # User model and operations
│   │   ├── Product.php       # Product model
│   │   ├── Cart.php          # Cart model
│   │   └── AIAnalysis.php    # AI analysis model
│   └── uploads/              # User uploaded images
└── database/
    └── schema.sql            # Database schema and sample data
```

## 🚀 Getting Started

### Prerequisites
- **Web Server**: Apache or Nginx
- **PHP**: Version 7.4 or higher
- **MySQL**: Version 8.0 or higher
- **Google Gemini API Key**: For AI functionality

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AbdelrahmanTamer11/Furniture_E-Shop.git
   cd Furniture_E-Shop
   ```

2. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE furniture_eshop;
   
   # Import schema
   mysql -u root -p furniture_eshop < database/schema.sql
   ```

3. **Configure Backend**
   ```php
   // Edit backend/config/config.php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'furniture_eshop');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   
   // Add your Gemini API key
   define('GEMINI_API_KEY', 'your_gemini_api_key_here');
   ```

4. **Set Permissions**
   ```bash
   # Make uploads directory writable
   chmod 755 backend/uploads/
   ```

5. **Start Development Server**
   ```bash
   # For PHP built-in server
   cd frontend
   php -S localhost:8000
   
   # Or configure Apache virtual host
   ```

### Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create a new project or select existing one
3. Enable the Gemini API
4. Generate an API key
5. Add the key to your configuration file

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth.php?action=register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword"
}
```

#### POST /api/auth.php?action=login
Authenticate user and get session token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "session_token_here",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Product Endpoints

#### GET /api/products.php
Get all products with optional filters.

**Query Parameters:**
- `category_id`: Filter by category
- `style`: Filter by style
- `min_price`: Minimum price
- `max_price`: Maximum price
- `search`: Search term
- `limit`: Number of results

#### GET /api/products.php?id={id}
Get specific product details.

#### GET /api/products.php?action=categories
Get all product categories.

#### GET /api/products.php?action=styles
Get all available styles.

### Cart Endpoints

#### GET /api/cart.php
Get current user's cart items.
**Requires:** Authorization header

#### POST /api/cart.php?action=add
Add item to cart.
**Requires:** Authorization header

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### PUT /api/cart.php?action=update
Update cart item quantity.
**Requires:** Authorization header

#### DELETE /api/cart.php?product_id={id}
Remove item from cart.
**Requires:** Authorization header

### AI Analysis Endpoint

#### POST /api/ai-analysis.php
Upload room image for AI analysis.
**Requires:** Authorization header

**Request:** Multipart form data
- `image`: Image file (JPG, PNG, WebP)
- `room_type`: Type of room (living_room, bedroom, etc.)
- `style_preference`: Preferred style (Modern, Scandinavian, etc.)

**Response:**
```json
{
  "success": true,
  "analysis_id": 123,
  "suggestions": [
    {
      "ai_suggestion": {
        "name": "Modern Sectional Sofa",
        "color": "Light Gray",
        "material": "Fabric",
        "price": 899.99,
        "placement": "Along the left wall beneath the window"
      },
      "matching_products": [...],
      "estimated_price": 899.99
    }
  ],
  "total_cost": 2499.97
}
```

## 🎨 Frontend Architecture

### Component Structure
The frontend is built with vanilla JavaScript using a modular architecture:

- **App.js**: Main application controller
- **Auth.js**: Authentication management
- **AI-Design.js**: AI analysis functionality
- **Cart.js**: Shopping cart operations
- **Products.js**: Product browsing and filtering

### State Management
- User session state managed in `app.currentUser`
- Cart state synchronized with backend
- Product filters stored in `app.filters`
- Real-time UI updates with event-driven architecture

### Responsive Design
- Mobile-first CSS approach
- Flexible grid layouts
- Touch-friendly interface elements
- Optimized for all screen sizes

## 🔧 Backend Architecture

### Model Layer
- **User.php**: User authentication and profile management
- **Product.php**: Product CRUD operations and filtering
- **Cart.php**: Shopping cart business logic
- **AIAnalysis.php**: AI analysis storage and retrieval

### API Layer
- RESTful endpoint design
- JSON request/response format
- Comprehensive error handling
- CORS support for frontend integration

### Security Features
- Password hashing with PHP's password_hash()
- SQL injection prevention with prepared statements
- File upload validation and sanitization
- Session token-based authentication

## 🤖 AI Integration

### Gemini Vision API Integration
The platform integrates with Google's Gemini Vision API to analyze room photos and provide furniture suggestions.

#### Analysis Process
1. **Image Upload**: User uploads room photo
2. **Preprocessing**: Image validation and optimization
3. **AI Analysis**: Send to Gemini API with structured prompt
4. **Response Processing**: Parse AI response and match with inventory
5. **Result Display**: Show suggestions with matching products

#### Prompt Engineering
The AI prompt is carefully crafted to provide:
- Structured JSON responses
- Specific furniture recommendations
- Color and material suggestions
- Placement advice based on room layout
- Cost estimations

### AI Features Roadmap
- [ ] Style transfer visualization
- [ ] 3D room rendering
- [ ] Seasonal trend analysis
- [ ] Personalized recommendations based on purchase history

## 📱 User Experience

### User Journey
1. **Browse Products**: Explore catalog with filtering
2. **Upload Room Photo**: Use AI design assistant
3. **Get AI Suggestions**: Receive personalized recommendations
4. **Add to Cart**: Select suggested or browsed items
5. **Checkout**: Complete purchase (coming soon)

### Design Principles
- **Intuitive Navigation**: Clear, consistent interface
- **Visual Appeal**: Modern, clean design aesthetic
- **Performance**: Fast loading and responsive interactions
- **Accessibility**: WCAG guidelines compliance

## 🔒 Security Considerations

### Data Protection
- User passwords are hashed and salted
- Session tokens expire automatically
- File uploads are validated and sanitized
- SQL injection prevention with prepared statements

### API Security
- Authentication required for sensitive operations
- Rate limiting on AI analysis requests
- Input validation on all endpoints
- CORS configuration for allowed origins

## 🚀 Deployment

### Production Setup
1. **Web Server Configuration**
   - Configure Apache/Nginx virtual hosts
   - Enable mod_rewrite for clean URLs
   - Set appropriate file permissions

2. **Database Optimization**
   - Create database indexes for performance
   - Set up regular backups
   - Configure connection pooling

3. **Security Hardening**
   - Use HTTPS in production
   - Configure firewall rules
   - Regular security updates

### Environment Variables
```bash
# Production configuration
DB_HOST=production_host
DB_NAME=furniture_eshop
DB_USER=app_user
DB_PASS=secure_password
GEMINI_API_KEY=production_api_key
APP_ENV=production
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Product browsing and filtering
- [ ] Cart operations (add, update, remove)
- [ ] AI image upload and analysis
- [ ] Responsive design on multiple devices
- [ ] Error handling and edge cases

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Test product endpoint
curl -X GET "http://localhost:8000/backend/api/products.php"

# Test authenticated cart endpoint
curl -X GET "http://localhost:8000/backend/api/cart.php" \
  -H "Authorization: Bearer your_token_here"
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style Guidelines
- Use consistent indentation (2 spaces)
- Follow PSR-4 standards for PHP
- Use meaningful variable and function names
- Add comments for complex logic
- Validate all user inputs

### Bug Reports
Please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Console errors or logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Abdelrahman Tamer**
- GitHub: [@AbdelrahmanTamer11](https://github.com/AbdelrahmanTamer11)
- Email: [your-email@example.com]

## 🙏 Acknowledgments

- Google Gemini API for AI-powered analysis
- Modern CSS techniques for responsive design
- PHP community for excellent documentation
- Open source contributors and tutorials

## 🔮 Future Enhancements

### Short Term
- [ ] Order management system
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] User reviews and ratings
- [ ] Wishlist functionality

### Long Term
- [ ] AR/VR room visualization
- [ ] Machine learning recommendations
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Analytics and reporting

## 📞 Support

For support, email support@furnivision.com or create an issue in the GitHub repository.

---

Built with ❤️ for the future of furniture shopping