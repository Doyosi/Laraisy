/**
 * DSSvgUpload (Standalone)
 * * A specialized file uploader for SVG Icons with a horizontal layout.
 * [ 60x60 Icon ] [ Dropzone / Actions ]
 */
export class DSSvgUpload {
    static instances = new Map();
    static instanceCounter = 0;

    /**
     * Default Icons (Copied for standalone usage)
     */
    static icons = {
        upload: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>`,
        close: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        reset: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
        file: `<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
    };

    /**
     * Configuration (Merged Defaults + SVG Specifics)
     */
    static defaults = {
        // SVG Specifics
        accept: '.svg,image/svg+xml',
        dropzoneText: 'Upload SVG Icon',
        wrapperClass: 'w-full',
        iconBoxClass: 'bg-base-200 border border-base-300',

        // General Defaults
        preview: true,
        previewMaxHeight: '60px',
        defaultImage: null,
        oldValue: null,
        maxSize: 2 * 1024 * 1024, // 2MB default for SVGs
        minSize: 0,
        showProgressBar: true,
        showFileInfo: true,
        showResetButton: true,
        showRemoveButton: true,
        dropzone: true,
        browseText: 'Browse',

        // Behavior
        autoUpload: false,
        uploadUrl: null,
        removeUrl: null,
        uploadMethod: 'POST',
        uploadFieldName: null,
        sizeUnit: 'auto',

        // Translations
        translations: {
            dropzone: 'Upload SVG Icon',
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
     * @param {string|HTMLElement} selector
     * @param {Object} config
     */
    constructor(selector, config = {}) {
        this.instanceId = `ds-svg-upload-${++DSSvgUpload.instanceCounter}`;

        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) throw new Error('DSSvgUpload: Element not found.');

        this.originalInput = el.tagName === 'INPUT' ? el : el.querySelector('input[type="file"]');
        if (!this.originalInput) throw new Error('DSSvgUpload: No file input found.');

        this.wrapper = el.closest('.form-group') || el.parentElement;
        this.cfg = this._buildConfig(config);

        // State
        this._file = null;
        this._previewUrl = null;
        this._isUploading = false;

        this._listeners = {};
        this._boundHandlers = {};

        this._init();

        DSSvgUpload.instances.set(this.instanceId, this);
        this.wrapper.dataset.dsUploadId = this.instanceId;
    }

    static create(selector, config = {}) {
        return new DSSvgUpload(selector, config);
    }

    static initAll(selector = '[data-ds-svg-upload]') {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.closest('[data-ds-upload-id]')) {
                new DSSvgUpload(el);
            }
        });
    }

    // ==================== INITIALIZATION ====================

    _buildConfig(userConfig) {
        const dataConfig = this._parseDataAttributes();
        return { ...DSSvgUpload.defaults, ...dataConfig, ...userConfig };
    }

    _parseDataAttributes() {
        const data = this.originalInput.dataset;
        const config = {};
        // Map data attributes to config
        if (data.preview !== undefined) config.preview = data.preview !== 'false';
        if (data.defaultImage) config.defaultImage = data.defaultImage;
        if (data.oldValue) config.oldValue = data.oldValue;
        if (data.uploadUrl) config.uploadUrl = data.uploadUrl;
        if (data.removeUrl) config.removeUrl = data.removeUrl;
        return config;
    }

    _init() {
        this._buildDOM();
        this._cacheElements();
        this._bindEvents();
        this._setInitialPreview();

        if (this.cfg.accept) {
            this.originalInput.setAttribute('accept', this.cfg.accept);
        }
    }

    // ==================== DOM BUILDING (Specific to SVG Layout) ====================

    _buildDOM() {
        this.originalInput.style.display = 'none';
        this.originalInput.classList.add('ds-upload-input');

        const container = document.createElement('div');
        // Add specific marker class 'ds-svg-upload'
        container.className = `ds-upload-container ds-svg-upload flex items-start gap-4 ${this.cfg.wrapperClass}`;

        container.innerHTML = `
            <div class="relative shrink-0">
                <div class="w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center ${this.cfg.iconBoxClass}" 
                     id="ds-icon-wrapper-${this.instanceId}">
                    
                    <span class="text-base-content/30" data-ds-upload-placeholder-icon>
                        ${DSSvgUpload.icons.file}
                    </span>

                    <img src="" class="w-full h-full object-contain hidden" data-ds-upload-preview-img>
                </div>
            </div>

            <div class="flex-1 min-w-0">
                <div class="ds-upload-dropzone border border-dashed border-base-300 rounded-lg px-4 py-2 hover:border-primary hover:bg-base-200/50 transition-colors cursor-pointer flex flex-col justify-center min-h-[60px]"
                     data-ds-upload-dropzone>
                    
                    <div class="flex items-center justify-between" data-ds-upload-placeholder>
                        <div class="text-sm text-base-content/70">
                            <span class="font-medium">${this.cfg.translations.browse}</span> 
                            <span class="opacity-60 text-xs hidden sm:inline"> - ${this.cfg.dropzoneText}</span>
                        </div>
                        <div class="text-xs text-base-content/40 bg-base-200 px-2 py-1 rounded">SVG</div>
                    </div>

                    <div class="ds-upload-info hidden flex items-center justify-between gap-3" data-ds-upload-info>
                        <div class="truncate">
                            <p class="text-sm font-medium text-base-content truncate" data-ds-upload-name></p>
                            <p class="text-[10px] text-base-content/50" data-ds-upload-size></p>
                        </div>
                        
                        <div class="flex shrink-0 gap-1">
                             <button type="button" class="btn btn-ghost btn-xs text-error" data-ds-upload-remove title="${this.cfg.translations.remove}">
                                ${DSSvgUpload.icons.close}
                            </button>
                             <button type="button" class="btn btn-ghost btn-xs" data-ds-upload-reset title="${this.cfg.translations.reset}">
                                ${DSSvgUpload.icons.reset}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ds-upload-progress hidden mt-2" data-ds-upload-progress>
                    <progress class="progress progress-primary w-full h-1" value="0" max="100" data-ds-upload-progress-bar></progress>
                    <div class="text-[10px] text-right text-base-content/60 mt-0.5" data-ds-upload-progress-text>0%</div>
                </div>

                <div class="ds-upload-error hidden mt-1" data-ds-upload-error>
                    <p class="text-xs text-error" data-ds-upload-error-text></p>
                </div>
            </div>
        `;

        this.originalInput.insertAdjacentElement('afterend', container);
        this.container = container;
    }

    _cacheElements() {
        this.elements = {
            dropzone: this.container.querySelector('[data-ds-upload-dropzone]'),
            placeholder: this.container.querySelector('[data-ds-upload-placeholder]'),
            // Specific to SVG Upload
            placeholderIcon: this.container.querySelector('[data-ds-upload-placeholder-icon]'),

            previewImg: this.container.querySelector('[data-ds-upload-preview-img]'),

            info: this.container.querySelector('[data-ds-upload-info]'),
            name: this.container.querySelector('[data-ds-upload-name]'),
            size: this.container.querySelector('[data-ds-upload-size]'),

            reset: this.container.querySelector('[data-ds-upload-reset]'),
            remove: this.container.querySelector('[data-ds-upload-remove]'),

            progress: this.container.querySelector('[data-ds-upload-progress]'),
            progressBar: this.container.querySelector('[data-ds-upload-progress-bar]'),
            progressText: this.container.querySelector('[data-ds-upload-progress-text]'),

            error: this.container.querySelector('[data-ds-upload-error]'),
            errorText: this.container.querySelector('[data-ds-upload-error-text]')
        };
    }

    // ==================== EVENTS (Standard Logic) ====================

    _bindEvents() {
        this._boundHandlers = {
            onInputChange: this._onInputChange.bind(this),
            onDropzoneClick: this._onDropzoneClick.bind(this),
            onDragOver: this._onDragOver.bind(this),
            onDragLeave: this._onDragLeave.bind(this),
            onDrop: this._onDrop.bind(this),
            onReset: this._onReset.bind(this),
            onRemove: this._onRemove.bind(this)
        };

        this.originalInput.addEventListener('change', this._boundHandlers.onInputChange);
        this.elements.dropzone.addEventListener('click', this._boundHandlers.onDropzoneClick);
        this.elements.dropzone.addEventListener('dragover', this._boundHandlers.onDragOver);
        this.elements.dropzone.addEventListener('dragleave', this._boundHandlers.onDragLeave);
        this.elements.dropzone.addEventListener('drop', this._boundHandlers.onDrop);
        this.elements.reset.addEventListener('click', this._boundHandlers.onReset);
        this.elements.remove.addEventListener('click', this._boundHandlers.onRemove);
    }

    _setInitialPreview() {
        const initialUrl = this.cfg.oldValue || this.cfg.defaultImage;
        const hasRealValue = !!this.cfg.oldValue || !!this.cfg.removeUrl;

        if (initialUrl && this.cfg.preview) {
            this._showPreview(initialUrl, null, true, hasRealValue);
        }

        this.elements.reset.classList.add('hidden');
    }

    // ==================== HANDLERS ====================

    _onInputChange(e) {
        const file = e.target.files[0];
        if (file) this._processFile(file);
    }

    _onDropzoneClick(e) {
        if (e.target.closest('button')) return;
        this.originalInput.click();
    }

    _onDragOver(e) {
        e.preventDefault(); e.stopPropagation();
        this.elements.dropzone.classList.add('border-primary', 'bg-primary/10');
    }

    _onDragLeave(e) {
        e.preventDefault(); e.stopPropagation();
        this.elements.dropzone.classList.remove('border-primary', 'bg-primary/10');
    }

    _onDrop(e) {
        e.preventDefault(); e.stopPropagation();
        this.elements.dropzone.classList.remove('border-primary', 'bg-primary/10');
        const file = e.dataTransfer.files[0];
        if (file) this._processFile(file);
    }

    _onReset(e) {
        e.stopPropagation();
        this.reset();
    }

    async _onRemove(e) {
        e.stopPropagation();
        if (this.cfg.removeUrl && !this._file) {
            if (confirm('Are you sure you want to remove this file?')) {
                const success = await this.remove();
                if (success) {
                    this.cfg.oldValue = null;
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
        this._hideError();

        // Type Validation
        if (!this._validateType(file)) {
            this._showError(this.cfg.translations.invalidType.replace('{types}', 'SVG'));
            return false;
        }

        // Size Validation
        if (file.size > this.cfg.maxSize) {
            this._showError(this.cfg.translations.fileTooBig.replace('{max}', this._formatSize(this.cfg.maxSize)));
            return false;
        }

        this._file = file;

        const dt = new DataTransfer();
        dt.items.add(file);
        this.originalInput.files = dt.files;

        if (this.cfg.preview) {
            const reader = new FileReader();
            reader.onload = (e) => this._showPreview(e.target.result, file);
            reader.readAsDataURL(file);
        }

        if (this.cfg.autoUpload && this.cfg.uploadUrl) {
            this.upload();
        }

        this._emit('select', { file });
        return true;
    }

    _validateType(file) {
        // Strict SVG check
        return file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
    }

    // ==================== UI UPDATES (Specific to SVG Layout) ====================

    _showPreview(url, file, isInitial = false, hasRealValue = false) {
        // 1. Image / Icon Handling
        if (url) {
            this.elements.previewImg.src = url;
            this.elements.previewImg.classList.remove('hidden');
            this.elements.placeholderIcon.classList.add('hidden');
            this._previewUrl = url;
        } else {
            this._showPlaceholder();
            return;
        }

        // 2. Info / Dropzone state
        if (file || (isInitial && hasRealValue)) {
            // Show Info
            this.elements.placeholder.classList.add('hidden');
            this.elements.info.classList.remove('hidden');
            this.elements.info.classList.add('flex');

            if (file) {
                this.elements.name.textContent = file.name;
                this.elements.size.textContent = this._formatSize(file.size);

                // Show Reset, Hide Remove (Local state)
                this.elements.reset.classList.remove('hidden');
                this.elements.remove.classList.add('hidden');
            } else {
                // Initial Load (Server state)
                this.elements.name.textContent = "Current SVG";
                this.elements.size.textContent = "Saved";

                // Hide Reset, Show Remove (Server state)
                this.elements.reset.classList.add('hidden');
                if (this.cfg.showRemoveButton) {
                    this.elements.remove.classList.remove('hidden');
                }
            }
        } else {
            // Empty state
            this._showPlaceholder();
        }
    }

    _showPlaceholder() {
        this.elements.previewImg.classList.add('hidden');
        this.elements.previewImg.src = '';
        this.elements.placeholderIcon.classList.remove('hidden');

        this.elements.placeholder.classList.remove('hidden');
        this.elements.info.classList.add('hidden');
        this.elements.info.classList.remove('flex');
    }

    _showError(msg) {
        this.elements.error.classList.remove('hidden');
        this.elements.errorText.textContent = msg;
    }

    _hideError() {
        this.elements.error.classList.add('hidden');
    }

    // ==================== PUBLIC API ====================

    reset() {
        this._file = null;
        this.originalInput.value = '';
        const originalUrl = this.cfg.oldValue || this.cfg.defaultImage;

        if (originalUrl) {
            this._showPreview(originalUrl, null, true, !!this.cfg.oldValue);
        } else {
            this._showPlaceholder();
        }
        this._hideError();
        this._emit('reset');
    }

    clear() {
        this._file = null;
        this.originalInput.value = '';
        if (this.cfg.defaultImage) {
            this._showPreview(this.cfg.defaultImage, null, true);
        } else {
            this._showPlaceholder();
        }
        this._hideError();
        this._emit('clear');
    }

    async upload() {
        if (!this._file || !this.cfg.uploadUrl) return;

        this._isUploading = true;
        this.elements.progress.classList.remove('hidden');
        this._emit('uploadStart');

        const formData = new FormData();
        const fieldName = this.cfg.uploadFieldName || this.originalInput.name || 'file';
        formData.append(fieldName, this._file);

        try {
            const response = await this._sendRequest(formData);
            if (response.ok) {
                this.elements.progress.classList.add('hidden');
                this._emit('uploadSuccess', { response: response.data });
            } else {
                throw new Error('Upload failed');
            }
        } catch (e) {
            this.elements.progress.classList.add('hidden');
            this._showError(e.message);
        }
    }

    async remove() {
        if (!this.cfg.removeUrl) return false;
        try {
            const response = await this._sendRequest(null, 'DELETE', this.cfg.removeUrl);
            if (response.ok) return true;
        } catch (e) {
            this._showError('Removal failed');
        }
        return false;
    }

    _sendRequest(formData, method, url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const token = document.querySelector('meta[name="csrf-token"]')?.content;

            if (formData) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const p = (e.loaded / e.total) * 100;
                        this.elements.progressBar.value = p;
                        this.elements.progressText.textContent = Math.round(p) + '%';
                    }
                });
            }

            xhr.addEventListener('load', () => resolve({ ok: xhr.status < 300, data: JSON.parse(xhr.responseText || '{}') }));
            xhr.addEventListener('error', () => reject(new Error('Network Error')));

            xhr.open(method || this.cfg.uploadMethod, url || this.cfg.uploadUrl);
            xhr.setRequestHeader('Accept', 'application/json');
            if (token) xhr.setRequestHeader('X-CSRF-TOKEN', token);
            xhr.send(formData);
        });
    }

    _emit(event, detail = {}) {
        this.wrapper.dispatchEvent(new CustomEvent(`dssvgupload:${event}`, { detail: { instance: this, ...detail }, bubbles: true }));
    }

    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB'][i];
    }
}