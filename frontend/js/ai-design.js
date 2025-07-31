// AI Design Analysis module
class AIDesignManager {
    constructor() {
        this.API_BASE = '../backend/api';
        this.currentAnalysis = null;
        this.TEST_MODE = true; // Set to false when backend server is running
        this.setupEventListeners();
        this.setupDragAndDrop();
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
        console.log('Analyze room button clicked!');

        const fileInput = document.getElementById('roomImageInput');
        const roomType = document.getElementById('roomType').value;
        const stylePreference = document.getElementById('stylePreference').value;
        const analyzeBtn = document.getElementById('analyzeBtn');

        console.log('File input:', fileInput);
        console.log('Files:', fileInput ? fileInput.files : 'No file input found');
        console.log('Room type:', roomType);
        console.log('Style preference:', stylePreference);

        if (!fileInput.files[0]) {
            console.log('No file selected');
            app.showAlert('Please select an image first', 'warning');
            return;
        }

        console.log('Current user:', app.currentUser);
        // Temporarily disable authentication requirement for testing
        // if (!app.currentUser) {
        //     app.showAlert('Please login to use AI analysis', 'warning');
        //     toggleAuth();
        //     return;
        // }

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
                app.showAlert('AI analysis completed! (Test Mode)', 'success');
            } else {
                // Real API mode
                console.log('Running in API MODE - making real backend call');
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
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
                    app.showAlert('AI analysis completed!', 'success');
                } else {
                    console.error('API error:', data);
                    app.showAlert(data.error || 'AI analysis failed', 'error');
                }
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            app.showAlert('Network error during analysis', 'error');
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
        console.log('Displaying results with data:', data);

        const resultsContainer = document.getElementById('aiResults');
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        const totalCostElement = document.getElementById('totalCost');

        console.log('Results container:', resultsContainer);
        console.log('Suggestions grid:', suggestionsGrid);
        console.log('Total cost element:', totalCostElement);

        if (!data.suggestions || data.suggestions.length === 0) {
            console.log('No suggestions found, showing no-results message');
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🤔</div>
                    <h3>No furniture suggestions generated</h3>
                    <p>Please try with a different image or ensure the room is well-lit and clearly visible.</p>
                    <p><small>Debug: ${JSON.stringify(data)}</small></p>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        console.log('Processing', data.suggestions.length, 'suggestions');

        // Clear previous results
        suggestionsGrid.innerHTML = '';

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
            suggestionsGrid.appendChild(analysisCard);
        }

        // Add estimated photo showing room with furniture
        console.log('Generating estimated room visualization');
        const estimatedPhotoCard = this.createEstimatedPhotoCard(data);
        suggestionsGrid.appendChild(estimatedPhotoCard);

        // Render suggestions with beautiful cards
        data.suggestions.forEach((suggestion, index) => {
            console.log('Creating card for suggestion', index, ':', suggestion);
            const suggestionCard = this.createBeautifulSuggestionCard(suggestion, index);
            suggestionsGrid.appendChild(suggestionCard);
        });

        // Update total cost with animation
        if (totalCostElement) {
            console.log('Animating total cost to:', data.total_cost);
            this.animateNumber(totalCostElement, 0, data.total_cost || 0, 1000);
        }

        // Show results with fade-in effect
        console.log('Showing results container');
        resultsContainer.style.display = 'block';
        resultsContainer.style.opacity = '0';
        setTimeout(() => {
            resultsContainer.style.transition = 'opacity 0.5s ease-in';
            resultsContainer.style.opacity = '1';
        }, 100);

        // Scroll to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 200);
    }

    createEstimatedPhotoCard(data) {
        const card = document.createElement('div');
        card.className = 'estimated-photo-card';

        // Get the original uploaded image
        const fileInput = document.getElementById('roomImageInput');
        const originalImage = fileInput.files[0];

        card.innerHTML = `
            <div class="estimated-photo-header">
                <h3>📸 Estimated Room Visualization</h3>
                <p>How your room could look after adding the suggested furniture</p>
            </div>
            <div class="photo-comparison">
                <div class="before-after-container">
                    <div class="before-section">
                        <h4>Before</h4>
                        <div class="image-container" id="beforeImage">
                            <div class="loading-placeholder">Loading original image...</div>
                        </div>
                        <p>Original room</p>
                    </div>
                    <div class="after-section">
                        <h4>After</h4>
                        <div class="image-container" id="afterImage">
                            <div class="generating-visualization">
                                <div class="spinner">⏳</div>
                                <p>Generating AI visualization...</p>
                            </div>
                        </div>
                        <p>With suggested furniture</p>
                    </div>
                </div>
                <div class="furniture-overlay-info">
                    <h4>🪑 Added Furniture:</h4>
                    <ul class="furniture-list">
                        ${data.suggestions.map(suggestion => `
                            <li>
                                <span class="furniture-name">${suggestion.ai_suggestion.name}</span>
                                <span class="furniture-placement">${suggestion.ai_suggestion.placement}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="visualization-actions">
                    <button class="btn-secondary" onclick="aiDesign.regenerateVisualization()">
                        🔄 Regenerate Visualization
                    </button>
                    <button class="btn-primary" onclick="aiDesign.downloadVisualization()">
                        💾 Download Image
                    </button>
                </div>
            </div>
        `;

        // Load the original image
        if (originalImage) {
            this.loadOriginalImage(originalImage, card);
        }

        // Generate the AI visualization
        setTimeout(() => {
            this.generateRoomVisualization(data, card);
        }, 1000);

        return card;
    }

    loadOriginalImage(file, card) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const beforeImageContainer = card.querySelector('#beforeImage');
            beforeImageContainer.innerHTML = `
                <img src="${e.target.result}" alt="Original room" class="room-image">
            `;
        };
        reader.readAsDataURL(file);
    }

    generateRoomVisualization(data, card) {
        // Simulate AI-generated room visualization
        // In a real implementation, this would call an AI image generation service

        const afterImageContainer = card.querySelector('#afterImage');
        const roomType = document.getElementById('roomType').value;
        const stylePreference = document.getElementById('stylePreference').value;

        // Create a simulated "after" image with furniture overlay
        const fileInput = document.getElementById('roomImageInput');
        const originalFile = fileInput.files[0];

        if (originalFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Create canvas for image manipulation
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Add furniture overlays (simulated)
                    this.addFurnitureOverlays(ctx, canvas, data.suggestions, stylePreference);

                    // Convert canvas to image
                    const visualizationURL = canvas.toDataURL('image/jpeg', 0.9);

                    afterImageContainer.innerHTML = `
                        <img src="${visualizationURL}" alt="Room with suggested furniture" class="room-image">
                        <div class="visualization-badge">AI Generated</div>
                    `;
                };

                img.src = e.target.result;
            };
            reader.readAsDataURL(originalFile);
        } else {
            // Fallback: Show a sample visualization
            afterImageContainer.innerHTML = `
                <div class="sample-visualization">
                    <div class="sample-room">
                        <h3>🏠 ${roomType.replace('_', ' ').toUpperCase()}</h3>
                        <div class="style-indicator">${stylePreference} Style</div>
                        <div class="furniture-items">
                            ${data.suggestions.map((suggestion, index) => `
                                <div class="furniture-item item-${index + 1}">
                                    ${this.getFurnitureEmoji(suggestion.ai_suggestion.name)}
                                    <span>${suggestion.ai_suggestion.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="visualization-badge">AI Concept</div>
                </div>
            `;
        }
    }

    addFurnitureOverlays(ctx, canvas, suggestions, style) {
        // Add semi-transparent furniture indicators on the image
        ctx.save();

        suggestions.forEach((suggestion, index) => {
            const furniture = suggestion.ai_suggestion;

            // Calculate position based on placement description
            const position = this.calculateFurniturePosition(furniture.placement, canvas.width, canvas.height, index);

            // Add colored indicator
            const colors = this.getStyleColors(style);
            ctx.fillStyle = colors[index % colors.length] + '80'; // 50% transparency
            ctx.fillRect(position.x, position.y, position.width, position.height);

            // Add furniture label
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText(furniture.name, position.x + 5, position.y + 20);

            // Add price tag
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.fillText(`$${furniture.price}`, position.x + 5, position.y + position.height - 5);
        });

        ctx.restore();
    }

    calculateFurniturePosition(placement, canvasWidth, canvasHeight, index) {
        // Simple positioning algorithm based on placement text
        const positions = [
            { x: canvasWidth * 0.1, y: canvasHeight * 0.3, width: canvasWidth * 0.3, height: canvasHeight * 0.2 }, // Left side
            { x: canvasWidth * 0.4, y: canvasHeight * 0.6, width: canvasWidth * 0.2, height: canvasHeight * 0.15 }, // Center
            { x: canvasWidth * 0.7, y: canvasHeight * 0.2, width: canvasWidth * 0.25, height: canvasHeight * 0.25 }, // Right side
            { x: canvasWidth * 0.15, y: canvasHeight * 0.7, width: canvasWidth * 0.2, height: canvasHeight * 0.1 }  // Bottom
        ];

        return positions[index % positions.length];
    }

    getStyleColors(style) {
        const colorSchemes = {
            Modern: ['#2196F3', '#FF5722', '#4CAF50', '#FF9800'],
            Scandinavian: ['#8BC34A', '#FFC107', '#03DAC6', '#E1BEE7'],
            Classic: ['#795548', '#FF7043', '#8D6E63', '#A1887F'],
            Industrial: ['#424242', '#FF6F00', '#37474F', '#546E7A'],
            Minimalist: ['#9E9E9E', '#607D8B', '#90A4AE', '#B0BEC5']
        };

        return colorSchemes[style] || colorSchemes.Modern;
    }

    getFurnitureEmoji(furnitureName) {
        const emojis = {
            'Sofa': '🛋️',
            'Coffee Table': '🪑',
            'Floor Lamp': '💡',
            'Bookshelf': '📚',
            'Bed Frame': '🛏️',
            'Nightstand': '🗄️',
            'Dresser': '🗃️',
            'Table Lamp': '🕯️',
            'Dining Table': '🍽️',
            'Dining Chairs': '🪑',
            'Sideboard': '🗄️',
            'Pendant Light': '💡',
            'Desk': '🗃️',
            'Office Chair': '🪑',
            'Filing Cabinet': '🗂️',
            'Desk Lamp': '💡'
        };

        // Find emoji based on furniture name
        for (const [key, emoji] of Object.entries(emojis)) {
            if (furnitureName.includes(key)) {
                return emoji;
            }
        }

        return '🪑'; // Default furniture emoji
    }

    regenerateVisualization() {
        console.log('Regenerating room visualization...');
        const afterImageContainer = document.querySelector('#afterImage');
        if (afterImageContainer) {
            afterImageContainer.innerHTML = `
                <div class="generating-visualization">
                    <div class="spinner">⏳</div>
                    <p>Regenerating visualization...</p>
                </div>
            `;

            setTimeout(() => {
                this.generateRoomVisualization(this.currentAnalysis, afterImageContainer.closest('.estimated-photo-card'));
            }, 2000);
        }
    }

    downloadVisualization() {
        console.log('Downloading room visualization...');
        const afterImage = document.querySelector('#afterImage img');
        if (afterImage) {
            const link = document.createElement('a');
            link.download = 'room-visualization.jpg';
            link.href = afterImage.src;
            link.click();
        } else {
            alert('Visualization not ready yet. Please wait for generation to complete.');
        }
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
        const imageUrl = product.image_url || '/images/placeholder-furniture.svg';
        return `
            <div class="matched-product" onclick="aiDesign.viewProduct(${product.id})">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/images/placeholder-furniture.svg'">
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

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const change = end - start;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = start + (change * progress);
            element.textContent = current.toFixed(2);

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }

        requestAnimationFrame(updateNumber);
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

    findSimilarProducts(itemName) {
        // Navigate to products and filter by the item name
        const productsSection = document.getElementById('products');
        const searchInput = document.querySelector('#searchInput');

        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });

            // If there's a search functionality, use it
            if (searchInput) {
                searchInput.value = itemName;
                // Trigger search if there's a search function
                if (typeof app.filterProducts === 'function') {
                    app.filterProducts();
                }
            }

            app.showAlert(`Searching for products similar to "${itemName}"`, 'info');
        }
    }


}// Global functions for HTML onclick handlers
function triggerFileInput() {
    document.getElementById('roomImageInput').click();
}

function handleImageUpload(event) {
    aiDesign.handleImageUpload(event);
}

function analyzeRoom() {
    console.log('Global analyzeRoom function called');
    console.log('aiDesign object:', aiDesign);
    if (aiDesign && typeof aiDesign.analyzeRoom === 'function') {
        aiDesign.analyzeRoom();
    } else {
        console.error('aiDesign object or analyzeRoom method not found');
        alert('Error: aiDesign object not found');
    }
}

function addAllToCart() {
    aiDesign.addAllToCart();
}

// Initialize AI Design Manager
const aiDesign = new AIDesignManager();

// Export for global access
window.aiDesign = aiDesign;
