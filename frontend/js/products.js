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
        this.setupScrollListener();
        this.setupQuickView();
        // Removed: this.setupComparison(); // Not used
    }

    setupScrollListener() {
        let isLoading = false;

        window.addEventListener('scroll', () => {
            if (isLoading) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.offsetHeight;

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
                            <div class="product-gallery" id="quickViewGallery"></div>
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

        const addToCartBtn = document.getElementById('quickViewAddToCart');
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('quickViewQuantity').value);
            app.addToCart(product.id, quantity);
            this.closeQuickView();
        };

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

    // Removed: setupAdvancedFilters, createFilterSidebar, addToWishlist, shareProduct (not used)
}

// Initialize product manager
const productManager = new ProductManager();