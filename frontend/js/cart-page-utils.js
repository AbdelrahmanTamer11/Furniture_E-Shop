// Initialize cart page manager
let cartPageManager;
document.addEventListener('DOMContentLoaded', () => {
    cartPageManager = new CartPageManager();
});

// Sample data for testing (remove in production)
if (localStorage.getItem('cart') === null) {
    const sampleCart = [
        {
            id: 1,
            name: 'Industrial Bookshelf',
            price: 199.99,
            image: 'images/bookshelf1.jpg',
            description: 'Modern industrial style bookshelf with metal frame',
            quantity: 2
        }
    ];
    localStorage.setItem('cart', JSON.stringify(sampleCart));
}
