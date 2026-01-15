import { DSAlert } from './DSAlert.js';

/**
 * DSRestore
 * 
 * A plugin to handle restore actions with confirmation dialogs and AJAX requests.
 * Integrates with DSAlert for UI.
 */
export class DSRestore {
    static defaults = {
        selector: '[data-restore]',
        method: 'PATCH',
        ajaxFunction: 'axios', // axios | fetch

        // Confirmation Dialog
        title: 'Are you sure?',
        text: "You are about to restore this item.",
        icon: 'question',
        confirmButtonText: 'Yes, restore it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: 'btn btn-sm btn-success', // Positive action for restore

        // Success Dialog
        successTitle: 'Restored!',
        successText: 'Item has been restored successfully.',
        successIcon: 'success',

        // Error Dialog
        errorTitle: 'Error!',
        errorText: 'Something went wrong.',
        errorIcon: 'error',

        // Callbacks
        onSuccess: null, // function(response, element)
        onError: null,   // function(error, element)
        onRestore: null, // function(element) - before restore, return false to cancel
    };

    constructor(options = {}) {
        this.config = { ...DSRestore.defaults, ...options };
        this._init();
    }

    _init() {
        // Event Delegation
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest(this.config.selector);
            if (trigger) {
                e.preventDefault();
                this._handleRestore(trigger);
            }
        });
    }

    async _handleRestore(element) {
        // Allow cancellation via hook
        if (this.config.onRestore && this.config.onRestore(element) === false) {
            return;
        }

        const url = element.dataset.restore || element.getAttribute('href');
        const id = element.dataset.restoreId;

        if (!url) {
            console.error('DSRestore: No restore URL found on element', element);
            return;
        }

        const contentTitle = element.dataset.restoreTitle ? `"${element.dataset.restoreTitle}"` : '';
        const confirmText = contentTitle ? `${this.config.text} ${contentTitle}` : this.config.text;

        const confirmed = await DSAlert.fire({
            title: this.config.title,
            text: confirmText,
            icon: this.config.icon,
            showCancelButton: true,
            confirmButtonText: this.config.confirmButtonText,
            cancelButtonText: this.config.cancelButtonText,
            confirmButtonColor: this.config.confirmButtonColor
        });

        if (confirmed.isConfirmed) {
            this._performRestore(url, id, element);
        }
    }

    async _performRestore(url, id, element) {
        try {
            this._emit('restore:start', { element, url, id });

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
                throw new Error('DSRestore: No valid ajax function found');
            }

        } catch (error) {
            this._handleError(error, element);
        }
    }

    async _handleSuccess(response, element) {
        // Standard Laravel response: { success: true, message: '...' }
        const message = response.message || this.config.successText;

        // Fire Success Alert
        await DSAlert.fire({
            title: this.config.successTitle,
            text: message,
            icon: this.config.successIcon,
            timer: 2000,
            timerProgressBar: true
        });

        if (this.config.onSuccess) {
            this.config.onSuccess(response, element);
        }

        this._emit('restore:success', { response, element });

        // Optional: Remove row from table if inside one (assuming we are in trash view)
        const row = element.closest('tr');
        if (row) {
            row.remove();
        }
    }

    _handleError(error, element) {
        console.error('DSRestore Error:', error);

        let message = this.config.errorText;
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        } else if (error.data && error.data.message) {
            message = error.data.message;
        }

        DSAlert.fire({
            title: this.config.errorTitle,
            text: message,
            icon: this.config.errorIcon
        });

        if (this.config.onError) {
            this.config.onError(error, element);
        }

        this._emit('restore:error', { error, element });
    }

    _emit(event, detail = {}) {
        document.dispatchEvent(new CustomEvent(`ds:${event}`, { bubbles: true, detail }));
    }
}

export default DSRestore;
