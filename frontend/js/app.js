// Main application JavaScript
const API_BASE = '/backend/api';

class FurnitureApp {
    constructor() {
        this.currentUser = null;
        this.cartItems = [];
        this.products = [];
        this.filteredProducts = [];
        this.isLoadingProducts = false;
        this.isLoading = false;
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
        toggleUserHamburger();
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

        if (window.cartManager) {
            window.cartManager.stopBalanceRefresh();
        }

        this.showAlert('Logged out successfully', 'success');

        const userMenu = document.querySelector('.user-menu');
        if (userMenu) userMenu.remove();

        // Refresh the site after successful logout
        setTimeout(() => {
            window.location.reload();
        }, 800);
    }

    setupEventListeners() {
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            const newPriceRange = priceRange.cloneNode(true);
            priceRange.parentNode.replaceChild(newPriceRange, priceRange);

            newPriceRange.addEventListener('input', (e) => {
                document.getElementById('priceValue').textContent = '$' + e.target.value;
            });
        }

        this.setupSearch();

        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    setupSearch() {
    let searchTimeout;
    let searchInput = document.querySelector('.search-input');

    if (!searchInput) {
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search furniture...';
        searchInput.className = 'search-input';

        const navActions = document.querySelector('.nav-actions');
        if (navActions) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-container';
            searchContainer.appendChild(searchInput);
            navActions.insertBefore(searchContainer, navActions.firstChild);
        }
    }

    // Scroll to products section when search bar is clicked
    searchInput.addEventListener('click', () => {
        const productsSection = document.getElementById('productsByCategory');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            this.filters.search = e.target.value.toLowerCase().trim();
            this.filterProducts();
        }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            this.filters.search = '';
            this.filterProducts();
        }
    });
    }

    handleResize() {
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
        const isMobile = window.innerWidth <= 768;
        const cartSidebar = document.getElementById('cartSidebar');

        if (isMobile && cartSidebar) {
            cartSidebar.style.width = '100%';
        } else if (cartSidebar) {
            cartSidebar.style.width = '400px';
        }
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadStyles(),
                this.loadProducts(),
                this.loadFeaturedProducts()
            ]);
        } catch (error) {
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
            const response = await fetch('./backend/api/products.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                const uniqueProducts = this.removeDuplicateProducts(data.products);
                this.products = uniqueProducts;
                this.filteredProducts = [...this.products];
                this.renderProductsByCategory(this.products);
            } else {
                document.getElementById('productsByCategory').innerHTML =
                    '<p style="text-align: center; color: #666;">No products available.</p>';
            }
        } catch (error) {
            document.getElementById('productsByCategory').innerHTML =
                '<p style="text-align: center; color: #e74c3c;">Error loading products.</p>';
        } finally {
            this.isLoading = false;
        }
    }

    removeDuplicateProducts(products) {
        const seen = new Set();
        return products.filter(product => {
            const key = `${product.name}-${product.category_id}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    async loadFeaturedProducts() {
        try {
            const response = await fetch(`${this.API_BASE}/products.php?action=featured&limit=6`);
            const data = await response.json();
            this.renderFeaturedProducts(data.products || []);
        } catch (error) {
            console.error('Failed to load featured products:', error);
        }
    }

    renderProductsByCategory(productsToRender = null) {
        const container = document.getElementById('productsByCategory');
        if (!container) return;

        const products = productsToRender || this.products;

        if (products.length === 0) {
            if (this.filters.search && this.filters.search.length > 0) {
                container.innerHTML = `<div class="no-products">No products found for "${this.filters.search}". Try a different search term.</div>`;
            } else {
                container.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
            }
            return;
        }

        const productsByCategory = this.groupProductsByCategory(products);

        container.innerHTML = Object.keys(productsByCategory).map(categoryName => {
            const categoryProducts = productsByCategory[categoryName];
            const visibleProducts = categoryProducts.slice(0, 5);
            const hasMore = categoryProducts.length > 5;

            return `
                <div class="category-section" data-category="${categoryName}">
                    <h2 class="category-title">${categoryName}</h2>
                    <div class="products-grid" id="grid-${categoryName.replace(/\s+/g, '-').toLowerCase()}">
                        ${visibleProducts.map(product => this.createProductCard(product)).join('')}
                    </div>
                    ${hasMore ? `
                        <button class="show-more-btn" onclick="app.showMoreProducts('${categoryName}')">
                            Show More (${categoryProducts.length - 5} more)
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

        grid.innerHTML = categoryProducts.map(product => this.createProductCard(product)).join('');

        if (showMoreBtn) {
            showMoreBtn.style.display = 'none';
        }
    }

    createProductCard(product) {
        const imageUrl = product.image_url || product.image || '/images/placeholder-furniture.svg';
        const isOutOfStock = parseInt(product.stock_quantity) <= 0;

        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         loading="lazy"
                         onerror="this.src='/images/placeholder-furniture.svg'">
                    ${isOutOfStock ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
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
                        <small class="${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                            ${isOutOfStock ? 'Out of Stock' : `In Stock: ${product.stock_quantity || 0} items`}
                        </small>
                    </div>
                    <button class="add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}" 
                            onclick="handleAddToCart(${product.id})" 
                            data-product-id="${product.id}"
                            ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    }

    renderFeaturedProducts(products) {
        console.log('Featured products:', products);
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner">⏳ Loading...</div>';
        }
    }

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
                this.userBalance = parseFloat(data.balance || 0);

                this.updateCartUI();

                if (window.cartManager) {
                    window.cartManager.userBalance = this.userBalance;
                    window.cartManager.cartItems = this.cartItems;
                    window.cartManager.cartTotal = parseFloat(data.total || 0);
                    window.cartManager.cartCount = parseInt(data.count || 0);
                    window.cartManager.updateCartUI();
                    window.cartManager.updateBalanceDisplay();
                }
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        if (!this.currentUser) {
            this.showAlert('You must login first', 'warning');
            toggleAuth();
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const requestBody = {
                action: 'add',
                product_id: parseInt(productId),
                quantity: parseInt(quantity)
            };

            const response = await fetch(`${API_BASE}/cart.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();

            if (response.ok) {
                let result;
                try {
                    result = JSON.parse(responseText);

                    if (result.items) {
                        this.cartItems = result.items;
                        this.updateCartUI();
                    }

                    this.showAlert('Item added to cart!', 'success');

                    if (window.cartManager) {
                        window.cartManager.cartItems = result.items || [];
                        window.cartManager.cartTotal = result.total || 0;
                        window.cartManager.cartCount = result.count || 0;
                        window.cartManager.updateCartUI();
                        window.cartManager.showCartNotification('Item added to cart!', 'success');
                    }

                } catch (parseError) {
                    this.showAlert('Item added to cart!', 'success');
                }
            } else {
                let errorMessage = 'Failed to add item to cart';
                try {
                    const error = JSON.parse(responseText);
                    errorMessage = error.error || error.message || errorMessage;
                } catch (parseError) {}
                this.showAlert(errorMessage, 'error');
            }
        } catch (error) {
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

    filterProducts() {
        if (!this.products || this.products.length === 0) {
            return;
        }

        let filteredProducts = [...this.products];

        if (this.filters.search && this.filters.search.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                const searchTerm = this.filters.search;
                return (
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                    (product.category_name && product.category_name.toLowerCase().includes(searchTerm)) ||
                    (product.style && product.style.toLowerCase().includes(searchTerm)) ||
                    (product.material && product.material.toLowerCase().includes(searchTerm)) ||
                    (product.color && product.color.toLowerCase().includes(searchTerm))
                );
            });
        }

        this.renderProductsByCategory(filteredProducts);
    }

    showAlert(message, type = 'info') {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        document.body.appendChild(alert);

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
}

// Global functions for HTML onclick handlers
function toggleCart() {
    if (window.cartManager) {
        window.cartManager.openCart();
    } else {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.toggle('open');
    }
}

function closeCart() {
    if (window.cartManager) {
        window.cartManager.closeCart();
    } else {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function toggleAuth() {
    const authModal = document.getElementById('authModal');
    authModal.classList.toggle('show');
}

function handleAddToCart(productId) {
    if (!window.app) {
        alert('System error: App not initialized');
        return;
    }

    if (!window.app.currentUser) {
        window.app.showAlert('You must login first', 'warning');
        toggleAuth();
        return;
    }

    window.app.addToCart(productId);
}

// Initialize the application
const app = new FurnitureApp();
window.app = app;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof CartManager !== 'undefined') {
        window.cartManager = new CartManager();

        if (window.cartManager.setupCheckout) {
            window.cartManager.setupCheckout();
        }

        setTimeout(() => {
            if (window.app && window.app.currentUser && window.app.userBalance) {
                window.cartManager.userBalance = window.app.userBalance;
                window.cartManager.updateBalanceDisplay();
                window.cartManager.updateCheckoutButton();
            }
        }, 1000);
    }

    if (typeof ProductManager !== 'undefined') {
        window.productManager = new ProductManager();
    }
});

window.testAuth = function () {
    return window.app ? !!window.app.currentUser : false;
};