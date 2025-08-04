// Cart action methods for CartManager
CartManager.prototype.addToCart = async function (productId, quantity = 1) {
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
};

CartManager.prototype.addToGuestCart = async function (productId, quantity) {
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
};

CartManager.prototype.updateQuantity = async function (productId, newQuantity) {
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
};

CartManager.prototype.updateGuestQuantity = function (productId, newQuantity) {
    const item = this.cartItems.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        this.calculateCartTotals();
        this.updateCartUI();
        this.saveGuestCart();
    }
};

CartManager.prototype.removeItem = async function (productId) {
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
};

CartManager.prototype.removeGuestItem = function (productId) {
    this.cartItems = this.cartItems.filter(item => item.id !== productId);
    this.calculateCartTotals();
    this.updateCartUI();
    this.saveGuestCart();
    this.showCartNotification('Item removed from cart', 'success');
};

CartManager.prototype.clearCart = async function () {
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
};
