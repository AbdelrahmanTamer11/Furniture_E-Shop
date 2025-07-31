// Main application JavaScript
class FurnitureApp {
    constructor() {
        this.API_BASE = 'http://localhost/backend/api';
        this.currentUser = null;
        this.cartItems = [];
        this.products = [];
        this.filters = {
            category: '',
            style: '',
            maxPrice: 2000,
            search: ''
        };

        this.init();
    }

    init() {
        console.log('Initializing FurnitureApp...');
        try {
            this.loadAuthToken();
            this.setupEventListeners();
            this.loadInitialData();
            this.setupSmoothScrolling();
            this.setupMobileNavigation();
            console.log('FurnitureApp initialized successfully');
        } catch (error) {
            console.error('Error initializing FurnitureApp:', error);
        }
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
        this.showAlert('Logged out successfully', 'success');

        // Remove user menu if exists
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) userMenu.remove();
    }

    // Event listeners setup
    setupEventListeners() {
        console.log('Setting up event listeners...');
        try {
            // Price range filter
            const priceRange = document.getElementById('priceRange');
            if (priceRange) {
                priceRange.addEventListener('input', (e) => {
                    document.getElementById('priceValue').textContent = '$' + e.target.value;
                    this.filters.maxPrice = parseInt(e.target.value);
                });
            } else {
                console.warn('priceRange element not found');
            }

            // Search functionality
            this.setupSearch();

            // Window resize handler
            window.addEventListener('resize', this.handleResize.bind(this));

            // Scroll handler for navbar
            window.addEventListener('scroll', this.handleScroll.bind(this));

            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
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
                this.filterProducts();
            }, 300);
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
        try {
            this.showLoading('productsGrid');
            const params = new URLSearchParams(this.filters);
            const response = await fetch(`${this.API_BASE}/products.php?${params}`);
            const data = await response.json();

            this.products = data.products || [];
            this.renderProducts();
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showAlert('Failed to load products', 'error');
        }
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
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const imageUrl = product.image_url || '/images/placeholder-furniture.jpg';
        const inStock = product.stock_quantity > 0;

        return `
            <div class="product-card">
                <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                     onerror="this.src='/images/placeholder-furniture.jpg'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-meta">
                        <span class="product-style">${product.style || 'N/A'}</span>
                        <span class="product-category">${product.category_name || 'N/A'}</span>
                    </div>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <button class="add-to-cart-btn" 
                            onclick="app.addToCart(${product.id})" 
                            ${!inStock ? 'disabled' : ''}>
                        ${inStock ? 'Add to Cart' : 'Out of Stock'}
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
                this.cartItems = data.items || [];
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        if (!this.currentUser) {
            this.showAlert('Please login to add items to cart', 'warning');
            toggleAuth();
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php?action=add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            if (response.ok) {
                this.showAlert('Item added to cart!', 'success');
                this.loadCart();
            } else {
                const error = await response.json();
                this.showAlert(error.error || 'Failed to add item to cart', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showAlert('Failed to add item to cart', 'error');
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
                <img src="${item.image_url || '/images/placeholder-furniture.jpg'}" 
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

        document.body.insertBefore(alert, document.body.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
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

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const styleFilter = document.getElementById('styleFilter');
    const priceRange = document.getElementById('priceRange');

    app.filters.category = categoryFilter.value;
    app.filters.style = styleFilter.value;
    app.filters.maxPrice = parseInt(priceRange.value);

    app.loadProducts();
}

function loadMoreProducts() {
    // Implement pagination logic here
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

    // Implement checkout logic
    app.showAlert('Checkout functionality coming soon!', 'info');
}

// Initialize the application
const app = new FurnitureApp();

// Export for use in other modules
window.app = app;
