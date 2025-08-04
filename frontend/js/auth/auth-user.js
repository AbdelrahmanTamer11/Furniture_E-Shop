// Update the displayUserInfo function
function displayUserInfo(user) {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        // Replace the login button with hamburger menu
        authBtn.outerHTML = `
            <div class="user-hamburger-container">
                <button class="hamburger-menu" onclick="toggleUserHamburger()">
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                </button>
                <div class="user-hamburger-menu" id="userHamburgerMenu">
                    <div class="user-hamburger-header">
                        <div class="user-avatar-large">${user.first_name.charAt(0).toUpperCase()}${user.last_name.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <div class="user-name">${user.first_name} ${user.last_name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                    <div class="user-hamburger-items">
                        <a href="#" class="hamburger-menu-item" onclick="showProfile()">
                            <i class="fas fa-user"></i>
                            <span>Profile</span>
                        </a>
                        <a href="#" class="hamburger-menu-item" onclick="showOrders()">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Orders</span>
                        </a>
                        <button class="hamburger-menu-item logout-item" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Toggle hamburger menu visibility
function toggleUserHamburger() {
    const hamburgerContainer = document.querySelector('.user-hamburger-container');
    const hamburgerMenu = document.getElementById('userHamburgerMenu');
    const hamburgerButton = document.querySelector('.hamburger-menu');

    if (hamburgerContainer && hamburgerMenu) {
        // Toggle menu visibility
        hamburgerContainer.classList.toggle('active');
        hamburgerButton.classList.toggle('active');

        // Close menu when clicking outside
        if (hamburgerContainer.classList.contains('active')) {
            setTimeout(() => {
                document.addEventListener('click', function closeHamburgerMenu(e) {
                    if (!hamburgerContainer.contains(e.target)) {
                        hamburgerContainer.classList.remove('active');
                        hamburgerButton.classList.remove('active');
                        document.removeEventListener('click', closeHamburgerMenu);
                    }
                });
            }, 100);
        }
    }
}

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
        const userHamburgerContainer = document.querySelector('.user-hamburger-container');
        if (userHamburgerContainer) {
            userHamburgerContainer.outerHTML = `
                <button class="auth-btn" id="authBtn" onclick="toggleAuth()">Login</button>
            `;
        }

        console.log('User logged out successfully');
        // Optionally reload the page to reset all states
        // window.location.reload();
    }
}
