// Cart action methods for CartPageManager
CartPageManager.prototype.updateQuantity = function (itemId, newQuantity) {
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
};

CartPageManager.prototype.removeItem = function (itemId) {
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
};

CartPageManager.prototype.clearCart = function () {
    if (this.cart.length === 0) return;

    if (confirm('Are you sure you want to clear your cart?')) {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        this.updateCartCount();
        this.showNotification('Cart cleared');
    }
};
