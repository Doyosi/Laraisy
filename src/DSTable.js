import DSTablePagination from './DSTable/DSTablePagination.js';
import DSTableSearch from './DSTable/DSTableSearch.js';
import DSTableSort from './DSTable/DSTableSort.js';
import DSTableFilter from './DSTable/DSTableFilter.js';
import DSTableExport from './DSTable/DSTableExport.js';
import DSTableSelection from './DSTable/DSTableSelection.js';

/**
 * DSTable
 * 
 * A comprehensive table plugin for data management.
 * Supports: Pagination, Search, Sort, Filter, Export, Selection.
 */
export class DSTable {
    static defaults = {
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

        table_source: 'ajax', // ajax | html | json
        ajax_url: null,
        ajax_data: {},
        ajax_method: 'GET',
        ajax_function: 'axios', // xhr | axios | fetch

        success: null,
        error: null,
        beforeSend: null,
        afterSend: null,

        template_source: 'html', // function | html | response
        template_function: null,
        template_html: null,
        template_response: 'data.*.html_response',


        emptyIcon: 'search_off',

        // Selectors
        tableSelector: 'table',
        bodySelector: 'tbody',
        messageSelector: '.ds-table-message',
        table_translations: {
            no_data: 'No data available',
            loading: 'Loading...',
            error: 'Error loading data',
            empty: 'No data available',

        }
    };

    constructor(wrapper, options = {}) {
        this.wrapper = typeof wrapper === 'string' ? document.querySelector(wrapper) : wrapper;
        if (!this.wrapper) throw new Error('DSTable: Wrapper element not found');

        this.config = { ...DSTable.defaults, ...options };

        // State
        this.data = [];
        this.meta = {}; // Pagination meta
        this.params = {
            page: 1,
            per_page: 15,
            sort_by: null,
            sort_by: null,
            sort_order: 'asc',
            search: null,
            filters: {}
        };

        this.modules = {};
        this.isLoading = false;

        this._init();
    }

    _init() {
        this.table = this.wrapper.querySelector(this.config.tableSelector);
        this.tbody = this.wrapper.querySelector(this.config.bodySelector) || this.table?.querySelector('tbody');

        if (!this.table) throw new Error('DSTable: Table element not found inside wrapper');

        // Initialize Modules
        if (this.config.pagination) this.modules.pagination = new DSTablePagination(this);
        if (this.config.search) this.modules.search = new DSTableSearch(this);
        if (this.config.sort) this.modules.sort = new DSTableSort(this);
        if (this.config.filter) this.modules.filter = new DSTableFilter(this);
        if (this.config.export) this.modules.export = new DSTableExport(this);
        if (this.config.selection) this.modules.selection = new DSTableSelection(this);

        // Initial Load
        this.loadData();
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
                // Load from local JSON data provided in config
                this._handleDataSuccess(this.config.data || []);
            } else if (this.config.table_source === 'html') {
                // Parse existing HTML? (Not fully implemented in this plan, mainly for Ajax)
                this.isLoading = false;
                this._toggleLoading(false);
            }
        } catch (error) {
            console.error('DSTable: Error loading data', error);
            if (this.config.error) this.config.error(error);
            this._showError('Error loading data');
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
            response = await window.axios({ method, url, params: method === 'GET' ? data : undefined, data: method !== 'GET' ? data : undefined });
            this._handleDataSuccess(response.data);
        } else if (this.config.ajax_function === 'fetch' || window.fetch) {
            // Basic fetch impl
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
            throw new Error('DSTable: No valid ajax function found');
        }
    }

    _handleDataSuccess(response) {
        // Standardize response
        // Expected: { success: true, data: [...], meta: {...} }

        if (response.data) {
            this.data = response.data;
            this.meta = response.meta || {};
        } else if (Array.isArray(response)) {
            this.data = response;
        }

        this.render();

        if (this.config.success) this.config.success(response);
        if (this.config.afterSend) this.config.afterSend(response);

        // Notify modules
        Object.values(this.modules).forEach(m => m.onDataLoaded && m.onDataLoaded(response));

        this.isLoading = false;
        this._toggleLoading(false);
        this._emit('dataLoaded', response);
    }

    // ================= RENDERING =================

    render() {
        if (!this.tbody) return;
        this.tbody.innerHTML = '';

        if (this.data.length === 0) {
            this._showEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();

        this.data.forEach((row, index) => {
            const tr = document.createElement('tr');
            let html = '';

            if (this.config.template_source === 'function' && typeof this.config.template_function === 'function') {
                html = this.config.template_function(row, index);
            } else if (this.config.template_source === 'html' && this.config.template_html) {
                html = this._renderTemplate(this.config.template_html, row);
            } else if (this.config.template_source === 'response') {
                // deeply get html_response from row using dot notation if needed
                html = this._getNestedValue(row, this.config.template_response) || '';
            }

            // If the template returns a full TR, we might need to parse it. 
            // Expectation: The template returns innerHTML for the TR, or the configuration handles the TR wrapper.
            // Adjusting based on standard table needs: assumes content is <td>...</td>
            // BUT if template_response is used, the example shows "<tr><td>...</td></tr>"

            if (html.trim().startsWith('<tr')) {
                const tempTable = document.createElement('table');
                const tempTbody = document.createElement('tbody');
                tempTable.appendChild(tempTbody);
                tempTbody.innerHTML = html;
                const newRow = tempTbody.firstElementChild;
                if (newRow) {
                    fragment.appendChild(newRow);
                }
            } else {
                tr.innerHTML = html;
                fragment.appendChild(tr);
            }
        });

        this.tbody.appendChild(fragment);
        this._emit('render');

        // Re-initialize selection module for new rows if needed
        if (this.modules.selection) this.modules.selection.update();
    }

    _renderTemplate(template, data) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : '';
        });
    }

    _showEmpty() {
        this.tbody.innerHTML = `
                            <tr>
                        <td colspan="100%" class="text-center py-12">
                            <div class="flex flex-col items-center gap-2 text-base-content/50">
                                <span class="material-symbols-outlined text-5xl">${this.config.emptyIcon}</span>
                                <p class="text-base">${this.config.table_translations.empty}</p>
                            </div>
                        </td>
                    </tr>`;
    }

    _showError(msg) {
        this.tbody.innerHTML =
            `
                    <tr>
                        <td colspan="100%" class="text-center py-12 text-error">
                            <div class="flex flex-col items-center gap-2">
                                <span class="material-symbols-outlined text-5xl">error</span>
                                <p class="text-base">${msg || this.config.table_translations.error}</p>
                            </div>
                        </td>
                    </tr>
                `;
    }

    _toggleLoading(loading) {
        if (loading) {
            this.wrapper.classList.add('loading-state');
            this._showSkeleton();
        } else {
            this.wrapper.classList.remove('loading-state');
            // Skeleton will be cleared by render() normally, 
            // but if we just want to hide it before render? 
            // render() clears tbody, so we are good.
        }
    }

    _showSkeleton() {
        if (!this.tbody) return;

        const perPage = this.params.per_page || 10;
        const columns = this.table.querySelectorAll('thead th').length || 5;
        let skeletonHtml = '';

        for (let i = 0; i < perPage; i++) {
            skeletonHtml += '<tr>';

            // First column: Avatar + Text skeleton (matching user's "Skeleton - circle with content")
            skeletonHtml += `
                <td>
                    <div class="flex items-center gap-4">
                        <div class="skeleton h-12 w-12 shrink-0 rounded-full"></div>
                        <div class="flex flex-col gap-2">
                            <div class="skeleton h-3 w-20"></div>
                            <div class="skeleton h-3 w-28"></div>
                        </div>
                    </div>
                </td>
            `;

            // Other columns: Simple text lines
            for (let j = 1; j < columns; j++) {
                skeletonHtml += `
                    <td>
                        <div class="skeleton h-4 w-full opacity-50"></div>
                    </td>
                `;
            }

            skeletonHtml += '</tr>';
        }

        this.tbody.innerHTML = skeletonHtml;
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

    // ================= EVENTS =================

    on(event, handler) {
        this.wrapper.addEventListener(`dstable:${event}`, handler);
    }

    _emit(event, detail = {}) {
        this.wrapper.dispatchEvent(new CustomEvent(`dstable:${event}`, { bubbles: true, detail }));
    }
    _getNestedValue(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }
}

export default DSTable;
