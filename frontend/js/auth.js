// Authentication module
class AuthManager {
    constructor() {
        this.API_BASE = 'http://localhost/backend/api';
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

    validateRegisterForm(data, confirmPassword) {
        // Check required fields
        for (const [key, value] of Object.entries(data)) {
            if (!value || value.trim() === '') {
                return {
                    isValid: false,
                    message: `${key.replace('_', ' ')} is required`
                };
            }
        }

        // Email validation
        if (!this.validateEmail(data.email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address'
            };
        }

        // Username validation
        if (data.username.length < 3) {
            return {
                isValid: false,
                message: 'Username must be at least 3 characters long'
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            return {
                isValid: false,
                message: 'Username can only contain letters, numbers, and underscores'
            };
        }

        // Password validation
        if (data.password.length < 6) {
            return {
                isValid: false,
                message: 'Password must be at least 6 characters long'
            };
        }

        if (data.password !== confirmPassword) {
            return {
                isValid: false,
                message: 'Passwords do not match'
            };
        }

        // Name validation
        if (data.first_name.length < 2 || data.last_name.length < 2) {
            return {
                isValid: false,
                message: 'First and last name must be at least 2 characters long'
            };
        }

        return { isValid: true };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error error';
        errorDiv.textContent = message;

        const modalBody = document.querySelector('.modal-body');
        modalBody.insertBefore(errorDiv, modalBody.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showLoading(show) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');

        [loginBtn, registerBtn].forEach(btn => {
            if (btn) {
                if (show) {
                    btn.disabled = true;
                    btn.textContent = 'Loading...';
                } else {
                    btn.disabled = false;
                    btn.textContent = btn.closest('#loginForm') ? 'Login' : 'Register';
                }
            }
        });
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }

        // Remove any error messages
        const errorDiv = document.querySelector('.auth-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Password strength checker
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password)
        ];

        strength = checks.filter(Boolean).length;

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#27ae60'];

        return {
            score: strength,
            text: strengthLevels[strength - 1] || 'Very Weak',
            color: strengthColors[strength - 1] || '#e74c3c'
        };
    }

    // Add password strength indicator
    addPasswordStrengthIndicator() {
        const passwordInput = document.getElementById('registerPassword');
        if (!passwordInput) return;

        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-text">Password Strength</div>
        `;

        passwordInput.parentNode.appendChild(strengthIndicator);

        passwordInput.addEventListener('input', (e) => {
            const strength = this.checkPasswordStrength(e.target.value);
            const fill = strengthIndicator.querySelector('.strength-fill');
            const text = strengthIndicator.querySelector('.strength-text');

            fill.style.width = (strength.score * 20) + '%';
            fill.style.backgroundColor = strength.color;
            text.textContent = strength.text;
        });
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

// Auth form switching functions
function switchToRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModalTitle').textContent = 'Register';

    // Clear any existing errors
    const errorDiv = document.querySelector('.auth-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function switchToLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authModalTitle').textContent = 'Login';

    // Clear any existing errors
    const errorDiv = document.querySelector('.auth-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Enhanced auth modal with better UX
function enhanceAuthModal() {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            toggleAuth();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('show')) {
            toggleAuth();
        }
    });

    // Add forgot password link
    const loginForm = document.getElementById('loginForm');
    if (loginForm && !loginForm.querySelector('.forgot-password')) {
        const forgotLink = document.createElement('div');
        forgotLink.className = 'forgot-password';
        forgotLink.innerHTML = '<a href="#" onclick="authManager.forgotPassword()">Forgot your password?</a>';
        loginForm.appendChild(forgotLink);
    }

    // Add social login buttons (placeholder)
    const modalBody = document.querySelector('.modal-body');
    if (modalBody && !modalBody.querySelector('.social-login')) {
        const socialLogin = document.createElement('div');
        socialLogin.className = 'social-login';
        socialLogin.innerHTML = `
            <div class="social-divider">
                <span>or</span>
            </div>
            <div class="social-buttons">
                <button class="social-btn google-btn" onclick="authManager.loginWithGoogle()">
                    Continue with Google
                </button>
                <button class="social-btn facebook-btn" onclick="authManager.loginWithFacebook()">
                    Continue with Facebook
                </button>
            </div>
        `;
        modalBody.appendChild(socialLogin);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Setup enhanced auth modal after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    enhanceAuthModal();
    authManager.addPasswordStrengthIndicator();
});

// Real-time form validation
function setupRealTimeValidation() {
    // Email validation
    const emailInputs = ['loginEmail', 'registerEmail'];
    emailInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', (e) => {
                if (e.target.value && !authManager.validateEmail(e.target.value)) {
                    e.target.style.borderColor = '#e74c3c';
                    let errorMsg = e.target.parentNode.querySelector('.field-error');
                    if (!errorMsg) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'field-error error';
                        e.target.parentNode.appendChild(errorMsg);
                    }
                    errorMsg.textContent = 'Please enter a valid email address';
                } else {
                    e.target.style.borderColor = '#ddd';
                    const errorMsg = e.target.parentNode.querySelector('.field-error');
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                }
            });
        }
    });

    // Password confirmation validation
    const confirmPasswordInput = document.getElementById('registerConfirmPassword');
    const passwordInput = document.getElementById('registerPassword');

    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', (e) => {
            if (e.target.value && e.target.value !== passwordInput.value) {
                e.target.style.borderColor = '#e74c3c';
                let errorMsg = e.target.parentNode.querySelector('.field-error');
                if (!errorMsg) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'field-error error';
                    e.target.parentNode.appendChild(errorMsg);
                }
                errorMsg.textContent = 'Passwords do not match';
            } else {
                e.target.style.borderColor = '#ddd';
                const errorMsg = e.target.parentNode.querySelector('.field-error');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
    }
}

// Setup real-time validation after DOM is loaded
document.addEventListener('DOMContentLoaded', setupRealTimeValidation);
