export class DSTableFilter {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('filter', this);
        this.wrapper = this.table.wrapper;

        // Config might be passed in options or we look for standard filter areas
        // The instruction suggests passing "filter_selectors" in config.

        this.filters = this.table.config.filter_selectors || {};

        // Optional: filter reset button selector
        this.resetButtonSelector = this.table.config.filter_reset_button || null;
        this.resetButton = null;

        this._init();
        this._initResetButton();
    }

    _init() {
        if (Object.keys(this.filters).length === 0) return;

        Object.entries(this.filters).forEach(([key, config]) => {
            const selector = config.input_selector;
            const el = document.querySelector(selector);

            if (!el) return;

            // Save default
            if (config.default_value !== undefined && config.default_value !== null) {
                this.table.setParam(key, config.default_value);
            }

            // Check if this is a DSSelect component (custom searchable select)
            const isDSSelect = el.hasAttribute('data-ds-select');

            if (isDSSelect) {
                // Listen for DSSelect's custom change event
                el.addEventListener('dsselect:change', (e) => {
                    this._handleDSSelectChange(key, el, e.detail);
                    this._updateResetButtonState();
                });
            } else {
                // Standard input/select handling
                const eventName = ['checkbox', 'radio', 'select-one'].includes(el.type) ? 'change' : 'input';

                // For Bulk actions, we might handle differently
                if (config.is_bulk) {
                    el.addEventListener(eventName, (e) => {
                        this._handleFilterChange(key, e.target);
                        this._updateResetButtonState();
                    });
                } else {
                    el.addEventListener(eventName, (e) => {
                        this._handleFilterChange(key, e.target);
                        this._updateResetButtonState();
                    });
                }
            }
        });
    }

    /**
     * Initialize the reset button if configured
     */
    _initResetButton() {
        if (!this.resetButtonSelector) return;

        this.resetButton = document.querySelector(this.resetButtonSelector);
        if (!this.resetButton) return;

        // Attach click handler
        this.resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearFilters(true);
        });

        // Set initial state
        this._updateResetButtonState();
    }

    /**
     * Check if any filter has an active value
     * @returns {boolean}
     */
    hasActiveFilters() {
        return Object.entries(this.filters).some(([key, config]) => {
            const el = document.querySelector(config.input_selector);
            if (!el) return false;

            const defaultValue = config.default_value;

            // Handle checkboxes
            if (el.type === 'checkbox') {
                return el.checked === true;
            }

            const value = el.value;

            // Check if value is different from default/empty
            if (Array.isArray(value)) {
                return value.length > 0;
            }

            // If there's a default value and current value equals default, not "active"
            if (defaultValue !== undefined && defaultValue !== null) {
                if (value === String(defaultValue) || value === defaultValue) {
                    return false;
                }
            }

            return value && value !== '' && value !== 'null';
        });
    }

    /**
     * Update the reset button's disabled state
     */
    _updateResetButtonState() {
        if (!this.resetButton) return;
        this.resetButton.disabled = !this.hasActiveFilters();
    }

    _handleFilterChange(key, element) {
        let val;
        if (element.type === 'checkbox') {
            val = element.checked ? (element.value || true) : null;
            // If unchecked and default is null, send null.
        } else {
            val = element.value;
        }

        // Debounce text inputs
        if (element.type === 'text') {
            clearTimeout(this._debounce);
            this._debounce = setTimeout(() => {
                this.table.setParam(key, val);
                this.table.setParam('page', 1);
                this.table.loadData();
            }, 500);
        } else {
            this.table.setParam(key, val);
            this.table.setParam('page', 1);
            this.table.loadData();
        }
    }

    /**
     * Handle DSSelect (searchable-select) custom component changes
     */
    _handleDSSelectChange(key, wrapper, detail) {
        let val = detail?.value;

        // Handle array values for multiple selects
        if (Array.isArray(val)) {
            // If empty array, set to null (no filter)
            val = val.length > 0 ? val : null;
        } else if (val === '' || val === undefined) {
            val = null;
        }

        this.table.setParam(key, val);
        this.table.setParam('page', 1);
        this.table.loadData();
    }

    /**
     * Reset a single filter by key
     * @param {string} key - The filter key to reset
     * @param {boolean} reload - Whether to reload data after reset (default: false)
     */
    resetFilter(key, reload = false) {
        const config = this.filters[key];
        if (!config) return;

        const el = document.querySelector(config.input_selector);
        if (el) {
            const isDSSelect = el.hasAttribute('data-ds-select');
            if (isDSSelect) {
                // Reset DSSelect visual state
                el.value = '';
                // Clear tags container if multiple
                const tagsContainer = el.querySelector('.ds-select-tags');
                if (tagsContainer) tagsContainer.innerHTML = '';
                // Reset display text
                const displayText = el.querySelector('.ds-select-text, .ds-select-placeholder');
                if (displayText) displayText.textContent = displayText.dataset.placeholder || '';
            } else {
                el.value = '';
            }
        }

        // Reset the param
        this.table.setParam(key, config.default_value !== undefined ? config.default_value : null);

        if (reload) {
            this.table.setParam('page', 1);
            this.table.loadData();
        }
    }

    /**
     * Clear all filters and reload data
     * @param {boolean} reload - Whether to reload data after clearing (default: true)
     */
    clearFilters(reload = true) {
        Object.keys(this.filters).forEach(key => {
            this.resetFilter(key, false);
        });

        if (reload) {
            this.table.setParam('page', 1);
            this.table.loadData();
        }

        // Update reset button state
        this._updateResetButtonState();

        // Emit custom event for external listeners
        this.wrapper.dispatchEvent(new CustomEvent('dstable:filters-cleared', { bubbles: true }));
    }
}
export default DSTableFilter;

