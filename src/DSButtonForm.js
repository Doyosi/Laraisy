/**
 * DSButtonForm
 *
 * A standalone button handler for AJAX actions (e.g., "Regenerate", "Delete", "Sync").
 * - Swaps button content during loading.
 * - Sends custom data (JSON) via Fetch / Axios / XHR.
 * - Integrates with DSAlert for toasts and confirmations.
 * - Emits internal events and bubbles native DOM events.
 */
import { DSAlert } from './DSAlert.js';

export class DSButtonForm {
    /**
     * @param {Object} config
     * @param {HTMLElement|string} config.element - The button selector or element.
     * @param {string} config.url - The endpoint URL.
     * @param {'get'|'post'|'put'|'delete'|'patch'} [config.method='post']
     * @param {Object|Function} [config.data={}] - Data to send. If function, receives the button element.
     * @param {'fetch'|'axios'|'xhr'} [config.requestLib='fetch'] - Force specific library.
     * @param {Object} [config.headers] - Custom headers.
     * @param {string} [config.loadingHtml] - HTML to show inside button while loading.
     * @param {boolean} [config.askConfirmation=false] - If true, triggers DSAlert confirm modal before request.
     * @param {Object} [config.confirmOptions] - DSAlert options for confirmation.
     * @param {boolean} [config.disableOnSuccess=false] - Keep button disabled after success.
     * @param {Object} [config.toast] - Toast config { enabled, position, timer }.
     */
    constructor(config = {}) {
        const defaults = {
            method: 'post',
            requestLib: 'fetch',
            data: {},
            loadingHtml: '<i class="ph ph-spinner text-base animate-spin"></i>', // Default spinner
            askConfirmation: false,
            confirmOptions: {
                title: 'Are you sure?',
                text: 'Do you want to proceed?',
                icon: 'warning',
                confirmButtonText: 'Yes, proceed',
                cancelButtonText: 'Cancel'
            },
            toast: { enabled: true, position: 'top-end', timer: 3000 },
            disableOnSuccess: false,
            translations: {
                networkError: 'Network error.',
                success: 'Action completed!',
                error: 'Action failed.'
            }
        };

        this.cfg = { ...defaults, ...config };
        this.el = typeof this.cfg.element === 'string' ? document.querySelector(this.cfg.element) : this.cfg.element;

        if (!this.el) throw new Error('DSButtonForm: Button element not found.');

        // State
        this._originalHtml = this.el.innerHTML;
        this._isBusy = false;
        this._listeners = {};

        // Bindings
        this._onClick = this._onClick.bind(this);
        this.bind();
    }

    // ================= Event API =================

    /**
     * Subscribe to internal events
     * @param {'start'|'success'|'error'|'complete'} event 
     * @param {Function} handler 
     */
    on(event, handler) {
        if (!this._listeners[event]) this._listeners[event] = new Set();
        this._listeners[event].add(handler);
        return this;
    }

    /** Unsubscribe */
    off(event, handler) {
        if (this._listeners[event]) this._listeners[event].delete(handler);
        return this;
    }

    /** Internal: Emit to listeners AND dispatch DOM event */
    _emit(event, detail = {}) {
        // 1. Internal listeners
        if (this._listeners[event]) {
            this._listeners[event].forEach(fn => {
                try { fn(detail); } catch (e) { console.warn(e); }
            });
        }

        // 2. DOM Event (bubbles up)
        // Listens as: document.addEventListener('dsbutton:success', ...)
        const domEvent = new CustomEvent(`dsbutton:${event}`, {
            bubbles: true,
            cancelable: true,
            detail: { ...detail, instance: this, element: this.el }
        });
        this.el.dispatchEvent(domEvent);
    }

    // ================= Lifecycle =================

    bind() {
        this.el.addEventListener('click', this._onClick);
        return this;
    }

    unbind() {
        this.el.removeEventListener('click', this._onClick);
        return this;
    }

    // ================= Execution =================

    async _onClick(e) {
        e.preventDefault();
        if (this._isBusy || this.el.disabled) return;

        if (this.cfg.askConfirmation) {
            const confirmed = await this._confirmAction();
            if (!confirmed) return;
        }

        await this.submit();
    }

    async submit() {
        this._setLoading(true);
        const controller = new AbortController();

        // Resolve Data (Object or Function)
        let payload = this.cfg.data;
        if (typeof payload === 'function') payload = payload(this.el);

        this._emit('start', { payload, controller });

        let ok = false;
        let response, data;

        try {
            ({ response, data } = await this._sendRequest({
                body: JSON.stringify(payload),
                headers: this._buildHeaders(),
                signal: controller.signal
            }));

            ok = response.ok;

            if (ok) {
                this._emit('success', { response, data });
                this._toast(data?.message || this.cfg.translations.success, 'success');

                // Handle Redirects
                if (data?.redirect || data?.data?.redirect) {
                    window.location.href = data.redirect || data.data.redirect;
                }
            } else {
                this._emit('error', { response, data });
                const errorMsg = data?.message || data?.error || this.cfg.translations.error;
                this._toast(errorMsg, 'error');
            }

        } catch (err) {
            console.error(err);
            this._emit('error', { error: err });
            this._toast(this.cfg.translations.networkError, 'error');
        } finally {
            if (!this.cfg.disableOnSuccess || !ok) {
                this._setLoading(false);
            }
            this._emit('complete', { ok });
        }
    }

    // ================= Network Logic =================

    async _sendRequest({ body, headers, signal }) {
        const url = this.cfg.url;
        const method = this.cfg.method.toLowerCase();

        // Normalize config (default to fetch)
        const lib = (this.cfg.requestLib || 'fetch').toLowerCase();

        // 1. AXIOS
        if (lib === 'axios') {
            if (window.axios) {
                try {
                    const resp = await window.axios({ url, method, data: JSON.parse(body), headers, signal });
                    return { response: { ok: true, status: resp.status }, data: resp.data };
                } catch (err) {
                    const resp = err.response || {};
                    return { response: { ok: false, status: resp.status || 500 }, data: resp.data || {} };
                }
            } else {
                console.warn('DSButtonForm: Axios selected but not found. Falling back to Fetch.');
            }
        }

        // 2. FETCH (Default or Fallback)
        if (lib === 'fetch' || (lib === 'axios' && window.fetch) || (!['axios', 'xhr'].includes(lib) && window.fetch)) {
            const resp = await fetch(url, { method, headers, body, signal, credentials: 'same-origin' });
            let data = {};
            try { data = await resp.json(); } catch { }
            return { response: resp, data };
        }

        // 3. XHR (Legacy Fallback)
        return this._xhr({ url, method, headers, body });
    }

    _xhr({ url, method, headers, body }) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), url, true);
            xhr.responseType = 'json';
            Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
            xhr.onload = () => resolve({ response: { ok: xhr.status >= 200 && xhr.status < 300 }, data: xhr.response });
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(body);
        });
    }

    _buildHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(this.cfg.headers || {})
        };
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrf) headers['X-CSRF-TOKEN'] = csrf;
        return headers;
    }

    // ================= UI Helpers =================

    _setLoading(active) {
        this._isBusy = active;
        if (active) {
            // Lock width to prevent UI jump
            this.el.style.width = `${this.el.offsetWidth}px`;

            this.el.setAttribute('disabled', 'disabled');
            this.el.dataset._originalHtml = this.el.innerHTML;
            this.el.innerHTML = this.cfg.loadingHtml;
            this.el.classList.add('disabled', 'cursor-not-allowed');
        } else {
            this.el.removeAttribute('disabled');
            this.el.innerHTML = this.el.dataset._originalHtml || this._originalHtml;
            this.el.style.width = '';
            this.el.classList.remove('disabled', 'cursor-not-allowed');
        }
    }

    async _confirmAction() {
        const result = await DSAlert.fire({
            showCancelButton: true,
            ...this.cfg.confirmOptions
        });
        return result.isConfirmed;
    }

    _toast(msg, icon) {
        if (!this.cfg.toast.enabled) return;
        DSAlert.fire({
            toast: true,
            position: this.cfg.toast.position,
            icon: icon,
            title: msg,
            showConfirmButton: false,
            timer: this.cfg.toast.timer
        });
    }
}