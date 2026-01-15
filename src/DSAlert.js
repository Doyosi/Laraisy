/**
 * DSAlert (Class-based)
 * A lightweight, native JavaScript alert/toast system using Tailwind CSS.
 * API designed to mimic SweetAlert2 for easy migration.
 *
 * Usage:
 * import { DSAlert } from './DSAlert.js';
 * DSAlert.fire({ title: 'Hello', icon: 'success' });
 * // OR shorthand
 * DSAlert.fire('Deleted!', 'Your file has been deleted.', 'success');
 */

export class DSAlert {
    /**
     * Default Icons - Can be overridden by modifying DSAlert.icons
     */
    static icons = {
        success: `<svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
        error: `<svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`,
        warning: `<svg class="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" /></svg>`,
        info: `<svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
        question: `<svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>`
    };

    /**
     * Default defaults
     */
    static defaults = {
        title: '',
        text: '',
        html: '',
        icon: '',
        toast: false,
        position: 'top-end',
        timer: 0,
        timerProgressBar: false,
        showConfirmButton: true,
        showCancelButton: false,
        showCloseButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        confirmButtonColor: 'btn btn-sm btn-primary',
        cancelButtonColor: 'btn btn-sm btn-soft btn-neutral',
        buttonsAlign: 'end', // 'start' | 'center' | 'end'
        backdrop: true,
    };

    constructor(...args) {
        this.config = this._parseArgs(args);
        this.domElement = null;
        this.container = null;
    }

    /**
     * Static helper to fire the alert immediately
     * @param  {...any} args - Options object OR (title, text, icon)
     * @returns {Promise}
     */
    static fire(...args) {
        const instance = new DSAlert(...args);
        return instance.fire();
    }

    /**
     * Triggers the alert/toast
     * @returns {Promise}
     */
    fire() {
        return new Promise((resolve) => {
            if (this.config.toast) {
                this._initToast(resolve);
            } else {
                this._initModal(resolve);
            }
        });
    }

    /**
     * Parse constructor arguments to support shorthand (Title, Text, Icon)
     */
    _parseArgs(args) {
        let userConfig = {};

        // Handle: fire('Title', 'Text', 'success')
        if (typeof args[0] === 'string') {
            userConfig.title = args[0];
            if (args[1]) userConfig.text = args[1];
            if (args[2]) userConfig.icon = args[2];
        }
        // Handle: fire({ ...options })
        else if (typeof args[0] === 'object' && args[0] !== null) {
            userConfig = args[0];
        }

        return { ...DSAlert.defaults, ...userConfig };
    }

    /* ================= TOAST LOGIC ================= */

    _initToast(resolve) {
        this.container = this._ensureToastContainer();
        this.domElement = document.createElement('div');

        // Base classes
        // Replaced 'w-full' with 'w-80' (20rem/320px) to prevent collapse in centered containers
        // Added 'relative' to support absolute positioning of progress bar
        this.domElement.className = `ds-alert-toast pointer-events-auto w-80 max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transform transition-all duration-300 translate-x-10 opacity-0 relative`;

        const iconHtml = DSAlert.icons[this.config.icon] || '';
        const contentHtml = this.config.html || `<p class="mt-1 text-sm text-gray-500">${this.config.text}</p>`;
        const titleHtml = this.config.title ? `<p class="text-sm font-medium text-gray-900">${this.config.title}</p>` : '';

        // Close Button (Conditional)
        const closeBtnHtml = this.config.showCloseButton
            ? `<div class="ml-4 flex flex-shrink-0">
                <button type="button" class="ds-close-btn inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span class="sr-only">Close</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
               </div>`
            : '';

        // Progress Bar
        const progressBarHtml = (this.config.timer && this.config.timerProgressBar)
            ? `<div class="ds-progress-bar absolute bottom-0 left-0 h-1 bg-blue-500 z-10" style="width: 100%;"></div>`
            : '';

        this.domElement.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">${iconHtml}</div>
                    <div class="ml-3 w-0 flex-1 pt-0.5">
                        ${titleHtml}
                        ${contentHtml}
                    </div>
                    ${closeBtnHtml}
                </div>
            </div>
            ${progressBarHtml}
        `;

        // Append and animate
        this.container.appendChild(this.domElement);
        requestAnimationFrame(() => {
            this.domElement.classList.remove('translate-x-10', 'opacity-0');

            // Animate progress bar
            if (this.config.timer && this.config.timerProgressBar) {
                const bar = this.domElement.querySelector('.ds-progress-bar');
                if (bar) {
                    bar.style.transition = `width ${this.config.timer}ms linear`;
                    bar.style.width = '0%';
                }
            }
        });

        // Close handlers
        const closeFn = () => this._closeToast(resolve);
        const closeBtn = this.domElement.querySelector('.ds-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeFn);
        }

        if (this.config.timer) {
            setTimeout(closeFn, this.config.timer);
        }
    }

    _closeToast(resolve) {
        if (!this.domElement) return;

        this.domElement.classList.add('opacity-0', 'scale-95'); // Exit animation
        setTimeout(() => {
            if (this.domElement && this.domElement.parentElement) {
                this.domElement.parentElement.removeChild(this.domElement);
            }
            // Cleanup container if empty
            if (this.container && this.container.children.length === 0) {
                this.container.remove();
            }
        }, 300);

        resolve({ isDismissed: true });
    }

    _ensureToastContainer() {
        const posClass = this._getToastPositionClass(this.config.position);
        let container = document.querySelector(`.ds-toast-container.${this.config.position}`);

        if (!container) {
            container = document.createElement('div');
            container.className = `ds-toast-container ${this.config.position} fixed z-[9999] pointer-events-none p-4 gap-3 flex flex-col ${posClass}`;
            document.body.appendChild(container);
        }
        return container;
    }

    _getToastPositionClass(pos) {
        switch (pos) {
            case 'top-start': return 'top-0 left-0 items-start';
            case 'top-center': return 'top-0 left-1/2 -translate-x-1/2 items-center';
            case 'top-end': return 'top-0 right-0 items-end';
            case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center';
            case 'bottom-start': return 'bottom-0 left-0 items-start flex-col-reverse';
            case 'bottom-center': return 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse';
            case 'bottom-end': return 'bottom-0 right-0 items-end flex-col-reverse';
            default: return 'top-0 right-0 items-end';
        }
    }

    /* ================= MODAL LOGIC ================= */

    _initModal(resolve) {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = `ds-modal-overlay fixed inset-0 z-[10000] bg-gray-500/75 transition-opacity opacity-0`;
        if (!this.config.backdrop) overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none';

        // Panel
        // Fix: Added z-[10001] to sit on top of the overlay
        const panel = document.createElement('div');
        panel.className = `ds-modal-panel pointer-events-auto relative z-[10001] transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg scale-95 opacity-0`;

        const iconColor = this._getIconColorName(this.config.icon);
        const iconHtml = this.config.icon ?
            `<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-${iconColor}-100">
                ${DSAlert.icons[this.config.icon]}
            </div>` : '';

        // Buttons
        let buttonsHtml = '';
        if (this.config.showCancelButton) {
            // Note: Classes are appended. If config provided full class string, it works.
            // If just "btn-soft", we might need default "btn".
            // But we changed defaults to include "btn".
            buttonsHtml += `<button type="button" class="ds-cancel-btn ${this.config.cancelButtonColor}">${this.config.cancelButtonText}</button>`;
        }
        if (this.config.showConfirmButton) {
            buttonsHtml += `<button type="button" class="ds-confirm-btn ${this.config.confirmButtonColor}">${this.config.confirmButtonText}</button>`;
        }

        // Close Button (Modal Top Right) - Moved to prevent overlapping by content
        const closeBtnHtml = this.config.showCloseButton ?
            `<button type="button" class="ds-modal-close-btn absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-500 focus:outline-none transition-colors">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>` : '';

        // Progress Bar
        const progressBarHtml = (this.config.timer && this.config.timerProgressBar)
            ? `<div class="ds-progress-bar absolute bottom-0 left-0 h-1 bg-blue-500 z-20" style="width: 100%;"></div>`
            : '';

        // Map alignment to class
        const justifyClass = {
            'start': 'justify-start',
            'center': 'justify-center',
            'end': 'justify-end'
        }[this.config.buttonsAlign] || 'justify-end';

        // Updated Layout: Icon + Title row, then content
        const contentHtml = `
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                         ${iconHtml}
                         <h3 class="text-lg font-bold text-gray-900" id="modal-title">${this.config.title}</h3>
                    </div>
                    <div class="text-sm text-gray-500 ml-1">
                        ${this.config.html || this.config.text}
                    </div>
                </div>
            </div>
            ${closeBtnHtml}
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row gap-1 ${justifyClass} sm:px-6">
                ${buttonsHtml}
            </div>
            ${progressBarHtml}
        `;

        panel.innerHTML = contentHtml;

        // Wrapper
        this.domElement = document.createElement('div');
        this.domElement.className = 'fixed inset-0 z-[10000] flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0';
        this.domElement.appendChild(overlay);
        this.domElement.appendChild(panel);
        document.body.appendChild(this.domElement);

        // Animate In
        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            panel.classList.remove('scale-95', 'opacity-0');

            // Animate progress bar
            if (this.config.timer && this.config.timerProgressBar) {
                const bar = panel.querySelector('.ds-progress-bar');
                if (bar) {
                    bar.style.transition = `width ${this.config.timer}ms linear`;
                    bar.style.width = '0%';
                }
            }
        });

        // Close Helper - Cleans up listeners
        const close = (result) => {
            document.removeEventListener('keydown', keydownHandler);
            overlay.classList.add('opacity-0');
            panel.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                this.domElement.remove();
                resolve(result);
            }, 200);
        };

        // Escape Key Handler
        const keydownHandler = (e) => {
            if (e.key === 'Escape' && this.config.allowEscapeKey) {
                close({ isDismissed: true });
            }
        };
        document.addEventListener('keydown', keydownHandler);

        // Bind Events
        const confirmBtn = panel.querySelector('.ds-confirm-btn');
        const cancelBtn = panel.querySelector('.ds-cancel-btn');
        const closeBtn = panel.querySelector('.ds-modal-close-btn');

        if (confirmBtn) confirmBtn.addEventListener('click', () => close({ isConfirmed: true, isDismissed: false }));
        if (cancelBtn) cancelBtn.addEventListener('click', () => close({ isConfirmed: false, isDismissed: true }));
        if (closeBtn) closeBtn.addEventListener('click', () => close({ isDismissed: true }));

        // Backdrop Click logic
        if (this.config.backdrop && this.config.allowOutsideClick) {
            overlay.addEventListener('click', () => close({ isConfirmed: false, isDismissed: true }));
        }

        // Timer Logic
        if (this.config.timer) {
            setTimeout(() => close({ isDismissed: true, timer: true }), this.config.timer);
        }
    }

    _getIconColorName(iconType) {
        const map = { success: 'green', error: 'red', warning: 'yellow', info: 'blue', question: 'gray' };
        return map[iconType] || 'gray';
    }
}