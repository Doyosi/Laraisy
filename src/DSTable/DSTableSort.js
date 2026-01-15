export class DSTableSort {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('sort', this);

        // We need to attach listeners to table headers row
        this.headers = this.table.wrapper.querySelectorAll('thead th[data-sort]');

        if (this.headers.length > 0) {
            this._init();
        }
    }

    _init() {
        this.headers.forEach(th => {
            th.classList.add('cursor-pointer', 'hover:bg-base-200'); // Add UI hint
            th.addEventListener('click', () => {
                const sortKey = th.dataset.sort;
                let currentDir = this.table.getParam('sort_order') || 'asc';
                let currentSort = this.table.getParam('sort_by');

                // Toggle if clicking same header, else default asc
                if (currentSort === sortKey) {
                    currentDir = currentDir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentDir = 'asc';
                }

                // Reset page to 1 when sorting changes
                this.table.setParam('page', 1);
                this.table.setParam('sort_by', sortKey);
                this.table.setParam('sort_order', currentDir);

                this._updateIcons(th, currentDir);
                this.table.loadData();
            });
        });
    }

    _updateIcons(activeTh, dir) {
        this.headers.forEach(th => {
            // Remove existing icons
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.remove();
            th.classList.remove('text-primary'); // Remove active color
        });

        // Add icon to active
        // Simple text arrow for now, can be SVG
        const arrow = dir === 'asc' ? '↑' : '↓';
        const span = document.createElement('span');
        span.className = 'sort-icon ml-1';
        span.textContent = arrow;
        activeTh.appendChild(span);
        activeTh.classList.add('text-primary');
    }
}
export default DSTableSort;
