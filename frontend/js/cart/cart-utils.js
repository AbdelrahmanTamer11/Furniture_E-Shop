// Initialize cart manager
const cartManager = new CartManager();

// Add scroll to home on page load
document.addEventListener('DOMContentLoaded', () => {
    // Scroll to home section immediately when page loads
    setTimeout(() => {
        const homeSection = document.getElementById('home');
        if (homeSection) {
            homeSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback: scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, 100); // Small delay to ensure page is fully loaded
});

// Global functions for HTML handlers
function toggleCart() {
    if (window.cartManager) {
        window.cartManager.openCart();
    }
}

function closeCart() {
    if (window.cartManager) {
        window.cartManager.closeCart();
    } else {
        // Fallback if cartManager not available
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function checkout() {
    console.log('=== CHECKOUT FUNCTION CALLED ===');
    console.log('CartManager exists:', !!window.cartManager);
    console.log('Current user:', window.app?.currentUser);

    if (!window.app?.currentUser) {
        console.log('User not logged in');
        window.app.showAlert('Please login to checkout', 'warning');
        toggleAuth();
        return;
    }

    if (!window.cartManager) {
        console.error('CartManager not available');
        window.app.showAlert('Cart system not available. Please refresh the page.', 'error');
        return;
    }

    if (window.cartManager.cartItems.length === 0) {
        console.log('Cart is empty');
        window.app.showAlert('Your cart is empty', 'warning');
        return;
    }

    console.log('Starting checkout process...');
    window.cartManager.startCheckout();
}

// Export for global access
window.cartManager = cartManager;
