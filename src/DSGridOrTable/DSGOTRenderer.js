/**
 * DSGOTRenderer
 * 
 * Handles rendering for both grid and table layouts.
 * Supports function, HTML template, and response-based templates.
 */
export class DSGOTRenderer {
    constructor(instance) {
        this.instance = instance;
        this.config = instance.config;
    }

    /**
     * Main render method - routes to appropriate renderer based on current view
     */
    render() {
        const data = this.instance.data;
        const target = this.instance.getRenderTarget();

        if (!target) {
            console.warn('DSGOTRenderer: No render target found');
            return;
        }

        if (data.length === 0) {
            this.showEmpty();
            return;
        }

        if (this.config.type === 'grid' ||
            (this.config.type === 'gridable' && this.instance.currentView === 'grid')) {
            this._renderGrid(data);
        } else {
            this._renderTable(data);
        }

        this.instance._emit('render');

        // Update selection module if exists
        if (this.instance.modules.selection) {
            this.instance.modules.selection.update();
        }
    }

    /**
     * Render data as table rows
     */
    _renderTable(data) {
        const tbody = this.instance.tbody;
        if (!tbody) return;

        tbody.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const templateConfig = this.config.rowTemplate;

        data.forEach((row, index) => {
            const html = this._getTemplateHtml(row, index, templateConfig);

            if (html.trim().startsWith('<tr')) {
                // HTML contains full <tr> element
                const tempTable = document.createElement('table');
                const tempTbody = document.createElement('tbody');
                tempTable.appendChild(tempTbody);
                tempTbody.innerHTML = html;
                const newRow = tempTbody.firstElementChild;
                if (newRow) {
                    fragment.appendChild(newRow);
                }
            } else {
                // HTML is just the inner content
                const tr = document.createElement('tr');
                tr.innerHTML = html;
                fragment.appendChild(tr);
            }
        });

        tbody.appendChild(fragment);
    }

    /**
     * Render data as grid cards
     */
    _renderGrid(data) {
        const gridContainer = this.instance.gridContainer;
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const templateConfig = this.config.gridTemplate;

        data.forEach((row, index) => {
            const html = this._getTemplateHtml(row, index, templateConfig);

            // Create a temporary container to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Append all child elements (supports multiple elements per item)
            while (temp.firstElementChild) {
                fragment.appendChild(temp.firstElementChild);
            }
        });

        gridContainer.appendChild(fragment);
    }

    /**
     * Get HTML content based on template configuration
     * @param {Object} row - Row data
     * @param {number} index - Row index
     * @param {Object} templateConfig - Template configuration object
     * @returns {string} HTML string
     */
    _getTemplateHtml(row, index, templateConfig) {
        const { source, response, function: templateFn, html: templateHtml } = templateConfig;

        if (source === 'function' && typeof templateFn === 'function') {
            return templateFn(row, index);
        } else if (source === 'html' && templateHtml) {
            return this._renderTemplateString(templateHtml, row);
        } else if (source === 'response') {
            // Get HTML from response data using path
            return this._getNestedValue(row, response) || '';
        }

        return '';
    }

    /**
     * Render a template string with {{placeholder}} syntax
     */
    _renderTemplateString(template, data) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : '';
        });
    }

    /**
     * Get nested value from object using dot notation
     */
    _getNestedValue(obj, path) {
        if (!path) return undefined;
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }

    /**
     * Show empty state
     */
    showEmpty() {
        const { emptyMessage, emptyIcon } = this.config;
        const target = this.instance.getRenderTarget();
        const iconHtml = this._renderIcon(emptyIcon, 'text-5xl');

        if (this.config.type === 'grid' ||
            (this.config.type === 'gridable' && this.instance.currentView === 'grid')) {
            // Grid empty state
            if (this.instance.gridContainer) {
                this.instance.gridContainer.innerHTML = `
                    <div class="col-span-full text-center py-12 text-base-content/50">
                        <span class="mb-3 block">${iconHtml}</span>
                        <p class="text-lg">${emptyMessage}</p>
                    </div>
                `;
            }
        } else {
            // Table empty state
            if (this.instance.tbody) {
                this.instance.tbody.innerHTML = `
                    <tr>
                        <td colspan="100%" class="text-center py-12">
                            <div class="flex flex-col items-center gap-2 text-base-content/50">
                                ${iconHtml}
                                <p class="text-lg">${emptyMessage}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        const target = this.instance.getRenderTarget();
        const errorMessage = message || this.config.errorMessage;
        const errorIcon = this.config.errorIcon || 'error';
        const iconHtml = this._renderIcon(errorIcon, 'text-5xl');

        if (this.config.type === 'grid' ||
            (this.config.type === 'gridable' && this.instance.currentView === 'grid')) {
            if (this.instance.gridContainer) {
                this.instance.gridContainer.innerHTML = `
                    <div class="col-span-full text-center py-12 text-error">
                        <span class="mb-3 block">${iconHtml}</span>
                        <p class="text-lg">${errorMessage}</p>
                    </div>
                `;
            }
        } else {
            if (this.instance.tbody) {
                this.instance.tbody.innerHTML = `
                    <tr>
                        <td colspan="100%" class="text-center py-12 text-error">
                            <div class="flex flex-col items-center gap-2">
                                ${iconHtml}
                                <p class="text-lg">${errorMessage}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    }

    /**
     * Render an icon based on the configured icon library.
     * @param {string} icon - Icon name or HTML
     * @param {string} sizeClass - Size class to apply (e.g., 'text-5xl')
     * @returns {string} HTML string for the icon
     */
    _renderIcon(icon, sizeClass = '') {
        const library = this.config.iconLibrary || 'material-symbols';

        switch (library) {
            case 'material-symbols':
                return `<span class="material-symbols-outlined ${sizeClass}">${icon}</span>`;

            case 'font-awesome':
                const faClass = icon.startsWith('fa') ? icon : `fas fa-${icon}`;
                return `<i class="${faClass} ${sizeClass}"></i>`;

            case 'heroicons':
                return `<span class="heroicon heroicon-${icon} ${sizeClass}"></span>`;

            case 'phosphor':
                const phClass = icon.startsWith('ph-') ? `ph ${icon}` : `ph ph-${icon}`;
                return `<i class="${phClass} ${sizeClass}"></i>`;

            case 'custom':
                return `<span class="${sizeClass}">${icon}</span>`;

            default:
                return `<span class="material-symbols-outlined ${sizeClass}">${icon}</span>`;
        }
    }

    /**
     * Show skeleton loading state
     */
    showSkeleton() {
        if (this.config.type === 'grid' ||
            (this.config.type === 'gridable' && this.instance.currentView === 'grid')) {
            this._showGridSkeleton();
        } else {
            this._showTableSkeleton();
        }
    }

    /**
     * Show grid skeleton
     */
    _showGridSkeleton() {
        const container = this.instance.gridContainer;
        if (!container) return;

        const count = this.instance.params.per_page || 10;
        let skeletonHtml = '';

        for (let i = 0; i < count; i++) {
            skeletonHtml += `
                <div class="card bg-base-100 border border-base-200 p-4">
                    <div class="flex items-start gap-3">
                        <div class="skeleton w-20 h-12 rounded-lg shrink-0"></div>
                        <div class="flex-1 space-y-2">
                            <div class="skeleton h-4 w-3/4"></div>
                            <div class="skeleton h-3 w-1/2"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = skeletonHtml;
    }

    /**
     * Show table skeleton
     */
    _showTableSkeleton() {
        const tbody = this.instance.tbody;
        if (!tbody) return;

        const perPage = this.instance.params.per_page || 10;
        const table = this.instance.table;
        const columns = table?.querySelectorAll('thead th').length || 5;
        let skeletonHtml = '';

        for (let i = 0; i < perPage; i++) {
            skeletonHtml += '<tr>';

            // First column: Avatar + Text skeleton
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

        tbody.innerHTML = skeletonHtml;
    }
}

export default DSGOTRenderer;
