// UI update methods for CartManager
CartManager.prototype.updateCartUI = function () {
    this.updateCartCount();
    this.updateCartItems();
    this.updateCartTotal();
    this.updateCartBadge();
    this.updateBalanceDisplay();
    this.updateCheckoutButton();
};

CartManager.prototype.updateCartCount = function () {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = this.cartCount;
    }
};

CartManager.prototype.updateCartItems = function () {
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
};

CartManager.prototype.createCartItemHTML = function (item) {
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
};

CartManager.prototype.updateCartTotal = function () {
    const cartTotalElement = document.getElementById('cartTotal');
    if (cartTotalElement) {
        cartTotalElement.textContent = this.cartTotal.toFixed(2);
    }
};

CartManager.prototype.updateCartBadge = function () {
    const cartBtn = document.querySelector('.cart-btn');
    if (this.cartCount > 0) {
        cartBtn.classList.add('has-items');
    } else {
        cartBtn.classList.remove('has-items');
    }
};

CartManager.prototype.updateBalanceDisplay = function () {
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
};

CartManager.prototype.updateBalanceState = function () {
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
};

CartManager.prototype.updateCheckoutButton = function () {
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
};

CartManager.prototype.showCartNotification = function (message, type) {
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
};

CartManager.prototype.showMiniCart = function () {
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
};
