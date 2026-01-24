/**
 * DSSvgUpload
 * * Specialized version of DSUpload for SVG Icons.
 * Layout: [ 60x60 Icon ] [ Dropzone / Actions ]
 */
export class DSSvgUpload extends DSUpload {

    /**
     * Override defaults to force SVG and adjust UI text
     */
    static defaults = {
        ...DSUpload.defaults,
        accept: '.svg,image/svg+xml', // Strict SVG
        preview: true,
        dropzoneText: 'Upload SVG Icon',

        // Custom class defaults for this layout
        wrapperClass: 'w-full',
        iconBoxClass: 'bg-base-200 border border-base-300',
    };

    constructor(selector, config = {}) {
        // Initialize parent logic
        super(selector, config);

        // Add specific marker class for styling if needed
        this.container.classList.add('ds-svg-upload');
    }

    /**
     * OVERRIDE: Build the Horizontal Layout
     * Left: 60x60 Preview Box
     * Right: Interactive Dropzone
     */
    _buildDOM() {
        // Hide original input
        this.originalInput.style.display = 'none';
        this.originalInput.classList.add('ds-upload-input');

        const container = document.createElement('div');
        container.className = `ds-upload-container flex items-start gap-4 ${this.cfg.wrapperClass}`;

        container.innerHTML = `
            <div class="relative shrink-0">
                <div class="w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center ${this.cfg.iconBoxClass}" 
                     id="ds-icon-wrapper-${this.instanceId}">
                    
                    <span class="text-base-content/30" data-ds-upload-placeholder-icon>
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
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
                                ${DSUpload.icons.close}
                            </button>
                             <button type="button" class="btn btn-ghost btn-xs" data-ds-upload-reset title="${this.cfg.translations.reset}">
                                ${DSUpload.icons.reset}
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

        // Cache extra element specific to this class
        this.placeholderIcon = container.querySelector('[data-ds-upload-placeholder-icon]');
    }

    /**
     * OVERRIDE: Specialized Preview Logic for 60x60 Box
     */
    _showPreview(url, file, isInitial = false, hasRealValue = false) {
        // 1. Image Handling
        if (url) {
            // Show Image
            this.elements.previewImg.src = url;
            this.elements.previewImg.classList.remove('hidden');
            this.placeholderIcon.classList.add('hidden');
            this._previewUrl = url;
        } else {
            // Show Placeholder Icon
            this.elements.previewImg.classList.add('hidden');
            this.elements.previewImg.src = '';
            this.placeholderIcon.classList.remove('hidden');
        }

        // 2. UI State Management (Dropzone vs Info)
        if (file || (isInitial && hasRealValue)) {
            // State: Has Content
            this.elements.placeholder.classList.add('hidden'); // Hide "Browse" text
            this.elements.info.classList.remove('hidden');     // Show Filename & Actions
            this.elements.info.classList.add('flex');

            // Populate Info
            if (file) {
                this.elements.name.textContent = file.name;
                this.elements.size.textContent = this._formatSize(file.size);
            } else {
                // For initial values without a file object, just show "Current Icon"
                this.elements.name.textContent = "Current SVG";
                this.elements.size.textContent = "Saved";
            }

            // Buttons Logic
            if (file) {
                this.elements.reset.classList.remove('hidden');
                this.elements.remove.classList.add('hidden');
            } else {
                this.elements.reset.classList.add('hidden');
                if (this.cfg.showRemoveButton) {
                    this.elements.remove.classList.remove('hidden');
                }
            }
        } else {
            // State: Empty
            this.elements.placeholder.classList.remove('hidden');
            this.elements.info.classList.add('hidden');
            this.elements.info.classList.remove('flex');
        }
    }

    /**
     * OVERRIDE: Reset visual state to empty
     */
    _showPlaceholder() {
        this.elements.previewImg.classList.add('hidden');
        this.elements.previewImg.src = '';
        this.placeholderIcon.classList.remove('hidden');

        this.elements.placeholder.classList.remove('hidden');
        this.elements.info.classList.add('hidden');
        this.elements.info.classList.remove('flex');
    }

    /**
     * Helper to create instance easily
     */
    static create(selector, config = {}) {
        return new DSSvgUpload(selector, config);
    }
}