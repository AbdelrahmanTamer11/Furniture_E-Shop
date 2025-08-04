// Form validation and handling methods for AuthManager
AuthManager.prototype.validateRegisterForm = function (data, confirmPassword) {
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
};

AuthManager.prototype.showError = function (message) {
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
};

AuthManager.prototype.showLoading = function (show) {
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
};

AuthManager.prototype.clearForm = function (formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }

    // Remove any error messages
    const errorDiv = document.querySelector('.auth-error');
    if (errorDiv) {
        errorDiv.remove();
    }
};

// Password strength checker
AuthManager.prototype.checkPasswordStrength = function (password) {
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
};

// Add password strength indicator
AuthManager.prototype.addPasswordStrengthIndicator = function () {
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
};

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
