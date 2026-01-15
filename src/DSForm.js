/**
 * DSForm (with DSAlert integration)
 *
 * A modern form handler that includes:
 * - Integration with DSAlert for Toasts and Modals.
 * - AJAX submission via 'fetch' | 'axios' | 'xhr'.
 * - Laravel-style error mapping (dot/bracket notation).
 * - Lifecycle hooks (onBeforeSubmit, onSubmit, onSuccess, onError, onComplete).
 * - Automatic disable/loading states.
 * - Data injection before submit.
 */
import { DSAlert } from './DSAlert.js';

export class DSForm {
    /**
     * @param {Object} config - Configuration object.
     * @param {HTMLFormElement|string} config.form - Form element or selector.
     * @param {string} [config.url] - Submit URL (defaults to form.action or current url).
     * @param {'post'|'put'} [config.method] - HTTP method.
     * @param {Array<string|HTMLElement>} [config.triggers] - External triggers (selectors/elements).
     * @param {'fetch'|'axios'|'xhr'} [config.requestLib] - Preferred request lib; gracefully falls back.
     * @param {Object} [config.headers] - Extra headers.
     * @param {Object|Function} [config.additionalData] - Extra data merged before submit.
     * @param {Array<string>} [config.disableSelectors] - Extra selectors to disable during submit.
     * @param {Array<string>} [config.excludeEnableSelectors] - Keep these disabled after complete.
     * @param {string} [config.primaryButtonSelector='button[type="submit"]'] - For default loading target.
     * @param {(Function|string)} [config.loadingTemplate] - Function/Selector/Raw HTML for loading state.
     * @param {Object} [config.translations] - i18n map for user texts.
     * @param {Object} [config.toast] - Toast options { enabled, position, timer, timerProgressBar }.
     * @param {boolean} [config.autoRedirect=true] - Follow payload.redirect if present.
     * @param {boolean} [config.disableOnSuccess=false] - Keep all controls disabled if the request succeeds.
     * @param {Function} [config.onBeforeSubmit]
     * @param {Function} [config.onSubmit]
     * @param {Function} [config.onSuccess]
     * @param {Function} [config.onError]
     * @param {Function} [config.onComplete]
     * @param {string} [config.successTitle] - Title for success toast (overrides payload.message).
     * @param {string} [config.errorTitle] - Title for error toast (overrides payload.message).
     */
    constructor(config = {}) {
        const defaults = {
            requestLib: 'fetch',
            primaryButtonSelector: 'button[type="submit"]',
            translations: {
                loading: 'Loading...',
                networkError: 'Network error.',
                unknownError: 'Something went wrong.',
                success: 'Success!',
                error: 'There was a problem.'
            },
            // Removed useSwal, added standard defaults compatible with DSAlert
            toast: { enabled: false, position: 'top-end', timer: 3000, timerProgressBar: true },
            autoRedirect: true,
            disableOnSuccess: false,
            successTitle: null,
            errorTitle: null,
        };

        this.cfg = { ...defaults, ...config };

        this.form = typeof this.cfg.form === 'string' ? document.querySelector(this.cfg.form) : this.cfg.form;
        if (!this.form) throw new Error('DSForm: form not found.');

        this.url = this.cfg.url || this.form.getAttribute('action') || window.location.href;
        this.method = (this.cfg.method || this.form.getAttribute('method') || 'post').toLowerCase();

        this.triggers = (this.cfg.triggers || [])
            .map(t => (typeof t === 'string' ? document.querySelector(t) : t))
            .filter(Boolean);

        this._activeTrigger = null;
        this._disabledEls = new Set();

        // Mini event emitter
        this._listeners = {};

        // Bind handlers once (per instance)
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onExternalTrigger = this._onExternalTrigger.bind(this);
    }

    /** Attach listeners to form and external triggers */
    bind() {
        this.form.addEventListener('submit', this._onFormSubmit);
        for (const el of this.triggers) el.addEventListener('click', this._onExternalTrigger);
        return this;
    }

    /** Detach listeners */
    unbind() {
        this.form.removeEventListener('submit', this._onFormSubmit);
        for (const el of this.triggers) el.removeEventListener('click', this._onExternalTrigger);
        return this;
    }

    /** Emitter: subscribe to internal events (and mirrored DOM CustomEvents) */
    on(event, handler) {
        if (!this._listeners[event]) this._listeners[event] = new Set();
        this._listeners[event].add(handler);
        return this;
    }

    /** Emitter: unsubscribe */
    off(event, handler) {
        if (this._listeners[event]) this._listeners[event].delete(handler);
        return this;
    }

    /** Programmatically submit (optional). Runs native validation via requestSubmit if supported. */
    submit({ trigger = null } = {}) {
        this._activeTrigger = trigger instanceof HTMLElement ? trigger : null;
        if (typeof this.form.requestSubmit === 'function') {
            const btn = this._activeTrigger?.type === 'submit' ? this._activeTrigger : this.form.querySelector(this.cfg.primaryButtonSelector);
            btn ? this.form.requestSubmit(btn) : this.form.requestSubmit();
        } else {
            this.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    }

    /** Public helper to merge extra data into request payload creation pipeline */
    addData(extra = {}) {
        if (typeof this.cfg.additionalData === 'function') {
            const prev = this.cfg.additionalData;
            this.cfg.additionalData = (data) => ({ ...prev(data), ...extra });
        } else if (this.cfg.additionalData && typeof this.cfg.additionalData === 'object') {
            this.cfg.additionalData = { ...this.cfg.additionalData, ...extra };
        } else {
            this.cfg.additionalData = { ...extra };
        }
    }

    // ================= Internal =================

    _onExternalTrigger(e) {
        e.preventDefault();
        const trigger = e.currentTarget;
        this.submit({ trigger });
    }

    async _onFormSubmit(e) {
        e.preventDefault();

        // Reset field errors each submit
        this._resetErrors();

        const { body, isFormData, jsonSnapshot } = this._buildBody();
        const headers = this._buildHeaders(isFormData);
        const controller = new AbortController();

        // Hook: before
        try { this.cfg.onBeforeSubmit?.({ formData: isFormData ? body : null, json: isFormData ? null : jsonSnapshot }); } catch (err) { console.warn('onBeforeSubmit error:', err); }

        // Disable UI + loading
        const loadingText = this._t('loading');
        this._disableAll(loadingText);

        this._emit('submit:start', { controller });
        try { this.cfg.onSubmit?.({ controller }); } catch (err) { console.warn('onSubmit error:', err); }

        let ok = false; let response, data;

        try {
            ({ response, data } = await this._sendRequest({ body, headers, signal: controller.signal, isFormData }));
            ok = response.ok;

            if (ok) {
                this._emit('success', { response, data });
                try { this.cfg.onSuccess?.({ response, data }); } catch (err) { console.warn('onSuccess error:', err); }
                this._toast(this.cfg.successTitle || data?.message || this._t('success'), 'success');
                if (this.cfg.autoRedirect) {
                    const payload = data?.data ?? data; // Laravel style
                    const url = payload?.redirect || payload?.url;
                    if (url) window.location.assign(url);
                }
            } else {
                this._renderErrors(data);
                this._emit('error', { response, data });
                try { this.cfg.onError?.({ response, data }); } catch (err) { console.warn('onError error:', err); }
                this._toast(this.cfg.errorTitle || data?.message || this._t('unknownError'), 'error');
            }
        } catch (err) {
            console.error(err);
            this._renderGeneralError(this._t('networkError'));
            this._emit('error', { response: null, data: null, error: err });
            try { this.cfg.onError?.({ response: null, data: null, error: err }); } catch (e2) { console.warn('onError error:', e2); }
            this._toast(this._t('networkError'), 'error');
        } finally {
            // Only re-enable if not configured to keep disabled on success
            if (!(this.cfg.disableOnSuccess && ok)) {
                this._enableAll();
            }
            this._emit('submit:complete', { ok });
            try { this.cfg.onComplete?.({ ok }); } catch (err) { console.warn('onComplete error:', err); }
        }
    }

    _buildBody() {
        const formData = new FormData(this.form);

        // Merge additional data
        let extra = this.cfg.additionalData || null;
        if (typeof extra === 'function') extra = extra(Object.fromEntries(formData.entries())) || null;
        if (extra && typeof extra === 'object') {
            for (const [k, v] of Object.entries(extra)) this._appendToFormData(formData, k, v);
        }

        const hasFile = Array.from(this.form.querySelectorAll('input[type="file"]')).some(i => i.files && i.files.length > 0);
        const enctype = (this.form.getAttribute('enctype') || '').toLowerCase();

        if (hasFile || enctype.includes('multipart')) {
            return { body: formData, isFormData: true, jsonSnapshot: null };
        }

        const json = this._formDataToJSON(formData);
        return { body: JSON.stringify(json), isFormData: false, jsonSnapshot: json };
    }

    _appendToFormData(fd, key, val) {
        if (val === undefined) return;
        if (val === null) { fd.append(key, ''); return; }
        if (Array.isArray(val)) { for (const item of val) fd.append(this._ensureArrayKey(key), item); return; }
        if (typeof val === 'object') { for (const [k, v] of Object.entries(val)) this._appendToFormData(fd, `${key}[${k}]`, v); return; }
        fd.append(key, String(val));
    }

    _ensureArrayKey(key) { return key.endsWith('[]') ? key : `${key}[]`; }

    _formDataToJSON(fd) {
        const obj = {};
        for (const [k, v] of fd.entries()) this._assignDeep(obj, k, v);
        return obj;
    }

    _assignDeep(obj, path, value) {
        const parts = this._parsePath(path);
        let cur = obj;
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            const last = i === parts.length - 1;
            if (last) {
                if (p === '[]') {
                    if (!Array.isArray(cur)) throw new Error(`Path misuse at ${path}`);
                    cur.push(value);
                } else if (p.endsWith('[]')) {
                    const key = p.slice(0, -2);
                    if (!Array.isArray(cur[key])) cur[key] = [];
                    cur[key].push(value);
                } else {
                    cur[p] = value;
                }
            } else {
                if (p.endsWith('[]')) {
                    const key = p.slice(0, -2);
                    if (!Array.isArray(cur[key])) cur[key] = [];
                    if (cur[key].length === 0 || typeof cur[key][cur[key].length - 1] !== 'object') cur[key].push({});
                    cur = cur[key][cur.length - 1];
                } else {
                    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
                    cur = cur[p];
                }
            }
        }
    }

    _parsePath(path) {
        const parts = [];

        // Check if path ends with [] (array notation like tags[], categories[])
        const isArrayField = path.endsWith('[]');

        // Remove trailing [] temporarily for parsing
        let cleanPath = isArrayField ? path.slice(0, -2) : path;

        // Parse the path: field[nested][key] -> [field, nested, key]
        cleanPath.replace(/\]/g, '').split('[').forEach(p => {
            if (p) parts.push(p);
        });

        // If it was an array field, add [] to the last part
        if (isArrayField && parts.length > 0) {
            parts[parts.length - 1] = parts[parts.length - 1] + '[]';
        }

        return parts;
    }

    _buildHeaders(isFormData) {
        const headers = { ...(this.cfg.headers || {}) };

        // CSRF from meta or hidden input
        const csrf =
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
            this.form.querySelector('input[name="_token"]')?.value ||
            null;

        if (csrf) headers['X-CSRF-TOKEN'] = csrf;
        if (!isFormData) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        headers['Accept'] = headers['Accept'] || 'application/json';
        return headers;
    }

    async _sendRequest({ body, headers, signal, isFormData }) {
        const url = this.url;
        const method = this.method;
        const lib = (this.cfg.requestLib || 'fetch').toLowerCase();

        // axios path
        if (lib === 'axios' && window.axios) {
            const resp = await window.axios({
                url,
                method,
                data: isFormData ? body : JSON.parse(body || '{}'),
                headers,
                signal,
            }).catch(err => (err.response ? err.response : Promise.reject(err)));

            const ok = (resp.status >= 200 && resp.status < 300);
            const data = resp.data && typeof resp.data === 'object' ? resp.data : {};
            return { response: { ok, status: resp.status }, data };
        }

        // fetch path (default & axios fallback)
        if (window.fetch) {
            const resp = await fetch(url, { method, headers, body, signal, credentials: 'same-origin' });
            let data = null; try { data = await resp.json(); } catch { data = {}; }
            return { response: resp, data };
        }

        // xhr fallback
        const { response, data } = await this._xhr({ url, method, headers, body, isFormData, signal });
        return { response, data };
    }

    _xhr({ url, method, headers, body, isFormData, signal }) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), url, true);
            xhr.responseType = 'json';
            for (const [k, v] of Object.entries(headers || {})) xhr.setRequestHeader(k, v);
            xhr.onload = () => {
                const ok = xhr.status >= 200 && xhr.status < 300;
                resolve({ response: { ok, status: xhr.status }, data: xhr.response || {} });
            };
            xhr.onerror = () => reject(new Error('XHR network error'));
            if (signal) signal.addEventListener('abort', () => { try { xhr.abort(); } catch { } reject(new Error('Aborted')); });
            isFormData ? xhr.send(body) : xhr.send(body || null);
        });
    }

    _disableAll(loadingText) {
        this._disabledEls.clear();

        // Disable all form elements
        const elements = Array.from(this.form.querySelectorAll('input, select, textarea, button, a, [tabindex]'));
        const extra = (this.cfg.disableSelectors || []).flatMap(sel => Array.from(document.querySelectorAll(sel)));

        // Include the active trigger if present
        const setToDisable = new Set([...elements, ...extra, ...(this._activeTrigger ? [this._activeTrigger] : [])]);

        for (const el of setToDisable) {
            if (!(el instanceof HTMLElement)) continue;

            // Store previous state for restore
            if (!el.dataset._dsfDisabled) el.dataset._dsfDisabled = el.hasAttribute('disabled') ? '1' : '0';
            if (!el.dataset._dsfHTML) el.dataset._dsfHTML = el.innerHTML || '';

            // Disable
            if (el.tagName === 'A') {
                el.dataset._dsfHref = el.getAttribute('href') || '';
                el.setAttribute('href', 'javascript:void(0)');
                el.classList.add('pointer-events-none');
            }
            el.setAttribute('disabled', 'disabled');
            el.classList.add('disabled');

            this._disabledEls.add(el);
        }

        // Loading UI on the most relevant button/trigger
        const targetBtn =
            this._activeTrigger && this._isButtonLike(this._activeTrigger)
                ? this._activeTrigger
                : this.form.querySelector(this.cfg.primaryButtonSelector);

        if (targetBtn && targetBtn instanceof HTMLElement) {
            targetBtn.innerHTML = this._resolveTemplate(this.cfg.loadingTemplate, loadingText) ||
                `<span class="loading loading-bars loading-md"></span><span>${loadingText}</span>`;
        }
    }

    _enableAll() {
        const exclude = new Set((this.cfg.excludeEnableSelectors || [])
            .flatMap(sel => Array.from(document.querySelectorAll(sel))));

        for (const el of this._disabledEls) {
            if (!(el instanceof HTMLElement)) continue;
            if (exclude.has(el)) continue;

            // Restore href for <a>
            if (el.tagName === 'A') {
                if (el.dataset._dsfHref !== undefined) el.setAttribute('href', el.dataset._dsfHref);
                el.classList.remove('pointer-events-none');
            }

            // Restore disabled state only if we disabled it
            if (el.dataset._dsfDisabled === '0') {
                el.removeAttribute('disabled');
                el.classList.remove('disabled');
            } else {
                // It was already disabled before; keep it disabled
                el.classList.add('disabled');
            }

            // Restore innerHTML if we changed it
            if (el.dataset._dsfHTML !== undefined && this._isButtonLike(el)) {
                el.innerHTML = el.dataset._dsfHTML;
            }

            // Cleanup datasets
            delete el.dataset._dsfDisabled;
            delete el.dataset._dsfHTML;
            delete el.dataset._dsfHref;
        }

        this._disabledEls.clear();
        this._activeTrigger = null;
    }

    _isButtonLike(el) {
        if (!(el instanceof HTMLElement)) return false;
        const tag = el.tagName.toLowerCase();
        if (tag === 'button') return true;
        if (tag === 'a') return true;
        if (el.getAttribute('role') === 'button') return true;
        return false;
    }

    _resolveTemplate(tpl, text) {
        if (!tpl) return '';
        if (typeof tpl === 'function') return tpl(text);
        if (typeof tpl === 'string') {
            if (tpl.trim().startsWith('#')) {
                const node = document.querySelector(tpl);
                return node ? node.innerHTML : '';
            }
            return tpl; // raw HTML
        }
        return '';
    }

    _resetErrors() {
        const spans = this.form.querySelectorAll('.form-error[data-input]');
        for (const s of spans) {
            s.textContent = '';
            s.classList.add('hidden');
        }
        const summary = this.form.querySelector('.form-error-summary');
        if (summary) {
            summary.textContent = '';
            summary.classList.add('hidden');
        }
    }

    _renderErrors(payload) {
        if (!payload || typeof payload !== 'object') return;
        const errors = payload.errors || {};
        const message = payload.message || this.cfg.errorTitle || this._t('unknownError');

        // Show per-field
        for (const [key, arr] of Object.entries(errors)) {
            const text = Array.isArray(arr) ? arr[0] : String(arr);
            this._showErrorForKey(key, text);
        }

        // If no per-field target(s) found, show a summary (optional)
        if (Object.keys(errors).length === 0) {
            this._renderGeneralError(message);
        }
    }

    _showErrorForKey(key, text) {
        // Accept both dot and bracket notations
        const variants = new Set([
            key,
            key.replace(/\./g, '[') + ']',
            key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, ''),
        ]);
        let shown = false;
        for (const v of variants) {
            const span = this.form.querySelector(`.form-error[data-input="${CSS.escape(v)}"]`);
            if (span) {
                span.textContent = text;
                span.classList.remove('hidden');
                shown = true;
            }
        }
        if (!shown) {
            const control = this.form.querySelector(`[name="${CSS.escape(key)}"]`) ||
                this.form.querySelector(`[name="${CSS.escape(key.replace(/\./g, '[') + ']')}"]`);
            if (control) {
                let span = control.closest('label, .form-control, .form-group, div')?.querySelector('.form-error');
                if (!span) {
                    span = document.createElement('span');
                    span.className = 'form-error text-error text-sm';
                    control.insertAdjacentElement('afterend', span);
                }
                span.textContent = text;
                span.classList.remove('hidden');
            }
        }
    }

    _renderGeneralError(msg) {
        const summary = this.form.querySelector('.form-error-summary');
        if (summary) {
            summary.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">\n' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />\n' +
                '</svg>' + msg;
            summary.classList.remove('hidden');
        } else {
            // Updated to use DSAlert instead of native alert
            DSAlert.fire({
                title: this._t('error'),
                text: msg,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    _emit(event, detail = {}) {
        // Call registered handlers
        (this._listeners[event] || new Set()).forEach(fn => { try { fn(detail); } catch (err) { console.warn(err); } });
        // Mirror as DOM CustomEvent on the form element
        this.form.dispatchEvent(new CustomEvent(`smartform:${event}`, { bubbles: true, detail }));
    }

    _t(key) {
        return (this.cfg.translations && this.cfg.translations[key]) || DSForm._defaults.translations[key] || key;
    }

    /** Toast helper using DSAlert */
    _toast(message, type = 'info') {
        if (!this.cfg.toast?.enabled) return;

        const msg = message || (type === 'success' ? this._t('success') : this._t('error'));

        // Map DSForm toast config to DSAlert config
        DSAlert.fire({
            toast: true,
            icon: type,
            title: msg,
            position: this.cfg.toast.position || 'top-end',
            showConfirmButton: false,
            timer: this.cfg.toast.timer || 3000,
            timerProgressBar: this.cfg.toast.timerProgressBar ?? true,
        });
    }

    static _defaults = {
        translations: {
            loading: 'Loading...',
            networkError: 'Network error.',
            unknownError: 'Something went wrong.',
            success: 'Success!',
            error: 'There was a problem.',
        },
    };
}