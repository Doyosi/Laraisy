import DSTablePagination from './DSTable/DSTablePagination.js';
import DSTableSearch from './DSTable/DSTableSearch.js';
import DSTableSort from './DSTable/DSTableSort.js';
import DSTableFilter from './DSTable/DSTableFilter.js';
import DSTableExport from './DSTable/DSTableExport.js';
import DSTableSelection from './DSTable/DSTableSelection.js';
import DSGOTRenderer from './DSGridOrTable/DSGOTRenderer.js';
import DSGOTViewToggle from './DSGridOrTable/DSGOTViewToggle.js';

/**
 * @typedef {Object} DSGridOrTableOptions
 * @property {'table'|'grid'|'gridable'} [type] - Display type
 * @property {'grid'|'table'} [defaultView] - For 'gridable' mode: initial view
 * @property {boolean} [showToggle] - Show view toggle buttons
 * @property {boolean} [pagination] - Enable pagination
 * @property {boolean} [search] - Enable search
 * @property {boolean} [sort] - Enable sorting
 * @property {boolean} [filter] - Enable filtering
 * @property {boolean} [export] - Enable export
 * @property {boolean} [selection] - Enable selection
 * @property {'ajax'|'html'|'json'} [table_source] - Data source type
 * @property {string} [ajax_url] - URL for AJAX requests
 * @property {Object} [ajax_data] - Additional data for AJAX requests
 * @property {'GET'|'POST'|'PUT'} [ajax_method] - HTTP method
 * @property {'xhr'|'axios'|'fetch'} [ajax_function] - Fetcher implementation
 * @property {Object} [rowTemplate] - Template config for table rows
 * @property {Object} [gridTemplate] - Template config for grid items
 * @property {Object|number} [gridColumns] - Grid column configuration
 * @property {number} [gridGap] - Tailwind gap value
 * @property {string} [gridContainerClass] - Grid container class
 * @property {string} [tableSelector] - Selector for table element
 * @property {string} [bodySelector] - Selector for tbody element
 * @property {string} [gridSelector] - Selector for grid container
 * @property {string} [toggleSelector] - Selector for view toggle
 * @property {string} [emptyMessage] - Message when no data found
 * @property {string} [errorMessage] - Message on error
 * @property {Function} [success] - Success callback
 * @property {Function} [error] - Error callback
 */

/**
 * DSGridOrTable
 * 
 * A flexible data display plugin supporting Table, Grid, or switchable (Gridable) layouts.
 * Built on top of DSTable architecture with extended rendering capabilities.
 * 
 * @example
 * // Table mode (like standard DSTable)
 * const table = new DSGridOrTable('#container', {
 *     type: 'table',
 *     ajax_url: '/api/data',
 *     rowTemplate: { source: 'response', response: 'html' }
 * });
 * 
 * @example
 * // Grid mode (card layout)
 * const grid = new DSGridOrTable('#container', {
 *     type: 'grid',
 *     ajax_url: '/api/data',
 *     gridTemplate: { source: 'response', response: 'grid_html' }
 * });
 * 
 * @example
 * // Gridable mode (toggle between table and grid)
 * const gridable = new DSGridOrTable('#container', {
 *     type: 'gridable',
 *     ajax_url: '/api/data',
 *     rowTemplate: { source: 'response', response: 'html' },
 *     gridTemplate: { source: 'response', response: 'grid_html' },
 *     defaultView: 'grid',
 *     showToggle: true
 * });
 */
export class DSGridOrTable {
    static defaults = {
        // Display type
        type: 'table', // 'table' | 'grid' | 'gridable'
        defaultView: 'grid', // For 'gridable' mode: 'grid' | 'table'
        showToggle: true, // For 'gridable' mode: show view toggle buttons

        // Standard features (same as DSTable)
        pagination: true,
        pagination_translations: {
            prev: 'Previous',
            next: 'Next',
            goto: 'Go to',
            stats: 'Showing {from} to {to} of {total} entries'
        },
        search: true,
        sort: true,
        filter: true,
        export: true,
        selection: true,

        // Data source
        table_source: 'ajax', // 'ajax' | 'html' | 'json'
        ajax_url: null,
        ajax_data: {},
        ajax_method: 'GET',
        ajax_function: 'axios', // 'xhr' | 'axios' | 'fetch'

        // Callbacks
        success: null,
        error: null,
        beforeSend: null,
        afterSend: null,

        // Template configurations
        rowTemplate: {
            source: 'response', // 'function' | 'html' | 'response'
            response: 'html',   // Property path in response data
            function: null,     // Function that returns HTML: (row, index) => '<tr>...</tr>'
            html: null          // Template string with {{placeholders}}
        },
        gridTemplate: {
            source: 'response',
            response: 'grid_html',
            function: null,
            html: null
        },

        // Grid layout options
        gridColumns: {
            default: 2,
            sm: 1,
            md: 2,
            lg: 3,
            xl: 4
        },
        gridGap: 4, // Tailwind gap value (gap-4)
        gridContainerClass: 'ds-grid-container',

        // Selectors
        tableSelector: 'table',
        bodySelector: 'tbody',
        gridSelector: '.ds-grid-container',
        toggleSelector: '.ds-view-toggle',
        messageSelector: '.ds-table-message',
        search_selector: null,

        // Empty/Error states
        emptyMessage: 'No data found',
        emptyIcon: 'search_off',
        errorMessage: 'Error loading data',

        // Filter selectors (passed to DSTableFilter)
        filter_selectors: {}
    };

    /**
     * @param {string|HTMLElement} wrapper
     * @param {DSGridOrTableOptions} options
     */
    constructor(wrapper, options = {}) {
        this.wrapper = typeof wrapper === 'string' ? document.querySelector(wrapper) : wrapper;
        if (!this.wrapper) throw new Error('DSGridOrTable: Wrapper element not found');

        // Merge configs with special handling for nested objects
        /** @type {DSGridOrTableOptions} */
        this.config = this._mergeDeep({}, DSGridOrTable.defaults, options);

        // State
        this.data = [];
        this.meta = {};
        this.params = {
            page: 1,
            per_page: 15,
            sort_by: null,
            sort_order: 'asc',
            search: null,
            filters: {}
        };

        this.modules = {};
        this.isLoading = false;
        this.currentView = this.config.defaultView;

        this._init();
    }

    _mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this._isObject(target) && this._isObject(source)) {
            for (const key in source) {
                if (this._isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this._mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this._mergeDeep(target, ...sources);
    }

    _isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    _init() {
        // Find elements based on type
        this.table = this.wrapper.querySelector(this.config.tableSelector);
        this.tbody = this.wrapper.querySelector(this.config.bodySelector) || this.table?.querySelector('tbody');
        this.gridContainer = this.wrapper.querySelector(this.config.gridSelector);

        // Create grid container if needed and not exists
        if ((this.config.type === 'grid' || this.config.type === 'gridable') && !this.gridContainer) {
            this.gridContainer = document.createElement('div');
            this.gridContainer.className = this._buildGridClasses();
            if (this.table) {
                this.table.parentNode.insertBefore(this.gridContainer, this.table.nextSibling);
            } else {
                this.wrapper.insertBefore(this.gridContainer, this.wrapper.firstChild);
            }
        }

        // Initialize the renderer module
        this.renderer = new DSGOTRenderer(this);

        // Initialize view toggle for gridable mode
        if (this.config.type === 'gridable' && this.config.showToggle) {
            this.viewToggle = new DSGOTViewToggle(this);
        }

        // Initialize standard modules (reuse DSTable modules)
        if (this.config.pagination) this.modules.pagination = new DSTablePagination(this);
        if (this.config.search) this.modules.search = new DSTableSearch(this);
        if (this.config.sort && this.table) this.modules.sort = new DSTableSort(this);
        if (this.config.filter) this.modules.filter = new DSTableFilter(this);
        if (this.config.export) this.modules.export = new DSTableExport(this);
        if (this.config.selection && this.table) this.modules.selection = new DSTableSelection(this);

        // Set initial visibility based on type
        this._setInitialVisibility();

        // Initial data load
        this.loadData();
    }

    _buildGridClasses() {
        const { gridColumns, gridGap, gridContainerClass } = this.config;
        let classes = `${gridContainerClass} grid gap-${gridGap}`;

        // Build responsive column classes
        if (typeof gridColumns === 'number') {
            classes += ` grid-cols-${gridColumns}`;
        } else if (typeof gridColumns === 'object') {
            classes += ` grid-cols-${gridColumns.default || 1}`;
            if (gridColumns.sm) classes += ` sm:grid-cols-${gridColumns.sm}`;
            if (gridColumns.md) classes += ` md:grid-cols-${gridColumns.md}`;
            if (gridColumns.lg) classes += ` lg:grid-cols-${gridColumns.lg}`;
            if (gridColumns.xl) classes += ` xl:grid-cols-${gridColumns.xl}`;
        }

        return classes;
    }

    _setInitialVisibility() {
        if (this.config.type === 'table') {
            if (this.gridContainer) this.gridContainer.classList.add('hidden');
            if (this.table) this.table.classList.remove('hidden');
        } else if (this.config.type === 'grid') {
            if (this.table) this.table.classList.add('hidden');
            if (this.gridContainer) this.gridContainer.classList.remove('hidden');
        } else { // gridable
            if (this.currentView === 'grid') {
                if (this.table) this.table.classList.add('hidden');
                if (this.gridContainer) this.gridContainer.classList.remove('hidden');
            } else {
                if (this.gridContainer) this.gridContainer.classList.add('hidden');
                if (this.table) this.table.classList.remove('hidden');
            }
        }
    }

    // ================= DATA LOADING =================

    async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;
        this._toggleLoading(true);

        if (this.config.beforeSend) this.config.beforeSend({ params: this.params });

        try {
            if (this.config.table_source === 'ajax') {
                await this._loadFromAjax();
            } else if (this.config.table_source === 'json') {
                this._handleDataSuccess(this.config.data || []);
            } else if (this.config.table_source === 'html') {
                this.isLoading = false;
                this._toggleLoading(false);
            }
        } catch (error) {
            console.error('DSGridOrTable: Error loading data', error);
            if (this.config.error) this.config.error(error);
            this.renderer.showError(this.config.errorMessage);
            this.isLoading = false;
            this._toggleLoading(false);
        }
    }

    async _loadFromAjax() {
        const url = this.config.ajax_url;
        const method = this.config.ajax_method;
        const data = { ...this.config.ajax_data, ...this.params };

        let response;

        if (this.config.ajax_function === 'axios' && window.axios) {
            response = await window.axios({
                method,
                url,
                params: method === 'GET' ? data : undefined,
                data: method !== 'GET' ? data : undefined
            });
            this._handleDataSuccess(response.data);
        } else if (this.config.ajax_function === 'fetch' || window.fetch) {
            const queryString = new URLSearchParams(data).toString();
            const fetchUrl = method === 'GET' ? `${url}?${queryString}` : url;
            const options = {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: method !== 'GET' ? JSON.stringify(data) : undefined
            };
            const res = await fetch(fetchUrl, options);
            const json = await res.json();
            this._handleDataSuccess(json);
        } else {
            throw new Error('DSGridOrTable: No valid ajax function found');
        }
    }

    _handleDataSuccess(response) {
        if (response.data) {
            this.data = response.data;
            this.meta = response.meta || {};
        } else if (Array.isArray(response)) {
            this.data = response;
        }

        this.renderer.render();

        if (this.config.success) this.config.success(response);
        if (this.config.afterSend) this.config.afterSend(response);

        // Notify modules
        Object.values(this.modules).forEach(m => m.onDataLoaded && m.onDataLoaded(response));

        this.isLoading = false;
        this._toggleLoading(false);
        this._emit('dataLoaded', response);
    }

    // ================= LOADING STATE =================

    _toggleLoading(loading) {
        if (loading) {
            this.wrapper.classList.add('loading-state');
            this.renderer.showSkeleton();
        } else {
            this.wrapper.classList.remove('loading-state');
        }
    }

    // ================= VIEW SWITCHING =================

    /**
     * Switch between grid and table views (for gridable mode)
     * @param {string} view - 'grid' or 'table'
     */
    setView(view) {
        if (this.config.type !== 'gridable') return;
        if (view !== 'grid' && view !== 'table') return;
        if (view === this.currentView) return;

        this.currentView = view;
        this._setInitialVisibility();
        this.renderer.render();

        if (this.viewToggle) this.viewToggle.update();

        this._emit('viewChange', { view });
    }

    /**
     * Toggle between grid and table views
     */
    toggleView() {
        const newView = this.currentView === 'grid' ? 'table' : 'grid';
        this.setView(newView);
    }

    /**
     * Get current view mode
     * @returns {string} 'grid' or 'table'
     */
    getView() {
        return this.currentView;
    }

    // ================= PUBLIC API =================

    refresh() {
        this.params.page = 1;
        this.loadData();
    }

    setParam(key, value) {
        this.params[key] = value;
    }

    getParam(key) {
        return this.params[key];
    }

    registerModule(name, instance) {
        this.modules[name] = instance;
    }

    /**
     * Get the current render target element
     * @returns {HTMLElement}
     */
    getRenderTarget() {
        if (this.config.type === 'grid') return this.gridContainer;
        if (this.config.type === 'table') return this.tbody;
        return this.currentView === 'grid' ? this.gridContainer : this.tbody;
    }

    // ================= EVENTS =================

    on(event, handler) {
        this.wrapper.addEventListener(`dsgot:${event}`, handler);
    }

    _emit(event, detail = {}) {
        this.wrapper.dispatchEvent(new CustomEvent(`dsgot:${event}`, { bubbles: true, detail }));
        // Also emit dstable events for compatibility with DSTable modules
        this.wrapper.dispatchEvent(new CustomEvent(`dstable:${event}`, { bubbles: true, detail }));
    }

    // ================= UTILITIES =================

    _getNestedValue(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }
}

export default DSGridOrTable;
