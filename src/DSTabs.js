/**
 * DSTabs
 * 
 * A lightweight tab switching component with:
 * - Button/link click handlers for tab switching
 * - Radio input synchronization
 * - Active state management with disabled/enabled buttons
 * - CSS class-based content show/hide
 * - Data attribute configuration
 * - Full event system
 * 
 * @example
 * // HTML structure:
 * // Buttons: <button data-tab="primary">Primary</button>
 * // Radio inputs: <input type="radio" data-tab="primary" checked />
 * // Tab content: <div class="tab-content">...</div>
 */
export class DSTabs {
    static instances = new Map();
    static instanceCounter = 0;

    /**
     * Default configuration
     */
    static defaults = {
        // Selectors
        buttonSelector: 'button[data-tab], a[data-tab]',  // Selector for tab buttons/links (excludes inputs)
        radioSelector: 'input[type="radio"][data-tab]',   // Selector for hidden radio inputs
        contentSelector: '.tab-content',                  // Selector for tab content containers
        tabsContainer: '.tabs',                           // Container that holds radios and content

        // Behavior
        activeClass: 'active',                  // Class to add to active button
        disableActive: true,                    // Disable the active button
        showFirst: true,                        // Auto-show first tab on init

        // Styling
        buttonActiveClass: 'btn-active',        // Additional class for active button
        contentHiddenClass: 'hidden',           // Class to hide inactive content

        // Callbacks
        onTabChange: null,                      // Callback when tab changes (tabName, prevTabName)
    };

    /**
     * @param {string|HTMLElement} containerSelector - Container element or selector
     * @param {Object} config - Configuration options
     */
    constructor(containerSelector, config = {}) {
        this.instanceId = `ds-tabs-${++DSTabs.instanceCounter}`;

        // Find the container element
        const el = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;

        if (!el) {
            throw new Error('DSTabs: Container element not found.');
        }

        this.container = el;

        // Merge config with data attributes
        this.cfg = this._buildConfig(config);

        // State
        this._currentTab = null;
        this._prevTab = null;

        // Event listeners
        this._listeners = {};
        this._boundHandlers = {};

        // Initialize
        this._init();

        // Register instance
        DSTabs.instances.set(this.instanceId, this);
        this.container.dataset.dsTabsId = this.instanceId;
    }

    /**
     * Static factory method
     */
    static create(containerSelector, config = {}) {
        return new DSTabs(containerSelector, config);
    }

    /**
     * Get instance by element
     */
    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;
        const container = el.closest('[data-ds-tabs-id]');
        if (!container) return null;
        return DSTabs.instances.get(container.dataset.dsTabsId);
    }

    /**
     * Auto-initialize all elements with [data-ds-tabs]
     */
    static initAll(selector = '[data-ds-tabs]') {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.closest('[data-ds-tabs-id]')) {
                new DSTabs(el);
            }
        });
    }

    // ==================== INITIALIZATION ====================

    _buildConfig(userConfig) {
        const dataConfig = this._parseDataAttributes();
        return { ...DSTabs.defaults, ...dataConfig, ...userConfig };
    }

    _parseDataAttributes() {
        const data = this.container.dataset;
        const config = {};

        if (data.buttonSelector) config.buttonSelector = data.buttonSelector;
        if (data.radioSelector) config.radioSelector = data.radioSelector;
        if (data.contentSelector) config.contentSelector = data.contentSelector;
        if (data.tabsContainer) config.tabsContainer = data.tabsContainer;
        if (data.activeClass) config.activeClass = data.activeClass;
        if (data.disableActive !== undefined) config.disableActive = data.disableActive !== 'false';
        if (data.showFirst !== undefined) config.showFirst = data.showFirst !== 'false';

        return config;
    }

    _init() {
        this._cacheElements();
        this._bindEvents();
        this._initActiveTab();

        this._emit('ready', { activeTab: this._currentTab });
    }

    _cacheElements() {
        // Find all buttons with data-tab attribute within the container
        this.buttons = Array.from(this.container.querySelectorAll(this.cfg.buttonSelector));

        // Find the tabs container
        this.tabsContainer = this.container.querySelector(this.cfg.tabsContainer);

        // Find all radio inputs and content pairs within the tabs container
        if (this.tabsContainer) {
            this.radios = Array.from(this.tabsContainer.querySelectorAll(this.cfg.radioSelector));
            this.contents = Array.from(this.tabsContainer.querySelectorAll(this.cfg.contentSelector));
        } else {
            this.radios = [];
            this.contents = [];
        }

        // Build a map of tab name -> { button, radio, content }
        this._tabMap = new Map();

        this.buttons.forEach(button => {
            const tabName = button.dataset.tab;
            if (!this._tabMap.has(tabName)) {
                this._tabMap.set(tabName, { buttons: [], radio: null, content: null });
            }
            this._tabMap.get(tabName).buttons.push(button);
        });

        // Associate radios with their following content divs
        this.radios.forEach((radio, index) => {
            const tabName = radio.dataset.tab;
            if (this._tabMap.has(tabName)) {
                this._tabMap.get(tabName).radio = radio;
                // The content div follows the radio input
                if (this.contents[index]) {
                    this._tabMap.get(tabName).content = this.contents[index];
                }
            }
        });
    }

    _bindEvents() {
        this._boundHandlers.onButtonClick = this._onButtonClick.bind(this);

        this.buttons.forEach(button => {
            button.addEventListener('click', this._boundHandlers.onButtonClick);
        });
    }

    _initActiveTab() {
        // Find the initially checked radio or first tab
        let activeTabName = null;

        // Check for checked radio
        const checkedRadio = this.radios.find(r => r.checked);
        if (checkedRadio) {
            activeTabName = checkedRadio.dataset.tab;
        }

        // Or check for disabled button (indicates active)
        if (!activeTabName) {
            const disabledButton = this.buttons.find(b => b.disabled);
            if (disabledButton) {
                activeTabName = disabledButton.dataset.tab;
            }
        }

        // Or use first tab if showFirst is enabled
        if (!activeTabName && this.cfg.showFirst && this._tabMap.size > 0) {
            activeTabName = this._tabMap.keys().next().value;
        }

        if (activeTabName) {
            this._switchTab(activeTabName, false);
        }
    }

    // ==================== EVENT HANDLERS ====================

    _onButtonClick(e) {
        const button = e.currentTarget;
        const tabName = button.dataset.tab;

        // Don't switch if already active or button is disabled
        if (tabName === this._currentTab || button.disabled) {
            return;
        }

        this.switchTo(tabName);
    }

    // ==================== CORE FUNCTIONALITY ====================

    _switchTab(tabName, emit = true) {
        const tabData = this._tabMap.get(tabName);
        if (!tabData) {
            console.warn(`DSTabs: Tab "${tabName}" not found.`);
            return false;
        }

        const prevTab = this._currentTab;
        this._prevTab = prevTab;
        this._currentTab = tabName;

        // Update all buttons
        this._tabMap.forEach((data, name) => {
            const isActive = name === tabName;

            data.buttons.forEach(button => {
                // Handle disabled state
                if (this.cfg.disableActive) {
                    button.disabled = isActive;
                }

                // Handle active classes
                if (isActive) {
                    button.classList.add(this.cfg.activeClass);
                    if (this.cfg.buttonActiveClass) {
                        button.classList.add(this.cfg.buttonActiveClass);
                    }
                } else {
                    button.classList.remove(this.cfg.activeClass);
                    if (this.cfg.buttonActiveClass) {
                        button.classList.remove(this.cfg.buttonActiveClass);
                    }
                }
            });

            // Update radio state
            if (data.radio) {
                data.radio.checked = isActive;
            }

            // Show/hide content
            if (data.content) {
                if (isActive) {
                    data.content.classList.remove(this.cfg.contentHiddenClass);
                    data.content.style.display = '';
                } else {
                    data.content.classList.add(this.cfg.contentHiddenClass);
                    data.content.style.display = 'none';
                }
            }
        });

        if (emit) {
            this._emit('change', { tab: tabName, prevTab });

            if (typeof this.cfg.onTabChange === 'function') {
                this.cfg.onTabChange(tabName, prevTab);
            }
        }

        return true;
    }

    // ==================== PUBLIC API ====================

    /**
     * Switch to a specific tab
     * @param {string} tabName - The tab to switch to
     * @returns {boolean} - Whether the switch was successful
     */
    switchTo(tabName) {
        return this._switchTab(tabName);
    }

    /**
     * Get the current active tab name
     * @returns {string|null}
     */
    getCurrentTab() {
        return this._currentTab;
    }

    /**
     * Get the previous tab name
     * @returns {string|null}
     */
    getPreviousTab() {
        return this._prevTab;
    }

    /**
     * Get all available tab names
     * @returns {string[]}
     */
    getTabNames() {
        return Array.from(this._tabMap.keys());
    }

    /**
     * Check if a tab exists
     * @param {string} tabName
     * @returns {boolean}
     */
    hasTab(tabName) {
        return this._tabMap.has(tabName);
    }

    /**
     * Switch to next tab (loops back to first)
     * @returns {string|null} - The new active tab name
     */
    next() {
        const tabs = this.getTabNames();
        const currentIndex = tabs.indexOf(this._currentTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        const nextTab = tabs[nextIndex];
        this.switchTo(nextTab);
        return nextTab;
    }

    /**
     * Switch to previous tab (loops to last)
     * @returns {string|null} - The new active tab name
     */
    prev() {
        const tabs = this.getTabNames();
        const currentIndex = tabs.indexOf(this._currentTab);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        const prevTab = tabs[prevIndex];
        this.switchTo(prevTab);
        return prevTab;
    }

    /**
     * Enable a specific tab button
     * @param {string} tabName
     */
    enableTab(tabName) {
        const tabData = this._tabMap.get(tabName);
        if (tabData) {
            tabData.buttons.forEach(button => {
                if (tabName !== this._currentTab || !this.cfg.disableActive) {
                    button.disabled = false;
                }
            });
        }
    }

    /**
     * Disable a specific tab button
     * @param {string} tabName
     */
    disableTab(tabName) {
        const tabData = this._tabMap.get(tabName);
        if (tabData) {
            tabData.buttons.forEach(button => {
                button.disabled = true;
            });
        }
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name ('ready', 'change')
     * @param {Function} handler - Event handler
     * @returns {DSTabs} - For chaining
     */
    on(event, handler) {
        if (!this._listeners[event]) {
            this._listeners[event] = new Set();
        }
        this._listeners[event].add(handler);
        return this;
    }

    /**
     * Unsubscribe from events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler (optional, removes all if not provided)
     * @returns {DSTabs} - For chaining
     */
    off(event, handler) {
        if (this._listeners[event]) {
            if (handler) {
                this._listeners[event].delete(handler);
            } else {
                this._listeners[event].clear();
            }
        }
        return this;
    }

    /**
     * Emit an event
     * @private
     */
    _emit(event, data = {}) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(handler => {
                try {
                    handler(data);
                } catch (e) {
                    console.error(`DSTabs: Error in ${event} handler:`, e);
                }
            });
        }

        // Also dispatch a DOM CustomEvent
        this.container.dispatchEvent(new CustomEvent(`dstabs:${event}`, {
            bubbles: true,
            detail: data
        }));
    }

    /**
     * Refresh the tabs (re-cache elements and reinitialize)
     */
    refresh() {
        this._cacheElements();
        this._initActiveTab();
        this._emit('refresh');
    }

    /**
     * Destroy the instance and cleanup
     */
    destroy() {
        // Remove event listeners
        this.buttons.forEach(button => {
            button.removeEventListener('click', this._boundHandlers.onButtonClick);
        });

        // Reset button states
        this.buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove(this.cfg.activeClass, this.cfg.buttonActiveClass);
        });

        // Show all content
        this.contents.forEach(content => {
            content.classList.remove(this.cfg.contentHiddenClass);
            content.style.display = '';
        });

        // Clear state
        this._listeners = {};
        this._tabMap.clear();
        DSTabs.instances.delete(this.instanceId);
        delete this.container.dataset.dsTabsId;

        this._emit('destroy');
    }
}

// Export for both ES modules and CommonJS
export default DSTabs;
