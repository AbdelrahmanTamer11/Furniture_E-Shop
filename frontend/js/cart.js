// Shopping cart management module
class CartManager {
    constructor() {
        this.API_BASE = '/backend/api';
        this.cartItems = [];
        this.isOpen = false;
        this.cartTotal = 0;
        this.cartCount = 0;
        this.userBalance = 0;
        this.setupCartHandlers();
        this.loadCart();
    }

    setupCartHandlers() {
        // Setup cart sidebar toggle
        this.setupCartSidebar();

        // Setup checkout process
        this.setupCheckout();

        // Setup cart persistence
        this.setupCartPersistence();
    }

    setupCartSidebar() {
        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cartSidebar');
            const cartBtn = document.querySelector('.cart-btn');

            if (cartSidebar && cartSidebar.classList.contains('open')) {
                if (!cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
                    this.closeCart();
                }
            }
        });

        // Close cart with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }

    openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.remove('open');
        document.body.style.overflow = ''; // Restore scrolling
    }

    async loadCart() {
        console.log('=== LOAD CART START ===');
        console.log('Current user from app:', window.app?.currentUser);
        console.log('Auth token exists:', !!localStorage.getItem('auth_token'));

        if (!app.currentUser) {
            console.log('No current user, loading guest cart');
            this.loadGuestCart();
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            console.log('Token length:', token?.length);
            console.log('Token preview:', token?.substring(0, 50) + '...');

            const response = await fetch(`${this.API_BASE}/cart.php`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Cart API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('=== CART API FULL RESPONSE ===', data);

                this.cartItems = data.items || [];
                this.cartTotal = parseFloat(data.total || 0);
                this.cartCount = parseInt(data.count || 0);
                this.userBalance = parseFloat(data.balance || 0);

                console.log('=== PARSED VALUES ===');
                console.log('cartItems count:', this.cartItems.length);
                console.log('cartTotal:', this.cartTotal);
                console.log('cartCount:', this.cartCount);
                console.log('userBalance:', this.userBalance);
                console.log('userBalance type:', typeof this.userBalance);

                if (data.debug) {
                    console.log('=== DEBUG INFO ===', data.debug);
                }

                this.updateCartUI();
            } else {
                console.error('Failed to load cart, response not ok:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }

        console.log('=== LOAD CART END ===');
    }

    loadGuestCart() {
        // Load cart from localStorage for guest users
        const guestCart = localStorage.getItem('guest_cart');
        if (guestCart) {
            try {
                this.cartItems = JSON.parse(guestCart);
                this.calculateCartTotals();
                this.updateCartUI();
            } catch (error) {
                console.error('Failed to load guest cart:', error);
                localStorage.removeItem('guest_cart');
            }
        }
    }

    saveGuestCart() {
        localStorage.setItem('guest_cart', JSON.stringify(this.cartItems));
    }

    calculateCartTotals() {
        this.cartTotal = this.cartItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        this.cartCount = this.cartItems.reduce((sum, item) => {
            return sum + parseInt(item.quantity);
        }, 0);
    }

    updateCartUI() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateCartTotal();
        this.updateCartBadge();
        this.updateBalanceDisplay();
        this.updateCheckoutButton();
    }

    updateCartCount() {
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = this.cartCount;
        }
    }

    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        if (this.cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Add some furniture to get started!</p>
                    <button class="btn-primary" onclick="cartManager.closeCart(); scrollToProducts();">
                        Browse Products
                    </button>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = this.cartItems.map(item => this.createCartItemHTML(item)).join('');
    }

    createCartItemHTML(item) {
        const imageUrl = item.image_url || '/images/placeholder-furniture.svg';
        const subtotal = parseFloat(item.price) * parseInt(item.quantity);

        return `
            <div class="cart-item" data-product-id="${item.product_id || item.id}">
                <img src="${imageUrl}" alt="${item.name}" class="cart-item-image" 
                     onerror="this.src='/images/placeholder-furniture.svg'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                    <div class="cart-item-meta">
                        <span class="item-style">${item.style || ''}</span>
                        <span class="item-material">${item.material || ''}</span>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.product_id || item.id}, ${item.quantity - 1})">
                            −
                        </button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.stock_quantity || 99}" 
                               class="quantity-input" 
                               onchange="cartManager.updateQuantity(${item.product_id || item.id}, this.value)">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${item.product_id || item.id}, ${item.quantity + 1})">
                            +
                        </button>
                    </div>
                    <div class="cart-item-subtotal">
                        Subtotal: $${subtotal.toFixed(2)}
                    </div>
                </div>
                <button class="remove-item-btn" onclick="cartManager.removeItem(${item.product_id || item.id})" 
                        title="Remove item">
                    ×
                </button>
            </div>
        `;
    }

    updateCartTotal() {
        const cartTotalElement = document.getElementById('cartTotal');
        if (cartTotalElement) {
            cartTotalElement.textContent = this.cartTotal.toFixed(2);
        }
    }

    updateCartBadge() {
        const cartBtn = document.querySelector('.cart-btn');
        if (this.cartCount > 0) {
            cartBtn.classList.add('has-items');
        } else {
            cartBtn.classList.remove('has-items');
        }
    }

    updateBalanceDisplay() {
        console.log('=== UPDATE BALANCE DISPLAY START ===');
        console.log('Current user exists:', !!window.app?.currentUser);
        console.log('User balance value:', this.userBalance);
        console.log('User balance type:', typeof this.userBalance);

        const balanceSection = document.getElementById('cartBalanceSection');
        const balanceDisplay = document.getElementById('userBalanceDisplay');

        console.log('Balance section found:', !!balanceSection);
        console.log('Balance display found:', !!balanceDisplay);

        // Only show balance for logged-in users
        if (!window.app?.currentUser) {
            console.log('No current user, hiding balance');
            if (balanceSection) {
                balanceSection.style.display = 'none';
            }
            return;
        }

        // Show balance section
        if (balanceSection) {
            balanceSection.style.display = 'block';
            console.log('Balance section made visible');
        } else {
            console.error('Balance section not found in DOM');
            return;
        }

        // Update balance amount
        if (balanceDisplay) {
            const balance = parseFloat(this.userBalance || 0);
            const formattedBalance = balance.toFixed(2);
            balanceDisplay.textContent = formattedBalance;
            console.log('Balance display updated to:', formattedBalance);

            // Force DOM update
            balanceDisplay.style.color = balance > 0 ? '#28a745' : '#dc3545';
        } else {
            console.error('Balance display element not found in DOM');
            return;
        }

        // Update visual state based on affordability
        this.updateBalanceState();

        console.log('=== UPDATE BALANCE DISPLAY END ===');
    }

    updateBalanceState() {
        const balanceSection = document.getElementById('cartBalanceSection');
        const total = parseFloat(this.cartTotal || 0);
        const balance = parseFloat(this.userBalance || 0);
        const canAfford = balance >= total;

        if (balanceSection) {
            // Remove existing classes
            balanceSection.classList.remove('sufficient', 'insufficient');

            // Add appropriate class
            if (canAfford) {
                balanceSection.classList.add('sufficient');
            } else {
                balanceSection.classList.add('insufficient');
            }
        }
    }

    updateCheckoutButton() {
        const checkoutBtn = document.querySelector('.cart-footer .btn-primary');
        if (!checkoutBtn) return;

        const hasItems = this.cartItems.length > 0;
        const isLoggedIn = window.app?.currentUser;
        const canAfford = !isLoggedIn || (parseFloat(this.userBalance || 0) >= parseFloat(this.cartTotal || 0));

        if (hasItems && canAfford) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
        } else if (hasItems && !canAfford) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Insufficient Balance';
            checkoutBtn.style.opacity = '0.6';
            checkoutBtn.style.cursor = 'not-allowed';
        } else {
            checkoutBtn.disabled = hasItems ? false : true;
            checkoutBtn.textContent = 'Checkout';
            checkoutBtn.style.opacity = hasItems ? '1' : '0.6';
            checkoutBtn.style.cursor = hasItems ? 'pointer' : 'not-allowed';
        }
    }

    async addToCart(productId, quantity = 1) {
        console.log('CartManager addToCart called:', productId, quantity);

        try {
            const token = localStorage.getItem('auth_token');
            console.log('Making API call to add to cart...');

            const response = await fetch(`${this.API_BASE}/cart.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'add',
                    product_id: parseInt(productId),
                    quantity: parseInt(quantity)
                })
            });

            console.log('Cart API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Cart API success:', result);

                // Update local cart data with API response
                if (result.items !== undefined) {
                    this.cartItems = result.items || [];
                    this.cartTotal = parseFloat(result.total || 0);
                    this.cartCount = parseInt(result.count || 0);
                    this.userBalance = parseFloat(result.balance || 0);

                    console.log('Updated cart data:');
                    console.log('- Items:', this.cartItems.length);
                    console.log('- Total:', this.cartTotal);
                    console.log('- Count:', this.cartCount);
                    console.log('- Balance:', this.userBalance);

                    this.updateCartUI();
                }

                this.showCartNotification('Item added to cart!', 'success');
                this.showMiniCart();
            } else {
                const error = await response.json();
                console.error('Cart API error:', error);
                if (window.app && window.app.showAlert) {
                    window.app.showAlert(error.error || 'Failed to add item to cart', 'error');
                }
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            if (window.app && window.app.showAlert) {
                window.app.showAlert('Network error. Please try again.', 'error');
            }
        }
    }

    async addToGuestCart(productId, quantity) {
        try {
            // Get product details first
            const response = await fetch(`${this.API_BASE}/products.php?id=${productId}`);
            const data = await response.json();

            if (!data.product) {
                app.showAlert('Product not found', 'error');
                return;
            }

            const product = data.product;
            const existingItem = this.cartItems.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.cartItems.push({
                    id: productId,
                    product_id: productId,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    style: product.style,
                    material: product.material,
                    stock_quantity: product.stock_quantity,
                    quantity: quantity
                });
            }

            this.calculateCartTotals();
            this.updateCartUI();
            this.saveGuestCart();
            this.showCartNotification('Item added to cart!', 'success');
            this.showMiniCart();

        } catch (error) {
            console.error('Failed to add to guest cart:', error);
            app.showAlert('Failed to add item to cart', 'error');
        }
    }

    async updateQuantity(productId, newQuantity) {
        newQuantity = parseInt(newQuantity);

        if (newQuantity <= 0) {
            return this.removeItem(productId);
        }

        if (!app.currentUser) {
            return this.updateGuestQuantity(productId, newQuantity);
        }

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
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                this.loadCart();
            }
        } catch (error) {
            console.error('Update quantity error:', error);
        }
    }

    updateGuestQuantity(productId, newQuantity) {
        const item = this.cartItems.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            this.calculateCartTotals();
            this.updateCartUI();
            this.saveGuestCart();
        }
    }

    async removeItem(productId) {
        if (!app.currentUser) {
            return this.removeGuestItem(productId);
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php?product_id=${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showCartNotification('Item removed from cart', 'success');
                this.loadCart();
            }
        } catch (error) {
            console.error('Remove item error:', error);
        }
    }

    removeGuestItem(productId) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
        this.calculateCartTotals();
        this.updateCartUI();
        this.saveGuestCart();
        this.showCartNotification('Item removed from cart', 'success');
    }

    async clearCart() {
        if (!app.currentUser) {
            this.cartItems = [];
            this.calculateCartTotals();
            this.updateCartUI();
            this.saveGuestCart();
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/cart.php?action=clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.loadCart();
                this.showCartNotification('Cart cleared', 'success');
            }
        } catch (error) {
            console.error('Clear cart error:', error);
        }
    }

    showCartNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    showMiniCart() {
        // Show a mini cart preview when items are added
        const miniCart = document.createElement('div');
        miniCart.className = 'mini-cart-preview';
        miniCart.innerHTML = `
            <div class="mini-cart-content">
                <h4>Added to Cart</h4>
                <div class="mini-cart-summary">
                    <span>${this.cartCount} item${this.cartCount !== 1 ? 's' : ''}</span>
                    <span>$${this.cartTotal.toFixed(2)}</span>
                </div>
                <div class="mini-cart-actions">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continue Shopping
                    </button>
                    <button class="btn-primary" onclick="cartManager.openCart(); this.parentElement.parentElement.parentElement.remove();">
                        View Cart
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(miniCart);

        // Position near cart button
        const cartBtn = document.querySelector('.cart-btn');
        const rect = cartBtn.getBoundingClientRect();
        miniCart.style.position = 'fixed';
        miniCart.style.top = rect.bottom + 10 + 'px';
        miniCart.style.right = '20px';
        miniCart.style.zIndex = '1003';

        // Show with animation
        setTimeout(() => {
            miniCart.classList.add('show');
        }, 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (miniCart.parentNode) {
                miniCart.classList.remove('show');
                setTimeout(() => {
                    miniCart.remove();
                }, 300);
            }
        }, 5000);
    }

    async setupCheckout() {
        this.createCheckoutModal();
    }

    createCheckoutModal() {
        const modal = document.createElement('div');
        modal.id = 'checkoutModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Checkout</h3>
                    <button class="close-modal" onclick="cartManager.closeCheckout()">×</button>
                </div>
                <div class="modal-body">
                    <div class="checkout-container">
                        <div class="checkout-left">
                            <div class="checkout-section">
                                <h4>Shipping Information</h4>
                                <form id="checkoutForm">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="firstName">First Name</label>
                                            <input type="text" id="firstName" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="lastName">Last Name</label>
                                            <input type="text" id="lastName" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="email">Email</label>
                                        <input type="email" id="email" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="phone">Phone</label>
                                        <input type="tel" id="phone" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="address">Address</label>
                                        <input type="text" id="address" required>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="city">City</label>
                                            <input type="text" id="city" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="state">State</label>
                                            <input type="text" id="state" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="zipCode">Zip Code</label>
                                            <input type="text" id="zipCode" required>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            
                            <div class="checkout-section">
                                <h4>Payment Method</h4>
                                <div class="payment-methods">
                                    <label class="payment-option">
                                        <input type="radio" name="payment" value="card" checked>
                                        <span>Credit/Debit Card</span>
                                    </label>
                                    <label class="payment-option">
                                        <input type="radio" name="payment" value="paypal">
                                        <span>PayPal</span>
                                    </label>
                                    <label class="payment-option">
                                        <input type="radio" name="payment" value="apple_pay">
                                        <span>Apple Pay</span>
                                    </label>
                                </div>
                                
                                <div class="card-details" id="cardDetails">
                                    <div class="form-group">
                                        <label for="cardNumber">Card Number</label>
                                        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456">
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="expiryDate">Expiry Date</label>
                                            <input type="text" id="expiryDate" placeholder="MM/YY">
                                        </div>
                                        <div class="form-group">
                                            <label for="cvv">CVV</label>
                                            <input type="text" id="cvv" placeholder="123">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="checkout-right">
                            <div class="order-summary">
                                <h4>Order Summary</h4>
                                <div class="summary-items" id="checkoutItems">
                                    <!-- Cart items will be populated here -->
                                </div>
                                <div class="summary-totals">
                                    <div class="summary-line">
                                        <span>Subtotal:</span>
                                        <span id="checkoutSubtotal">$0.00</span>
                                    </div>
                                    <div class="summary-line">
                                        <span>Shipping:</span>
                                        <span id="checkoutShipping">$19.99</span>
                                    </div>
                                    <div class="summary-line">
                                        <span>Tax:</span>
                                        <span id="checkoutTax">$0.00</span>
                                    </div>
                                    <div class="summary-line total">
                                        <span>Total:</span>
                                        <span id="checkoutTotal">$0.00</span>
                                    </div>
                                </div>
                                <button class="btn-primary full-width" onclick="cartManager.processPayment()">
                                    Place Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    startCheckout() {
        if (!app.currentUser) {
            app.showAlert('Please login to checkout', 'warning');
            toggleAuth();
            return;
        }

        if (this.cartItems.length === 0) {
            app.showAlert('Your cart is empty', 'warning');
            return;
        }

        this.populateCheckoutForm();
        document.getElementById('checkoutModal').classList.add('show');
    }

    populateCheckoutForm() {
        // Pre-fill form with user data
        if (app.currentUser) {
            document.getElementById('firstName').value = app.currentUser.first_name || '';
            document.getElementById('lastName').value = app.currentUser.last_name || '';
            document.getElementById('email').value = app.currentUser.email || '';
        }

        // Populate order summary
        this.updateCheckoutSummary();
    }

    updateCheckoutSummary() {
        const itemsContainer = document.getElementById('checkoutItems');
        const subtotalElement = document.getElementById('checkoutSubtotal');
        const shippingElement = document.getElementById('checkoutShipping');
        const taxElement = document.getElementById('checkoutTax');
        const totalElement = document.getElementById('checkoutTotal');

        // Populate items
        itemsContainer.innerHTML = this.cartItems.map(item => `
            <div class="checkout-item">
                <img src="${item.image_url || '/images/placeholder-furniture.svg'}" alt="${item.name}">
                <div class="item-details">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">Qty: ${item.quantity}</span>
                </div>
                <span class="item-total">$${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
            </div>
        `).join('');

        // Calculate totals
        const subtotal = this.cartTotal;
        const shipping = subtotal > 100 ? 0 : 19.99; // Free shipping over $100
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'FREE';
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }

    closeCheckout() {
        document.getElementById('checkoutModal').classList.remove('show');
    }

    processPayment() {
        // Validate form
        const form = document.getElementById('checkoutForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Show loading state
        const placeOrderBtn = document.querySelector('#checkoutModal .btn-primary');
        placeOrderBtn.textContent = 'Processing...';
        placeOrderBtn.disabled = true;

        // Simulate payment processing
        setTimeout(() => {
            this.completeOrder();
        }, 2000);
    }

    completeOrder() {
        // Clear cart
        this.clearCart();

        // Close checkout
        this.closeCheckout();

        // Show success message
        this.showOrderConfirmation();
    }

    showOrderConfirmation() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body text-center">
                    <div class="success-icon">✓</div>
                    <h2>Order Confirmed!</h2>
                    <p>Thank you for your purchase. Your order has been received and will be processed shortly.</p>
                    <div class="order-details">
                        <p><strong>Order Number:</strong> #${Date.now()}</p>
                        <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
                    </div>
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            modal.remove();
        }, 10000);
    }

    setupCartPersistence() {
        // Merge guest cart with user cart when user logs in
        window.addEventListener('user-login', () => {
            this.mergeGuestCart();
        });
    }

    async mergeGuestCart() {
        const guestCart = localStorage.getItem('guest_cart');
        if (!guestCart || !app.currentUser) return;

        try {
            const guestItems = JSON.parse(guestCart);

            // Add each guest cart item to user cart
            for (const item of guestItems) {
                await this.addToCart(item.id, item.quantity);
            }

            // Clear guest cart
            localStorage.removeItem('guest_cart');

        } catch (error) {
            console.error('Failed to merge guest cart:', error);
        }
    }

    // Add this method to better detect if user is logged in
    isUserLoggedIn() {
        // Check multiple authentication indicators
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');
        const authBtn = document.getElementById('authBtn');

        // Check if app instance shows user is logged in
        const appLoggedIn = window.app && window.app.currentUser;

        // Check if auth button shows logged in state (contains "Hi,")
        const isDisplayLoggedIn = authBtn && authBtn.textContent.includes('Hi,');

        return !!(token || appLoggedIn || isDisplayLoggedIn);
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Global functions for HTML handlers
function toggleCart() {
    cartManager.openCart();
}

function checkout() {
    if (!app.currentUser) {
        app.showAlert('Please login to checkout', 'warning');
        toggleAuth();
        return;
    }
    cartManager.checkout();
}

// Export for global access
window.cartManager = cartManager;
