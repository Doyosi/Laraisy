/**
 * DSSvgFetch
 * Fetches SVG files and injects them inline.
 * Replaces <svg> classes with those defined in data-class.
 */
export class DSSvgFetch {
    constructor(options = {}) {
        this.config = {
            selector: '.icon-fetch-web',
            attribute: 'data-svg',
            classAttribute: 'data-class', // New config for the class data
            ...options
        };

        this.svgCache = new Map();
    }

    init() {
        const elements = document.querySelectorAll(this.config.selector);

        elements.forEach(element => {
            if (element.dataset.svgProcessed) return;
            this.processElement(element);
        });
    }

    async processElement(element) {
        const url = element.getAttribute(this.config.attribute);
        const customClasses = element.getAttribute(this.config.classAttribute);

        if (!url) return;

        try {
            element.dataset.svgProcessed = 'true';

            // 1. Fetch content (or get from cache)
            const svgContent = await this.fetchSvg(url);

            // 2. Inject HTML
            element.innerHTML = svgContent;

            // 3. Apply custom classes if data-class exists
            if (customClasses) {
                const svg = element.querySelector('svg');
                if (svg) {
                    // setAttribute overwrites the entire 'class' attribute, 
                    // effectively removing old classes and adding the new ones.
                    svg.setAttribute('class', customClasses);
                }
            }

        } catch (error) {
            console.error(`DSSvgFetch: Failed to load ${url}`, error);
            delete element.dataset.svgProcessed;
        }
    }

    async fetchSvg(url) {
        if (this.svgCache.has(url)) {
            return this.svgCache.get(url);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        this.svgCache.set(url, text);
        return text;
    }
}