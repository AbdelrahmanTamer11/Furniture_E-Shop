class CartPageManager {
    constructor() {
        this.cart = [];
        this.userBalance = 1212.17;
        this.shippingRate = 29.99;
        this.taxRate = 0.08;
        this.freeShippingThreshold = 500;

        this.init();
    }

    init() {
        this.loadCart();
        this.updateCartDisplay();
        this.updateCartCount();
        this.updateUserBalance();
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        this.cart = savedCart ? JSON.parse(savedCart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        const cartItemsList = document.getElementById('cartItemsList');
        const emptyCart = document.getElementById('emptyCart');

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
    }

    createCartItemHTML(item) {
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
    }

    updateQuantity(itemId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(itemId);
            return;
        }

        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.cart[itemIndex].quantity = newQuantity;
            this.saveCart();
            this.updateCartDisplay();
            this.updateCartCount();
            this.showNotification('Quantity updated');
        }
    }

    removeItem(itemId) {
        const itemElement = document.querySelector(`[data-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('removing');

            setTimeout(() => {
                this.cart = this.cart.filter(item => item.id !== itemId);
                this.saveCart();
                this.updateCartDisplay();
                this.updateCartCount();
                this.showNotification('Item removed from cart');
            }, 300);
        }
    }

    clearCart() {
        if (this.cart.length === 0) return;

        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
            this.updateCartCount();
            this.showNotification('Cart cleared');
        }
    }

    updateSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingRate;
        const tax = subtotal * this.taxRate;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotalAmount').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shippingAmount').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;

        // Update checkout button state
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (total > this.userBalance) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'INSUFFICIENT BALANCE';
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'CHECKOUT';
        }
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    updateUserBalance() {
        document.getElementById('userBalance').textContent = `$${this.userBalance.toFixed(2)}`;
    }

    showNotification(message) {
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
    }
}

// Global functions
function proceedToCheckout() {
    if (cartPageManager.cart.length === 0) {
        cartPageManager.showNotification('Your cart is empty');
        return;
    }

    const total = cartPageManager.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = total >= cartPageManager.freeShippingThreshold ? 0 : cartPageManager.shippingRate;
    const tax = total * cartPageManager.taxRate;
    const finalTotal = total + shipping + tax;

    if (finalTotal > cartPageManager.userBalance) {
        cartPageManager.showNotification('Insufficient balance');
        return;
    }

    // Redirect to checkout page or open checkout modal
    window.location.href = 'checkout.html';
}

function clearCart() {
    cartPageManager.clearCart();
}

// Initialize cart page manager
let cartPageManager;
document.addEventListener('DOMContentLoaded', () => {
    cartPageManager = new CartPageManager();
});

// Sample data for testing (remove in production)
if (localStorage.getItem('cart') === null) {
    const sampleCart = [
        {
            id: 1,
            name: 'Industrial Bookshelf',
            price: 199.99,
            image: 'images/bookshelf1.jpg',
            description: 'Modern industrial style bookshelf with metal frame',
            quantity: 2
        }
    ];
    localStorage.setItem('cart', JSON.stringify(sampleCart));
}
