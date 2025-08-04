// Utility methods for AIRoomAssistant
AIRoomAssistant.prototype.formatFileSize = function (bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

AIRoomAssistant.prototype.showNotification = function (message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ${type === 'success' ? 'background: linear-gradient(135deg, #16a34a, #22c55e);' : ''}
        ${type === 'error' ? 'background: linear-gradient(135deg, #dc2626, #ef4444);' : ''}
        ${type === 'info' ? 'background: linear-gradient(135deg, #2563eb, #3b82f6);' : ''}
        ${type === 'warning' ? 'background: linear-gradient(135deg, #d97706, #f59e0b);' : ''}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Global functions for HTML onclick handlers
function analyzeRoom() {
    console.log('Global analyzeRoom function called');
    if (window.aiDesign && typeof window.aiDesign.analyzeRoom === 'function') {
        window.aiDesign.analyzeRoom();
    } else {
        console.error('aiDesign object or analyzeRoom method not found');
        alert('Error: AI system not initialized');
    }
}

// Initialize AI Design Manager
let aiDesign;
document.addEventListener('DOMContentLoaded', () => {
    aiDesign = new AIRoomAssistant();
    window.aiDesign = aiDesign;
    console.log('AI Room Assistant initialized');
});
