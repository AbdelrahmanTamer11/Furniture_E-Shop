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

    setupEventListeners() {
        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });
        }

        // Upload button click (only the button, not the entire area)
        if (this.uploadButton) {
            this.uploadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.triggerFileInput();
            });
        }

        // Upload area click (but prevent double triggering)
        if (this.uploadArea) {
            this.uploadArea.addEventListener('click', (e) => {
                // Only trigger if the click is not on the button
                if (e.target !== this.uploadButton && !this.uploadButton.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.triggerFileInput();
                }
            });
        }
    }

    setupDragAndDrop() {
        if (!this.uploadArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults.bind(this), false);
            document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        // Handle dropped files
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(e) {
        this.uploadArea.classList.add('dragover');
    }

    unhighlight(e) {
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    triggerFileInput() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    handleFileSelect(file) {
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Please select a valid image file (JPG, PNG, or WebP)', 'error');
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 5MB', 'error');
            return;
        }

        // Show preview
        this.showImagePreview(file);

        // Enable analyze button
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.dataset.file = 'ready';
        }
    }

    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.previewImg) {
                this.previewImg.src = e.target.result;
            }
            if (this.imagePreview) {
                this.imagePreview.classList.add('show');
            }
        };
        reader.readAsDataURL(file);

        this.showNotification('Image uploaded successfully!', 'success');
    }

    removeImage() {
        if (this.imagePreview) {
            this.imagePreview.classList.remove('show');
        }
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        if (this.analyzeBtn) {
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.dataset.file = '';
        }
        this.hideResults();
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

    createTestAIResponse(roomType, stylePreference) {
        const suggestions = [];

        // Generate furniture suggestions based on room type and style
        const furnitureTemplates = {
            living_room: [
                { name: "Sofa", category: "Seating", basePrice: 599 },
                { name: "Coffee Table", category: "Tables", basePrice: 299 },
                { name: "Floor Lamp", category: "Lighting", basePrice: 149 },
                { name: "Bookshelf", category: "Storage", basePrice: 199 }
            ],
            bedroom: [
                { name: "Bed Frame", category: "Bedroom", basePrice: 499 },
                { name: "Nightstand", category: "Bedroom", basePrice: 129 },
                { name: "Dresser", category: "Storage", basePrice: 349 },
                { name: "Table Lamp", category: "Lighting", basePrice: 79 }
            ],
            dining_room: [
                { name: "Dining Table", category: "Tables", basePrice: 799 },
                { name: "Dining Chairs", category: "Seating", basePrice: 149 },
                { name: "Sideboard", category: "Storage", basePrice: 599 },
                { name: "Pendant Light", category: "Lighting", basePrice: 199 }
            ],
            office: [
                { name: "Desk", category: "Office", basePrice: 399 },
                { name: "Office Chair", category: "Seating", basePrice: 249 },
                { name: "Filing Cabinet", category: "Storage", basePrice: 179 },
                { name: "Desk Lamp", category: "Lighting", basePrice: 89 }
            ],
            kitchen: [
                { name: "Kitchen Island", category: "Kitchen", basePrice: 899 },
                { name: "Bar Stools", category: "Seating", basePrice: 99 },
                { name: "Storage Cabinet", category: "Storage", basePrice: 299 },
                { name: "Pendant Lights", category: "Lighting", basePrice: 129 }
            ]
        };

        const styleModifiers = {
            Modern: { colorPalette: ["White", "Black", "Gray"], material: "Metal", priceMultiplier: 1.2 },
            Scandinavian: { colorPalette: ["Light Wood", "White", "Beige"], material: "Pine Wood", priceMultiplier: 1.1 },
            Classic: { colorPalette: ["Dark Wood", "Cream", "Gold"], material: "Oak Wood", priceMultiplier: 1.3 },
            Industrial: { colorPalette: ["Black", "Metal Gray", "Brown"], material: "Steel", priceMultiplier: 1.15 },
            Minimalist: { colorPalette: ["White", "Light Gray", "Natural"], material: "Composite", priceMultiplier: 1.0 }
        };

        const roomFurniture = furnitureTemplates[roomType] || furnitureTemplates.living_room;
        const styleInfo = styleModifiers[stylePreference] || styleModifiers.Modern;

        roomFurniture.forEach((furniture, index) => {
            const color = styleInfo.colorPalette[index % styleInfo.colorPalette.length];
            const price = furniture.basePrice * styleInfo.priceMultiplier;

            suggestions.push({
                ai_suggestion: {
                    name: `${stylePreference} ${furniture.name}`,
                    color: color,
                    material: styleInfo.material,
                    price: Math.round(price),
                    placement: this.generatePlacement(furniture.name, roomType),
                    category: furniture.category
                },
                matching_products: [],
                estimated_price: Math.round(price)
            });
        });

        const totalCost = suggestions.reduce((sum, s) => sum + s.estimated_price, 0);

        return {
            suggestions: suggestions,
            total_cost: totalCost,
            style_analysis: `This ${roomType.replace('_', ' ')} has been analyzed for ${stylePreference} style furniture. The space appears suitable for ${suggestions.length} key furniture pieces that will complement the room's layout and lighting. The ${stylePreference} style emphasizes ${this.getStyleDescription(stylePreference)}.`
        };
    }

    generatePlacement(furnitureName, roomType) {
        const placements = {
            Sofa: "Against the main wall facing the entertainment area",
            "Coffee Table": "Center of the seating area",
            "Floor Lamp": "In the corner next to seating for ambient lighting",
            Bookshelf: "Along the side wall for easy access",
            "Bed Frame": "Centered against the largest wall",
            Nightstand: "Beside the bed for convenience",
            Dresser: "Opposite the bed or in the corner",
            "Table Lamp": "On the nightstand for reading light",
            "Dining Table": "Center of the dining area",
            "Dining Chairs": "Around the dining table",
            Sideboard: "Against the wall for serving and storage",
            "Pendant Light": "Above the dining table",
            Desk: "Near the window for natural light",
            "Office Chair": "At the desk for optimal ergonomics",
            "Filing Cabinet": "Beside or under the desk",
            "Desk Lamp": "On the desk for task lighting"
        };

        return placements[furnitureName] || "Positioned optimally within the room layout";
    }

    getStyleDescription(style) {
        const descriptions = {
            Modern: "clean lines, minimal decoration, and contemporary materials",
            Scandinavian: "natural materials, light colors, and functional design",
            Classic: "traditional elegance, rich materials, and timeless appeal",
            Industrial: "raw materials, exposed elements, and urban aesthetics",
            Minimalist: "simplicity, essential functionality, and uncluttered spaces"
        };
        return descriptions[style] || "contemporary design principles";
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

    displayResults(data) {
        console.log('Displaying results with data:', data);

        if (!this.resultsContent || !this.resultsDiv) {
            console.error('Results elements not found');
            return;
        }

        if (!data.suggestions || data.suggestions.length === 0) {
            console.log('No suggestions found, showing no-results message');
            this.resultsContent.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🤔</div>
                    <h3>No furniture suggestions generated</h3>
                    <p>Please try with a different image or ensure the room is well-lit and clearly visible.</p>
                </div>
            `;
            this.resultsDiv.classList.add('show');
            return;
        }

        console.log('Processing', data.suggestions.length, 'suggestions');

        // Create results grid
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'suggestions-grid';

        // Add style analysis if available
        if (data.style_analysis) {
            console.log('Adding style analysis card');
            const analysisCard = document.createElement('div');
            analysisCard.className = 'style-analysis-card';
            analysisCard.innerHTML = `
                <div class="analysis-header">
                    <h3>🎨 Room Analysis</h3>
                </div>
                <p>${data.style_analysis}</p>
            `;
            resultsGrid.appendChild(analysisCard);
        }

        // Render suggestions with beautiful cards
        data.suggestions.forEach((suggestion, index) => {
            console.log('Creating card for suggestion', index, ':', suggestion);
            const suggestionCard = this.createBeautifulSuggestionCard(suggestion, index);
            resultsGrid.appendChild(suggestionCard);
        });

        // Add total cost summary
        const totalCard = document.createElement('div');
        totalCard.className = 'total-cost-card';
        totalCard.innerHTML = `
            <div class="total-header">
                <h3>💰 Total Estimated Cost</h3>
            </div>
            <div class="total-amount">$${data.total_cost.toFixed(2)}</div>
            <div class="total-actions">
                <button class="btn-primary" onclick="aiDesign.addAllToCart()">
                    🛒 Add All to Cart
                </button>
            </div>
        `;
        resultsGrid.appendChild(totalCard);

        this.resultsContent.innerHTML = '';
        this.resultsContent.appendChild(resultsGrid);

        // Show results with fade-in effect
        console.log('Showing results container');
        this.resultsDiv.classList.add('show');

        // Scroll to results
        setTimeout(() => {
            this.resultsDiv.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 200);
    }

    createBeautifulSuggestionCard(suggestion, index) {
        const card = document.createElement('div');
        card.className = 'suggestion-card modern-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const aiSuggestion = suggestion.ai_suggestion || {};
        const matchingProducts = suggestion.matching_products || [];

        // Create gradient background based on color
        const colorGradient = this.getColorGradient(aiSuggestion.color || 'Gray');

        card.innerHTML = `
            <div class="card-header" style="background: ${colorGradient}">
                <div class="card-number">${index + 1}</div>
                <div class="card-category">${aiSuggestion.category || 'Furniture'}</div>
            </div>
            
            <div class="card-content">
                <h3 class="item-name">${aiSuggestion.name || 'Furniture Item'}</h3>
                
                <div class="item-details">
                    <div class="detail-row">
                        <span class="detail-icon">🎨</span>
                        <span class="detail-label">Color:</span>
                        <span class="detail-value">${aiSuggestion.color || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-icon">🪵</span>
                        <span class="detail-label">Material:</span>
                        <span class="detail-value">${aiSuggestion.material || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span class="detail-label">Placement:</span>
                        <span class="detail-value">${aiSuggestion.placement || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="price-section">
                    <div class="estimated-price">
                        <span class="price-label">Estimated Price</span>
                        <span class="price-value">$${(aiSuggestion.price || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                ${matchingProducts.length > 0 ? `
                    <div class="matching-products">
                        <h4 class="products-title">
                            <span class="products-icon">✨</span>
                            Available Products
                        </h4>
                        <div class="products-carousel">
                            ${matchingProducts.map(product => this.createMatchedProductCard(product)).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="no-matches">
                        <div class="no-match-icon">🔍</div>
                        <p>No exact matches found in our inventory</p>
                        <small>We'll help you find similar products</small>
                    </div>
                `}
                
                <div class="card-actions">
                    ${matchingProducts.length > 0 ? `
                        <button class="btn-primary action-btn" onclick="aiDesign.addSuggestionToCart(${index})">
                            <span class="btn-icon">🛒</span>
                            Add Best Match to Cart
                        </button>
                    ` : `
                        <button class="btn-secondary action-btn" onclick="aiDesign.findSimilarProducts('${aiSuggestion.name}')">
                            <span class="btn-icon">🔍</span>
                            Find Similar Products
                        </button>
                    `}
                </div>
            </div>
        `;

        return card;
    }

    createMatchedProductCard(product) {
        return `
            <div class="matched-product-card" onclick="aiDesign.viewProduct(${product.id})">
                <div class="product-image-container">
                    <img src="${product.image_url || '/images/placeholder-furniture.svg'}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='/images/placeholder-furniture.svg'">
                    <div class="product-overlay">
                        <span class="view-details">View Details</span>
                    </div>
                </div>
                <div class="product-info">
                    <h5 class="product-name">${product.name}</h5>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="match-score">
                        <span class="score-label">Match:</span>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${this.calculateMatchScore(product)}%"></div>
                        </div>
                        <span class="score-value">${this.calculateMatchScore(product)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    getColorGradient(color) {
        const colorMap = {
            'Gray': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Brown': 'linear-gradient(135deg, #d2691e 0%, #8b4513 100%)',
            'White': 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            'Black': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            'Blue': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            'Green': 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            'Red': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            'Beige': 'linear-gradient(135deg, #f5f5dc 0%, #deb887 100%)',
            'Navy': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
        };

        return colorMap[color] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    calculateMatchScore(product) {
        // Simple algorithm to calculate match score based on product attributes
        return Math.floor(Math.random() * 20) + 80; // Random score between 80-100%
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
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
    }
}

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
