export class DSTableSelection {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('selection', this);

        // Configuration for persistence
        this.persist = this.table.config.selection_persist ?? false;
        this.storageType = this.table.config.selection_storage ?? 'localStorage'; // 'localStorage' or 'sessionStorage'
        this.storageKey = this.table.config.selection_storage_key ?? `dstable_selection_${this._getTableIdentifier()}`;

        this.selectedIds = new Set();

        // Load persisted selection if enabled
        if (this.persist) {
            this._loadFromStorage();
        }

        this._init();
    }

    /**
     * Generate a unique identifier for this table instance
     */
    _getTableIdentifier() {
        // Use wrapper id, data-url, or fallback to path
        return this.table.wrapper.id ||
            this.table.config.ajax_url ||
            window.location.pathname.replace(/\//g, '_');
    }

    _init() {
        // We need to re-bind on render
        this.table.on('render', () => this.update());

        // Check all toggle
        const checkAll = this.table.table.querySelector('thead input[type="checkbox"].select-all');
        if (checkAll) {
            checkAll.addEventListener('change', (e) => {
                this.toggleAll(e.target.checked);
            });
        }
    }

    update() {
        // Determine indentifier key, default 'id'
        const key = 'id';

        // Find checkboxes in tbody
        const checkboxes = this.table.tbody.querySelectorAll('input[type="checkbox"].select-row');

        checkboxes.forEach(chk => {
            const rowId = chk.value; // Assuming value holds the ID

            // Restore state from selectedIds (which may have been loaded from storage)
            chk.checked = this.selectedIds.has(rowId);

            // Bind click
            chk.onchange = (e) => {
                this._toggleId(rowId, e.target.checked);
            };
        });

        this._updateCheckAllState();
    }

    _toggleId(id, checked) {
        if (checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);

        this._updateCheckAllState();
        this._saveToStorage();
        this.table._emit('selectionChange', { selected: Array.from(this.selectedIds) });
    }

    toggleAll(checked) {
        const checkboxes = this.table.tbody.querySelectorAll('input[type="checkbox"].select-row');
        checkboxes.forEach(chk => {
            chk.checked = checked;
            const rowId = chk.value;
            if (checked) this.selectedIds.add(rowId);
            else this.selectedIds.delete(rowId);
        });

        this._saveToStorage();
        this.table._emit('selectionChange', { selected: Array.from(this.selectedIds) });
    }

    _updateCheckAllState() {
        const checkAll = this.table.table.querySelector('thead input[type="checkbox"].select-all');
        if (!checkAll) return;

        const checkboxes = Array.from(this.table.tbody.querySelectorAll('input[type="checkbox"].select-row'));
        if (checkboxes.length === 0) {
            checkAll.checked = false;
            checkAll.indeterminate = false;
            return;
        }

        const allChecked = checkboxes.every(c => c.checked);
        const someChecked = checkboxes.some(c => c.checked);

        checkAll.checked = allChecked;
        checkAll.indeterminate = someChecked && !allChecked;
    }

    // ==================== STORAGE ====================

    /**
     * Save selection to storage
     */
    _saveToStorage() {
        if (!this.persist) return;

        try {
            const storage = this.storageType === 'sessionStorage' ? sessionStorage : localStorage;
            storage.setItem(this.storageKey, JSON.stringify(Array.from(this.selectedIds)));
        } catch (e) {
            console.warn('DSTableSelection: Failed to save to storage', e);
        }
    }

    /**
     * Load selection from storage
     */
    _loadFromStorage() {
        try {
            const storage = this.storageType === 'sessionStorage' ? sessionStorage : localStorage;
            const saved = storage.getItem(this.storageKey);

            if (saved) {
                const ids = JSON.parse(saved);
                if (Array.isArray(ids)) {
                    this.selectedIds = new Set(ids.map(String));
                }
            }
        } catch (e) {
            console.warn('DSTableSelection: Failed to load from storage', e);
        }
    }

    /**
     * Clear storage
     */
    _clearStorage() {
        if (!this.persist) return;

        try {
            const storage = this.storageType === 'sessionStorage' ? sessionStorage : localStorage;
            storage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('DSTableSelection: Failed to clear storage', e);
        }
    }

    // ==================== PUBLIC API ====================

    /**
     * Get all selected IDs
     */
    getSelected() {
        return Array.from(this.selectedIds);
    }

    /**
     * Set selected IDs programmatically
     */
    setSelected(ids) {
        this.selectedIds = new Set(ids.map(String));
        this._saveToStorage();
        this.update();
        this.table._emit('selectionChange', { selected: Array.from(this.selectedIds) });
    }

    /**
     * Clear all selections
     */
    clearAll() {
        this.selectedIds.clear();
        this._clearStorage();
        this.update();
        this.table._emit('selectionChange', { selected: [] });
    }

    /**
     * Check if an ID is selected
     */
    isSelected(id) {
        return this.selectedIds.has(String(id));
    }
}
export default DSTableSelection;

