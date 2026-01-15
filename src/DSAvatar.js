import { DSAlert } from './DSAlert.js';

/**
 * DSAvatar
 *
 * Handles avatar file uploads and resets via AJAX.
 * - Integrates with DSAlert for notifications.
 * - Manages loading states and UI updates.
 * - Uses Laravel-style CSRF protection.
 */
export class DSAvatar {


    /**
     * @param {string|HTMLElement} selector - The .avatar-uploader wrapper
     * @param {Object} config - Configuration overrides
     */
    constructor(selector, config = {}) {
        this.wrapper = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.wrapper) throw new Error('DSAvatar: Wrapper not found.');

        this.cfg = {
            headers: {},
            ...config
        };

        // Cache elements
        this.img = this.wrapper.querySelector('[data-ds-avatar-img]');
        this.input = this.wrapper.querySelector('[data-ds-avatar-input]');
        this.loadingOverlay = this.wrapper.querySelector('[data-ds-avatar-loading]');
        this.triggerBtn = this.wrapper.querySelector('[data-ds-avatar-action="trigger-upload"]');
        this.removeBtn = this.wrapper.querySelector('[data-ds-avatar-action="trigger-remove"]');

        // Data attributes
        this.uploadUrl = this.wrapper.dataset.uploadUrl;
        this.removeUrl = this.wrapper.dataset.removeUrl;
        this.inputName = this.wrapper.dataset.name;

        // State backup for error reversion
        this._backupSrc = this.img ? this.img.src : '';

        this.bind();
        this.initTooltips();
    }

    initTooltips() {
        if (window.tippy) {
            if (this.triggerBtn) window.tippy(this.triggerBtn);
            if (this.removeBtn) window.tippy(this.removeBtn);
        }
    }

    bind() {
        // Trigger file input click
        if (this.triggerBtn) {
            this.triggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.input.click();
            });
        }

        // Handle file selection
        if (this.input) {
            this.input.addEventListener('change', (e) => this._handleFileSelect(e));
        }

        // Handle remove/reset
        if (this.removeBtn) {
            this.removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._handleRemove();
            });
        }
    }

    /**
     * Upload Process
     */
    async _handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!this.uploadUrl) {
            console.warn('DSAvatar: No upload URL provided.');
            return;
        }

        // 1. Show loading
        this._toggleLoading(true);

        // 2. Prepare Data
        const formData = new FormData();
        formData.append(this.inputName, file);
        // Append _method if needed, usually POST for upload

        try {
            const { response, data } = await this._sendRequest(this.uploadUrl, 'POST', formData);

            if (response.ok) {
                // Success: Update Image & Toast
                if (data.url) this.img.src = data.url;
                this._backupSrc = data.url; // Update backup on success
                this.input.value = ''; // Clear input to allow re-uploading same file
                this._toast(data.message || 'Avatar updated successfully', 'success');
            } else {
                // Server Error
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err) {
            // Error: Revert & Toast
            console.error(err);
            this.img.src = this._backupSrc;
            this.input.value = '';
            this._toast(err.message || 'Network error occurred', 'error');
        } finally {
            this._toggleLoading(false);
        }
    }

    /**
     * Remove/Reset Process
     */
    async _handleRemove() {
        if (!this.removeUrl) return;

        // Confirm dialog (Optional, but good UX)
        /*
        const confirmed = confirm('Reset avatar to default?');
        if (!confirmed) return; 
        */

        this._toggleLoading(true);

        try {
            // Usually DELETE or POST with _method=DELETE
            const formData = new FormData();
            formData.append('_method', 'DELETE');

            const { response, data } = await this._sendRequest(this.removeUrl, 'POST', formData);

            if (response.ok) {
                if (data.url) this.img.src = data.url; // Server usually returns the default placeholder URL
                this._backupSrc = this.img.src;
                this._toast(data.message || 'Avatar reset successfully', 'success');
            } else {
                throw new Error(data.message || 'Reset failed');
            }
        } catch (err) {
            console.error(err);
            this._toast(err.message || 'Could not reset avatar', 'error');
        } finally {
            this._toggleLoading(false);
        }
    }

    /**
     * Shared Request Logic (mirrors DSForm)
     */
    async _sendRequest(url, method, body) {
        const headers = {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            ...this.cfg.headers
        };

        const resp = await fetch(url, {
            method: method,
            headers: headers,
            body: body
        });

        let data = {};
        try {
            data = await resp.json();
        } catch (e) { /* ignore non-json */ }

        return { response: resp, data };
    }

    _toggleLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
            if (this.triggerBtn) this.triggerBtn.disabled = true;
            if (this.removeBtn) this.removeBtn.disabled = true;
        } else {
            this.loadingOverlay.classList.add('hidden');
            if (this.triggerBtn) this.triggerBtn.disabled = false;
            if (this.removeBtn) this.removeBtn.disabled = false;
        }
    }

    _toast(message, type = 'info') {
        if (typeof DSAlert !== 'undefined') {
            DSAlert.fire({
                toast: true,
                icon: type,
                title: message,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        } else {
            // Fallback if DSAlert is missing
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}