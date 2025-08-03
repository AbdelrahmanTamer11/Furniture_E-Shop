class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 3;
        this.shippingData = {};
        this.paymentData = {};
        this.orderData = {};

        this.init();
    }

    init() {
        this.loadCartItems();
        this.calculateTotals();
        this.bindEvents();
        this.updateProgress();
    }

    bindEvents() {
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.currentTarget);
            });
        });

        // Form validation
        this.setupFormValidation();

        // Promo code - only if element exists
        const applyBtn = document.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyPromoCode();
            });
        }
    }

    loadCartItems() {
        // Remove this method content since we're not showing order items in checkout
        console.log('Cart items loading skipped - order summary removed');
    }

    calculateTotals() {
        // Simplified calculation without UI updates
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 29.99;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        this.orderData.subtotal = subtotal;
        this.orderData.shipping = shipping;
        this.orderData.tax = tax;
        this.orderData.total = total;

        // Also refresh balance if user is logged in
        this.refreshUserBalanceIfNeeded();
    }

    // Add method to refresh balance when needed
    async refreshUserBalanceIfNeeded() {
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
                if (window.cartManager) {
                    window.cartManager.userBalance = parseFloat(data.balance || 0);
                    window.cartManager.updateBalanceDisplay();
                    window.cartManager.updateCheckoutButton();
                }
            }
        } catch (error) {
            console.error('Error refreshing balance in checkout:', error);
        }
    }

    selectPaymentMethod(method) {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
        method.classList.add('active');

        const methodType = method.dataset.method;
        this.showPaymentDetails(methodType);
    }

    showPaymentDetails(method) {
        const cardDetails = document.getElementById('cardDetails');

        switch (method) {
            case 'card':
                cardDetails.style.display = 'block';
                break;
            case 'paypal':
            case 'apple':
                cardDetails.style.display = 'none';
                break;
        }
    }

    setupFormValidation() {
        // Real-time validation for inputs
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });

        // Format card number
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
            });
        }

        // Format expiry date
        const expiryInput = document.getElementById('expiryDate');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                this.formatExpiryDate(e.target);
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Remove previous error styling
        field.classList.remove('error');

        // Check if required field is empty
        if (field.hasAttribute('required') && !value) {
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
            }
        }

        // Card number validation
        if (field.id === 'cardNumber' && value) {
            const cardRegex = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/;
            if (!cardRegex.test(value)) {
                isValid = false;
            }
        }

        // CVV validation
        if (field.id === 'cvv' && value) {
            const cvvRegex = /^\d{3,4}$/;
            if (!cvvRegex.test(value)) {
                isValid = false;
            }
        }

        if (!isValid) {
            field.classList.add('error');
        }

        return isValid;
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
        input.value = formattedValue;
    }

    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();

            if (this.currentStep < this.maxSteps) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateProgress();

                if (this.currentStep === 3) {
                    this.populateReview();
                }
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showError('Please fill in all required fields correctly.');
        }

        return isValid;
    }

    saveCurrentStepData() {
        if (this.currentStep === 1) {
            const form = document.getElementById('shippingForm');
            const formData = new FormData(form);

            this.shippingData = {};
            for (let [key, value] of formData.entries()) {
                this.shippingData[key] = value;
            }
        } else if (this.currentStep === 2) {
            const form = document.getElementById('paymentForm');
            const formData = new FormData(form);

            this.paymentData = {};
            for (let [key, value] of formData.entries()) {
                this.paymentData[key] = value;
            }

            // Get selected payment method
            const activeMethod = document.querySelector('.payment-method.active');
            this.paymentData.method = activeMethod?.dataset.method || 'card';
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        document.getElementById(`step-${stepNumber}`).classList.add('active');
    }

    updateProgress() {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;

            step.classList.remove('active', 'completed');

            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    populateReview() {
        // Shipping review
        const shippingReview = document.getElementById('shippingReview');
        shippingReview.innerHTML = `
            <p><strong>${this.shippingData.firstName} ${this.shippingData.lastName}</strong></p>
            <p>${this.shippingData.address}</p>
            <p>${this.shippingData.city}, ${this.shippingData.state} ${this.shippingData.zipCode}</p>
            <p>${this.shippingData.country}</p>
            <p>Phone: ${this.shippingData.phone}</p>
            <p>Email: ${this.shippingData.email}</p>
        `;

        // Payment review
        const paymentReview = document.getElementById('paymentReview');
        const methodName = this.getPaymentMethodName(this.paymentData.method);

        if (this.paymentData.method === 'card') {
            const maskedCard = this.paymentData.cardNumber ?
                '**** **** **** ' + this.paymentData.cardNumber.slice(-4) :
                'Card ending in ****';

            paymentReview.innerHTML = `
                <p><strong>${methodName}</strong></p>
                <p>${maskedCard}</p>
                <p>${this.paymentData.cardName || 'Cardholder Name'}</p>
            `;
        } else {
            paymentReview.innerHTML = `<p><strong>${methodName}</strong></p>`;
        }
    }

    getPaymentMethodName(method) {
        const methods = {
            'card': 'Credit/Debit Card',
            'paypal': 'PayPal',
            'apple': 'Apple Pay'
        };
        return methods[method] || 'Payment Method';
    }

    editStep(stepNumber) {
        this.currentStep = stepNumber;
        this.showStep(stepNumber);
        this.updateProgress();
    }

    applyPromoCode() {
        const promoCodeInput = document.getElementById('promoCode');
        if (!promoCodeInput) {
            console.log('Promo code input not found - feature disabled');
            return;
        }

        const promoCode = promoCodeInput.value.trim();

        if (!promoCode) {
            this.showError('Please enter a promo code.');
            return;
        }

        // Simulate promo code validation
        const validCodes = {
            'SAVE10': 0.10,
            'WELCOME': 0.15,
            'FIRST20': 0.20
        };

        if (validCodes[promoCode.toUpperCase()]) {
            const discount = validCodes[promoCode.toUpperCase()];
            this.applyDiscount(discount);
            this.showSuccess(`Promo code applied! ${(discount * 100)}% discount.`);
        } else {
            this.showError('Invalid promo code.');
        }
    }

    applyDiscount(discountRate) {
        const subtotal = this.orderData.subtotal;
        const discount = subtotal * discountRate;
        const newSubtotal = subtotal - discount;
        const shipping = newSubtotal > 500 ? 0 : 29.99;
        const tax = newSubtotal * 0.08;
        const total = newSubtotal + shipping + tax;

        this.orderData.discount = discount;
        this.orderData.subtotal = newSubtotal;
        this.orderData.shipping = shipping;
        this.orderData.tax = tax;
        this.orderData.total = total;

        // Update display only if elements exist
        const subtotalEl = document.getElementById('subtotal');
        const shippingEl = document.getElementById('shipping');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${newSubtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

        // Add discount row if not exists and parent exists
        const totalRow = document.querySelector('.total-row.total');
        if (totalRow && !document.querySelector('.discount-row')) {
            const discountRow = document.createElement('div');
            discountRow.className = 'total-row discount-row';
            discountRow.innerHTML = `
                <span>Discount:</span>
                <span style="color: #16a34a;">-$${discount.toFixed(2)}</span>
            `;
            totalRow.parentNode.insertBefore(discountRow, totalRow);
        }
    }

    async placeOrder() {
        try {
            // Show loading state
            const orderButton = document.querySelector('.step-actions .btn-primary');
            const originalText = orderButton.textContent;
            orderButton.textContent = 'Processing...';
            orderButton.disabled = true;

            // Simulate API call
            await this.simulateOrderProcessing();

            // Generate order number
            const orderNumber = 'FV' + Date.now().toString().slice(-6);

            // Clear cart
            localStorage.removeItem('cart');

            // Show success modal
            document.getElementById('orderNumber').textContent = orderNumber;
            document.getElementById('successModal').classList.add('show');

            // Update cart count
            if (window.updateCartCount) {
                window.updateCartCount();
            }

        } catch (error) {
            this.showError('Failed to process order. Please try again.');

            // Reset button
            const orderButton = document.querySelector('.step-actions .btn-primary');
            orderButton.textContent = 'Place Order';
            orderButton.disabled = false;
        }
    }

    simulateOrderProcessing() {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000); // Simulate 2 second processing time
        });
    }

    showError(message) {
        // Create and show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #16a34a;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions for navigation
function nextStep() {
    if (window.checkoutManager) {
        window.checkoutManager.nextStep();
    }
}

function prevStep() {
    if (window.checkoutManager) {
        window.checkoutManager.prevStep();
    }
}

function editStep(stepNumber) {
    if (window.checkoutManager) {
        window.checkoutManager.editStep(stepNumber);
    }
}

function goBack() {
    window.history.back();
}

function goToHome() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('show');
    }
    window.location.href = '/';
}

function viewOrder() {
    // Implement order details view
    alert('Order details page would open here');
}

function placeOrder() {
    if (window.checkoutManager) {
        window.checkoutManager.placeOrder();
    }
}

// Cart functions (simplified)
function toggleCart() {
    // Redirect to checkout if needed or show cart sidebar
    console.log('Toggle cart');
}

// Initialize checkout manager when page loads
let checkoutManager;
document.addEventListener('DOMContentLoaded', () => {
    checkoutManager = new CheckoutManager();
    window.checkoutManager = checkoutManager; // Make it globally accessible
});

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
