/**
 * DSSimpleSlider
 * 
 * A flexible, customizable slider plugin supporting multiple data sources
 * (ajax, json, html) with auto-play, hover pause, and timer border animation.
 * 
 * @example
 * // AJAX Mode
 * const slider = new DSSimpleSlider('#premiumSlider', {
 *     source: 'ajax',
 *     ajax_url: '/api/featured-domains',
 *     ajax_method: 'GET',
 *     autoPlay: true,
 *     interval: 5000,
 *     pauseOnHover: true
 * });
 * 
 * // JSON Mode
 * const slider = new DSSimpleSlider('#slider', {
 *     source: 'json',
 *     data: [
 *         { title: 'crypto.com', subtitle: '$12,000' },
 *         { title: 'ai.io', subtitle: '$8,500' }
 *     ]
 * });
 * 
 * // HTML Mode (reads existing content)
 * const slider = new DSSimpleSlider('#slider', { source: 'html' });
 */
class DSSimpleSlider {
    static defaults = {
        // Data source: 'ajax', 'json', 'html'
        source: 'json',

        // AJAX settings
        ajax_url: null,
        ajax_method: 'GET',
        ajax_data: {},
        ajax_function: 'axios', // 'axios', 'fetch', 'xhr'

        // JSON data (for source: 'json')
        data: [],

        // Data mapping (how to extract title/subtitle from data)
        dataMap: {
            title: 'title',      // property name for title
            subtitle: 'subtitle', // property name for subtitle
            url: 'url'           // property name for link URL (optional)
        },

        // Auto-play settings
        autoPlay: true,
        interval: 5000,          // ms between slides
        pauseOnHover: true,

        // Timer border animation
        showTimerBorder: true,   // set to false to disable
        timerBorderSelector: '.ds-slider-badge', // element to animate border
        timerBorderColor: 'rgba(251, 191, 36, 1)', // amber-400
        timerBorderWidth: 2,

        // Navigation buttons
        showPrevButton: true,
        showNextButton: true,
        prevButtonSelector: '.ds-slider-prev',
        nextButtonSelector: '.ds-slider-next',

        // Content selectors
        contentSelector: '.ds-slider-content',
        titleSelector: '.ds-slider-title',
        subtitleSelector: '.ds-slider-subtitle',

        // Disabled state
        disabledClass: 'opacity-50 pointer-events-none',

        // Animation
        fadeClass: 'transition-opacity duration-300',

        // Callbacks
        onSlideChange: null,
        onDataLoad: null,
        onEmpty: null
    };

    constructor(wrapper, options = {}) {
        this.wrapper = typeof wrapper === 'string' ? document.querySelector(wrapper) : wrapper;
        if (!this.wrapper) {
            console.warn('DSSimpleSlider: Wrapper element not found');
            return;
        }

        this.config = { ...DSSimpleSlider.defaults, ...options };
        this.slides = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.timer = null;
        this.timerAnimation = null;

        this._init();
    }

    async _init() {
        this._cacheElements();
        await this._loadData();
        this._bindEvents();

        if (this.slides.length > 0) {
            this._render();
            if (this.config.autoPlay) {
                this.play();
            }
        } else {
            this._handleEmpty();
        }
    }

    _cacheElements() {
        this.contentEl = this.wrapper.querySelector(this.config.contentSelector);
        this.titleEl = this.wrapper.querySelector(this.config.titleSelector);
        this.subtitleEl = this.wrapper.querySelector(this.config.subtitleSelector);
        this.prevBtn = this.wrapper.querySelector(this.config.prevButtonSelector);
        this.nextBtn = this.wrapper.querySelector(this.config.nextButtonSelector);
        this.badgeEl = this.wrapper.querySelector(this.config.timerBorderSelector);
    }

    async _loadData() {
        try {
            switch (this.config.source) {
                case 'ajax':
                    await this._loadFromAjax();
                    break;
                case 'json':
                    this.slides = this.config.data || [];
                    break;
                case 'html':
                    this._loadFromHtml();
                    break;
                default:
                    this.slides = [];
            }

            if (this.config.onDataLoad) {
                this.config.onDataLoad(this.slides);
            }
        } catch (error) {
            console.error('DSSimpleSlider: Error loading data', error);
            this.slides = [];
        }
    }

    async _loadFromAjax() {
        const { ajax_url, ajax_method, ajax_data, ajax_function } = this.config;

        if (!ajax_url) {
            console.warn('DSSimpleSlider: ajax_url is required for ajax source');
            return;
        }

        try {
            let response;

            if (ajax_function === 'axios' && window.axios) {
                response = await window.axios({
                    method: ajax_method,
                    url: ajax_url,
                    params: ajax_method === 'GET' ? ajax_data : undefined,
                    data: ajax_method !== 'GET' ? ajax_data : undefined
                });
                this.slides = response.data?.data || response.data || [];
            } else if (ajax_function === 'fetch' || window.fetch) {
                const queryString = new URLSearchParams(ajax_data).toString();
                const fetchUrl = ajax_method === 'GET' && queryString ? `${ajax_url}?${queryString}` : ajax_url;
                const options = {
                    method: ajax_method,
                    headers: { 'Accept': 'application/json' }
                };
                if (ajax_method !== 'GET') {
                    options.headers['Content-Type'] = 'application/json';
                    options.body = JSON.stringify(ajax_data);
                }
                const res = await fetch(fetchUrl, options);
                const json = await res.json();
                this.slides = json?.data || json || [];
            } else {
                // XHR fallback
                this.slides = await this._loadFromXhr();
            }
        } catch (error) {
            console.error('DSSimpleSlider: AJAX error', error);
            this.slides = [];
        }
    }

    _loadFromXhr() {
        return new Promise((resolve, reject) => {
            const { ajax_url, ajax_method, ajax_data } = this.config;
            const xhr = new XMLHttpRequest();

            let url = ajax_url;
            if (ajax_method === 'GET' && Object.keys(ajax_data).length) {
                url += '?' + new URLSearchParams(ajax_data).toString();
            }

            xhr.open(ajax_method, url, true);
            xhr.setRequestHeader('Accept', 'application/json');

            if (ajax_method !== 'GET') {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        resolve(json?.data || json || []);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(ajax_method !== 'GET' ? JSON.stringify(ajax_data) : null);
        });
    }

    _loadFromHtml() {
        // Read existing content as the first slide
        if (this.titleEl && this.subtitleEl) {
            const title = this.titleEl.textContent.trim();
            const subtitle = this.subtitleEl.textContent.trim();
            if (title) {
                this.slides = [{ title, subtitle }];
            }
        }
    }

    _bindEvents() {
        // Navigation buttons
        if (this.prevBtn && this.config.showPrevButton) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prev();
            });
        }

        if (this.nextBtn && this.config.showNextButton) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.next();
            });
        }

        // Hover pause
        if (this.config.pauseOnHover) {
            this.wrapper.addEventListener('mouseenter', () => this.pause());
            this.wrapper.addEventListener('mouseleave', () => this.resume());
        }
    }

    _render() {
        const slide = this.slides[this.currentIndex];
        if (!slide) return;

        const { dataMap } = this.config;
        const title = this._getNestedValue(slide, dataMap.title) || '';
        const subtitle = this._getNestedValue(slide, dataMap.subtitle) || '';
        const url = this._getNestedValue(slide, dataMap.url) || null;

        // Apply fade effect
        if (this.contentEl) {
            this.contentEl.classList.add('opacity-0');

            setTimeout(() => {
                if (this.titleEl) this.titleEl.textContent = title;
                if (this.subtitleEl) this.subtitleEl.textContent = subtitle;

                // Handle URL wrapping
                if (url && this.contentEl) {
                    this.contentEl.style.cursor = 'pointer';
                    this.contentEl.onclick = () => window.location.href = url;

                    // Also update any <a> inside (e.g. .ds-slider-link) or if the contentEl itself is an <a>
                    const linkEl = this.contentEl.tagName.toLowerCase() === 'a' ? this.contentEl : (this.contentEl.querySelector('a.ds-slider-link') || this.contentEl.querySelector('a'));
                    if (linkEl) {
                        linkEl.href = url;
                    }
                } else if (this.contentEl) {
                    this.contentEl.style.cursor = 'default';
                    this.contentEl.onclick = null;

                    const linkEl = this.contentEl.querySelector('a.ds-slider-link') || this.contentEl.querySelector('a');
                    if (linkEl) {
                        linkEl.href = '#';
                    }
                }

                this.contentEl.classList.remove('opacity-0');
            }, 150);
        } else {
            if (this.titleEl) this.titleEl.textContent = title;
            if (this.subtitleEl) this.subtitleEl.textContent = subtitle;
        }

        // Callback
        if (this.config.onSlideChange) {
            this.config.onSlideChange(slide, this.currentIndex, this.slides.length);
        }

        // Emit event
        this.wrapper.dispatchEvent(new CustomEvent('dsslider:change', {
            detail: { slide, index: this.currentIndex, total: this.slides.length }
        }));
    }

    _handleEmpty() {
        // Disable buttons
        if (this.prevBtn) {
            this.prevBtn.classList.add(...this.config.disabledClass.split(' '));
            this.prevBtn.disabled = true;
        }
        if (this.nextBtn) {
            this.nextBtn.classList.add(...this.config.disabledClass.split(' '));
            this.nextBtn.disabled = true;
        }

        // Clear content
        if (this.titleEl) this.titleEl.textContent = '';
        if (this.subtitleEl) this.subtitleEl.textContent = '';

        // Callback
        if (this.config.onEmpty) {
            this.config.onEmpty();
        }

        // Emit event
        this.wrapper.dispatchEvent(new CustomEvent('dsslider:empty'));
    }

    _startTimer() {
        this._stopTimer();

        if (this.config.showTimerBorder && this.badgeEl) {
            this._startTimerBorderAnimation();
        }

        this.timer = setTimeout(() => {
            this.next();
        }, this.config.interval);
    }

    _stopTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this._stopTimerBorderAnimation();
    }

    _startTimerBorderAnimation() {
        if (!this.badgeEl) return;

        const { interval, timerBorderColor, timerBorderWidth } = this.config;

        // Create a pseudo-element style for the border animation
        // We'll use a conic gradient that animates around the element
        this.badgeEl.style.setProperty('--timer-duration', `${interval}ms`);
        this.badgeEl.style.setProperty('--timer-color', timerBorderColor);

        // Add animation class
        this.badgeEl.classList.add('ds-slider-timer-active');

        // Reset animation by forcing reflow
        this.badgeEl.style.animation = 'none';
        this.badgeEl.offsetHeight; // Trigger reflow
        this.badgeEl.style.animation = `ds-slider-timer-border ${interval}ms linear`;
    }

    _stopTimerBorderAnimation() {
        if (this.badgeEl) {
            this.badgeEl.classList.remove('ds-slider-timer-active');
            this.badgeEl.style.animation = '';
        }
    }

    // Public methods
    next() {
        if (this.slides.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this._render();

        if (this.isPlaying && !this.isPaused) {
            this._startTimer();
        }
    }

    prev() {
        if (this.slides.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this._render();

        if (this.isPlaying && !this.isPaused) {
            this._startTimer();
        }
    }

    goTo(index) {
        if (index < 0 || index >= this.slides.length) return;
        this.currentIndex = index;
        this._render();

        if (this.isPlaying && !this.isPaused) {
            this._startTimer();
        }
    }

    play() {
        if (this.slides.length <= 1) return;
        this.isPlaying = true;
        this.isPaused = false;
        this._startTimer();
    }

    pause() {
        this.isPaused = true;
        this._stopTimer();
    }

    resume() {
        if (this.isPlaying) {
            this.isPaused = false;
            this._startTimer();
        }
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this._stopTimer();
    }

    // Reload data
    async reload(newData = null) {
        if (newData) {
            this.slides = newData;
        } else {
            await this._loadData();
        }

        this.currentIndex = 0;

        if (this.slides.length > 0) {
            this._render();
            if (this.config.autoPlay) {
                this.play();
            }
        } else {
            this._handleEmpty();
        }
    }

    // Set AJAX params and reload
    setParams(params) {
        this.config.ajax_data = { ...this.config.ajax_data, ...params };
        return this;
    }

    // Get current slide
    getCurrentSlide() {
        return this.slides[this.currentIndex] || null;
    }

    // Get all slides
    getSlides() {
        return this.slides;
    }

    // Destroy
    destroy() {
        this.stop();

        // Remove event listeners
        if (this.prevBtn) {
            this.prevBtn.replaceWith(this.prevBtn.cloneNode(true));
        }
        if (this.nextBtn) {
            this.nextBtn.replaceWith(this.nextBtn.cloneNode(true));
        }

        // Remove wrapper listeners
        this.wrapper.replaceWith(this.wrapper.cloneNode(true));
    }

    // Helper to get nested value from object
    _getNestedValue(obj, path) {
        if (!path) return obj;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

// Add CSS for timer border animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
@keyframes ds-slider-timer-border {
    0% {
        box-shadow: inset 0 0 0 0 var(--timer-color, rgba(251, 191, 36, 0.5));
    }
    100% {
        box-shadow: inset 0 0 0 2px var(--timer-color, rgba(251, 191, 36, 0.5));
    }
}

.ds-slider-timer-active {
    animation: ds-slider-timer-border 5000ms linear;
}

.ds-slider-content {
    transition: opacity 0.15s ease-in-out;
}
`;
    document.head.appendChild(style);
}

export default DSSimpleSlider;
