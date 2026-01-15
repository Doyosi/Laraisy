export class DSTableExport {
    constructor(tableInstance) {
        this.table = tableInstance;
        this.table.registerModule('export', this);

        // Look for export buttons
        this.buttons = document.querySelectorAll('[data-ds-table-export]');

        this._init();
    }

    _init() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.dataset.dsTableExport || 'csv';
                this.exportData(type);
            });
        });
    }

    exportData(type) {
        // Simple client-side export of current page data
        // For full export, we might need server support or fetch all.
        // Assuming client-side of current data for now.

        const data = this.table.data;
        if (!data || data.length === 0) return;

        if (type === 'csv') {
            this._exportCSV(data);
        } else if (type === 'json') {
            this._exportJSON(data);
        }
    }

    _exportCSV(data) {
        if (!data.length) return;

        // Flatten object for CSV? Or just take top level keys
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                if (typeof cell === 'object') cell = JSON.stringify(cell); // Simple handling
                return JSON.stringify(cell); // Quote strings
            }).join(','))
        ].join('\r\n');

        this._downloadFile(csvContent, 'export.csv', 'text/csv');
    }

    _exportJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        this._downloadFile(jsonContent, 'export.json', 'application/json');
    }

    _downloadFile(content, fileName, mimeType) {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        a.setAttribute('href', url);
        a.setAttribute('download', fileName);
        a.click();
    }
}
export default DSTableExport;
