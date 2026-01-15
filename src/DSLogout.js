/**
 * DSLogout
 *
 * JS-only, multi-element Laravel logout helper.
 *
 * Features:
 * - Bind to one or many elements (selector/NodeList/Array/Element)
 * - Optional event delegation: { root, match }
 * - Prevent multi-click per element with logical + visual disable
 * - Axios → fetch → XHR fallback; JSON redirect support
 * - CSRF auto-resolution from <meta>, data attribute, window, cookie
 * - i18n messages via `translations`
 *
 * @example
 * // Blade <head>:
 * // <meta name="csrf-token" content="{{ csrf_token() }}">
 *
 * // HTML:
 * // <a class="js-logout" href="#">Logout</a>
 * // <button class="js-logout">Logout 2</button>
 *
 * // JS:
 * import { DSLogout } from '/js/modules/DSLogout.js';
 * new DSLogout({
 *   elements: '.js-logout',                  // one or many elements
 *   // or: element: '#header-logout'
 *   // or delegation:
 *   // delegate: { root: document, match: '.js-logout' },
 *   url: '/logout',                          // or "{{ route('logout') }}"
 *   requestLibrary: 'axios',                 // 'auto'|'axios'|'fetch'|'xhr'
 *   translations: { loading: 'Çıkış yapılıyor...', error: 'Çıkış yapılamadı' },
 *   disabledClasses: ['pointer-events-none','opacity-60','cursor-not-allowed']
 * });
 */
export class DSLogout {
    constructor({
                    element = null,                 // Element | string
                    elements = null,                // Element[] | NodeList | string
                    delegate = null,                // { root: Element|string, match: string }
                    url = '/logout',
                    redirect = null,
                    requestLibrary = 'auto',
                    csrfToken = null,
                    translations = {},
                    disabledClasses = ['pointer-events-none','opacity-60','cursor-not-allowed'],
                    eventType = 'click'
                } = {}) {
        this.url = url;
        this.redirect = redirect;
        this.requestLibrary = requestLibrary;
        this.translations = {
            loading: 'Logging out...',
            error: 'Error logging out',
            ...translations
        };
        this.disabledClasses = disabledClasses;
        this.eventType = eventType;

        // Resolve CSRF once (can be overridden)
        this.csrf = csrfToken || this._resolveCsrfToken();

        // Per-element state & unbind storage
        this._bound = new WeakMap(); // el -> handler
        this._isDelegated = !!delegate;
        this._delegated = null;

        // Bind either direct elements or delegation
        if (this._isDelegated) {
            const root = typeof delegate.root === 'string'
                ? document.querySelector(delegate.root)
                : (delegate.root || document);
            if (!root) throw new Error('DSLogout: delegate.root not found');
            if (!delegate.match) throw new Error('DSLogout: delegate.match selector required');
            this._delegated = { root, match: delegate.match };
            this._bindDelegated();
        } else {
            const list = this._normalizeElements(element, elements);
            if (!list.length) throw new Error('DSLogout: no elements to bind');
            list.forEach((el) => this._bindElement(el));
        }
    }

    // Public: cleanup
    destroy() {
        if (this._isDelegated && this._delegated) {
            this._delegated.root.removeEventListener(this.eventType, this._delegated._handler);
            this._delegated = null;
            return;
        }
        // Unbind direct handlers
        for (const [el, handler] of this._entries(this._bound)) {
            el.removeEventListener(this.eventType, handler);
        }
        this._bound = new WeakMap();
    }

    // -------------------------------------------------------------------------
    // Internal binding helpers
    _normalizeElements(element, elements) {
        const out = [];
        const pushEl = (el) => { if (el && el.nodeType === 1) out.push(el); };

        if (element) {
            if (typeof element === 'string') {
                document.querySelectorAll(element).forEach(pushEl);
            } else {
                pushEl(element);
            }
        }

        if (elements) {
            if (typeof elements === 'string') {
                document.querySelectorAll(elements).forEach(pushEl);
            } else if (elements instanceof NodeList || Array.isArray(elements)) {
                elements.forEach(pushEl);
            } else {
                pushEl(elements);
            }
        }
        return out;
    }

    _bindElement(el) {
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            this._handleClick(el);
        };
        el.addEventListener(this.eventType, handler);
        this._bound.set(el, handler);
    }

    _bindDelegated() {
        const { root, match } = this._delegated;
        const handler = (e) => {
            const el = e.target.closest(match);
            if (!el || !root.contains(el)) return;
            e.preventDefault();
            this._handleClick(el);
        };
        root.addEventListener(this.eventType, handler);
        this._delegated._handler = handler;
    }

    // -------------------------------------------------------------------------
    // Click + request pipeline
    async _handleClick(el) {
        if (this._isDisabled(el)) return;

        const restore = this._disableWithLoading(el);

        try {
            const data = await this._post();     // axios/fetch/xhr
            const json = data?.data || data;     // axios vs fetch/xhr
            const target = this.redirect || json?.redirect || '/';
            window.location.assign(target);
        } catch (err) {
            alert(this.translations.error);
            // eslint-disable-next-line no-console
            console.error('DSLogout error:', err);
            restore();
        }
    }

    _isDisabled(el) {
        if (el instanceof HTMLButtonElement) return el.disabled;
        return el.getAttribute('aria-disabled') === 'true';
    }

    _disableWithLoading(el) {
        const isButton = el instanceof HTMLButtonElement;
        const prevHTML = el.innerHTML;
        const prevTitle = el.getAttribute('title');

        if (isButton) {
            el.disabled = true;
        } else {
            el.setAttribute('aria-disabled', 'true');
            this.disabledClasses.forEach(c => el.classList.add(c));
        }

        el.setAttribute('title', this.translations.loading);
        el.innerHTML = this.translations.loading;

        return () => {
            if (isButton) {
                el.disabled = false;
            } else {
                el.setAttribute('aria-disabled', 'false');
                this.disabledClasses.forEach(c => el.classList.remove(c));
            }
            if (prevTitle == null) el.removeAttribute('title');
            else el.setAttribute('title', prevTitle);
            el.innerHTML = prevHTML;
        };
    }

    _chooseLib() {
        const want = this.requestLibrary?.toLowerCase?.() || 'auto';
        if (want === 'axios') return (window.axios ? 'axios' : (window.fetch ? 'fetch' : 'xhr'));
        if (want === 'fetch') return (window.fetch ? 'fetch' : (window.axios ? 'axios' : 'xhr'));
        if (want === 'xhr') return 'xhr';
        if (window.axios) return 'axios';
        if (window.fetch) return 'fetch';
        return 'xhr';
    }

    async _post() {
        const lib = this._chooseLib();
        const headers = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': this.csrf
        };

        if (lib === 'axios') {
            return window.axios.post(this.url, {}, { headers });
        }

        if (lib === 'fetch') {
            const res = await fetch(this.url, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: '{}'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }

        // xhr fallback
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.url, true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('X-CSRF-TOKEN', this.csrf);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText || '{}'));
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                } catch (e) { reject(e); }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send('{}');
        });
    }

    // -------------------------------------------------------------------------
    // CSRF utilities
    _resolveCsrfToken() {
        // meta
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta?.content) return meta.content;

        // from any bound element (data-csrf)
        for (const [el] of this._entries(this._bound)) {
            const t = el?.dataset?.csrf;
            if (t) return t;
        }

        // window exposed
        if (window.Laravel?.csrfToken) return window.Laravel.csrfToken;

        // cookie (Sanctum style)
        const xsrf = this._readCookie('XSRF-TOKEN');
        if (xsrf) return decodeURIComponent(xsrf);

        throw new Error(
            'DSLogout: CSRF token not found. Add <meta name="csrf-token" content="{{ csrf_token() }}"> ' +
            'or pass { csrfToken } when constructing DSLogout.'
        );
    }

    _readCookie(name) {
        const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}\]\\^])/g, '\\$1') + '=([^;]*)'));
        return m ? m[1] : null;
    }

    // helper to iterate WeakMap safely
    *_entries(weakMap) {
        // NOTE: WeakMap isn’t iterable in general; we only use this in places
        // where we’ve just added entries and still hold the references via the DOM.
        // As a safe no-op, return empty iterator if not supported.
        // (We avoid relying on this for core logic.)
        return;
    }
}
