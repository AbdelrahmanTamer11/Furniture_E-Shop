// UI interaction methods for AIRoomAssistant
AIRoomAssistant.prototype.setupEventListeners = function () {
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
};

AIRoomAssistant.prototype.setupDragAndDrop = function () {
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
};

AIRoomAssistant.prototype.preventDefaults = function (e) {
    e.preventDefault();
    e.stopPropagation();
};

AIRoomAssistant.prototype.highlight = function (e) {
    this.uploadArea.classList.add('dragover');
};

AIRoomAssistant.prototype.unhighlight = function (e) {
    this.uploadArea.classList.remove('dragover');
};

AIRoomAssistant.prototype.handleDrop = function (e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        this.processFile(files[0]);
    }
};

AIRoomAssistant.prototype.triggerFileInput = function () {
    if (this.fileInput) {
        this.fileInput.click();
    }
};

AIRoomAssistant.prototype.handleFileSelect = function (file) {
    if (file) {
        this.processFile(file);
    }
};

AIRoomAssistant.prototype.processFile = function (file) {
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
};

AIRoomAssistant.prototype.showImagePreview = function (file) {
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
};

AIRoomAssistant.prototype.removeImage = function () {
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
};
