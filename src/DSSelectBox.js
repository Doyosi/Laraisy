/**
 * DSSelectBox
 * 
 * A dual-list selector component for transferring items between two lists.
 * Supports:
 * - Static options (JSON array/object) or AJAX URL
 * - Bi-directional transfer (left ↔ right)
 * - Search/filter for both lists
 * - Select All and Invert Selection buttons
 * - Event system for selection changes
 * 
 * Usage:
 * const selectBox = new DSSelectBox('#container', {
 *     availableOptions: [...],   // or axiosUrl: '/api/items'
 *     selectedOptions: [...],    // Pre-selected items
 *     valueKey: 'id',
 *     labelKey: 'name',
 *     onChange: (selected) => console.log(selected)
 * });
 */
export class DSSelectBox {
    static instances = new Map();
    static instanceCounter = 0;

    static defaultIcons = {
        moveRight: `<span class="material-symbols-outlined text-lg">chevron_right</span>`,
        moveLeft: `<span class="material-symbols-outlined text-lg">chevron_left</span>`,
        moveAllRight: `<span class="material-symbols-outlined text-lg">keyboard_double_arrow_right</span>`,
        moveAllLeft: `<span class="material-symbols-outlined text-lg">keyboard_double_arrow_left</span>`,
        search: `<span class="material-symbols-outlined text-sm opacity-50">search</span>`
    };

    // Keep static icons as alias for backward compatibility
    static get icons() {
        return DSSelectBox.defaultIcons;
    }

    static defaults = {
        // Data sources
        availableOptions: [],       // [{id: 1, name: 'Item'}] or {1: 'Item'}
        selectedOptions: [],        // Pre-selected items
        axiosUrl: null,             // Remote data URL for available items
        axiosMethod: 'GET',
        axiosParams: {},
        axiosDataPath: 'data',

        // Value configuration
        valueKey: 'id',
        labelKey: 'name',

        // UI Labels
        availableTitle: 'Available Items',
        selectedTitle: 'Selected Items',
        selectAllText: 'Select All',
        invertSelectionText: 'Invert',
        searchPlaceholder: 'Search...',
        noItemsText: 'No items',

        // Height
        listHeight: '300px',

        // Icons
        iconLibrary: 'material-symbols', // 'material-symbols' | 'phosphor' | 'font-awesome' | 'heroicons'
        icons: null, // Override individual icons (merged with library defaults)

        // Callbacks
        onChange: null,             // (selectedItems) => {}
        onMove: null,               // (direction, items) => {}

        // Classes
        wrapperClass: '',
    };

    constructor(selector, config = {}) {
        this.instanceId = `ds-selectbox-${++DSSelectBox.instanceCounter}`;
        this.wrapper = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (!this.wrapper) {
            throw new Error('DSSelectBox: Container element not found.');
        }

        this.cfg = { ...DSSelectBox.defaults, ...config };

        // Resolve icons
        const libraryIcons = this._getLibraryIcons(this.cfg.iconLibrary);
        this.icons = { ...libraryIcons, ...(config.icons || {}) };

        // State
        this._availableItems = [];
        this._selectedItems = [];
        this._filteredAvailable = [];
        this._filteredSelected = [];
        this._highlightedAvailable = new Set();
        this._highlightedSelected = new Set();
        this._isLoading = false;

        this._init();

        DSSelectBox.instances.set(this.instanceId, this);
        this.wrapper.dataset.dsSelectboxId = this.instanceId;
    }

    _getLibraryIcons(library) {
        switch (library) {
            case 'phosphor':
                return {
                    moveRight: `<i class="ph ph-caret-right text-lg"></i>`,
                    moveLeft: `<i class="ph ph-caret-left text-lg"></i>`,
                    moveAllRight: `<i class="ph ph-caret-double-right text-lg"></i>`,
                    moveAllLeft: `<i class="ph ph-caret-double-left text-lg"></i>`,
                    search: `<i class="ph ph-magnifying-glass text-sm opacity-50"></i>`
                };
            case 'font-awesome':
                return {
                    moveRight: `<i class="fas fa-chevron-right text-lg"></i>`,
                    moveLeft: `<i class="fas fa-chevron-left text-lg"></i>`,
                    moveAllRight: `<i class="fas fa-angle-double-right text-lg"></i>`,
                    moveAllLeft: `<i class="fas fa-angle-double-left text-lg"></i>`,
                    search: `<i class="fas fa-search text-sm opacity-50"></i>`
                };
            case 'heroicons':
                // Heroicons (using basic SVG/class structure assuming user has CSS or JS for it, or just span markers)
                // For valid heroicons we usually need SVG, but here using placeholders if not provided
                // This is a basic fallback map
                return {
                    moveRight: `<span class="heroicon heroicon-chevron-right text-lg"></span>`,
                    moveLeft: `<span class="heroicon heroicon-chevron-left text-lg"></span>`,
                    moveAllRight: `<span class="heroicon heroicon-chevron-double-right text-lg"></span>`,
                    moveAllLeft: `<span class="heroicon heroicon-chevron-double-left text-lg"></span>`,
                    search: `<span class="heroicon heroicon-magnifying-glass text-sm opacity-50"></span>`
                };
            case 'material-symbols':
            default:
                return DSSelectBox.defaultIcons;
        }
    }



    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;
        const id = el.dataset.dsSelectboxId;
        return id ? DSSelectBox.instances.get(id) : null;
    }

    // ==================== INITIALIZATION ====================

    _init() {
        this._buildDOM();
        this._cacheElements();
        this._loadOptions();
        this._bindEvents();
    }

    _buildDOM() {
        this.wrapper.classList.add('ds-selectbox-wrapper', 'w-full');
        if (this.cfg.wrapperClass) {
            this.wrapper.classList.add(...this.cfg.wrapperClass.split(' '));
        }

        this.wrapper.innerHTML = `
            <div class="flex gap-4 items-stretch">
                <!-- Available Items (Left) -->
                <div class="flex-1 flex flex-col border border-base-300 rounded-box bg-base-100">
                    <div class="p-3 border-b border-base-300 bg-base-200 rounded-t-box">
                        <h4 class="font-semibold text-sm mb-2">${this.cfg.availableTitle}</h4>
                        <div class="relative">
                            <input type="text" 
                                   class="input input-sm input-bordered w-full pl-8" 
                                   placeholder="${this.cfg.searchPlaceholder}"
                                   data-search="available">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2">${this.icons.search}</span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2" style="height: ${this.cfg.listHeight}" data-list="available">
                        <div class="text-sm text-base-content/50 text-center py-4">${this.cfg.noItemsText}</div>
                    </div>
                    <div class="p-2 border-t border-base-300 flex gap-2">
                        <button type="button" class="btn btn-xs btn-ghost flex-1" data-action="invert-available">
                            ${this.cfg.invertSelectionText}
                        </button>
                        <button type="button" class="btn btn-xs btn-ghost flex-1" data-action="select-all-available">
                            ${this.cfg.selectAllText}
                        </button>
                    </div>
                </div>

                <!-- Transfer Buttons (Center) -->
                <div class="flex flex-col justify-center gap-2">
                    <button type="button" class="btn btn-sm btn-outline" data-action="move-right" title="Move selected to right">
                        ${this.icons.moveRight}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" data-action="move-all-right" title="Move all to right">
                        ${this.icons.moveAllRight}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" data-action="move-left" title="Move selected to left">
                        ${this.icons.moveLeft}
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" data-action="move-all-left" title="Move all to left">
                        ${this.icons.moveAllLeft}
                    </button>
                </div>

                <!-- Selected Items (Right) -->
                <div class="flex-1 flex flex-col border border-base-300 rounded-box bg-base-100">
                    <div class="p-3 border-b border-base-300 bg-base-200 rounded-t-box">
                        <h4 class="font-semibold text-sm mb-2">${this.cfg.selectedTitle}</h4>
                        <div class="relative">
                            <input type="text" 
                                   class="input input-sm input-bordered w-full pl-8" 
                                   placeholder="${this.cfg.searchPlaceholder}"
                                   data-search="selected">
                            <span class="absolute left-2 top-1/2 -translate-y-1/2">${this.icons.search}</span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2" style="height: ${this.cfg.listHeight}" data-list="selected">
                        <div class="text-sm text-base-content/50 text-center py-4">${this.cfg.noItemsText}</div>
                    </div>
                    <div class="p-2 border-t border-base-300 flex gap-2">
                        <button type="button" class="btn btn-xs btn-ghost flex-1" data-action="invert-selected">
                            ${this.cfg.invertSelectionText}
                        </button>
                        <button type="button" class="btn btn-xs btn-ghost flex-1" data-action="select-all-selected">
                            ${this.cfg.selectAllText}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Hidden inputs for form submission -->
            <div data-hidden-inputs></div>
        `;
    }

    _cacheElements() {
        this.elements = {
            availableList: this.wrapper.querySelector('[data-list="available"]'),
            selectedList: this.wrapper.querySelector('[data-list="selected"]'),
            availableSearch: this.wrapper.querySelector('[data-search="available"]'),
            selectedSearch: this.wrapper.querySelector('[data-search="selected"]'),
            hiddenInputs: this.wrapper.querySelector('[data-hidden-inputs]'),
            btnMoveRight: this.wrapper.querySelector('[data-action="move-right"]'),
            btnMoveAllRight: this.wrapper.querySelector('[data-action="move-all-right"]'),
            btnMoveLeft: this.wrapper.querySelector('[data-action="move-left"]'),
            btnMoveAllLeft: this.wrapper.querySelector('[data-action="move-all-left"]'),
        };
    }

    _loadOptions() {
        // Load available options
        if (this.cfg.axiosUrl) {
            this._fetchRemoteOptions();
        } else {
            this._availableItems = this._normalizeOptions(this.cfg.availableOptions);
        }

        // Load pre-selected options
        this._selectedItems = this._normalizeOptions(this.cfg.selectedOptions);

        // Remove pre-selected from available
        const selectedValues = new Set(this._selectedItems.map(i => i.value));
        this._availableItems = this._availableItems.filter(i => !selectedValues.has(i.value));

        this._updateFiltered();
        this._render();
    }

    _normalizeOptions(options) {
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

        if (typeof options === 'object') {
            return Object.entries(options).map(([key, value]) => ({
                value: String(key),
                label: String(value),
                data: { [this.cfg.valueKey]: key, [this.cfg.labelKey]: value }
            }));
        }

        return [];
    }

    async _fetchRemoteOptions() {
        this._isLoading = true;
        this._renderLoading();

        try {
            let response;
            if (window.axios) {
                response = await window.axios({
                    method: this.cfg.axiosMethod,
                    url: this.cfg.axiosUrl,
                    params: this.cfg.axiosMethod.toUpperCase() === 'GET' ? this.cfg.axiosParams : undefined,
                    data: this.cfg.axiosMethod.toUpperCase() !== 'GET' ? this.cfg.axiosParams : undefined
                });
                response = response.data;
            } else {
                const url = new URL(this.cfg.axiosUrl, window.location.origin);
                if (this.cfg.axiosMethod.toUpperCase() === 'GET') {
                    Object.entries(this.cfg.axiosParams).forEach(([k, v]) => url.searchParams.set(k, v));
                }
                const res = await fetch(url.toString(), { method: this.cfg.axiosMethod });
                response = await res.json();
            }

            let data = response;
            if (this.cfg.axiosDataPath) {
                const paths = this.cfg.axiosDataPath.split('.');
                for (const path of paths) {
                    data = data?.[path];
                }
            }

            this._availableItems = this._normalizeOptions(data || []);

            // Remove already selected items
            const selectedValues = new Set(this._selectedItems.map(i => i.value));
            this._availableItems = this._availableItems.filter(i => !selectedValues.has(i.value));

            this._updateFiltered();
            this._render();
        } catch (error) {
            console.error('DSSelectBox: Failed to fetch options', error);
        } finally {
            this._isLoading = false;
        }
    }

    // ==================== EVENTS ====================

    _bindEvents() {
        // Search inputs
        this.elements.availableSearch.addEventListener('input', (e) => {
            this._filterList('available', e.target.value);
        });

        this.elements.selectedSearch.addEventListener('input', (e) => {
            this._filterList('selected', e.target.value);
        });

        // List item clicks
        this.elements.availableList.addEventListener('click', (e) => {
            const item = e.target.closest('[data-value]');
            if (item) this._toggleHighlight('available', item.dataset.value, e.ctrlKey || e.metaKey);
        });

        this.elements.selectedList.addEventListener('click', (e) => {
            const item = e.target.closest('[data-value]');
            if (item) this._toggleHighlight('selected', item.dataset.value, e.ctrlKey || e.metaKey);
        });

        // Double-click to move
        this.elements.availableList.addEventListener('dblclick', (e) => {
            const item = e.target.closest('[data-value]');
            if (item) {
                this._highlightedAvailable.clear();
                this._highlightedAvailable.add(item.dataset.value);
                this._moveRight();
            }
        });

        this.elements.selectedList.addEventListener('dblclick', (e) => {
            const item = e.target.closest('[data-value]');
            if (item) {
                this._highlightedSelected.clear();
                this._highlightedSelected.add(item.dataset.value);
                this._moveLeft();
            }
        });

        // Transfer buttons
        this.elements.btnMoveRight.addEventListener('click', () => this._moveRight());
        this.elements.btnMoveAllRight.addEventListener('click', () => this._moveAllRight());
        this.elements.btnMoveLeft.addEventListener('click', () => this._moveLeft());
        this.elements.btnMoveAllLeft.addEventListener('click', () => this._moveAllLeft());

        // Select All / Invert
        this.wrapper.querySelector('[data-action="select-all-available"]').addEventListener('click', () => {
            this._filteredAvailable.forEach(i => this._highlightedAvailable.add(i.value));
            this._render();
        });

        this.wrapper.querySelector('[data-action="select-all-selected"]').addEventListener('click', () => {
            this._filteredSelected.forEach(i => this._highlightedSelected.add(i.value));
            this._render();
        });

        this.wrapper.querySelector('[data-action="invert-available"]').addEventListener('click', () => {
            this._filteredAvailable.forEach(i => {
                if (this._highlightedAvailable.has(i.value)) {
                    this._highlightedAvailable.delete(i.value);
                } else {
                    this._highlightedAvailable.add(i.value);
                }
            });
            this._render();
        });

        this.wrapper.querySelector('[data-action="invert-selected"]').addEventListener('click', () => {
            this._filteredSelected.forEach(i => {
                if (this._highlightedSelected.has(i.value)) {
                    this._highlightedSelected.delete(i.value);
                } else {
                    this._highlightedSelected.add(i.value);
                }
            });
            this._render();
        });
    }

    // ==================== ACTIONS ====================

    _toggleHighlight(list, value, multi = false) {
        const set = list === 'available' ? this._highlightedAvailable : this._highlightedSelected;

        if (!multi) {
            set.clear();
        }

        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }

        this._render();
    }

    _moveRight() {
        if (this._highlightedAvailable.size === 0) return;

        const toMove = this._availableItems.filter(i => this._highlightedAvailable.has(i.value));
        this._availableItems = this._availableItems.filter(i => !this._highlightedAvailable.has(i.value));
        this._selectedItems.push(...toMove);
        this._highlightedAvailable.clear();

        this._updateFiltered();
        this._render();
        this._emitChange('right', toMove);
    }

    _moveAllRight() {
        const toMove = [...this._filteredAvailable];
        this._availableItems = this._availableItems.filter(i => !this._filteredAvailable.some(f => f.value === i.value));
        this._selectedItems.push(...toMove);
        this._highlightedAvailable.clear();

        this._updateFiltered();
        this._render();
        this._emitChange('right', toMove);
    }

    _moveLeft() {
        if (this._highlightedSelected.size === 0) return;

        const toMove = this._selectedItems.filter(i => this._highlightedSelected.has(i.value));
        this._selectedItems = this._selectedItems.filter(i => !this._highlightedSelected.has(i.value));
        this._availableItems.push(...toMove);
        this._highlightedSelected.clear();

        this._updateFiltered();
        this._render();
        this._emitChange('left', toMove);
    }

    _moveAllLeft() {
        const toMove = [...this._filteredSelected];
        this._selectedItems = this._selectedItems.filter(i => !this._filteredSelected.some(f => f.value === i.value));
        this._availableItems.push(...toMove);
        this._highlightedSelected.clear();

        this._updateFiltered();
        this._render();
        this._emitChange('left', toMove);
    }

    _filterList(list, term) {
        const searchTerm = term.toLowerCase().trim();

        if (list === 'available') {
            this._filteredAvailable = searchTerm
                ? this._availableItems.filter(i => i.label.toLowerCase().includes(searchTerm))
                : [...this._availableItems];
        } else {
            this._filteredSelected = searchTerm
                ? this._selectedItems.filter(i => i.label.toLowerCase().includes(searchTerm))
                : [...this._selectedItems];
        }

        this._render();
    }

    _updateFiltered() {
        this._filteredAvailable = [...this._availableItems];
        this._filteredSelected = [...this._selectedItems];
    }

    // ==================== RENDERING ====================

    _render() {
        this._renderList('available');
        this._renderList('selected');
        this._updateHiddenInputs();
    }

    _renderList(list) {
        const container = list === 'available' ? this.elements.availableList : this.elements.selectedList;
        const items = list === 'available' ? this._filteredAvailable : this._filteredSelected;
        const highlighted = list === 'available' ? this._highlightedAvailable : this._highlightedSelected;

        if (items.length === 0) {
            container.innerHTML = `<div class="text-sm text-base-content/50 text-center py-4">${this.cfg.noItemsText}</div>`;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="px-3 py-2 rounded cursor-pointer text-sm transition-colors select-none
                        ${highlighted.has(item.value) ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}"
                 data-value="${this._escapeHtml(item.value)}">
                ${this._escapeHtml(item.label)}
            </div>
        `).join('');
    }

    _renderLoading() {
        this.elements.availableList.innerHTML = `
            <div class="text-center py-4">
                <span class="loading loading-spinner loading-md"></span>
            </div>
        `;
    }

    _updateHiddenInputs() {
        const name = this.wrapper.dataset.name || 'selected';
        this.elements.hiddenInputs.innerHTML = this._selectedItems.map(item =>
            `<input type="hidden" name="${name}[]" value="${this._escapeHtml(item.value)}">`
        ).join('');
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== EVENTS ====================

    _emitChange(direction, movedItems) {
        if (this.cfg.onMove) {
            this.cfg.onMove(direction, movedItems);
        }

        if (this.cfg.onChange) {
            this.cfg.onChange(this._selectedItems);
        }

        this.wrapper.dispatchEvent(new CustomEvent('dsselectbox:change', {
            bubbles: true,
            detail: { selected: this._selectedItems, direction, moved: movedItems }
        }));
    }

    // ==================== PUBLIC API ====================

    getSelected() {
        return this._selectedItems.map(i => i.value);
    }

    getSelectedItems() {
        return [...this._selectedItems];
    }

    setSelected(values) {
        const valueSet = new Set(values.map(String));

        // Move matching items from available to selected
        const toSelect = this._availableItems.filter(i => valueSet.has(i.value));
        this._availableItems = this._availableItems.filter(i => !valueSet.has(i.value));
        this._selectedItems.push(...toSelect);

        this._updateFiltered();
        this._render();
    }

    reset() {
        this._availableItems.push(...this._selectedItems);
        this._selectedItems = [];
        this._highlightedAvailable.clear();
        this._highlightedSelected.clear();
        this._updateFiltered();
        this._render();
    }

    destroy() {
        this.wrapper.innerHTML = '';
        DSSelectBox.instances.delete(this.instanceId);
    }
}

export default DSSelectBox;
