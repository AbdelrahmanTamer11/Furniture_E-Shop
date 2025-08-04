// Authentication module
class AuthManager {
    constructor() {
        this.API_BASE = 'http://localhost:8000/backend/api';
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.API_BASE}/auth.php?action=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('auth_token', data.token);
                app.currentUser = data.user;
                app.updateAuthUI();
                app.loadCart();

                this.clearForm('loginForm');
                toggleAuth();
                app.showAlert('Login successful!', 'success');

                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user));

                // Display user info
                displayUserInfo(data.user);

                console.log('Login successful');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const formData = {
            username: document.getElementById('registerUsername').value,
            email: document.getElementById('registerEmail').value,
            first_name: document.getElementById('registerFirstName').value,
            last_name: document.getElementById('registerLastName').value,
            password: document.getElementById('registerPassword').value
        };

        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validation
        const validation = this.validateRegisterForm(formData, confirmPassword);
        if (!validation.isValid) {
            this.showError(validation.message);
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.API_BASE}/auth.php?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.clearForm('registerForm');
                app.showAlert('Registration successful! Please login.', 'success');
                switchToLogin();
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Social login methods (placeholder for future implementation)
    async loginWithGoogle() {
        app.showAlert('Google login coming soon!', 'info');
    }

    async loginWithFacebook() {
        app.showAlert('Facebook login coming soon!', 'info');
    }

    // Forgot password functionality
    async forgotPassword() {
        const email = prompt('Please enter your email address:');
        if (!email) return;

        if (!this.validateEmail(email)) {
            app.showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            // This would be implemented on the backend
            app.showAlert('Password reset link sent to your email!', 'success');
        } catch (error) {
            app.showAlert('Failed to send reset email', 'error');
        }
    }
}
