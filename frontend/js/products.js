// Product management module
class ProductManager {
    constructor() {
        this.API_BASE = 'http://localhost:8000/backend/api';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalProducts = 0;
        this.setupProductHandlers();
    }

    setupProductHandlers() {
        // Setup infinite scroll or pagination
        this.setupScrollListener();

        // Setup product quickview
        this.setupQuickView();

        // Setup product comparison
        this.setupComparison();
    }

    setupScrollListener() {
        let isLoading = false;

        window.addEventListener('scroll', () => {
            if (isLoading) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.offsetHeight;

            // Load more when user is 200px from bottom
            if (scrollPosition >= documentHeight - 200) {
                isLoading = true;
                this.loadMoreProducts().finally(() => {
                    isLoading = false;
                });
            }
        });
    }

    async loadMoreProducts() {
        this.currentPage++;

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            const response = await fetch(`${this.API_BASE}/products.php?${params}`);
            const data = await response.json();

            if (data.products && data.products.length > 0) {
                this.appendProducts(data.products);
            } else {
                // No more products to load
                this.showEndMessage();
            }
        } catch (error) {
            console.error('Failed to load more products:', error);
        }
    }

    appendProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image_url || product.image || '/images/placeholder-furniture.svg'}" 
                         alt="${product.name}" loading="lazy"
                         onerror="this.src='/images/placeholder-furniture.svg'">
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-details">
                        <span>Style: ${product.style || 'N/A'}</span>
                        <span>Color: ${product.color || 'N/A'}</span>
                        <span>Material: ${product.material || 'N/A'}</span>
                    </div>
                    <div class="product-dimensions">
                        <small>Dimensions: ${product.dimensions || 'N/A'}</small>
                    </div>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="product-stock">
                        <small>In Stock: ${product.stock_quantity || 0} items</small>
                    </div>
                    <button class="add-to-cart-btn" onclick="handleAddToCart(${product.id})">
                        Add to Cart
                    </button>
                </div>
            `;
            grid.appendChild(productCard);
        });
    }

    showEndMessage() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const endMessage = document.createElement('div');
        endMessage.className = 'end-of-products';
        endMessage.innerHTML = '<p>You\'ve reached the end of our catalog!</p>';
        grid.appendChild(endMessage);
    }

    setupQuickView() {
        // Create quick view modal
        this.createQuickViewModal();
    }

    createQuickViewModal() {
        const modal = document.createElement('div');
        modal.id = 'quickViewModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Product Details</h3>
                    <button class="close-modal" onclick="productManager.closeQuickView()">×</button>
                </div>
                <div class="modal-body">
                    <div class="product-quick-view">
                        <div class="product-image-section">
                            <img id="quickViewImage" src="" alt="Product Image" class="main-product-image">
                            <div class="product-gallery" id="quickViewGallery">
                                <!-- Additional images will go here -->
                            </div>
                        </div>
                        <div class="product-details-section">
                            <h2 id="quickViewName"></h2>
                            <div id="quickViewPrice" class="product-price"></div>
                            <div id="quickViewDescription" class="product-description"></div>
                            <div class="product-meta">
                                <div class="meta-item">
                                    <strong>Style:</strong> <span id="quickViewStyle"></span>
                                </div>
                                <div class="meta-item">
                                    <strong>Material:</strong> <span id="quickViewMaterial"></span>
                                </div>
                                <div class="meta-item">
                                    <strong>Dimensions:</strong> <span id="quickViewDimensions"></span>
                                </div>
                                <div class="meta-item">
                                    <strong>Stock:</strong> <span id="quickViewStock"></span>
                                </div>
                            </div>
                            <div class="quantity-selector">
                                <label for="quickViewQuantity">Quantity:</label>
                                <div class="quantity-controls">
                                    <button onclick="productManager.changeQuantity(-1)">-</button>
                                    <input type="number" id="quickViewQuantity" value="1" min="1">
                                    <button onclick="productManager.changeQuantity(1)">+</button>
                                </div>
                            </div>
                            <div class="product-actions">
                                <button class="btn-primary" id="quickViewAddToCart">Add to Cart</button>
                                <button class="btn-secondary" onclick="productManager.addToWishlist()">♡ Wishlist</button>
                                <button class="btn-secondary" onclick="productManager.shareProduct()">Share</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async showQuickView(productId) {
        try {
            const response = await fetch(`${this.API_BASE}/products.php?id=${productId}`);
            const data = await response.json();

            if (data.product) {
                this.populateQuickView(data.product);
                document.getElementById('quickViewModal').classList.add('show');
            }
        } catch (error) {
            console.error('Failed to load product details:', error);
            app.showAlert('Failed to load product details', 'error');
        }
    }

    populateQuickView(product) {
        document.getElementById('quickViewImage').src = product.image_url || '/images/placeholder-furniture.svg';
        document.getElementById('quickViewName').textContent = product.name;
        document.getElementById('quickViewPrice').textContent = `$${parseFloat(product.price).toFixed(2)}`;
        document.getElementById('quickViewDescription').textContent = product.description || '';
        document.getElementById('quickViewStyle').textContent = product.style || 'N/A';
        document.getElementById('quickViewMaterial').textContent = product.material || 'N/A';
        document.getElementById('quickViewDimensions').textContent = product.dimensions || 'N/A';
        document.getElementById('quickViewStock').textContent = product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock';

        // Setup add to cart button
        const addToCartBtn = document.getElementById('quickViewAddToCart');
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('quickViewQuantity').value);
            app.addToCart(product.id, quantity);
            this.closeQuickView();
        };

        // Handle gallery images if available
        if (product.gallery_images) {
            this.populateGallery(JSON.parse(product.gallery_images));
        }
    }

    populateGallery(images) {
        const gallery = document.getElementById('quickViewGallery');
        gallery.innerHTML = '';

        images.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.onclick = () => {
                document.getElementById('quickViewImage').src = imageUrl;
            };
            gallery.appendChild(img);
        });
    }

    closeQuickView() {
        document.getElementById('quickViewModal').classList.remove('show');
    }

    changeQuantity(delta) {
        const quantityInput = document.getElementById('quickViewQuantity');
        const currentValue = parseInt(quantityInput.value);
        const newValue = Math.max(1, currentValue + delta);
        quantityInput.value = newValue;
    }














    // Advanced filtering
    setupAdvancedFilters() {
        this.createFilterSidebar();
    }

    createFilterSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'filterSidebar';
        sidebar.className = 'filter-sidebar';
        sidebar.innerHTML = `
            <div class="filter-header">
                <h3>Filters</h3>
                <button onclick="productManager.clearAllFilters()">Clear All</button>
            </div>
            <div class="filter-sections">
                <div class="filter-section">
                    <h4>Price Range</h4>
                    <div class="price-range-slider">
                        <input type="range" id="minPrice" min="0" max="2000" value="0">
                        <input type="range" id="maxPrice" min="0" max="2000" value="2000">
                        <div class="price-values">
                            <span id="minPriceValue">$0</span> - <span id="maxPriceValue">$2000</span>
                        </div>
                    </div>
                </div>
                <div class="filter-section">
                    <h4>Categories</h4>
                    <div class="filter-checkboxes" id="categoryFilters">
                        <!-- Category checkboxes will be populated here -->
                    </div>
                </div>
                <div class="filter-section">
                    <h4>Styles</h4>
                    <div class="filter-checkboxes" id="styleFilters">
                        <!-- Style checkboxes will be populated here -->
                    </div>
                </div>
                <div class="filter-section">
                    <h4>Materials</h4>
                    <div class="filter-checkboxes" id="materialFilters">
                        <!-- Material checkboxes will be populated here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);
    }

    // Wishlist functionality
    addToWishlist(productId) {
        if (!app.currentUser) {
            app.showAlert('Please login to add items to wishlist', 'warning');
            toggleAuth();
            return;
        }

        // This would be implemented with backend storage
        app.showAlert('Added to wishlist!', 'success');
    }

    // Product sharing
    shareProduct(productId, productName) {
        const shareData = {
            title: productName,
            text: `Check out this furniture item: ${productName}`,
            url: `${window.location.origin}/?product=${productId}`
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                app.showAlert('Product link copied to clipboard!', 'success');
            });
        }
    }
}

// Initialize product manager
const productManager = new ProductManager();

// Export for global access
window.productManager = productManager;
