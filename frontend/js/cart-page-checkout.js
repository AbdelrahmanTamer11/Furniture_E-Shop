// Checkout and summary methods for CartPageManager
CartPageManager.prototype.updateSummary = function () {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingRate;
    const tax = subtotal * this.taxRate;
    const total = subtotal + shipping + tax;

    // Safely update elements if they exist
    const subtotalEl = document.getElementById('subtotalAmount');
    const shippingEl = document.getElementById('shippingAmount');
    const taxEl = document.getElementById('taxAmount');
    const totalEl = document.getElementById('totalAmount');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    // Update checkout button state
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        if (total > this.userBalance) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'INSUFFICIENT BALANCE';
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'CHECKOUT';
        }
    }
};

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
