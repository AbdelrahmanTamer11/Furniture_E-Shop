// Checkout and payment methods for CartManager
CartManager.prototype.setupCheckout = async function () {
    this.createCheckoutModal();
};

CartManager.prototype.createCheckoutModal = function () {
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
                        
                        <button class="btn-primary full-width" onclick="cartManager.processPayment()">
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

CartManager.prototype.startCheckout = async function () {
    console.log('=== START CHECKOUT ===');

    if (!app.currentUser) {
        app.showAlert('Please login to checkout', 'warning');
        toggleAuth();
        return;
    }

    if (this.cartItems.length === 0) {
        app.showAlert('Your cart is empty', 'warning');
        return;
    }

    // FORCE BALANCE CHECK before checkout
    console.log('Current balance before checkout:', this.userBalance);

    // Refresh balance one more time to be sure
    await this.refreshUserBalance();

    // Check balance after refresh
    const userBalance = parseFloat(this.userBalance || 0);
    const cartTotal = parseFloat(this.cartTotal || 0);

    console.log('Balance check after refresh:', { userBalance, cartTotal });

    if (userBalance < cartTotal) {
        console.log('Insufficient balance detected');
        this.showInsufficientBalanceModal();
        return;
    }

    console.log('Balance sufficient, proceeding to checkout');
    this.populateCheckoutForm();
    document.getElementById('checkoutModal').classList.add('show');
    document.body.style.overflow = 'hidden';
};

CartManager.prototype.showInsufficientBalanceModal = function () {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Insufficient Balance</h3>
                <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove(); document.body.style.overflow = '';">×</button>
            </div>
            <div class="modal-body text-center">
                <div class="warning-icon">⚠️</div>
                <h3 style="color: #e74c3c; margin: 1rem 0;">Insufficient Balance</h3>
                <div class="balance-details">
                    <div class="balance-row">
                        <span>Cart Total:</span>
                        <span class="amount">$${this.cartTotal.toFixed(2)}</span>
                    </div>
                    <div class="balance-row">
                        <span>Your Balance:</span>
                        <span class="amount">$${this.userBalance.toFixed(2)}</span>
                    </div>
                    <div class="balance-row shortage">
                        <span>Shortage:</span>
                        <span class="amount">$${(this.cartTotal - this.userBalance).toFixed(2)}</span>
                    </div>
                </div>
                <p style="color: #666; margin: 1rem 0;">You need to add more funds to your account or remove some items from your cart.</p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove(); document.body.style.overflow = '';">
                        Continue Shopping
                    </button>
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove(); document.body.style.overflow = ''; cartManager.closeCart();">
                        Remove Items
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

CartManager.prototype.processPayment = async function () {
    console.log('=== PROCESS PAYMENT ===');

    // Validate form
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Show loading state
    const placeOrderBtn = document.querySelector('#checkoutModal .btn-primary');
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Processing Payment...';
    placeOrderBtn.disabled = true;

    try {
        // Collect form data
        const shippingAddress = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip_code: document.getElementById('zipCode').value
        };

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        console.log('Checkout data:', { shippingAddress, paymentMethod });

        // Make checkout API call
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${this.API_BASE}/checkout.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                shipping_address: shippingAddress,
                billing_address: shippingAddress, // Same as shipping for now
                payment_method: paymentMethod
            })
        });

        console.log('Checkout API response status:', response.status);
        const result = await response.json();
        console.log('Checkout API result:', result);

        if (response.ok && result.success) {
            // Success - show confirmation
            this.showOrderSuccess(result);

            // Update balance in cart manager
            this.userBalance = result.new_balance;

            // Reload cart data
            await this.loadCart();

            // Close checkout modal
            this.closeCheckout();

        } else {
            // Handle errors
            let errorMessage = result.error || 'Payment failed';

            if (result.shortage) {
                errorMessage = `Insufficient balance. You need $${result.shortage.toFixed(2)} more.`;
            }

            this.showAlert(errorMessage, 'error');
        }

    } catch (error) {
        console.error('Checkout error:', error);
        this.showAlert('Network error. Please try again.', 'error');
    } finally {
        // Reset button
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
    }
};

CartManager.prototype.showOrderSuccess = function (orderData) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-body text-center">
                <div class="success-animation">
                    <div class="success-icon">✓</div>
                </div>
                <h2 style="color: #28a745; margin: 1rem 0;">Order Confirmed!</h2>
                <p style="color: #666; font-size: 1.1rem;">Thank you for your purchase!</p>
                
                <div class="order-summary">
                    <div class="order-detail">
                        <strong>Order Number:</strong> ${orderData.order_number}
                    </div>
                    <div class="order-detail">
                        <strong>Total Paid:</strong> $${orderData.total.toFixed(2)}
                    </div>
                    <div class="order-detail">
                        <strong>New Balance:</strong> $${orderData.new_balance.toFixed(2)}
                    </div>
                    <div class="order-detail">
                        <strong>Estimated Delivery:</strong> 3-5 business days
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="cartManager.refreshProductStock(); this.parentElement.parentElement.parentElement.remove(); document.body.style.overflow = '';">
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
            document.body.style.overflow = '';
            // Refresh product stock when modal closes
            this.refreshProductStock();
        }
    }, 15000);
};

// Add new method to refresh product stock display
CartManager.prototype.refreshProductStock = function () {
    // Trigger a reload of products to show updated stock
    if (window.app && window.app.loadProducts) {
        console.log('Refreshing product stock after successful checkout');
        window.app.loadProducts();
    }

    // Also refresh any product cards currently visible
    this.updateVisibleProductStock();
};

CartManager.prototype.updateVisibleProductStock = function () {
    // Find all product cards and refresh their stock display
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        if (addToCartBtn && addToCartBtn.dataset.productId) {
            this.refreshSingleProductStock(addToCartBtn.dataset.productId, card);
        }
    });
};

CartManager.prototype.refreshSingleProductStock = async function (productId, productCard) {
    try {
        const response = await fetch(`${this.API_BASE}/products.php?id=${productId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.product) {
                // Update stock display
                const stockElement = productCard.querySelector('.product-stock small');
                if (stockElement) {
                    const newStock = data.product.stock_quantity;
                    stockElement.textContent = `In Stock: ${newStock} items`;

                    // Disable button if out of stock
                    const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
                    if (newStock <= 0 && addToCartBtn) {
                        addToCartBtn.disabled = true;
                        addToCartBtn.textContent = 'Out of Stock';
                        addToCartBtn.style.background = '#dc3545';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Failed to refresh product stock:', error);
    }
};

CartManager.prototype.showAlert = function (message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.checkout-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `checkout-alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
            <span class="alert-message">${message}</span>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
};

CartManager.prototype.closeCheckout = function () {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.body.style.overflow = '';
};

CartManager.prototype.populateCheckoutForm = function () {
    // Pre-fill form with user data
    if (app.currentUser) {
        document.getElementById('firstName').value = app.currentUser.first_name || '';
        document.getElementById('lastName').value = app.currentUser.last_name || '';
        document.getElementById('email').value = app.currentUser.email || '';
    }

    // Populate order summary
    this.updateCheckoutSummary();
};

CartManager.prototype.updateCheckoutSummary = function () {
    // Remove this method or make it empty since we're not using order summary anymore
    console.log('Checkout summary update skipped - order summary removed');
};
