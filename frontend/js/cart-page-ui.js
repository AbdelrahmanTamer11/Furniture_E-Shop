// UI rendering methods for CartPageManager
CartPageManager.prototype.updateCartDisplay = function () {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');

    if (!cartItemsList || !emptyCart) {
        console.error('Required cart elements not found');
        return;
    }

    if (this.cart.length === 0) {
        cartItemsList.style.display = 'none';
        emptyCart.style.display = 'block';
        this.updateSummary();
        return;
    }

    cartItemsList.style.display = 'block';
    emptyCart.style.display = 'none';

    cartItemsList.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
    this.updateSummary();
};

CartPageManager.prototype.createCartItemHTML = function (item) {
    return `
        <div class="cart-item-modern" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image-modern">
            <div class="item-details-modern">
                <h3 class="item-name-modern">${item.name}</h3>
                <p class="item-price-modern">$${item.price.toFixed(2)}</p>
                <p class="item-description">${item.description || 'Premium quality furniture'}</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn-modern" onclick="cartPageManager.updateQuantity(${item.id}, ${item.quantity - 1})">
                    −
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn-modern" onclick="cartPageManager.updateQuantity(${item.id}, ${item.quantity + 1})">
                    +
                </button>
            </div>
            <button class="remove-item-btn" onclick="cartPageManager.removeItem(${item.id})" title="Remove item">
                ×
            </button>
        </div>
    `;
};

CartPageManager.prototype.showNotification = function (message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #16a34a, #22c55e);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};
