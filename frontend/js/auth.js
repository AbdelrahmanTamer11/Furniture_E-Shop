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

    // Add social login buttons with icons
    const modalBody = document.querySelector('.modal-body');
    if (modalBody && !modalBody.querySelector('.social-login')) {
        const socialLogin = document.createElement('div');
        socialLogin.className = 'social-login';
        socialLogin.innerHTML = `
            <div class="social-divider">
                <span>or</span>
            </div>
            <div class="social-buttons">
                <button class="social-btn google-btn" onclick="continueWithGoogle()">
                    <i class="fab fa-google"></i>
                    <span>Continue with Google</span>
                </button>
                <button class="social-btn facebook-btn" onclick="continueWithFacebook()">
                    <i class="fab fa-facebook-f"></i>
                    <span>Continue with Facebook</span>
                </button>
            </div>
        `;
        modalBody.appendChild(socialLogin);
    }
}

// Add these functions if they don't exist
function continueWithGoogle() {
    console.log('Google login clicked');
    alert('Google login coming soon!');
}

function continueWithFacebook() {
    console.log('Facebook login clicked');
    alert('Facebook login coming soon!');
}

// Initialize auth manager
const authManager = new AuthManager();

// Setup enhanced auth modal after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    enhanceAuthModal();
    authManager.addPasswordStrengthIndicator();

    // Check for existing user on page load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            displayUserInfo(user);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('user');
        }
    }
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

// Update the showLoginForm function
function showLoginForm() {
    const authContent = document.getElementById('authModalContent');
    authContent.innerHTML = `
        <div class="auth-header">
            <h2>Login</h2>
            <span class="close-modal" onclick="toggleAuth()">&times;</span>
        </div>
        <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="form-group">
                <label for="loginEmail">Email:</label>
                <input type="email" id="loginEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="loginPassword">Password:</label>
                <input type="password" id="loginPassword" name="password" required>
            </div>
            <button type="submit" class="auth-btn">Login</button>
        </form>
        <div class="auth-links">
            <p>Don't have an account? <a href="#" onclick="showRegisterForm()">Register here</a></p>
            <p><a href="#" onclick="showForgotPasswordForm()">Forgot your password?</a></p>
        </div>
        <div class="social-login">
            <p class="social-divider">or</p>
            <div class="social-buttons">
                <button class="social-btn google-btn" onclick="continueWithGoogle()">
                    <div class="social-icon google-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </div>
                    <span>Continue with Google</span>
                </button>
                <button class="social-btn facebook-btn" onclick="continueWithFacebook()">
                    <div class="social-icon facebook-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </div>
                    <span>Continue with Facebook</span>
                </button>
            </div>
        </div>
    `;
}

// Update the showRegisterForm function similarly
function showRegisterForm() {
    const authContent = document.getElementById('authModalContent');
    authContent.innerHTML = `
        <div class="auth-header">
            <h2>Register</h2>
            <span class="close-modal" onclick="toggleAuth()">&times;</span>
        </div>
        <form id="registerForm" onsubmit="handleRegister(event)">
            <div class="form-group">
                <label for="registerFirstName">First Name:</label>
                <input type="text" id="registerFirstName" name="firstName" required>
            </div>
            <div class="form-group">
                <label for="registerLastName">Last Name:</label>
                <input type="text" id="registerLastName" name="lastName" required>
            </div>
            <div class="form-group">
                <label for="registerEmail">Email:</label>
                <input type="email" id="registerEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="registerPassword">Password:</label>
                <input type="password" id="registerPassword" name="password" required>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
            </div>
            <button type="submit" class="auth-btn">Register</button>
        </form>
        <div class="auth-links">
            <p>Already have an account? <a href="#" onclick="showLoginForm()">Login here</a></p>
        </div>
        <div class="social-login">
            <p class="social-divider">or</p>
            <div class="social-buttons">
                <button class="social-btn google-btn" onclick="continueWithGoogle()">
                    <div class="social-icon google-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                    </div>
                    <span>Continue with Google</span>
                </button>
                <button class="social-btn facebook-btn" onclick="continueWithFacebook()">
                    <div class="social-icon facebook-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </div>
                    <span>Continue with Facebook</span>
                </button>
            </div>
        </div>
    `;
}

// Update the displayUserInfo function
function displayUserInfo(user) {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        // Get user initials for avatar
        const initials = user.first_name.charAt(0).toUpperCase() + user.last_name.charAt(0).toUpperCase();

        // Replace the login button with user dropdown
        authBtn.outerHTML = `
            <div class="user-dropdown">
                <button class="user-info" onclick="toggleUserDropdown()">
                    <div class="user-avatar">${initials}</div>
                    <span>Hi, ${user.first_name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown-content" id="userDropdownContent">
                    <div class="user-dropdown-header">
                        <div class="user-name">${user.first_name} ${user.last_name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-dropdown-menu">
                        <a href="#" class="user-dropdown-item" onclick="showProfile()">
                            <i class="fas fa-user"></i>
                            <span>Profile</span>
                        </a>
                        <a href="#" class="user-dropdown-item" onclick="showOrders()">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Orders</span>
                        </a>
                        <button class="user-dropdown-item logout" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Toggle user dropdown visibility
function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    const dropdownContent = document.getElementById('userDropdownContent');

    if (dropdown && dropdownContent) {
        // Close all other dropdowns first
        document.querySelectorAll('.user-dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });

        // Toggle current dropdown
        dropdown.classList.toggle('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Menu item functions
function showProfile() {
    console.log('Opening profile...');
    alert('Profile page coming soon!');
    toggleUserDropdown();
}

function showOrders() {
    console.log('Opening orders...');
    alert('Orders page coming soon!');
    toggleUserDropdown();
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');

        // Reset UI to login state
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.outerHTML = `
                <button class="auth-btn" id="authBtn" onclick="toggleAuth()">Login</button>
            `;
        }

        console.log('User logged out successfully');
        // Optionally reload the page to reset all states
        // window.location.reload();
    }
}
