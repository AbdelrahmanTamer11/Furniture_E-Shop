// Main application JavaScript
const API_BASE = '/backend/api';  // Remove the './backend/api'

class FurnitureApp {
    constructor() {
        this.currentUser = null;
        this.cartItems = [];
        this.products = [];
        this.filteredProducts = [];
        this.isLoadingProducts = false; // Flag to prevent multiple simultaneous API calls
        this.isLoading = false; // Add this to prevent multiple calls
        this.filters = {
            category: '',
            style: '',
            maxPrice: 2000,
            search: ''
        };

        this.init();
    }

    init() {
        this.loadAuthToken();
        this.setupEventListeners();
        this.loadInitialData();
        this.setupSmoothScrolling();
        this.setupMobileNavigation();
    }

    // Authentication management
    loadAuthToken() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.API_BASE}/auth.php?action=profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateAuthUI();
                this.loadCart();

                // Start dynamic balance refresh
                if (window.cartManager) {
                    window.cartManager.startBalanceRefresh();
                }
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('auth_token');
        }
    }

    updateAuthUI() {
        const authBtn = document.getElementById('authBtn');
        if (this.currentUser) {
            authBtn.textContent = `Hi, ${this.currentUser.first_name}`;
            authBtn.onclick = () => this.showUserMenu();
        } else {
            authBtn.textContent = 'Login';
            authBtn.onclick = () => toggleAuth();
        }
    }

    showUserMenu() {
        // Create user menu dropdown
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-menu-content">
                <div class="user-info">
                    <strong>${this.currentUser.first_name} ${this.currentUser.last_name}</strong>
                    <small>${this.currentUser.email}</small>
                </div>
                <div class="menu-items">
                    <a href="#" onclick="app.showProfile()">Profile</a>
                    <a href="#" onclick="app.showOrderHistory()">Orders</a>
                    <a href="#" onclick="app.logout()">Logout</a>
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        // Position menu
        const authBtn = document.getElementById('authBtn');
        const rect = authBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = rect.bottom + 10 + 'px';
        menu.style.right = '20px';
        menu.style.zIndex = '1003';

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !authBtn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    async logout() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await fetch(`${this.API_BASE}/auth.php?action=logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('auth_token');
        this.currentUser = null;
        this.cartItems = [];
        this.updateAuthUI();
        this.updateCartUI();

        // Stop balance refresh when logging out
        if (window.cartManager) {
            window.cartManager.stopBalanceRefresh();
        }

        this.showAlert('Logged out successfully', 'success');

        // Remove user menu if exists
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) userMenu.remove();
    }

    // Event listeners setup
    setupEventListeners() {
        // Remove any existing event listeners first to prevent duplicates
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            // Clone element to remove all existing event listeners
            const newPriceRange = priceRange.cloneNode(true);
            priceRange.parentNode.replaceChild(newPriceRange, priceRange);

            // Add single event listener for price display update only
            newPriceRange.addEventListener('input', (e) => {
                document.getElementById('priceValue').textContent = '$' + e.target.value;
            });
        }

        // Search functionality
        this.setupSearch();

        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Scroll handler for navbar
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    setupSearch() {
        let searchTimeout;
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search furniture...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                // Only call loadProducts, not filterProducts to avoid double calls
                console.log('Search changed, loading products with search:', e.target.value);
                this.loadProducts();
            }, 500); // Increased debounce time for search
        });

        // Add search to navigation if not exists
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !navActions.querySelector('.search-input')) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.appendChild(searchInput);
            navActions.insertBefore(searchContainer, navActions.firstChild);
        }
    }

    handleResize() {
        // Handle responsive layout changes
        this.updateLayout();
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    updateLayout() {
        // Update layout based on screen size
        const isMobile = window.innerWidth <= 768;
        const cartSidebar = document.getElementById('cartSidebar');

        if (isMobile && cartSidebar) {
            cartSidebar.style.width = '100%';
        } else if (cartSidebar) {
            cartSidebar.style.width = '400px';
        }
    }

    // Data loading
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadStyles(),
                this.loadProducts(),
                this.loadFeaturedProducts()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showAlert('Failed to load data. Please refresh the page.', 'error');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.API_BASE}/products.php?action=categories`);
            const data = await response.json();

            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter && data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadStyles() {
        try {
            const response = await fetch(`${this.API_BASE}/products.php?action=styles`);
            const data = await response.json();

            const styleFilter = document.getElementById('styleFilter');
            if (styleFilter && data.styles) {
                data.styles.forEach(style => {
                    const option = document.createElement('option');
                    option.value = style;
                    option.textContent = style;
                    styleFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load styles:', error);
        }
    }

    async loadProducts() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            console.log('Loading products from API...');

            const response = await fetch('./backend/api/products.php');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Products data received:', data);

            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                // Remove duplicates based on product name
                const uniqueProducts = this.removeDuplicateProducts(data.products);
                this.products = uniqueProducts;
                this.filteredProducts = [...this.products];
                this.renderProductsByCategory(this.products);
            } else {
                document.getElementById('productsByCategory').innerHTML =
                    '<p style="text-align: center; color: #666;">No products available.</p>';
            }
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('productsByCategory').innerHTML =
                '<p style="text-align: center; color: #e74c3c;">Error loading products.</p>';
        } finally {
            this.isLoading = false;
        }
    }

    // Add this new method to remove duplicates
    removeDuplicateProducts(products) {
        const seen = new Set();
        return products.filter(product => {
            const key = `${product.name}-${product.category_id}`;
            if (seen.has(key)) {
                return false; // Skip duplicate
            }
            seen.add(key);
            return true; // Keep unique product
        });
    }

    async loadFeaturedProducts() {
        try {
            const response = await fetch(`${this.API_BASE}/products.php?action=featured&limit=6`);
            const data = await response.json();

            // Display featured products in hero section or dedicated area
            this.renderFeaturedProducts(data.products || []);
        } catch (error) {
            console.error('Failed to load featured products:', error);
        }
    }

    // UI rendering
    renderProductsByCategory() {
        const container = document.getElementById('productsByCategory');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
            return;
        }

        // Group products by category
        const productsByCategory = this.groupProductsByCategory(this.products);

        // Render categories
        container.innerHTML = Object.keys(productsByCategory).map(categoryName => {
            const products = productsByCategory[categoryName];
            const visibleProducts = products.slice(0, 5);
            const hasMore = products.length > 5;

            return `
                <div class="category-section" data-category="${categoryName}">
                    <h2 class="category-title">${categoryName}</h2>
                    <div class="products-grid" id="grid-${categoryName.replace(/\s+/g, '-').toLowerCase()}">
                        ${visibleProducts.map(product => this.createProductCard(product)).join('')}
                    </div>
                    ${hasMore ? `
                        <button class="show-more-btn" onclick="app.showMoreProducts('${categoryName}')">
                            Show More (${products.length - 5} more)
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    groupProductsByCategory(products) {
        const grouped = {};

        products.forEach(product => {
            const category = product.category_name || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(product);
        });

        return grouped;
    }

    showMoreProducts(categoryName) {
        const productsByCategory = this.groupProductsByCategory(this.products);
        const categoryProducts = productsByCategory[categoryName] || [];
        const gridId = `grid-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
        const grid = document.getElementById(gridId);
        const showMoreBtn = document.querySelector(`[data-category="${categoryName}"] .show-more-btn`);

        if (!grid || !categoryProducts) return;

        // Show all products for this category
        grid.innerHTML = categoryProducts.map(product => this.createProductCard(product)).join('');

        // Hide the show more button
        if (showMoreBtn) {
            showMoreBtn.style.display = 'none';
        }
    }

    createProductCard(product) {
        const imageUrl = product.image_url || product.image || '/images/placeholder-furniture.svg';

        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         loading="lazy"
                         onerror="this.src='/images/placeholder-furniture.svg'">
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-details">
                        <span class="product-style">Style: ${product.style || 'N/A'}</span>
                        <span class="product-color">Color: ${product.color || 'N/A'}</span>
                        <span class="product-material">Material: ${product.material || 'N/A'}</span>
                    </div>
                    <div class="product-dimensions">
                        <small>Dimensions: ${product.dimensions || 'N/A'}</small>
                    </div>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="product-stock">
                        <small>In Stock: ${product.stock_quantity || 0} items</small>
                    </div>
                    <button class="add-to-cart-btn" onclick="handleAddToCart(${product.id})" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    renderFeaturedProducts(products) {
        // Could be used to populate a featured section
        console.log('Featured products:', products);
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner">⏳ Loading...</div>';
        }
    }

    // Cart functionality
    async loadCart() {
        if (!this.currentUser) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('App loadCart response:', data);

                this.cartItems = data.items || [];
                this.userBalance = parseFloat(data.balance || 0);

                console.log('App - Set userBalance to:', this.userBalance);

                this.updateCartUI();

                // Also update CartManager if it exists
                if (window.cartManager) {
                    window.cartManager.userBalance = this.userBalance;
                    window.cartManager.cartItems = this.cartItems;
                    window.cartManager.cartTotal = parseFloat(data.total || 0);
                    window.cartManager.cartCount = parseInt(data.count || 0);
                    window.cartManager.updateCartUI();
                }
            } else {
                console.error('App loadCart failed:', response.status);
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        console.log('=== APP ADD TO CART METHOD ===');
        console.log('Product ID:', productId);
        console.log('Quantity:', quantity);
        console.log('Current user:', this.currentUser);

        if (!this.currentUser) {
            console.log('User not logged in in app method');
            this.showAlert('You must login first', 'warning');
            toggleAuth();
            return;
        }

        console.log('User is logged in, proceeding with API call...');

        try {
            const token = localStorage.getItem('auth_token');
            console.log('Token exists:', !!token);
            console.log('API URL:', `${API_BASE}/cart.php`);

            const requestBody = {
                action: 'add',
                product_id: parseInt(productId),
                quantity: parseInt(quantity)
            };

            console.log('Request body:', requestBody);

            const response = await fetch(`${API_BASE}/cart.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('API response status:', response.status);

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (response.ok) {
                let result;
                try {
                    result = JSON.parse(responseText);
                    console.log('Parsed API success result:', result);

                    // Update local cart data
                    if (result.items) {
                        this.cartItems = result.items;
                        this.updateCartUI();
                    }

                    this.showAlert('Item added to cart!', 'success');

                    // Also update CartManager if available
                    if (window.cartManager) {
                        window.cartManager.cartItems = result.items || [];
                        window.cartManager.cartTotal = result.total || 0;
                        window.cartManager.cartCount = result.count || 0;
                        window.cartManager.updateCartUI();
                        window.cartManager.showCartNotification('Item added to cart!', 'success');
                    }

                } catch (parseError) {
                    console.error('Failed to parse response as JSON:', parseError);
                    this.showAlert('Item added to cart!', 'success');
                }
            } else {
                console.error('API error status:', response.status);
                console.error('API error response:', responseText);

                let errorMessage = 'Failed to add item to cart';
                try {
                    const error = JSON.parse(responseText);
                    errorMessage = error.error || error.message || errorMessage;
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                }

                this.showAlert(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Network or other error:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        const totalItems = this.cartItems.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        const totalPrice = this.cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        if (cartCount) {
            cartCount.textContent = totalItems;
        }

        if (cartItems) {
            cartItems.innerHTML = this.cartItems.map(item => this.createCartItem(item)).join('');
        }

        if (cartTotal) {
            cartTotal.textContent = totalPrice.toFixed(2);
        }
    }

    createCartItem(item) {
        return `
            <div class="cart-item">
                <img src="${item.image_url || '/images/placeholder-furniture.svg'}" 
                     alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="app.updateCartQuantity(${item.product_id}, ${item.quantity - 1})">−</button>
                        <input type="number" value="${item.quantity}" min="1" 
                               onchange="app.updateCartQuantity(${item.product_id}, this.value)" class="quantity-input">
                        <button class="quantity-btn" onclick="app.updateCartQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="app.removeFromCart(${item.product_id})" title="Remove item">×</button>
            </div>
        `;
    }

    async updateCartQuantity(productId, quantity) {
        if (!this.currentUser) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php?action=update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: parseInt(quantity)
                })
            });

            if (response.ok) {
                this.loadCart();
            }
        } catch (error) {
            console.error('Update cart error:', error);
        }
    }

    async removeFromCart(productId) {
        if (!this.currentUser) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php?product_id=${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showAlert('Item removed from cart', 'success');
                this.loadCart();
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
        }
    }

    // Utility functions
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        document.body.appendChild(alert);

        // Auto remove after 3 seconds
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupMobileNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }
    }

    // Add this method to the FurnitureApp class for testing:

    async testCartAPI() {
        console.log('=== TESTING CART API ===');
        try {
            const response = await fetch(`${this.API_BASE}/cart.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Test API response status:', response.status);
            const result = await response.text();
            console.log('Test API response:', result);

            return response.ok;
        } catch (error) {
            console.error('Test API error:', error);
            return false;
        }
    }


}

// Global functions for HTML onclick handlers
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('open');
}

function toggleAuth() {
    const authModal = document.getElementById('authModal');
    authModal.classList.toggle('show');
}

function loadMoreProducts() {
    console.log('Load more products');
}

function openAIDesign() {
    document.getElementById('ai-design').scrollIntoView({
        behavior: 'smooth'
    });
}

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({
        behavior: 'smooth'
    });
}

function scrollToAbout() {
    document.getElementById('about').scrollIntoView({
        behavior: 'smooth'
    });
}

function scrollToContact() {
    document.getElementById('contact').scrollIntoView({
        behavior: 'smooth'
    });
}

function checkout() {
    if (!app.currentUser) {
        app.showAlert('Please login to checkout', 'warning');
        toggleAuth();
        return;
    }

    if (app.cartItems.length === 0) {
        app.showAlert('Your cart is empty', 'warning');
        return;
    }

    app.showAlert('Checkout functionality coming soon!', 'info');
}

// SINGLE GLOBAL ADD TO CART HANDLER
function handleAddToCart(productId) {
    console.log('=== ADD TO CART CLICKED ===');
    console.log('Product ID:', productId);
    console.log('App current user:', window.app ? window.app.currentUser : 'App not found');

    if (!window.app) {
        console.error('App not initialized');
        alert('System error: App not initialized');
        return;
    }

    // Check if user is logged in
    if (!window.app.currentUser) {
        console.log('User not logged in, showing auth modal');
        window.app.showAlert('You must login first', 'warning');
        toggleAuth();
        return;
    }

    console.log('User is logged in, adding to cart...');
    window.app.addToCart(productId);
}

// Initialize the application
const app = new FurnitureApp();
window.app = app;

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, app initialized');

    // Initialize other managers after DOM is ready
    if (typeof CartManager !== 'undefined') {
        window.cartManager = new CartManager();
        console.log('CartManager initialized');
    }

    if (typeof ProductManager !== 'undefined') {
        window.productManager = new ProductManager();
        console.log('ProductManager initialized');
    }
});

// Test function
window.testAuth = function () {
    console.log('=== AUTH TEST ===');
    console.log('App exists:', !!window.app);
    console.log('Current user:', window.app ? window.app.currentUser : 'No app');
    console.log('Auth token:', localStorage.getItem('auth_token'));
    return window.app ? !!window.app.currentUser : false;
};
