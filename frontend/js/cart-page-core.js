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
        // Add fresh balance fetch for logged-in users
        this.refreshUserBalanceFromAPI();
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        this.cart = savedCart ? JSON.parse(savedCart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
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

    // Add method to fetch fresh balance from API
    async refreshUserBalanceFromAPI() {
        if (!window.app?.currentUser) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/backend/api/balance.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userBalance = parseFloat(data.balance || 0);
                this.updateUserBalance();
                this.updateSummary();
            }
        } catch (error) {
            console.error('Error fetching fresh balance:', error);
        }
    }
}
