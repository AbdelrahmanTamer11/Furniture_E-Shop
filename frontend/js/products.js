// Product management module
class ProductManager {
    constructor() {
        this.API_BASE = 'http://localhost/backend/api';
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
                ...app.filters,
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
            const productElement = document.createElement('div');
            productElement.innerHTML = app.createProductCard(product);
            grid.appendChild(productElement.firstElementChild);
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
        document.getElementById('quickViewImage').src = product.image_url || '/images/placeholder-furniture.jpg';
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

    setupComparison() {
        this.comparisonList = [];
        this.createComparisonPanel();
    }

    createComparisonPanel() {
        const panel = document.createElement('div');
        panel.id = 'comparisonPanel';
        panel.className = 'comparison-panel';
        panel.innerHTML = `
            <div class="comparison-header">
                <h4>Compare Products</h4>
                <button onclick="productManager.clearComparison()">Clear All</button>
            </div>
            <div class="comparison-items" id="comparisonItems">
                <!-- Comparison items will go here -->
            </div>
            <div class="comparison-actions">
                <button class="btn-primary" onclick="productManager.showComparison()" disabled id="compareBtn">
                    Compare Selected
                </button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    addToComparison(productId, productData) {
        if (this.comparisonList.length >= 4) {
            app.showAlert('You can compare up to 4 products at a time', 'warning');
            return;
        }

        if (this.comparisonList.find(item => item.id === productId)) {
            app.showAlert('Product already in comparison', 'warning');
            return;
        }

        this.comparisonList.push(productData);
        this.updateComparisonPanel();
        app.showAlert('Product added to comparison', 'success');
    }

    removeFromComparison(productId) {
        this.comparisonList = this.comparisonList.filter(item => item.id !== productId);
        this.updateComparisonPanel();
    }

    updateComparisonPanel() {
        const panel = document.getElementById('comparisonPanel');
        const itemsContainer = document.getElementById('comparisonItems');
        const compareBtn = document.getElementById('compareBtn');

        if (this.comparisonList.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        itemsContainer.innerHTML = '';

        this.comparisonList.forEach(product => {
            const item = document.createElement('div');
            item.className = 'comparison-item';
            item.innerHTML = `
                <img src="${product.image_url || '/images/placeholder-furniture.jpg'}" alt="${product.name}">
                <div class="item-info">
                    <span class="item-name">${product.name}</span>
                    <span class="item-price">$${parseFloat(product.price).toFixed(2)}</span>
                </div>
                <button onclick="productManager.removeFromComparison(${product.id})">×</button>
            `;
            itemsContainer.appendChild(item);
        });

        compareBtn.disabled = this.comparisonList.length < 2;
    }

    showComparison() {
        if (this.comparisonList.length < 2) {
            app.showAlert('Please select at least 2 products to compare', 'warning');
            return;
        }

        this.createComparisonModal();
    }

    createComparisonModal() {
        const modal = document.createElement('div');
        modal.id = 'comparisonModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content extra-large">
                <div class="modal-header">
                    <h3>Product Comparison</h3>
                    <button class="close-modal" onclick="productManager.closeComparison()">×</button>
                </div>
                <div class="modal-body">
                    <div class="comparison-table">
                        ${this.generateComparisonTable()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    generateComparisonTable() {
        let table = '<table><thead><tr><th>Feature</th>';

        // Add headers for each product
        this.comparisonList.forEach(product => {
            table += `<th><img src="${product.image_url || '/images/placeholder-furniture.jpg'}" alt="${product.name}"><br>${product.name}</th>`;
        });

        table += '</tr></thead><tbody>';

        // Add comparison rows
        const features = ['price', 'style', 'material', 'dimensions', 'stock_quantity'];
        const featureLabels = ['Price', 'Style', 'Material', 'Dimensions', 'Stock'];

        features.forEach((feature, index) => {
            table += `<tr><td><strong>${featureLabels[index]}</strong></td>`;

            this.comparisonList.forEach(product => {
                let value = product[feature] || 'N/A';
                if (feature === 'price') {
                    value = `$${parseFloat(value).toFixed(2)}`;
                } else if (feature === 'stock_quantity') {
                    value = value > 0 ? `${value} available` : 'Out of stock';
                }
                table += `<td>${value}</td>`;
            });

            table += '</tr>';
        });

        // Add action row
        table += '<tr><td><strong>Actions</strong></td>';
        this.comparisonList.forEach(product => {
            table += `<td><button class="btn-primary small" onclick="app.addToCart(${product.id})">Add to Cart</button></td>`;
        });
        table += '</tr>';

        table += '</tbody></table>';

        return table;
    }

    closeComparison() {
        const modal = document.getElementById('comparisonModal');
        if (modal) {
            modal.remove();
        }
    }

    clearComparison() {
        this.comparisonList = [];
        this.updateComparisonPanel();
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
