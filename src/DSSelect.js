/**
 * DSSelect
 * 
 * A comprehensive searchable select component with:
 * - Static options, JSON data, and Axios remote fetching
 * - Single and multiple selection modes
 * - Laravel old/current/default value support
 * - Full event system
 * - Multiple instances support
 */
export class DSSelect {
    static instances = new Map();
    static instanceCounter = 0;

    /**
     * Default Icons
     */
    static icons = {
        search: `<svg class="w-4 h-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
        chevron: `<svg class="w-4 h-4 text-base-content/50 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`,
        close: `<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        loading: `<span class="loading loading-spinner loading-sm"></span>`,
        check: `<svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
        clear: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
    };

    /**
     * Default configuration
     */
    static defaults = {
        // Data sources
        options: [],                    // [{id: 1, name: 'Option'}] or {1: 'Option'}
        axiosUrl: null,                 // Remote data URL
        axiosMethod: 'GET',            // HTTP method for remote
        axiosParams: {},               // Additional params
        axiosSearchParam: 'search',    // Search query param name
        axiosDataPath: 'data',         // Path to options in response

        // Value configuration
        valueKey: 'id',                // Key for option value
        labelKey: 'name',              // Key for option label

        // Selection
        multiple: false,               // Allow multiple selection
        maxSelections: null,           // Max items in multiple mode

        // Search
        searchable: true,              // Enable search input
        searchMinLength: 0,            // Min chars before search
        searchDebounce: 300,           // Debounce delay (ms)

        // UI
        placeholder: 'Select...',
        searchPlaceholder: 'Type to search...',
        noResultsText: 'No results found',
        loadingText: 'Loading...',
        clearable: true,               // Show clear button
        disabled: false,

        // Dropdown
        closeOnSelect: true,           // Close after selection (single mode)
        openOnFocus: true,             // Open when input focused
        maxHeight: '240px',            // Dropdown max height

        // Classes
        wrapperClass: '',
        inputClass: '',
        dropdownClass: '',
        optionClass: '',

        // Translations (for i18n)
        translations: {
            noResults: 'No results found',
            loading: 'Loading...',
            maxSelected: 'Maximum {max} items allowed'
        }
    };

    /**
     * @param {string|HTMLElement} selector - Container element or selector
     * @param {Object} config - Configuration options
     */
    constructor(selector, config = {}) {
        this.instanceId = `ds-select-${++DSSelect.instanceCounter}`;
        this.wrapper = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (!this.wrapper) {
            throw new Error('DSSelect: Container element not found.');
        }

        // Merge config with data attributes and defaults
        this.cfg = this._buildConfig(config);

        // State
        this._options = [];
        this._filteredOptions = [];
        this._selected = this.cfg.multiple ? [] : null;
        this._isOpen = false;
        this._isLoading = false;
        this._searchTerm = '';
        this._highlightedIndex = -1;

        // Debounce timer
        this._searchTimer = null;

        // Event listeners storage for cleanup
        this._listeners = {};
        this._boundHandlers = {};

        // Initialize
        this._init();

        // Register instance
        DSSelect.instances.set(this.instanceId, this);
        this.wrapper.dataset.dsSelectId = this.instanceId;
    }

    /**
     * Static factory method
     */
    static create(selector, config = {}) {
        return new DSSelect(selector, config);
    }

    /**
     * Get instance by element
     */
    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;
        const id = el.dataset.dsSelectId;
        return id ? DSSelect.instances.get(id) : null;
    }

    /**
     * Auto-initialize all elements with [data-ds-select]
     */
    static initAll(selector = '[data-ds-select]') {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.dataset.dsSelectId) {
                new DSSelect(el);
            }
        });
    }

    // ==================== INITIALIZATION ====================

    _buildConfig(userConfig) {
        const dataConfig = this._parseDataAttributes();
        return { ...DSSelect.defaults, ...dataConfig, ...userConfig };
    }

    _parseDataAttributes() {
        const data = this.wrapper.dataset;
        const config = {};

        // Parse known data attributes
        if (data.options) {
            try { config.options = JSON.parse(data.options); } catch { }
        }
        if (data.axiosUrl) config.axiosUrl = data.axiosUrl;
        if (data.axiosMethod) config.axiosMethod = data.axiosMethod;
        if (data.multiple !== undefined) config.multiple = data.multiple === 'true';
        if (data.placeholder) config.placeholder = data.placeholder;
        if (data.searchPlaceholder) config.searchPlaceholder = data.searchPlaceholder;
        if (data.valueKey) config.valueKey = data.valueKey;
        if (data.labelKey) config.labelKey = data.labelKey;
        if (data.clearable !== undefined) config.clearable = data.clearable === 'true';
        if (data.disabled !== undefined) config.disabled = data.disabled === 'true';
        if (data.maxSelections) config.maxSelections = parseInt(data.maxSelections, 10);
        if (data.value) {
            try {
                config.initialValue = JSON.parse(data.value);
            } catch {
                config.initialValue = data.value;
            }
        }

        return config;
    }

    _init() {
        this._buildDOM();
        this._cacheElements();
        this._loadInitialOptions();
        this._setInitialValue();
        this._bindEvents();

        // Ensure UI state is correct (especially for empty multiple selects)
        this._updateUI();

        if (this.cfg.disabled) {
            this.disable();
        }
    }

    _buildDOM() {
        // Get existing hidden input if any (for ID)
        const existingInput = this.wrapper.querySelector('input[type="hidden"]');

        // Always use data-name as the base name, strip any existing [] to prevent double-brackets on hot reload
        let baseName = this.wrapper.dataset.name || 'select';
        baseName = baseName.replace(/\[\]$/, ''); // Remove trailing [] if present

        const inputName = baseName + (this.cfg.multiple ? '[]' : '');
        const inputId = existingInput?.id || this.wrapper.dataset.id || this.instanceId;

        this.wrapper.classList.add('ds-select-wrapper', 'relative', 'w-full');
        if (this.cfg.wrapperClass) {
            this.wrapper.classList.add(...this.cfg.wrapperClass.split(' '));
        }

        this.wrapper.innerHTML = `
            <!-- Hidden Input(s) for form submission -->
            <input type="hidden" 
                   name="${inputName}" 
                   id="${inputId}"
                   data-ds-select-value>

            <!-- Main Control -->
            <div class="ds-select-control focus-within:outline-none input input-bordered w-full flex items-center gap-1 min-h-10 cursor-pointer py-2 h-auto pr-2 ${this.cfg.inputClass}"
                 data-ds-select-control>
                
                <!-- Content Area (Tags + Search) -->
                <div class="ds-select-content flex flex-wrap items-center gap-1 flex-1 min-w-0">
                    <!-- Selected Tags (Multiple Mode) -->
                    <div class="ds-select-tags contents" data-ds-select-tags></div>
                    
                    <!-- Search Input -->
                    <input type="text" 
                           class="ds-select-search flex-1 min-w-[60px] bg-transparent border-0 outline-none text-sm p-0"
                           placeholder="${this.cfg.placeholder}"
                           data-ds-select-search
                           autocomplete="off"
                           ${this.cfg.disabled ? 'disabled' : ''}>
                </div>
                
                <!-- Icons Container (Always stays right) -->
                <div class="ds-select-icons flex items-center gap-1 ml-auto flex-shrink-0">
                    <button type="button" 
                            class="ds-select-clear btn btn-ghost btn-xs btn-circle hidden"
                            data-ds-select-clear
                            tabindex="-1">
                        ${DSSelect.icons.clear}
                    </button>
                    <span class="ds-select-loading hidden" data-ds-select-loading>
                        ${DSSelect.icons.loading}
                    </span>
                    <span class="ds-select-chevron" data-ds-select-chevron>
                        ${DSSelect.icons.chevron}
                    </span>
                </div>
            </div>

            <!-- Dropdown -->
            <div class="ds-select-dropdown absolute left-0 right-0 top-full mt-1 z-50 hidden"
                 data-ds-select-dropdown>
                <ul class="ds-select-options bg-base-100 rounded-box shadow-lg border border-base-300 p-2 overflow-y-auto text-sm w-full flex flex-col gap-1 ${this.cfg.dropdownClass}"
                    style="max-height: ${this.cfg.maxHeight}"
                    data-ds-select-options
                    tabindex="-1">
                </ul>
            </div>
        `;
    }

    _cacheElements() {
        this.elements = {
            hiddenInput: this.wrapper.querySelector('[data-ds-select-value]'),
            control: this.wrapper.querySelector('[data-ds-select-control]'),
            tags: this.wrapper.querySelector('[data-ds-select-tags]'),
            search: this.wrapper.querySelector('[data-ds-select-search]'),
            clear: this.wrapper.querySelector('[data-ds-select-clear]'),
            loading: this.wrapper.querySelector('[data-ds-select-loading]'),
            chevron: this.wrapper.querySelector('[data-ds-select-chevron]'),
            dropdown: this.wrapper.querySelector('[data-ds-select-dropdown]'),
            options: this.wrapper.querySelector('[data-ds-select-options]')
        };
    }

    _loadInitialOptions() {
        // Priority: config options > data-options > axios
        if (this.cfg.options && (Array.isArray(this.cfg.options) ? this.cfg.options.length : Object.keys(this.cfg.options).length)) {
            this._options = this._normalizeOptions(this.cfg.options);
            this._filteredOptions = [...this._options];
        } else if (this.cfg.axiosUrl) {
            this._fetchRemoteOptions();
        }
    }

    _normalizeOptions(options) {
        // Handle array of objects
        if (Array.isArray(options)) {
            return options.map(opt => {
                if (typeof opt === 'object') {
                    return {
                        value: String(opt[this.cfg.valueKey] ?? opt.id ?? opt.value),
                        label: opt[this.cfg.labelKey] ?? opt.name ?? opt.label ?? opt.text,
                        data: opt
                    };
                }
                return { value: String(opt), label: String(opt), data: opt };
            });
        }

        // Handle object (key-value pairs)
        if (typeof options === 'object') {
            return Object.entries(options).map(([key, value]) => ({
                value: String(key),
                label: String(value),
                data: { [this.cfg.valueKey]: key, [this.cfg.labelKey]: value }
            }));
        }

        return [];
    }

    _setInitialValue() {
        // Priority: old (Laravel) > current > default > config
        const oldValue = this.wrapper.dataset.oldValue;
        const currentValue = this.wrapper.dataset.currentValue;
        const defaultValue = this.wrapper.dataset.defaultValue;
        const configValue = this.cfg.initialValue;

        let value = oldValue ?? currentValue ?? defaultValue ?? configValue;

        if (value !== undefined && value !== null && value !== '') {
            if (this.cfg.multiple) {
                let values;
                if (Array.isArray(value)) {
                    values = value;
                } else if (typeof value === 'string') {
                    // Try to parse as JSON first (for encoded arrays like ["1","2"])
                    try {
                        const parsed = JSON.parse(value);
                        values = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        // Fallback to comma-separated string
                        values = value.split(',');
                    }
                } else {
                    values = [value];
                }
                values.forEach(v => this._selectValue(String(v).trim(), false));
            } else {
                this._selectValue(String(value), false);
            }
        }
    }

    // ==================== EVENTS ====================

    _bindEvents() {
        // Store bound handlers for cleanup
        this._boundHandlers = {
            onControlClick: this._onControlClick.bind(this),
            onSearchInput: this._onSearchInput.bind(this),
            onSearchKeydown: this._onSearchKeydown.bind(this),
            onSearchFocus: this._onSearchFocus.bind(this),
            onClearClick: this._onClearClick.bind(this),
            onDocumentClick: this._onDocumentClick.bind(this),
            onOptionClick: this._onOptionClick.bind(this)
        };

        // Control click
        this.elements.control.addEventListener('click', this._boundHandlers.onControlClick);

        // Search input
        this.elements.search.addEventListener('input', this._boundHandlers.onSearchInput);
        this.elements.search.addEventListener('keydown', this._boundHandlers.onSearchKeydown);
        this.elements.search.addEventListener('focus', this._boundHandlers.onSearchFocus);

        // Clear button
        this.elements.clear.addEventListener('click', this._boundHandlers.onClearClick);

        // Outside click
        document.addEventListener('click', this._boundHandlers.onDocumentClick);

        // Options list delegation
        this.elements.options.addEventListener('click', this._boundHandlers.onOptionClick);
    }

    _onControlClick(e) {
        if (this.cfg.disabled) return;
        if (e.target.closest('[data-ds-select-clear]')) return;

        this.elements.search.focus();
        if (!this._isOpen) {
            this.open();
        }
    }

    _onSearchInput(e) {
        const term = e.target.value;
        this._searchTerm = term;

        this._emit('search', { term });

        // Debounce search
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
            this._performSearch(term);
        }, this.cfg.searchDebounce);
    }

    _onSearchKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!this._isOpen) {
                    this.open();
                } else {
                    this._highlightNext();
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                this._highlightPrev();
                break;

            case 'Enter':
                e.preventDefault();
                if (this._highlightedIndex >= 0 && this._filteredOptions[this._highlightedIndex]) {
                    this._selectOption(this._filteredOptions[this._highlightedIndex]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.close();
                break;

            case 'Backspace':
                if (this.cfg.multiple && !this._searchTerm && this._selected.length > 0) {
                    this._deselectValue(this._selected[this._selected.length - 1].value);
                }
                break;
        }
    }

    _onSearchFocus() {
        if (this.cfg.openOnFocus && !this._isOpen) {
            this.open();
        }
    }

    _onClearClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.clear();
    }

    _onDocumentClick(e) {
        if (!this.wrapper.contains(e.target) && this._isOpen) {
            this.close();
        }
    }

    _onOptionClick(e) {
        const optionEl = e.target.closest('[data-ds-option-value]');
        if (!optionEl) return;

        const value = optionEl.dataset.dsOptionValue;
        const option = this._options.find(o => o.value === value);

        if (option) {
            this._selectOption(option);
        }
    }

    // ==================== SEARCH ====================

    _performSearch(term) {
        if (this.cfg.axiosUrl && term.length >= this.cfg.searchMinLength) {
            this._fetchRemoteOptions(term);
        } else {
            this._filterOptions(term);
        }
    }

    _filterOptions(term) {
        const searchTerm = term.toLowerCase().trim();

        if (!searchTerm) {
            this._filteredOptions = [...this._options];
        } else {
            this._filteredOptions = this._options.filter(opt =>
                opt.label.toLowerCase().includes(searchTerm)
            );
        }

        this._highlightedIndex = this._filteredOptions.length > 0 ? 0 : -1;
        this._renderOptions();
    }

    async _fetchRemoteOptions(searchTerm = '') {
        if (!this.cfg.axiosUrl) return;

        this._setLoading(true);

        const params = {
            ...this.cfg.axiosParams,
            [this.cfg.axiosSearchParam]: searchTerm
        };

        try {
            let response;

            // Use axios if available, otherwise fetch
            if (window.axios) {
                response = await window.axios({
                    method: this.cfg.axiosMethod,
                    url: this.cfg.axiosUrl,
                    params: this.cfg.axiosMethod.toUpperCase() === 'GET' ? params : undefined,
                    data: this.cfg.axiosMethod.toUpperCase() !== 'GET' ? params : undefined
                });
                response = response.data;
            } else {
                const url = new URL(this.cfg.axiosUrl, window.location.origin);
                if (this.cfg.axiosMethod.toUpperCase() === 'GET') {
                    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
                }

                const fetchOptions = {
                    method: this.cfg.axiosMethod,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                    }
                };

                if (this.cfg.axiosMethod.toUpperCase() !== 'GET') {
                    fetchOptions.body = JSON.stringify(params);
                }

                const res = await fetch(url.toString(), fetchOptions);
                response = await res.json();
            }

            // Extract data from response
            let data = response;
            if (this.cfg.axiosDataPath) {
                const paths = this.cfg.axiosDataPath.split('.');
                for (const path of paths) {
                    data = data?.[path];
                }
            }

            this._options = this._normalizeOptions(data || []);
            this._filteredOptions = [...this._options];

            // IMPORTANT: Set loading to false BEFORE rendering so options actually display
            this._setLoading(false);
            this._renderOptions();

            this._emit('load', { options: this._options });

        } catch (error) {
            console.error('DSSelect: Failed to fetch options', error);
            this._setLoading(false);
            this._emit('error', { error });
        }

    }

    // ==================== SELECTION ====================

    _selectOption(option) {
        if (this.cfg.multiple) {
            const isSelected = this._selected.some(s => s.value === option.value);

            if (isSelected) {
                this._deselectValue(option.value);
            } else {
                // Check max selections
                if (this.cfg.maxSelections && this._selected.length >= this.cfg.maxSelections) {
                    this._emit('maxReached', { max: this.cfg.maxSelections });
                    return;
                }
                this._selected.push(option);
                this._emit('select', { option, selected: this._selected });
            }

            // Clear search and reset filter in multiple mode
            this.elements.search.value = '';
            this._searchTerm = '';
            this._filteredOptions = [...this._options];
        } else {
            const prevSelected = this._selected;
            this._selected = option;
            this._emit('select', { option, previous: prevSelected });

            if (this.cfg.closeOnSelect) {
                this.close();
            }
        }

        this._updateUI();
        this._emit('change', { value: this.getValue(), selected: this._selected });
    }

    _selectValue(value, triggerChange = true) {
        const option = this._options.find(o => o.value === value);
        if (!option) return false;

        if (this.cfg.multiple) {
            if (!this._selected.some(s => s.value === value)) {
                this._selected.push(option);
            }
        } else {
            this._selected = option;
        }

        this._updateUI();

        if (triggerChange) {
            this._emit('change', { value: this.getValue(), selected: this._selected });
        }

        return true;
    }

    _deselectValue(value) {
        if (!this.cfg.multiple) {
            this._selected = null;
        } else {
            const option = this._selected.find(s => s.value === value);
            this._selected = this._selected.filter(s => s.value !== value);
            if (option) {
                this._emit('deselect', { option, selected: this._selected });
            }
        }

        this._updateUI();
        this._emit('change', { value: this.getValue(), selected: this._selected });
    }

    // ==================== UI RENDERING ====================

    _updateUI() {
        this._updateHiddenInput();
        this._updateTags();
        this._updateSearchPlaceholder();
        this._updateClearButton();
        this._renderOptions();
    }

    _updateHiddenInput() {
        if (this.cfg.multiple) {
            // For multiple, we need multiple hidden inputs
            const name = this.elements.hiddenInput.name;

            // Remove existing additional inputs
            this.wrapper.querySelectorAll('input[data-ds-select-multi-value]').forEach(el => el.remove());

            if (this._selected.length === 0) {
                // Disable the hidden input so it won't be submitted (prevents [""] being sent)
                this.elements.hiddenInput.value = '';
                this.elements.hiddenInput.disabled = true;
            } else {
                // Enable and create hidden input for each selected value
                this.elements.hiddenInput.disabled = false;
                this.elements.hiddenInput.value = this._selected[0].value;

                this._selected.slice(1).forEach(opt => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = name;
                    input.value = opt.value;
                    input.dataset.dsSelectMultiValue = 'true';
                    this.wrapper.insertBefore(input, this.elements.control);
                });
            }
        } else {
            this.elements.hiddenInput.value = this._selected?.value || '';
        }
    }

    _updateTags() {
        if (!this.cfg.multiple) {
            // For single select, show selected value in search input
            this.elements.tags.innerHTML = '';
            if (this._selected && !this._isOpen) {
                this.elements.search.value = this._selected.label;
            }
            return;
        }

        // Multiple mode - render tags
        this.elements.tags.innerHTML = this._selected.map(opt => `
            <span class="ds-select-tag badge badge-primary gap-1 py-3">
                <span class="text-xs">${this._escapeHtml(opt.label)}</span>
                <button type="button" 
                        class="btn btn-ghost btn-xs btn-circle -mr-1" 
                        data-ds-tag-remove="${opt.value}"
                        tabindex="-1">
                    ${DSSelect.icons.close}
                </button>
            </span>
        `).join('');

        // Bind remove handlers
        this.elements.tags.querySelectorAll('[data-ds-tag-remove]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._deselectValue(btn.dataset.dsTagRemove);
                this.elements.search.focus();
            });
        });
    }

    _updateSearchPlaceholder() {
        if (this.cfg.multiple) {
            this.elements.search.placeholder = this._selected.length > 0
                ? ''
                : this.cfg.placeholder;
        } else {
            this.elements.search.placeholder = this._selected
                ? ''
                : this.cfg.placeholder;
        }
    }

    _updateClearButton() {
        const hasValue = this.cfg.multiple
            ? this._selected.length > 0
            : this._selected !== null;

        if (this.cfg.clearable && hasValue) {
            this.elements.clear.classList.remove('hidden');
        } else {
            this.elements.clear.classList.add('hidden');
        }
    }

    _renderOptions() {
        if (this._isLoading) {
            this.elements.options.innerHTML = `
                <li class="disabled text-center py-4 text-base-content/50">
                    ${DSSelect.icons.loading}
                    <span class="ml-2">${this.cfg.loadingText}</span>
                </li>
            `;
            return;
        }

        if (this._filteredOptions.length === 0) {
            this.elements.options.innerHTML = `
                <li class="disabled text-center py-4 text-base-content/50">
                    ${this.cfg.noResultsText}
                </li>
            `;
            return;
        }

        this.elements.options.innerHTML = this._filteredOptions.map((opt, idx) => {
            const isSelected = this.cfg.multiple
                ? this._selected.some(s => s.value === opt.value)
                : this._selected?.value === opt.value;
            const isHighlighted = idx === this._highlightedIndex;

            return `
                <li class="w-full">
                    <a class="ds-select-option flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg cursor-pointer hover:bg-base-200 ${isSelected ? 'bg-primary/10 text-primary' : ''} ${isHighlighted ? 'bg-base-200' : ''} ${this.cfg.optionClass}"
                       data-ds-option-value="${this._escapeHtml(opt.value)}"
                       data-ds-option-index="${idx}">
                        <span>${this._escapeHtml(opt.label)}</span>
                        ${isSelected ? DSSelect.icons.check : ''}
                    </a>
                </li>
            `;
        }).join('');
    }

    _highlightNext() {
        if (this._filteredOptions.length === 0) return;

        this._highlightedIndex = Math.min(
            this._highlightedIndex + 1,
            this._filteredOptions.length - 1
        );
        this._updateHighlight();
    }

    _highlightPrev() {
        if (this._filteredOptions.length === 0) return;

        this._highlightedIndex = Math.max(this._highlightedIndex - 1, 0);
        this._updateHighlight();
    }

    _updateHighlight() {
        this.elements.options.querySelectorAll('.ds-select-option').forEach((el, idx) => {
            el.classList.toggle('focus', idx === this._highlightedIndex);
        });

        // Scroll into view
        const highlighted = this.elements.options.querySelector('.focus');
        if (highlighted) {
            highlighted.scrollIntoView({ block: 'nearest' });
        }
    }

    _setLoading(loading) {
        this._isLoading = loading;
        this.elements.loading.classList.toggle('hidden', !loading);
        this.elements.chevron.classList.toggle('hidden', loading);
    }

    // ==================== PUBLIC API ====================

    /**
     * Open the dropdown
     */
    open() {
        if (this._isOpen || this.cfg.disabled) return;

        this._isOpen = true;
        this.elements.dropdown.classList.remove('hidden');
        this.elements.chevron.querySelector('svg')?.classList.add('rotate-180');

        // Reset search for single mode
        if (!this.cfg.multiple && this._selected) {
            this.elements.search.value = '';
        }

        this._filteredOptions = [...this._options];
        this._highlightedIndex = 0;
        this._renderOptions();

        this._emit('open');
    }

    /**
     * Close the dropdown
     */
    close() {
        if (!this._isOpen) return;

        this._isOpen = false;
        this.elements.dropdown.classList.add('hidden');
        this.elements.chevron.querySelector('svg')?.classList.remove('rotate-180');

        // Restore selection display for single mode
        if (!this.cfg.multiple) {
            this.elements.search.value = this._selected?.label || '';
        }

        this._searchTerm = '';

        this._emit('close');
    }

    /**
     * Toggle dropdown
     */
    toggle() {
        this._isOpen ? this.close() : this.open();
    }

    /**
     * Get current value(s)
     */
    getValue() {
        if (this.cfg.multiple) {
            return this._selected.map(s => s.value);
        }
        return this._selected?.value || null;
    }

    /**
     * Get selected option(s) with full data
     */
    getSelected() {
        return this._selected;
    }

    /**
     * Set value(s)
     */
    setValue(value) {
        if (this.cfg.multiple) {
            this._selected = [];
            const values = Array.isArray(value) ? value : [value];
            values.forEach(v => this._selectValue(String(v), false));
        } else {
            this._selected = null;
            if (value !== null && value !== undefined) {
                this._selectValue(String(value), false);
            }
        }
        this._updateUI();
        this._emit('change', { value: this.getValue(), selected: this._selected });
    }

    /**
     * Clear all selections
     */
    clear() {
        if (this.cfg.multiple) {
            this._selected = [];
        } else {
            this._selected = null;
        }

        this.elements.search.value = '';
        this._searchTerm = '';
        this._updateUI();

        this._emit('clear');
        this._emit('change', { value: this.getValue(), selected: this._selected });
    }

    /**
     * Reset to initial value
     */
    reset() {
        this.clear();
        this._setInitialValue();
        this._emit('reset');
    }

    /**
     * Add option(s)
     */
    addOption(option) {
        const normalized = this._normalizeOptions(Array.isArray(option) ? option : [option]);
        this._options.push(...normalized);
        this._filteredOptions = [...this._options];
        this._renderOptions();
    }

    /**
     * Remove option by value
     */
    removeOption(value) {
        this._options = this._options.filter(o => o.value !== String(value));
        this._filteredOptions = this._filteredOptions.filter(o => o.value !== String(value));

        // Also deselect if selected
        if (this.cfg.multiple) {
            this._selected = this._selected.filter(s => s.value !== String(value));
        } else if (this._selected?.value === String(value)) {
            this._selected = null;
        }

        this._updateUI();
    }

    /**
     * Set options (replace all)
     */
    setOptions(options) {
        this._options = this._normalizeOptions(options);
        this._filteredOptions = [...this._options];
        this._renderOptions();
    }

    /**
     * Refresh/reload options from remote
     */
    refresh() {
        if (this.cfg.axiosUrl) {
            this._fetchRemoteOptions(this._searchTerm);
        }
    }

    /**
     * Enable the select
     */
    enable() {
        this.cfg.disabled = false;
        this.elements.search.disabled = false;
        this.elements.control.classList.remove('opacity-50', 'cursor-not-allowed');
        this._emit('enable');
    }

    /**
     * Disable the select
     */
    disable() {
        this.cfg.disabled = true;
        this.elements.search.disabled = true;
        this.elements.control.classList.add('opacity-50', 'cursor-not-allowed');
        this.close();
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
        this.elements.control.removeEventListener('click', this._boundHandlers.onControlClick);
        this.elements.search.removeEventListener('input', this._boundHandlers.onSearchInput);
        this.elements.search.removeEventListener('keydown', this._boundHandlers.onSearchKeydown);
        this.elements.search.removeEventListener('focus', this._boundHandlers.onSearchFocus);
        this.elements.clear.removeEventListener('click', this._boundHandlers.onClearClick);
        document.removeEventListener('click', this._boundHandlers.onDocumentClick);
        this.elements.options.removeEventListener('click', this._boundHandlers.onOptionClick);

        // Clear state
        this._listeners = {};
        clearTimeout(this._searchTimer);

        // Remove from instances
        DSSelect.instances.delete(this.instanceId);
        delete this.wrapper.dataset.dsSelectId;

        this._emit('destroy');
    }

    // ==================== UTILITIES ====================

    _emit(event, detail = {}) {
        // Call registered handlers
        (this._listeners[event] || new Set()).forEach(fn => {
            try { fn(detail); } catch (err) { console.warn('DSSelect event error:', err); }
        });

        // Dispatch DOM event
        this.wrapper.dispatchEvent(new CustomEvent(`dsselect:${event}`, {
            bubbles: true,
            detail: { instance: this, ...detail }
        }));
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Auto-init on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DSSelect.initAll());
    } else {
        DSSelect.initAll();
    }
}
