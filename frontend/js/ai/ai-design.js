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
