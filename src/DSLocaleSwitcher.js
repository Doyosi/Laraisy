/**
 * DSLocaleSwitcher
 * 
 * Manages locale switching for translatable form fields.
 * Shows/hides input fields based on selected locale.
 */
export class DSLocaleSwitcher {
    static instances = new Map();
    static instanceCounter = 0;

    /**
     * Default configuration
     */
    static defaults = {
        defaultLocale: 'en',
        onSwitch: null, // Callback when locale switches
    };

    /**
     * @param {string|HTMLElement} selector - Container element or selector
     * @param {Object} config - Configuration options
     */
    constructor(selector, config = {}) {
        this.instanceId = `ds-locale-switcher-${++DSLocaleSwitcher.instanceCounter}`;

        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;

        if (!el) {
            throw new Error('DSLocaleSwitcher: Element not found.');
        }

        this.container = el;
        this.cfg = { ...DSLocaleSwitcher.defaults, ...config };
        this._currentLocale = this.cfg.defaultLocale;
        this._boundHandlers = {};

        this._init();

        DSLocaleSwitcher.instances.set(this.instanceId, this);
        this.container.dataset.dsLocaleSwitcherId = this.instanceId;
    }

    /**
     * Static factory
     */
    static create(selector, config = {}) {
        return new DSLocaleSwitcher(selector, config);
    }

    /**
     * Get instance by element
     */
    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return null;
        const container = el.closest('[data-ds-locale-switcher-id]');
        if (!container) return null;
        return DSLocaleSwitcher.instances.get(container.dataset.dsLocaleSwitcherId);
    }

    /**
     * Auto-initialize all elements with [data-ds-locale-switcher]
     */
    static initAll(selector = '[data-ds-locale-switcher]') {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.dataset.dsLocaleSwitcherId) {
                new DSLocaleSwitcher(el);
            }
        });
    }

    // ==================== INITIALIZATION ====================

    _init() {
        this._cacheElements();
        this._bindEvents();
        this._setInitialState();
    }

    _cacheElements() {
        this.elements = {
            trigger: this.container.querySelector('[data-ds-locale-trigger]'),
            label: this.container.querySelector('[data-ds-locale-label]'),
            options: this.container.querySelectorAll('[data-ds-locale-option]'),
            translatables: this.container.querySelectorAll('[data-locale-translatable]'),
        };
    }

    _bindEvents() {
        this._boundHandlers.onOptionClick = this._onOptionClick.bind(this);

        this.elements.options.forEach(option => {
            option.addEventListener('click', this._boundHandlers.onOptionClick);
        });
    }

    _setInitialState() {
        // Find the first visible translatable to determine default locale
        this.elements.translatables.forEach(el => {
            if (el.style.display !== 'none') {
                this._currentLocale = el.dataset.localeTranslatable;
            }
        });

        // Update UI to match current locale
        this._updateUI();
    }

    // ==================== EVENT HANDLERS ====================

    _onOptionClick(e) {
        e.preventDefault();
        const locale = e.currentTarget.dataset.dsLocaleOption;
        this.switchTo(locale);

        // Close dropdown
        document.activeElement?.blur();
    }

    // ==================== PUBLIC API ====================

    /**
     * Switch to a specific locale
     */
    switchTo(locale) {
        if (locale === this._currentLocale) return;

        const prevLocale = this._currentLocale;
        this._currentLocale = locale;

        // Show/hide translatable fields
        this.elements.translatables.forEach(el => {
            if (el.dataset.localeTranslatable === locale) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // Update dropdown UI
        this._updateUI();

        // Callback
        if (typeof this.cfg.onSwitch === 'function') {
            this.cfg.onSwitch({ locale, prevLocale, instance: this });
        }

        // Dispatch event
        this.container.dispatchEvent(new CustomEvent('dslocale:switch', {
            bubbles: true,
            detail: { locale, prevLocale, instance: this }
        }));
    }

    /**
     * Get current locale
     */
    getCurrentLocale() {
        return this._currentLocale;
    }

    /**
     * Get all values for all locales
     */
    getValues() {
        const values = {};

        this.elements.translatables.forEach(el => {
            const locale = el.dataset.localeTranslatable;
            const input = el.querySelector('input, textarea');
            if (input) {
                values[locale] = input.value;
            }
        });

        return values;
    }

    /**
     * Set values for all locales
     */
    setValues(values) {
        if (typeof values !== 'object') return;

        this.elements.translatables.forEach(el => {
            const locale = el.dataset.localeTranslatable;
            const input = el.querySelector('input, textarea');
            if (input && values[locale] !== undefined) {
                input.value = values[locale];
            }
        });
    }

    /**
     * Destroy instance
     */
    destroy() {
        this.elements.options.forEach(option => {
            option.removeEventListener('click', this._boundHandlers.onOptionClick);
        });

        DSLocaleSwitcher.instances.delete(this.instanceId);
        delete this.container.dataset.dsLocaleSwitcherId;
    }

    // ==================== PRIVATE METHODS ====================

    _updateUI() {
        // Update active state on options
        this.elements.options.forEach(option => {
            if (option.dataset.dsLocaleOption === this._currentLocale) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Update trigger label and flag
        const activeOption = this.container.querySelector(`[data-ds-locale-option="${this._currentLocale}"]`);
        if (activeOption && this.elements.label) {
            this.elements.label.textContent = activeOption.dataset.localeName || this._currentLocale;
        }

        // Update trigger flag
        if (activeOption && this.elements.trigger) {
            const triggerFlag = this.elements.trigger.querySelector('.fi');
            if (triggerFlag && activeOption.dataset.localeFlag) {
                triggerFlag.className = `fi fi-${activeOption.dataset.localeFlag} text-sm`;
            }
        }
    }
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        DSLocaleSwitcher.initAll();
    });
}
