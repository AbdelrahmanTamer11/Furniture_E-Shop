class AIRoomAssistant {
    constructor() {
        this.API_BASE = '/backend/api';
        this.currentAnalysis = null;
        this.TEST_MODE = true; // Set to false when backend server is running

        // All DOM elements
        this.uploadArea = document.querySelector('#uploadZone');
        this.uploadButton = document.querySelector('#uploadButton');
        this.fileInput = document.getElementById('roomPhoto');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.analyzeBtn = document.getElementById('analyzeRoom');
        this.resultsDiv = document.getElementById('aiResults');
        this.resultsContent = document.getElementById('resultsContent');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    async analyzeRoom() {
        console.log('Analyze room button clicked!');

        const roomType = document.getElementById('roomType')?.value || 'living_room';
        const stylePreference = document.getElementById('preferredStyle')?.value || 'Modern';

        console.log('Room type:', roomType);
        console.log('Style preference:', stylePreference);

        if (!this.fileInput || !this.fileInput.files[0]) {
            console.log('No file selected');
            this.showNotification('Please select an image first', 'error');
            return;
        }

        console.log('Starting analysis...');
        // Show loading state
        this.setAnalyzeButtonState('analyzing');

        try {
            if (this.TEST_MODE) {
                // Test mode - show sample AI results
                console.log('Running in TEST MODE - showing sample AI results');
                const testData = this.createTestAIResponse(roomType, stylePreference);
                console.log('Test data created:', testData);

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                this.currentAnalysis = testData;
                this.displayResults(testData);
                this.showNotification('AI analysis completed! (Test Mode)', 'success');
            } else {
                // Real API mode
                console.log('Running in API MODE - making real backend call');
                const formData = new FormData();
                formData.append('image', this.fileInput.files[0]);
                formData.append('room_type', roomType);
                formData.append('style_preference', stylePreference);

                const token = localStorage.getItem('auth_token');
                console.log('Making API request to:', `${this.API_BASE}/ai-analysis.php`);

                const response = await fetch(`${this.API_BASE}/ai-analysis.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                console.log('API response data:', data);

                if (response.ok) {
                    this.currentAnalysis = data;
                    this.displayResults(data);
                    this.showNotification('AI analysis completed!', 'success');
                } else {
                    console.error('API error:', data);
                    this.showNotification(data.error || 'AI analysis failed', 'error');
                }
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            this.showNotification('Network error during analysis', 'error');
        } finally {
            this.setAnalyzeButtonState('ready');
        }
    }

    setAnalyzeButtonState(state) {
        if (!this.analyzeBtn) return;

        const btnText = this.analyzeBtn.querySelector('.btn-text');
        const loadingSpinner = this.analyzeBtn.querySelector('.loading-spinner');

        switch (state) {
            case 'analyzing':
                this.analyzeBtn.disabled = true;
                if (btnText) btnText.style.display = 'none';
                if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
                this.analyzeBtn.classList.add('loading');
                break;
            case 'ready':
                this.analyzeBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline-block';
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                this.analyzeBtn.classList.remove('loading');
                break;
        }
    }

    async addSuggestionToCart(suggestionIndex) {
        if (!this.currentAnalysis || !this.currentAnalysis.suggestions[suggestionIndex]) {
            this.showNotification('Invalid suggestion selected', 'error');
            return;
        }

        const suggestion = this.currentAnalysis.suggestions[suggestionIndex];
        const matchingProducts = suggestion.matching_products || [];

        if (matchingProducts.length === 0) {
            this.showNotification('No products available for this suggestion', 'warning');
            return;
        }

        // Add the best matching product (first one)
        const bestMatch = matchingProducts[0];
        if (window.app && window.app.addToCart) {
            await window.app.addToCart(bestMatch.id);
        } else {
            this.showNotification('Add to cart feature not available', 'error');
        }
    }

    async addAllToCart() {
        if (!this.currentAnalysis || !this.currentAnalysis.suggestions) {
            this.showNotification('No suggestions to add', 'warning');
            return;
        }

        let addedCount = 0;

        for (const suggestion of this.currentAnalysis.suggestions) {
            const matchingProducts = suggestion.matching_products || [];
            if (matchingProducts.length > 0) {
                try {
                    if (window.app && window.app.addToCart) {
                        await window.app.addToCart(matchingProducts[0].id);
                        addedCount++;
                    }
                } catch (error) {
                    console.error('Failed to add product:', error);
                }
            }
        }

        if (addedCount > 0) {
            this.showNotification(`${addedCount} items added to cart!`, 'success');
        } else {
            this.showNotification('No products were available to add', 'warning');
        }
    }

    findSimilarProducts(searchTerm) {
        // Navigate to products section and apply search filter
        if (window.app && window.app.filters) {
            window.app.filters.search = searchTerm;
            window.app.loadProducts();
        }

        // Scroll to products section
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth'
            });
        }

        this.showNotification(`Showing products similar to "${searchTerm}"`, 'info');
    }

    viewProduct(productId) {
        // Scroll to products section and highlight the product
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });

            // Highlight the product after scrolling
            setTimeout(() => {
                const productCards = document.querySelectorAll('.product-card');
                productCards.forEach(card => {
                    const addToCartBtn = card.querySelector('.add-to-cart-btn');
                    if (addToCartBtn && addToCartBtn.onclick && addToCartBtn.onclick.toString().includes(productId)) {
                        card.style.border = '3px solid #3498db';
                        card.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.3)';

                        // Remove highlight after 3 seconds
                        setTimeout(() => {
                            card.style.border = '';
                            card.style.boxShadow = '';
                        }, 3000);
                    }
                });
            }, 1000);
        }
    }

    hideResults() {
        if (this.resultsDiv) {
            this.resultsDiv.classList.remove('show');
        }
    }
}
