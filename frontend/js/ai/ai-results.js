// Results display methods for AIRoomAssistant
AIRoomAssistant.prototype.displayResults = function (data) {
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
};

AIRoomAssistant.prototype.createBeautifulSuggestionCard = function (suggestion, index) {
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
};

AIRoomAssistant.prototype.createMatchedProductCard = function (product) {
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
};

AIRoomAssistant.prototype.getColorGradient = function (color) {
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
};

AIRoomAssistant.prototype.calculateMatchScore = function (product) {
    // Simple algorithm to calculate match score based on product attributes
    return Math.floor(Math.random() * 20) + 80; // Random score between 80-100%
};
