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

        // CRITICAL: Fetch fresh balance every time cart is opened
        this.refreshBalanceOnOpen();
    }

    // Add new method to refresh balance when cart opens
    async refreshBalanceOnOpen() {
        if (!window.app?.currentUser) {
            return; // No user logged in, no balance to fetch
        }

        try {
            console.log('=== REFRESHING BALANCE ON CART OPEN ===');
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`${this.API_BASE}/balance.php`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Balance refresh on cart open:', data);

                if (data.balance !== undefined) {
                    this.userBalance = parseFloat(data.balance);
                    console.log('Balance updated on cart open to:', this.userBalance);

                    // Update UI immediately
                    this.updateBalanceDisplay();
                    this.updateCheckoutButton();
                }
            } else {
                console.error('Balance refresh on cart open failed:', response.status);
            }
        } catch (error) {
            console.error('Error refreshing balance on cart open:', error);
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.remove('open');
            document.body.style.overflow = ''; // Restore scrolling
        }
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

                // CRITICAL FIX: Ensure balance is properly loaded
                this.userBalance = parseFloat(data.balance || 0);

                console.log('=== PARSED VALUES ===');
                console.log('cartItems count:', this.cartItems.length);
                console.log('cartTotal:', this.cartTotal);
                console.log('cartCount:', this.cartCount);
                console.log('userBalance:', this.userBalance);
                console.log('userBalance type:', typeof this.userBalance);

                // FORCE BALANCE REFRESH if it's still 0
                if (this.userBalance === 0 && app.currentUser) {
                    console.log('Balance is 0, forcing refresh...');
                    await this.refreshUserBalance();
                }

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

    // Add new method to force balance refresh
    async refreshUserBalance() {
        try {
            console.log('=== REFRESHING USER BALANCE ===');
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`${this.API_BASE}/balance.php`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Balance refresh response:', data);

                if (data.balance !== undefined) {
                    this.userBalance = parseFloat(data.balance);
                    console.log('Balance refreshed to:', this.userBalance);

                    // Update UI immediately
                    this.updateBalanceDisplay();
                    this.updateCheckoutButton();
                }
            } else {
                console.error('Balance refresh failed:', response.status);
            }
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
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
