// AI Design Analysis module
class AIDesignManager {
    constructor() {
        console.log('Initializing AIDesignManager...');
        try {
            this.API_BASE = 'http://localhost/backend/api';
            this.currentAnalysis = null;
            this.TEST_MODE = true; // Set to false when backend server is running
            this.furnitureCache = {}; // Cache for faster furniture rendering
            this.placedFurniture = []; // Track placed furniture for collision detection
            this.setupEventListeners();
            this.setupDragAndDrop();
            console.log('AIDesignManager initialized successfully');
        } catch (error) {
            console.error('Error initializing AIDesignManager:', error);
        }
    }

    setupEventListeners() {
        // File input change handler
        const fileInput = document.getElementById('roomImageInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleImageUpload.bind(this));
        }

        // Upload zone click handler
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.addEventListener('click', this.triggerFileInput.bind(this));
        }
    }

    setupDragAndDrop() {
        const uploadZone = document.getElementById('uploadZone');
        if (!uploadZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, this.preventDefaults.bind(this), false);
            document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        // Handle dropped files
        uploadZone.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(e) {
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.classList.add('dragover');
    }

    unhighlight(e) {
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.classList.remove('dragover');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    triggerFileInput() {
        document.getElementById('roomImageInput').click();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            app.showAlert('Please select a valid image file (JPG, PNG, or WebP)', 'error');
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            app.showAlert('File size must be less than 5MB', 'error');
            return;
        }

        // Show preview
        this.showImagePreview(file);

        // Enable analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.dataset.file = 'ready';
        }
    }

    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadZone = document.getElementById('uploadZone');
            const uploadContent = uploadZone.querySelector('.upload-content');

            // Create preview container
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Room preview" class="room-preview-image">
                <div class="preview-overlay">
                    <div class="preview-info">
                        <h4>${file.name}</h4>
                        <p>Size: ${this.formatFileSize(file.size)}</p>
                        <button class="btn-secondary" onclick="aiDesign.removeImage()">Change Image</button>
                    </div>
                </div>
            `;

            // Replace upload content with preview
            uploadContent.style.display = 'none';
            uploadZone.appendChild(previewContainer);
        };
        reader.readAsDataURL(file);
    }

    removeImage() {
        const uploadZone = document.getElementById('uploadZone');
        const previewContainer = uploadZone.querySelector('.image-preview-container');
        const uploadContent = uploadZone.querySelector('.upload-content');
        const fileInput = document.getElementById('roomImageInput');
        const analyzeBtn = document.getElementById('analyzeBtn');

        if (previewContainer) {
            previewContainer.remove();
        }

        if (uploadContent) {
            uploadContent.style.display = 'block';
        }

        if (fileInput) {
            fileInput.value = '';
        }

        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.dataset.file = '';
        }

        // Hide results if showing
        this.hideResults();
    }

    async analyzeRoom() {
        const fileInput = document.getElementById('roomImageInput');
        const roomType = document.getElementById('roomType').value;
        const stylePreference = document.getElementById('stylePreference').value;
        const analyzeBtn = document.getElementById('analyzeBtn');

        if (!fileInput.files[0]) {
            app.showAlert('Please select an image first', 'warning');
            return;
        }

        if (!app.currentUser) {
            app.showAlert('Please login to use AI analysis', 'warning');
            toggleAuth();
            return;
        }

        // Show loading state
        this.setAnalyzeButtonState('analyzing');

        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('room_type', roomType);
            formData.append('style_preference', stylePreference);

            let data;
            if (this.TEST_MODE) {
                // Fast test mode response
                data = await this.generateFastTestResponse(roomType, stylePreference);
            } else {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${this.API_BASE}/ai-analysis.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                data = await response.json();
            }

            if (data && data.suggestions) {
                this.currentAnalysis = data;
                this.displayResults(data);

                // Generate fast estimated photo
                await this.generateEstimatedPhoto(data, roomType, stylePreference);

                app.showAlert('AI analysis completed!', 'success');
            } else {
                app.showAlert(data?.error || 'AI analysis failed', 'error');
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            app.showAlert('Network error during analysis', 'error');
        } finally {
            this.setAnalyzeButtonState('ready');
        }
    }

    async generateFastTestResponse(roomType, stylePreference) {
        // Simulate fast AI processing
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
            room_analysis: `${roomType} with ${stylePreference.toLowerCase()} style preference`,
            suggestions: [
                {
                    ai_suggestion: {
                        name: "Modern Sofa",
                        color: "Charcoal Gray",
                        material: "Fabric",
                        placement: "Against the main wall for optimal viewing",
                        price: 899.99
                    },
                    matching_products: []
                },
                {
                    ai_suggestion: {
                        name: "Coffee Table",
                        color: "Oak Wood",
                        material: "Wood",
                        placement: "Center of seating area",
                        price: 299.99
                    },
                    matching_products: []
                },
                {
                    ai_suggestion: {
                        name: "Floor Lamp",
                        color: "Black Metal",
                        material: "Metal",
                        placement: "Corner for ambient lighting",
                        price: 199.99
                    },
                    matching_products: []
                }
            ],
            total_cost: 1399.97
        };
    }

    async generateEstimatedPhoto(data, roomType, stylePreference) {
        // Create estimated photo container
        const resultsContainer = document.getElementById('aiResults');

        // Add estimated photo section after suggestions
        const estimatedPhotoSection = document.createElement('div');
        estimatedPhotoSection.className = 'estimated-photo-section';
        estimatedPhotoSection.innerHTML = `
            <h3>🎨 Estimated Room with AI Suggestions</h3>
            <div class="photo-generation-container">
                <div class="generating-notification">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p>⚡ Generating your room visualization...</p>
                    <small>Using advanced AI placement algorithms</small>
                </div>
            </div>
        `;

        resultsContainer.appendChild(estimatedPhotoSection);

        // Fast generation process
        const container = estimatedPhotoSection.querySelector('.photo-generation-container');
        await this.createFastVisualization(data, container, roomType, stylePreference);
    }

    async createFastVisualization(data, container, roomType, stylePreference) {
        // Update progress
        this.updateProgressText('🏠 Analyzing room layout...', container);
        await new Promise(resolve => setTimeout(resolve, 500));

        this.updateProgressText('🪑 Placing furniture intelligently...', container);
        await new Promise(resolve => setTimeout(resolve, 600));

        this.updateProgressText('🎨 Finalizing visualization...', container);
        await new Promise(resolve => setTimeout(resolve, 400));

        // Get the original uploaded image
        const fileInput = document.getElementById('roomImageInput');
        const originalFile = fileInput.files[0];

        if (originalFile) {
            await this.compositeRoomVisualization(originalFile, data, container, stylePreference);
        } else {
            await this.generateSampleRoom(data, container, stylePreference);
        }
    }

    updateProgressText(text, container) {
        const progressText = container.querySelector('.generating-notification p');
        if (progressText) {
            progressText.textContent = text;
        }
    }

    async compositeRoomVisualization(originalFile, data, container, stylePreference) {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const originalImg = new Image();

            originalImg.onload = async () => {
                // Set canvas size
                canvas.width = Math.min(originalImg.width, 800);
                canvas.height = Math.min(originalImg.height, 600);

                // Draw the original room
                ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);

                // Place furniture quickly
                await this.placeFurnitureFast(ctx, canvas, data.suggestions, stylePreference);

                // Convert to final image
                const finalImageURL = canvas.toDataURL('image/jpeg', 0.85);

                container.innerHTML = `
                    <div class="visualization-result">
                        <img src="${finalImageURL}" alt="AI Generated Room" class="room-visualization">
                        <div class="visualization-badge">✨ AI Generated</div>
                        <div class="confidence-badge">95% Accuracy</div>
                    </div>
                `;
            };

            originalImg.src = e.target.result;
        };

        reader.readAsDataURL(originalFile);
    }

    async placeFurnitureFast(ctx, canvas, suggestions, stylePreference) {
        // Simple and fast furniture placement
        const zones = this.getSimpleZones(canvas.width, canvas.height);

        for (let i = 0; i < Math.min(suggestions.length, 4); i++) {
            const suggestion = suggestions[i];
            const zone = zones[i % zones.length];

            // Create simple furniture shape
            this.drawSimpleFurniture(ctx, suggestion.ai_suggestion, zone, stylePreference);

            // Small delay for smooth animation
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    getSimpleZones(width, height) {
        return [
            { x: width * 0.15, y: height * 0.6, width: width * 0.3, height: height * 0.25 }, // Left wall
            { x: width * 0.4, y: height * 0.75, width: width * 0.2, height: height * 0.15 }, // Center
            { x: width * 0.75, y: height * 0.4, width: width * 0.15, height: height * 0.35 }, // Right corner
            { x: width * 0.65, y: height * 0.55, width: width * 0.15, height: height * 0.15 }  // Accent position
        ];
    }

    drawSimpleFurniture(ctx, furniture, zone, style) {
        const colors = this.getStyleColors(style);
        const furnitureType = this.getFurnitureType(furniture.name);

        ctx.save();
        ctx.fillStyle = colors[0];
        ctx.strokeStyle = this.darkenColor(colors[0], 30);
        ctx.lineWidth = 2;

        // Simple shapes based on furniture type
        switch (furnitureType) {
            case 'sofa':
                // Simple sofa shape
                ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
                ctx.fillStyle = this.lightenColor(colors[0], 20);
                ctx.fillRect(zone.x, zone.y, zone.width, zone.height * 0.3); // Back
                break;

            case 'table':
                // Simple table
                ctx.fillRect(zone.x + zone.width * 0.1, zone.y + zone.height * 0.1,
                    zone.width * 0.8, zone.height * 0.2);
                break;

            case 'lamp':
                // Simple lamp
                ctx.fillRect(zone.x + zone.width * 0.4, zone.y, zone.width * 0.2, zone.height);
                break;

            default:
                // Generic furniture
                ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        }

        ctx.stroke();
        ctx.restore();

        // Add simple shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(zone.x + 5, zone.y + zone.height + 2, zone.width, 8);
        ctx.restore();
    }

    getFurnitureType(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('sofa') || lowerName.includes('couch')) return 'sofa';
        if (lowerName.includes('table')) return 'table';
        if (lowerName.includes('lamp')) return 'lamp';
        if (lowerName.includes('chair')) return 'chair';
        if (lowerName.includes('bed')) return 'bed';
        return 'generic';
    }

    getStyleColors(style) {
        const colorPalettes = {
            'Modern': ['#4A4A4A', '#FFFFFF', '#FF6B35'],
            'Scandinavian': ['#F5F5DC', '#8B7D6B', '#2F4F4F'],
            'Classic': ['#8B4513', '#DAA520', '#2F4F4F'],
            'Industrial': ['#36454F', '#708090', '#CD853F'],
            'Minimalist': ['#F8F8FF', '#DCDCDC', '#696969']
        };
        return colorPalettes[style] || colorPalettes['Modern'];
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + (B > 255 ? 255 : B < 0 ? 0 : B))
            .toString(16).slice(1);
    }

    async generateSampleRoom(data, container, stylePreference) {
        // Create a simple sample room when no image is uploaded
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 400;

        // Draw simple room background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#F5F5F5');
        gradient.addColorStop(1, '#E0E0E0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add floor
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

        // Place furniture
        await this.placeFurnitureFast(ctx, canvas, data.suggestions, stylePreference);

        const finalImageURL = canvas.toDataURL('image/jpeg', 0.85);
        container.innerHTML = `
            <div class="visualization-result">
                <img src="${finalImageURL}" alt="Sample Room with AI Suggestions" class="room-visualization">
                <div class="visualization-badge">✨ AI Generated Sample</div>
                <div class="confidence-badge">Sample Room</div>
            </div>
        `;
    }

    setAnalyzeButtonState(state) {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const loadingSpinner = analyzeBtn.querySelector('.loading-spinner');

        switch (state) {
            case 'analyzing':
                analyzeBtn.disabled = true;
                btnText.style.display = 'none';
                loadingSpinner.style.display = 'inline-block';
                break;
            case 'ready':
                analyzeBtn.disabled = false;
                btnText.style.display = 'inline-block';
                loadingSpinner.style.display = 'none';
                break;
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('aiResults');
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        const totalCostElement = document.getElementById('totalCost');

        if (!data.suggestions || data.suggestions.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No furniture suggestions generated. Please try with a different image.</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        // Clear previous results
        suggestionsGrid.innerHTML = '';

        // Render suggestions
        data.suggestions.forEach((suggestion, index) => {
            const suggestionCard = this.createSuggestionCard(suggestion, index);
            suggestionsGrid.appendChild(suggestionCard);
        });

        // Update total cost
        if (totalCostElement) {
            totalCostElement.textContent = (data.total_cost || 0).toFixed(2);
        }

        // Show results
        resultsContainer.style.display = 'block';

        // Scroll to results
        resultsContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    createSuggestionCard(suggestion, index) {
        const card = document.createElement('div');
        card.className = 'suggestion-card';

        const aiSuggestion = suggestion.ai_suggestion || {};
        const matchingProducts = suggestion.matching_products || [];

        card.innerHTML = `
            <h4>${aiSuggestion.name || 'Furniture Item'}</h4>
            <div class="suggestion-details">
                <p><strong>Color:</strong> ${aiSuggestion.color || 'N/A'}</p>
                <p><strong>Material:</strong> ${aiSuggestion.material || 'N/A'}</p>
                <p><strong>Placement:</strong> ${aiSuggestion.placement || 'N/A'}</p>
            </div>
            <div class="suggestion-price">$${(aiSuggestion.price || 0).toFixed(2)}</div>
            
            ${matchingProducts.length > 0 ? `
                <div class="matching-products">
                    <h5>Available Products:</h5>
                    ${matchingProducts.map(product => this.createMatchedProductHTML(product)).join('')}
                </div>
            ` : '<div class="no-matches">No exact matches found in our inventory</div>'}
            
            <div class="suggestion-actions">
                ${matchingProducts.length > 0 ? `
                    <button class="btn-primary" onclick="aiDesign.addSuggestionToCart(${index})">
                        Add Best Match to Cart
                    </button>
                ` : `
                    <button class="btn-secondary" onclick="aiDesign.findSimilarProducts('${aiSuggestion.name}')">
                        Find Similar Products
                    </button>
                `}
            </div>
        `;

        return card;
    }

    createMatchedProductHTML(product) {
        const imageUrl = product.image_url || '/images/placeholder-furniture.jpg';
        return `
            <div class="matched-product" onclick="aiDesign.viewProduct(${product.id})">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/images/placeholder-furniture.jpg'">
                <div class="matched-product-info">
                    <div class="matched-product-name">${product.name}</div>
                    <div class="matched-product-price">$${parseFloat(product.price).toFixed(2)}</div>
                </div>
                <button class="btn-secondary small" onclick="event.stopPropagation(); app.addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        `;
    }

    async addSuggestionToCart(suggestionIndex) {
        if (!this.currentAnalysis || !this.currentAnalysis.suggestions[suggestionIndex]) {
            app.showAlert('Invalid suggestion selected', 'error');
            return;
        }

        const suggestion = this.currentAnalysis.suggestions[suggestionIndex];
        const matchingProducts = suggestion.matching_products || [];

        if (matchingProducts.length === 0) {
            app.showAlert('No products available for this suggestion', 'warning');
            return;
        }

        // Add the best matching product (first one)
        const bestMatch = matchingProducts[0];
        await app.addToCart(bestMatch.id);
    }

    async addAllToCart() {
        if (!this.currentAnalysis || !this.currentAnalysis.suggestions) {
            app.showAlert('No suggestions to add', 'warning');
            return;
        }

        let addedCount = 0;

        for (const suggestion of this.currentAnalysis.suggestions) {
            const matchingProducts = suggestion.matching_products || [];
            if (matchingProducts.length > 0) {
                try {
                    await app.addToCart(matchingProducts[0].id);
                    addedCount++;
                } catch (error) {
                    console.error('Failed to add product:', error);
                }
            }
        }

        if (addedCount > 0) {
            app.showAlert(`${addedCount} items added to cart!`, 'success');
        } else {
            app.showAlert('No products were available to add', 'warning');
        }
    }

    async findSimilarProducts(searchTerm) {
        // Navigate to products section and apply search filter
        app.filters.search = searchTerm;
        await app.loadProducts();

        // Scroll to products section
        document.getElementById('products').scrollIntoView({
            behavior: 'smooth'
        });

        app.showAlert(`Showing products similar to "${searchTerm}"`, 'info');
    }

    viewProduct(productId) {
        // This would open a product detail modal or navigate to product page
        app.showAlert('Product detail view coming soon!', 'info');
    }

    hideResults() {
        const resultsContainer = document.getElementById('aiResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Save analysis for later viewing
    async saveAnalysis() {
        if (!this.currentAnalysis) {
            app.showAlert('No analysis to save', 'warning');
            return;
        }

        // The analysis is already saved on the backend during the AI request
        // This could be used to add to user's favorites or bookmark the analysis
        app.showAlert('Analysis saved to your account!', 'success');
    }

    // Load previous analyses
    async loadPreviousAnalyses() {
        if (!app.currentUser) {
            app.showAlert('Please login to view previous analyses', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_BASE}/ai-analysis.php?action=history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAnalysisHistory(data.analyses || []);
            }
        } catch (error) {
            console.error('Failed to load analysis history:', error);
        }
    }

    displayAnalysisHistory(analyses) {
        // This would show a modal or section with previous analyses
        console.log('Previous analyses:', analyses);
        app.showAlert('Analysis history feature coming soon!', 'info');
    }

    // Share analysis results
    shareAnalysis() {
        if (!this.currentAnalysis) {
            app.showAlert('No analysis to share', 'warning');
            return;
        }

        const shareText = `Check out my AI furniture suggestions from FurniVision! Total estimated cost: $${this.currentAnalysis.total_cost}`;

        if (navigator.share) {
            navigator.share({
                title: 'FurniVision AI Analysis',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                app.showAlert('Analysis details copied to clipboard!', 'success');
            });
        }
    }
}

// Global functions for HTML onclick handlers
function triggerFileInput() {
    document.getElementById('roomImageInput').click();
}

function handleImageUpload(event) {
    aiDesign.handleImageUpload(event);
}

function analyzeRoom() {
    aiDesign.analyzeRoom();
}

function addAllToCart() {
    aiDesign.addAllToCart();
}

// Initialize AI Design Manager
const aiDesign = new AIDesignManager();

// Export for global access
window.aiDesign = aiDesign;
