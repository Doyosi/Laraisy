export class DSTableSearch {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('search', this);
        this.wrapper = this.table.wrapper;

        // Look for search input from options or convention
        // Instructions: input_selector: '#search'

        this.input = document.querySelector(this.table.config.search_selector || '#search') ||
            this.wrapper.querySelector('.ds-table-search input'); // Fallback convention

        if (this.input) {
            this._init();
        }
    }

    _init() {
        let timeout;
        this.input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const val = e.target.value;
                this.table.setParam('search', val);
                this.table.setParam('page', 1); // Reset to page 1 on search
                this.table.loadData();
            }, 500); // 500ms debounce
        });

        // Handle "X" clear search
        this.input.addEventListener('search', (e) => {
            if (e.target.value === '') {
                this.table.setParam('search', '');
                this.table.setParam('page', 1);
                this.table.loadData();
            }
        });
    }
}
export default DSTableSearch;
