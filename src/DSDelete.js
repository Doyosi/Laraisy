import { DSAlert } from './DSAlert.js';

/**
 * DSDelete
 * 
 * A plugin to handle delete actions with confirmation dialogs and AJAX requests.
 * Integrates with DSAlert for UI.
 */
export class DSDelete {
    static defaults = {
        selector: '[data-delete]',
        method: 'DELETE',
        ajaxFunction: 'axios', // axios | fetch

        // Icons
        icon: 'warning',
        successIcon: 'success',
        errorIcon: 'error',

        // Button styling
        confirmButtonColor: 'btn btn-sm btn-error', // Destructive action

        // Translations (i18n support)
        translations: {
            // Confirmation Dialog
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',

            // Success Dialog
            successTitle: 'Deleted!',
            successText: 'Your file has been deleted.',

            // Error Dialog
            errorTitle: 'Error!',
            errorText: 'Something went wrong.',
        },

        // Callbacks
        onSuccess: null, // function(response, element)
        onError: null,   // function(error, element)
        onDelete: null,  // function(element) - before delete, return false to cancel
    };

    static _defaults = {
        translations: {
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            successTitle: 'Deleted!',
            successText: 'Your file has been deleted.',
            errorTitle: 'Error!',
            errorText: 'Something went wrong.',
        },
    };

    /**
     * Static translation helper
     * @param {Object} config - Merged config object
     * @param {string} key - Translation key
     * @returns {string} Translated string
     */
    static _st(config, key) {
        return (config.translations && config.translations[key]) ||
            DSDelete._defaults.translations[key] ||
            key;
    }

    /**
     * Static method for programmatic delete confirmation
     * Usage: DSDelete.confirm({ url, title, text, successMessage, onSuccess })
     */
    static async confirm(options = {}) {
        // Deep merge translations
        const mergedTranslations = {
            ...DSDelete.defaults.translations,
            ...(options.translations || {})
        };
        const config = { ...DSDelete.defaults, ...options, translations: mergedTranslations };

        const confirmed = await DSAlert.fire({
            title: DSDelete._st(config, 'title'),
            text: DSDelete._st(config, 'text'),
            icon: config.icon || DSDelete.defaults.icon,
            showCancelButton: true,
            confirmButtonText: DSDelete._st(config, 'confirmButtonText'),
            cancelButtonText: DSDelete._st(config, 'cancelButtonText'),
            confirmButtonColor: config.confirmButtonColor || DSDelete.defaults.confirmButtonColor
        });

        if (confirmed.isConfirmed) {
            try {
                const method = config.method || 'DELETE';
                let response;

                if (window.axios) {
                    response = await window.axios({
                        method: method,
                        url: config.url,
                        data: config.data || {}
                    });
                    response = response.data;
                } else {
                    const res = await fetch(config.url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                        },
                        body: JSON.stringify(config.data || {})
                    });
                    response = await res.json();
                    if (!res.ok) throw { response: res, data: response };
                }

                // Show success message
                const successMessage = config.successMessage || response.message || DSDelete._st(config, 'successText');
                await DSAlert.fire({
                    title: DSDelete._st(config, 'successTitle'),
                    text: successMessage,
                    icon: config.successIcon || DSDelete.defaults.successIcon,
                    timer: 2000,
                    timerProgressBar: true
                });

                if (config.onSuccess) {
                    config.onSuccess(response);
                }

                return response;

            } catch (error) {
                console.error('DSDelete Error:', error);

                let errorMessage = DSDelete._st(config, 'errorText');
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.data?.message) {
                    errorMessage = error.data.message;
                }

                DSAlert.fire({
                    title: DSDelete._st(config, 'errorTitle'),
                    text: errorMessage,
                    icon: config.errorIcon || DSDelete.defaults.errorIcon
                });

                if (config.onError) {
                    config.onError(error);
                }

                throw error;
            }
        }

        return null;
    }

    constructor(options = {}) {
        // Deep merge translations
        const mergedTranslations = {
            ...DSDelete.defaults.translations,
            ...(options.translations || {})
        };
        this.config = { ...DSDelete.defaults, ...options, translations: mergedTranslations };
        this._init();
    }

    _init() {
        // Event Delegation
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest(this.config.selector);
            if (trigger) {
                e.preventDefault();
                this._handleDelete(trigger);
            }
        });
    }

    async _handleDelete(element) {
        // Allow cancellation via hook
        if (this.config.onDelete && this.config.onDelete(element) === false) {
            return;
        }

        const url = element.dataset.delete || element.getAttribute('href');
        const id = element.dataset.deleteId;

        if (!url) {
            console.error('DSDelete: No delete URL found on element', element);
            return;
        }

        // Construct final URL if ID is provided and URL doesn't look complete (optional logic, kept simple for now)
        // User instructions said: "custom url with data-delete-id custom url + data - id send by request"
        // Interpretation: If data-delete-id exists, maybe append it? 
        // Usually Laravel routes are full URLs. Let's assume URL is full unless we want to support building it.
        // If data-delete-id is preset, maybe we send it as data body? 
        // Default standard: DELETE request to URL.

        const contentTitle = element.dataset.deleteTitle ? `"${element.dataset.deleteTitle}"` : '';
        const confirmText = contentTitle ? `${this._t('text')} ${contentTitle}` : this._t('text');

        const confirmed = await DSAlert.fire({
            title: this._t('title'),
            text: confirmText,
            icon: this.config.icon,
            showCancelButton: true,
            confirmButtonText: this._t('confirmButtonText'),
            cancelButtonText: this._t('cancelButtonText'),
            confirmButtonColor: this.config.confirmButtonColor
        });

        if (confirmed.isConfirmed) {
            this._performDelete(url, id, element);
        }
    }

    async _performDelete(url, id, element) {
        try {
            this._emit('delete:start', { element, url, id });

            let response;
            const data = id ? { id } : {};

            if (this.config.ajaxFunction === 'axios' && window.axios) {
                response = await window.axios({
                    method: this.config.method,
                    url: url,
                    data: data
                });
                // Axios returns data in response.data
                await this._handleSuccess(response.data, element);
            } else if (this.config.ajaxFunction === 'fetch' || window.fetch) {
                const options = {
                    method: this.config.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                    },
                    body: JSON.stringify(data)
                };
                const res = await fetch(url, options);
                const json = await res.json();

                if (!res.ok) throw { response: res, data: json };

                await this._handleSuccess(json, element);
            } else {
                throw new Error('DSDelete: No valid ajax function found');
            }

        } catch (error) {
            this._handleError(error, element);
        }
    }

    async _handleSuccess(response, element) {
        // Standard Laravel response: { success: true, message: '...' }
        const message = response.message || this._t('successText');

        // Fire Success Alert
        await DSAlert.fire({
            title: this._t('successTitle'),
            text: message,
            icon: this.config.successIcon,
            timer: 2000,
            timerProgressBar: true
        });

        if (this.config.onSuccess) {
            this.config.onSuccess(response, element);
        }

        this._emit('delete:success', { response, element });

        // Optional: Remove row from table if inside one
        const row = element.closest('tr');
        if (row) {
            row.remove();
        }
    }

    _handleError(error, element) {
        console.error('DSDelete Error:', error);

        let message = this._t('errorText');
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        } else if (error.data && error.data.message) {
            message = error.data.message;
        }

        DSAlert.fire({
            title: this._t('errorTitle'),
            text: message,
            icon: this.config.errorIcon
        });

        if (this.config.onError) {
            this.config.onError(error, element);
        }

        this._emit('delete:error', { error, element });
    }

    /**
     * Instance translation helper
     * @param {string} key - Translation key
     * @returns {string} Translated string
     */
    _t(key) {
        return (this.config.translations && this.config.translations[key]) ||
            DSDelete._defaults.translations[key] ||
            key;
    }

    _emit(event, detail = {}) {
        document.dispatchEvent(new CustomEvent(`ds:${event}`, { bubbles: true, detail }));
    }
}

export default DSDelete;
