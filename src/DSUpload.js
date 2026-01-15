/**
 * DSUpload
 * 
 * A comprehensive file upload component with:
 * - Image/file preview
 * - Progress bar support
 * - File type validation
 * - File size validation
 * - Old value / default image support
 * - Reset functionality
 * - Drag and drop support
 * - Full event system
 */
export class DSUpload {
    static instances = new Map();
    static instanceCounter = 0;

    /**
     * Default Icons
     */
    static icons = {
        upload: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>`,
        file: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
        image: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
        close: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        reset: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
        check: `<svg class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
    };

    /**
     * Default configuration
     */
    static defaults = {
        // Preview options
        preview: true,                  // Enable preview
        previewMaxHeight: '200px',      // Max height for preview image
        defaultImage: null,             // Default/placeholder image URL
        oldValue: null,                 // Old/current file URL (for edit forms)

        // File validation
        accept: '*',                    // Accepted file types (e.g., 'image/*', '.pdf,.doc')
        maxSize: 5 * 1024 * 1024,       // Max file size in bytes (default 5MB)
        minSize: 0,                     // Min file size in bytes

        // UI options
        showProgressBar: true,          // Show upload progress bar
        showFileInfo: true,             // Show file name and size
        showResetButton: true,          // Show reset button when file selected
        showRemoveButton: true,         // Show remove/clear button
        dropzone: true,                 // Enable drag and drop
        dropzoneText: 'Drop file here or click to upload',
        browseText: 'Browse',

        // Styling
        wrapperClass: '',
        previewClass: '',
        dropzoneClass: '',

        // Behavior
        autoUpload: false,              // Auto upload on select (requires uploadUrl)
        uploadUrl: null,                // URL for AJAX upload
        removeUrl: null,                // URL for AJAX removal (DELETE request)
        uploadMethod: 'POST',           // Upload HTTP method
        uploadFieldName: null,          // Override form field name for upload

        // Size display
        sizeUnit: 'auto',               // 'auto', 'KB', 'MB', 'GB'

        // Translations
        translations: {
            dropzone: 'Drop file here or click to upload',
            browse: 'Browse',
            remove: 'Remove',
            reset: 'Reset',
            fileTooBig: 'File is too large. Maximum size is {max}',
            fileTooSmall: 'File is too small. Minimum size is {min}',
            invalidType: 'Invalid file type. Accepted types: {types}',
            uploadError: 'Upload failed',
            uploading: 'Uploading...'
        }
    };

    /**
     * @param {string|HTMLElement} selector - Input element or selector
     * @param {Object} config - Configuration options
     */
    constructor(selector, config = {}) {
        this.instanceId = `ds-upload-${++DSUpload.instanceCounter}`;

        // Find the input element
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;

        if (!el) {
            throw new Error('DSUpload: Element not found.');
        }

        // Store original input
        this.originalInput = el.tagName === 'INPUT' ? el : el.querySelector('input[type="file"]');
        if (!this.originalInput) {
            throw new Error('DSUpload: No file input found.');
        }

        // Find or create wrapper
        this.wrapper = el.closest('.form-group') || el.parentElement;

        // Merge config with data attributes
        this.cfg = this._buildConfig(config);

        // State
        this._file = null;
        this._previewUrl = null;
        this._isUploading = false;
        this._progress = 0;
        this._originalValue = this.cfg.oldValue || this.cfg.defaultImage;

        // Event listeners
        this._listeners = {};
        this._boundHandlers = {};

        // Initialize
        this._init();

        // Register instance
        DSUpload.instances.set(this.instanceId, this);
        this.wrapper.dataset.dsUploadId = this.instanceId;
    }

    /**
     * Static factory
     */
    static create(selector, config = {}) {
        return new DSUpload(selector, config);
    }

    /**
     * Get instance by element
     */
    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;
        const wrapper = el.closest('[data-ds-upload-id]');
        if (!wrapper) return null;
        return DSUpload.instances.get(wrapper.dataset.dsUploadId);
    }

    /**
     * Auto-initialize all elements with [data-ds-upload]
     */
    static initAll(selector = '[data-ds-upload]') {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.closest('[data-ds-upload-id]')) {
                new DSUpload(el);
            }
        });
    }

    // ==================== INITIALIZATION ====================

    _buildConfig(userConfig) {
        const dataConfig = this._parseDataAttributes();
        return { ...DSUpload.defaults, ...dataConfig, ...userConfig };
    }

    _parseDataAttributes() {
        const data = this.originalInput.dataset;
        const config = {};

        if (data.preview !== undefined) config.preview = data.preview !== 'false';
        if (data.defaultImage) config.defaultImage = data.defaultImage;
        if (data.fallbackImage) config.fallbackImage = data.fallbackImage;
        if (data.oldValue) config.oldValue = data.oldValue;
        if (data.accept) config.accept = data.accept;
        if (data.maxSize) config.maxSize = parseInt(data.maxSize, 10);
        if (data.minSize) config.minSize = parseInt(data.minSize, 10);
        if (data.dropzone !== undefined) config.dropzone = data.dropzone !== 'false';
        if (data.showProgressBar !== undefined) config.showProgressBar = data.showProgressBar !== 'false';
        if (data.uploadUrl) config.uploadUrl = data.uploadUrl;
        if (data.removeUrl) config.removeUrl = data.removeUrl;

        return config;
    }

    _init() {
        this._buildDOM();
        this._cacheElements();
        this._bindEvents();
        this._setInitialPreview();

        if (this.cfg.accept && this.cfg.accept !== '*') {
            this.originalInput.setAttribute('accept', this.cfg.accept);
        }
    }

    _buildDOM() {
        // Hide original input
        this.originalInput.style.display = 'none';
        this.originalInput.classList.add('ds-upload-input');

        // Create upload UI
        const container = document.createElement('div');
        container.className = `ds-upload-container relative ${this.cfg.wrapperClass}`;
        container.innerHTML = `
            <!-- Dropzone / Upload Area -->
            <div class="ds-upload-dropzone border-2 border-dashed border-base-300 rounded-sm p-3 pb-1 text-center cursor-pointer transition-all hover:border-primary hover:bg-base-200/50 ${this.cfg.dropzoneClass}"
                 data-ds-upload-dropzone>
                <div class="ds-upload-placeholder flex flex-col items-center gap-2" data-ds-upload-placeholder>
                    <span class="text-base-content/40">${DSUpload.icons.upload}</span>
                    <p class="text-sm text-base-content/60">${this.cfg.translations.dropzone}</p>
                    <button type="button" class="btn btn-primary btn-sm mt-2" data-ds-upload-browse>
                        ${this.cfg.translations.browse}
                    </button>
                </div>
                
                <!-- Preview Area -->
                <div class="ds-upload-preview hidden" data-ds-upload-preview>
                    <div class="relative inline-block">
                        <img src="" alt="Preview" 
                             class="max-h-[${this.cfg.previewMaxHeight}] max-w-full rounded-lg object-contain mx-auto ${this.cfg.previewClass}"
                             data-ds-upload-preview-img>
                        <div class="ds-upload-file-preview hidden flex-col items-center gap-2" data-ds-upload-file-preview>
                            <span class="text-base-content/40">${DSUpload.icons.file}</span>
                            <span class="text-sm font-medium" data-ds-upload-filename></span>
                        </div>
                    </div>
                    
                    <!-- File Info -->
                    <div class="ds-upload-info mt-3 text-center" data-ds-upload-info>
                        <p class="text-sm font-medium text-base-content" data-ds-upload-name></p>
                        <p class="text-xs text-base-content/60" data-ds-upload-size></p>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="ds-upload-actions flex justify-center gap-2 mt-3">
                        <button type="button" class="btn btn-ghost btn-sm gap-1" data-ds-upload-reset title="${this.cfg.translations.reset}">
                            ${DSUpload.icons.reset}
                            <span>${this.cfg.translations.reset}</span>
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm text-error gap-1" data-ds-upload-remove title="${this.cfg.translations.remove}">
                            ${DSUpload.icons.close}
                            <span>${this.cfg.translations.remove}</span>
                        </button>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="ds-upload-progress hidden mt-4" data-ds-upload-progress>
                    <div class="flex justify-between text-xs text-base-content/60 mb-1">
                        <span>${this.cfg.translations.uploading}</span>
                        <span data-ds-upload-progress-text>0%</span>
                    </div>
                    <progress class="progress progress-primary w-full" value="0" max="100" data-ds-upload-progress-bar></progress>
                </div>
            </div>
            
            <!-- Error Message -->
            <div class="ds-upload-error hidden mt-2" data-ds-upload-error>
                <p class="text-sm text-error flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span data-ds-upload-error-text></span>
                </p>
            </div>
        `;

        // Insert after original input
        this.originalInput.insertAdjacentElement('afterend', container);
        this.container = container;
    }

    _cacheElements() {
        this.elements = {
            dropzone: this.container.querySelector('[data-ds-upload-dropzone]'),
            placeholder: this.container.querySelector('[data-ds-upload-placeholder]'),
            preview: this.container.querySelector('[data-ds-upload-preview]'),
            previewImg: this.container.querySelector('[data-ds-upload-preview-img]'),
            filePreview: this.container.querySelector('[data-ds-upload-file-preview]'),
            filename: this.container.querySelector('[data-ds-upload-filename]'),
            info: this.container.querySelector('[data-ds-upload-info]'),
            name: this.container.querySelector('[data-ds-upload-name]'),
            size: this.container.querySelector('[data-ds-upload-size]'),
            reset: this.container.querySelector('[data-ds-upload-reset]'),
            remove: this.container.querySelector('[data-ds-upload-remove]'),
            browse: this.container.querySelector('[data-ds-upload-browse]'),
            progress: this.container.querySelector('[data-ds-upload-progress]'),
            progressBar: this.container.querySelector('[data-ds-upload-progress-bar]'),
            progressText: this.container.querySelector('[data-ds-upload-progress-text]'),
            error: this.container.querySelector('[data-ds-upload-error]'),
            errorText: this.container.querySelector('[data-ds-upload-error-text]')
        };
    }

    _bindEvents() {
        this._boundHandlers = {
            onInputChange: this._onInputChange.bind(this),
            onDropzoneClick: this._onDropzoneClick.bind(this),
            onDragOver: this._onDragOver.bind(this),
            onDragLeave: this._onDragLeave.bind(this),
            onDrop: this._onDrop.bind(this),
            onReset: this._onReset.bind(this),
            onRemove: this._onRemove.bind(this),
            onBrowse: this._onBrowse.bind(this)
        };

        // Input change
        this.originalInput.addEventListener('change', this._boundHandlers.onInputChange);

        // Dropzone click
        this.elements.dropzone.addEventListener('click', this._boundHandlers.onDropzoneClick);

        // Drag and drop
        if (this.cfg.dropzone) {
            this.elements.dropzone.addEventListener('dragover', this._boundHandlers.onDragOver);
            this.elements.dropzone.addEventListener('dragleave', this._boundHandlers.onDragLeave);
            this.elements.dropzone.addEventListener('drop', this._boundHandlers.onDrop);
        }

        // Buttons
        this.elements.browse.addEventListener('click', this._boundHandlers.onBrowse);
        this.elements.reset.addEventListener('click', this._boundHandlers.onReset);
        this.elements.remove.addEventListener('click', this._boundHandlers.onRemove);
    }

    _setInitialPreview() {
        const initialUrl = this.cfg.oldValue || this.cfg.defaultImage;
        // Treat removeUrl as proof of a real value existing on the server
        const hasRealValue = !!this.cfg.oldValue || !!this.cfg.removeUrl;

        if (initialUrl && this.cfg.preview) {
            this._showPreview(initialUrl, null, true, hasRealValue);
        }

        // Hide reset button initially (no new file selected yet)
        this.elements.reset.classList.add('hidden');

        // Hide remove button if only showing default placeholder logic handled in _showPreview
        // based on hasRealValue passed above.

        this._emit('ready', { hasInitialValue: !!initialUrl, hasRealValue });
    }

    // ==================== EVENT HANDLERS ====================

    _onInputChange(e) {
        const file = e.target.files[0];
        if (file) {
            this._processFile(file);
        }
    }

    _onDropzoneClick(e) {
        // Don't trigger if clicking buttons
        if (e.target.closest('button')) return;
        this.originalInput.click();
    }

    _onBrowse(e) {
        e.stopPropagation();
        this.originalInput.click();
    }

    _onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropzone.classList.add('border-primary', 'bg-primary/10');
    }

    _onDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropzone.classList.remove('border-primary', 'bg-primary/10');
    }

    _onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.dropzone.classList.remove('border-primary', 'bg-primary/10');

        const file = e.dataTransfer.files[0];
        if (file) {
            this._processFile(file);
        }
    }

    _onReset(e) {
        e.stopPropagation();
        this.reset();
    }

    async _onRemove(e) {
        e.stopPropagation();

        // If we have a removeUrl and a real value (implied by removeUrl presence), try to delete via AJAX
        // validation: ensure we don't have a new file selected (this._file should be null)
        if (this.cfg.removeUrl && !this._file) {
            if (confirm('Are you sure you want to remove this file?')) {
                const success = await this.remove();
                if (success) {
                    // File is deleted from server. 
                    // If we have a fallback image, set it as the new default
                    // Otherwise clear default so we show placeholder
                    this.cfg.defaultImage = this.cfg.fallbackImage || null;

                    this.cfg.oldValue = null;
                    // Also clear removeUrl to prevent trying to delete again
                    this.cfg.removeUrl = null;

                    this.clear();
                }
            }
        } else {
            this.clear();
        }
    }

    // ==================== FILE PROCESSING ====================

    _processFile(file) {
        // Clear previous errors
        this._hideError();

        // Validate file type
        if (!this._validateType(file)) {
            this._showError(
                this.cfg.translations.invalidType.replace('{types}', this.cfg.accept)
            );
            this._emit('error', { error: 'invalid_type', file });
            return false;
        }

        // Validate file size
        if (!this._validateSize(file)) {
            if (file.size > this.cfg.maxSize) {
                this._showError(
                    this.cfg.translations.fileTooBig.replace('{max}', this._formatSize(this.cfg.maxSize))
                );
            } else {
                this._showError(
                    this.cfg.translations.fileTooSmall.replace('{min}', this._formatSize(this.cfg.minSize))
                );
            }
            this._emit('error', { error: 'invalid_size', file });
            return false;
        }

        // Store file
        this._file = file;

        // Update input
        const dt = new DataTransfer();
        dt.items.add(file);
        this.originalInput.files = dt.files;

        // Show preview
        if (this.cfg.preview) {
            if (this._isImage(file)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this._showPreview(e.target.result, file);
                };
                reader.readAsDataURL(file);
            } else {
                this._showPreview(null, file);
            }
        }

        // Auto upload
        if (this.cfg.autoUpload && this.cfg.uploadUrl) {
            this.upload();
        }

        this._emit('select', { file });
        return true;
    }

    _validateType(file) {
        if (!this.cfg.accept || this.cfg.accept === '*') return true;

        const accept = this.cfg.accept.toLowerCase().split(',').map(t => t.trim());
        const fileType = file.type.toLowerCase();
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();

        return accept.some(type => {
            if (type.endsWith('/*')) {
                // Wildcard like image/*
                return fileType.startsWith(type.replace('/*', '/'));
            }
            if (type.startsWith('.')) {
                // Extension like .pdf
                return fileExt === type;
            }
            // Exact MIME type
            return fileType === type;
        });
    }

    _validateSize(file) {
        if (this.cfg.maxSize && file.size > this.cfg.maxSize) return false;
        if (this.cfg.minSize && file.size < this.cfg.minSize) return false;
        return true;
    }

    _isImage(file) {
        return file.type.startsWith('image/');
    }

    // ==================== UI UPDATES ====================

    _showPreview(url, file, isInitial = false, hasRealValue = false) {
        this.elements.placeholder.classList.add('hidden');
        this.elements.preview.classList.remove('hidden');

        if (url && (isInitial || (file && this._isImage(file)))) {
            // Image preview
            this.elements.previewImg.src = url;
            this.elements.previewImg.classList.remove('hidden');
            this.elements.filePreview.classList.add('hidden');
            this._previewUrl = url;
        } else {
            // File icon preview
            this.elements.previewImg.classList.add('hidden');
            this.elements.filePreview.classList.remove('hidden');
            this.elements.filePreview.classList.add('flex');
            if (file) {
                this.elements.filename.textContent = file.name;
            }
        }

        // File info
        if (file && this.cfg.showFileInfo) {
            this.elements.info.classList.remove('hidden');
            this.elements.name.textContent = file.name;
            this.elements.size.textContent = this._formatSize(file.size);
        } else if (isInitial) {
            this.elements.info.classList.add('hidden');
        }

        // Show/hide buttons based on context
        if (file) {
            // New file selected - show only reset (to go back to original)
            this.elements.reset.classList.remove('hidden');
            this.elements.remove.classList.add('hidden');
        } else if (isInitial && hasRealValue) {
            // Initial load with real value (oldValue from DB) - show remove only
            this.elements.reset.classList.add('hidden');
            if (this.cfg.showRemoveButton) {
                this.elements.remove.classList.remove('hidden');
            }
        } else if (isInitial) {
            // Initial load with default placeholder only - hide both
            this.elements.reset.classList.add('hidden');
            this.elements.remove.classList.add('hidden');
        }
    }

    _showPlaceholder() {
        this.elements.placeholder.classList.remove('hidden');
        this.elements.preview.classList.add('hidden');
        this.elements.info.classList.add('hidden');
        this.elements.reset.classList.add('hidden');
        this.elements.remove.classList.add('hidden');
    }

    _showProgress(percent) {
        this.elements.progress.classList.remove('hidden');
        this.elements.progressBar.value = percent;
        this.elements.progressText.textContent = `${Math.round(percent)}%`;
    }

    _hideProgress() {
        this.elements.progress.classList.add('hidden');
        this.elements.progressBar.value = 0;
    }

    _showError(message) {
        this.elements.error.classList.remove('hidden');
        this.elements.errorText.textContent = message;
    }

    _hideError() {
        this.elements.error.classList.add('hidden');
    }

    // ==================== PUBLIC API ====================

    /**
     * Get the current file
     */
    getFile() {
        return this._file;
    }

    /**
     * Get file info
     */
    getFileInfo() {
        if (!this._file) return null;
        return {
            name: this._file.name,
            size: this._file.size,
            type: this._file.type,
            formattedSize: this._formatSize(this._file.size)
        };
    }

    /**
     * Check if a file is selected
     */
    hasFile() {
        return this._file !== null;
    }

    /**
     * Get preview URL
     */
    getPreviewUrl() {
        return this._previewUrl;
    }

    /**
     * Clear the file input
     */
    clear() {
        this._file = null;
        this._previewUrl = null;
        this.originalInput.value = '';

        // Check if we should show default or blank
        if (this.cfg.defaultImage) {
            this._showPreview(this.cfg.defaultImage, null, true);
            this.elements.reset.classList.add('hidden');
        } else {
            this._showPlaceholder();
        }

        this._hideError();
        this._emit('clear');
        this._emit('change', { file: null });
    }

    /**
     * Reset to original/old value
     */
    reset() {
        this._file = null;
        this._previewUrl = null;
        this.originalInput.value = '';

        const originalUrl = this.cfg.oldValue || this.cfg.defaultImage;

        if (originalUrl) {
            this._showPreview(originalUrl, null, true);
            this.elements.reset.classList.add('hidden');
        } else {
            this._showPlaceholder();
        }

        this._hideError();
        this._emit('reset');
        this._emit('change', { file: null });
    }

    /**
     * Set a file programmatically
     */
    setFile(file) {
        if (file instanceof File) {
            this._processFile(file);
        }
    }

    /**
     * Set preview URL directly (for existing files)
     */
    setPreview(url) {
        if (url) {
            this._showPreview(url, null, true);
            this._previewUrl = url;
        }
    }

    /**
     * Upload file via AJAX
     */
    async upload() {
        if (!this._file || !this.cfg.uploadUrl) return null;

        this._isUploading = true;
        this._emit('uploadStart', { file: this._file });

        const formData = new FormData();
        const fieldName = this.cfg.uploadFieldName || this.originalInput.name || 'file';
        formData.append(fieldName, this._file);

        try {
            const response = await this._sendRequest(formData);
            this._isUploading = false;
            this._hideProgress();

            if (response.ok) {
                this._emit('uploadSuccess', { response: response.data });
                return response.data;
            } else {
                throw new Error(response.data?.message || this.cfg.translations.uploadError);
            }
        } catch (error) {
            this._isUploading = false;
            this._hideProgress();
            this._showError(error.message || this.cfg.translations.uploadError);
            this._emit('uploadError', { error });
            return null;
        }
    }

    /**
     * Remove file via AJAX
     */
    async remove() {
        if (!this.cfg.removeUrl) return false;

        try {
            const response = await this._sendRequest(null, 'DELETE', this.cfg.removeUrl);

            if (response.ok) {
                this._emit('removeSuccess', { response: response.data });
                return true;
            } else {
                throw new Error(response.data?.message || 'Removal failed');
            }
        } catch (error) {
            this._showError(error.message || 'Removal failed');
            this._emit('removeError', { error });
            return false;
        }
    }

    async _sendRequest(formData = null, method = null, url = null) {
        const headers = {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        };

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (formData) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && this.cfg.showProgressBar) {
                        const percent = (e.loaded / e.total) * 100;
                        this._showProgress(percent);
                        this._emit('uploadProgress', { loaded: e.loaded, total: e.total, percent });
                    }
                });
            }

            xhr.addEventListener('load', () => {
                let data = {};
                try { data = JSON.parse(xhr.responseText); } catch { }
                resolve({
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    data
                });
            });

            xhr.addEventListener('error', () => reject(new Error('Network error')));

            xhr.open(method || this.cfg.uploadMethod, url || this.cfg.uploadUrl);
            for (const [key, value] of Object.entries(headers)) {
                xhr.setRequestHeader(key, value);
            }
            xhr.send(formData);
        });
    }

    /**
     * Enable the uploader
     */
    enable() {
        this.originalInput.disabled = false;
        this.elements.dropzone.classList.remove('opacity-50', 'pointer-events-none');
        this._emit('enable');
    }

    /**
     * Disable the uploader
     */
    disable() {
        this.originalInput.disabled = true;
        this.elements.dropzone.classList.add('opacity-50', 'pointer-events-none');
        this._emit('disable');
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        if (!this._listeners[event]) {
            this._listeners[event] = new Set();
        }
        this._listeners[event].add(handler);
        return this;
    }

    /**
     * Unsubscribe from events
     */
    off(event, handler) {
        if (this._listeners[event]) {
            if (handler) {
                this._listeners[event].delete(handler);
            } else {
                this._listeners[event].clear();
            }
        }
        return this;
    }

    /**
     * Destroy instance
     */
    destroy() {
        // Remove event listeners
        this.originalInput.removeEventListener('change', this._boundHandlers.onInputChange);
        this.elements.dropzone.removeEventListener('click', this._boundHandlers.onDropzoneClick);
        this.elements.dropzone.removeEventListener('dragover', this._boundHandlers.onDragOver);
        this.elements.dropzone.removeEventListener('dragleave', this._boundHandlers.onDragLeave);
        this.elements.dropzone.removeEventListener('drop', this._boundHandlers.onDrop);
        this.elements.browse.removeEventListener('click', this._boundHandlers.onBrowse);
        this.elements.reset.removeEventListener('click', this._boundHandlers.onReset);
        this.elements.remove.removeEventListener('click', this._boundHandlers.onRemove);

        // Show original input
        this.originalInput.style.display = '';
        this.originalInput.classList.remove('ds-upload-input');

        // Remove container
        this.container.remove();

        // Clear state
        this._listeners = {};
        DSUpload.instances.delete(this.instanceId);
        delete this.wrapper.dataset.dsUploadId;

        this._emit('destroy');
    }

    // ==================== UTILITIES ====================

    _emit(event, detail = {}) {
        (this._listeners[event] || new Set()).forEach(fn => {
            try { fn(detail); } catch (err) { console.warn('DSUpload event error:', err); }
        });

        this.wrapper.dispatchEvent(new CustomEvent(`dsupload:${event}`, {
            bubbles: true,
            detail: { instance: this, ...detail }
        }));
    }

    _formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        if (this.cfg.sizeUnit !== 'auto') {
            const i = sizes.indexOf(this.cfg.sizeUnit);
            if (i > 0) {
                return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
            }
        }

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Auto-init on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DSUpload.initAll());
    } else {
        DSUpload.initAll();
    }
}
