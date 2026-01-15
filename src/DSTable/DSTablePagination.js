export class DSTablePagination {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('pagination', this);
        this.wrapper = this.table.wrapper;
        this.container = null;
        this._init();
    }

    _init() {
        // Locate or create pagination container
        // Usually inside the wrapper, after the table
        // We can look for a specific container or append one.
        // For this implementation, we will append a container if one doesn't exist with a specific class custom to this plugin, 
        // OR reuse the provided HTML structure from the instructions.

        // Instructions sample: <div class="flex justify-between items-center mt-4 pt-4 border-t border-base-200">...</div>

        this.container = this.wrapper.querySelector('.ds-table-pagination');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'ds-table-pagination';
            this.wrapper.appendChild(this.container);
        }

        // Bind events for static elements if any (usually dynamic)
    }

    onDataLoaded(response) {
        this.render(response.meta);
    }

    render(meta) {
        if (!meta || !meta.total) { // || meta.total === 0
            this.container.innerHTML = '';
            return;
        }

        const { current_page, last_page, total, per_page, from, to } = meta;
        var text = this.table.config.pagination_translations.stats;
        const stats_replace = (from, to, total, text) => text.replace('{from}', from).replace('{to}', to).replace('{total}', total);
        this.container.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-base-200 gap-4">
                <div class="flex items-center gap-4">
                    <div class="text-sm text-base-content/70">
                        ${stats_replace(meta.from, meta.to, total, text)}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="join">
                        ${this._buildButtons(current_page, last_page)}
                    </div>
                    <div class="flex items-center gap-2 ml-2">
                        <span class="text-xs text-base-content/70">${this.table.config.pagination_translations.goto}</span>
                        <input type="number" min="1" max="${last_page}" class="input input-sm input-bordered w-16 text-center page-goto" value="${current_page}">
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    _buildButtons(current, last) {
        let buttons = '';

        // Prev
        buttons += `<button class="join-item btn btn-sm ${current === 1 ? 'btn-disabled' : ''}" data-page="${current - 1}">«</button>`;

        // Simple logic: Show all if small, or sliding window
        // For brevity: 1, 2, 3 ... last

        const delta = 2;
        const range = [];
        for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
            range.push(i);
        }

        if (current - delta > 2) range.unshift('...');
        if (current + delta < last - 1) range.push('...');

        range.unshift(1);
        if (last > 1) range.push(last);

        range.forEach(i => {
            if (i === '...') {
                buttons += `<button class="join-item btn btn-sm btn-disabled">...</button>`;
            } else {
                const isActive = i === current;
                buttons += `<button class="join-item btn btn-sm ${isActive ? 'btn-active btn-disabled' : ''}" data-page="${i}">${i}</button>`;
            }
        });

        // Next
        buttons += `<button class="join-item btn btn-sm ${current === last ? 'btn-disabled' : ''}" data-page="${current + 1}">»</button>`;

        return buttons;
    }

    _bindEvents() {
        // Buttons
        this.container.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (btn.classList.contains('btn-disabled')) return;
                const page = parseInt(btn.dataset.page);
                if (page) {
                    this.table.setParam('page', page);
                    this.table.loadData();
                }
            });
        });

        // Go to input
        const gotoInput = this.container.querySelector('.page-goto');
        if (gotoInput) {
            gotoInput.addEventListener('change', (e) => {
                let page = parseInt(e.target.value);
                const max = parseInt(e.target.max);
                if (page < 1) page = 1;
                if (page > max) page = max;

                if (page !== this.table.getParam('page')) {
                    this.table.setParam('page', page);
                    this.table.loadData();
                }
            });
            gotoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    gotoInput.blur(); // Trigger change
                }
            });
        }
    }
}
export default DSTablePagination;
