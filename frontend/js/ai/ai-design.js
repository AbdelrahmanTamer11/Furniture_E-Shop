// This file is now deprecated - all functionality moved to ai-assistant.js
// Keep this file for backward compatibility but redirect to new system

console.warn('ai-design.js is deprecated. Please use ai-assistant.js instead.');

// Redirect old global functions to new system
window.aiDesign = window.aiDesign || {
    analyzeRoom: function () {
        if (window.aiDesign && window.aiDesign.analyzeRoom) {
            window.aiDesign.analyzeRoom();
        }
    },
    addAllToCart: function () {
        if (window.aiDesign && window.aiDesign.addAllToCart) {
            window.aiDesign.addAllToCart();
        }
    },
    findSimilarProducts: function (itemName) {
        if (window.aiDesign && window.aiDesign.findSimilarProducts) {
            window.aiDesign.findSimilarProducts(itemName);
        }
    }
};
