/**
 * DSGOTViewToggle
 * 
 * Handles the view toggle button for gridable mode.
 * Allows users to switch between grid and table views.
 */
export class DSGOTViewToggle {
    constructor(instance) {
        this.instance = instance;
        this.config = instance.config;
        this.container = null;

        this._init();
    }

    _init() {
        // Look for existing toggle container or create one
        this.container = this.instance.wrapper.querySelector(this.config.toggleSelector);

        if (!this.container) {
            this._createToggle();
        }

        this._bindEvents();
        this.update();
    }

    /**
     * Create toggle buttons if not found in DOM
     */
    _createToggle() {
        this.container = document.createElement('div');
        this.container.className = 'ds-view-toggle join';
        this.container.innerHTML = `
            <button type="button" class="btn btn-sm join-item" data-view="grid" title="Grid View">
                <span class="material-symbols-outlined text-lg!">grid_view</span>
            </button>
            <button type="button" class="btn btn-sm join-item" data-view="table" title="Table View">
                <span class="material-symbols-outlined text-lg!">view_list</span>
            </button>
        `;

        // Insert toggle in appropriate location
        // Look for header area or insert before the table/grid
        const header = this.instance.wrapper.querySelector('.card-header, .ds-header, header');
        if (header) {
            // Append to header
            header.appendChild(this.container);
        } else {
            // Insert at the beginning of wrapper
            this.instance.wrapper.insertBefore(this.container, this.instance.wrapper.firstChild);
        }
    }

    /**
     * Bind click events to toggle buttons
     */
    _bindEvents() {
        const buttons = this.container.querySelectorAll('[data-view]');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = btn.dataset.view;
                this.instance.setView(view);
            });
        });
    }

    /**
     * Update toggle button states
     */
    update() {
        const currentView = this.instance.currentView;
        const buttons = this.container.querySelectorAll('[data-view]');

        buttons.forEach(btn => {
            const isActive = btn.dataset.view === currentView;
            btn.classList.toggle('btn-active', isActive);
            btn.classList.toggle('btn-primary', isActive);
        });
    }
}

export default DSGOTViewToggle;
