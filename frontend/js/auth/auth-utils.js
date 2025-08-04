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
