# DSSvgFetch Usage Guide

`DSSvgFetch` is a utility component that asynchronously fetches SVG icon files and injects their raw inline `<svg>` code into container elements. This allows SVGs to be styled dynamically via CSS (e.g. `fill-current`, `text-primary`, `w-5 h-5`).

## Installation

```javascript
import { DSSvgFetch } from '@doyosi/laraisy';
```

---

## Basic Usage

### HTML Structure

Add a container element (such as a `<span>` or `<i>`) with the configured selector class, the `data-svg` attribute pointing to the SVG file URL, and optionally `data-class` for overriding classes on the injected SVG tag.

```html
<!-- Default selector (.icon-fetch-web) or custom selector (.svg-icon) -->
<span class="svg-icon" data-svg="/assets/icons/user.svg" data-class="w-5 h-5 text-primary"></span>
<span class="svg-icon" data-svg="/assets/icons/settings.svg" data-class="w-6 h-6 text-gray-500 hover:text-black"></span>
```

### JavaScript Initialization

```javascript
import { DSSvgFetch } from '@doyosi/laraisy';

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate with custom options
    const svgFetch = new DSSvgFetch({ selector: '.svg-icon' });
    
    // Process matching elements
    svgFetch.init();
});
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | `string` | `'.icon-fetch-web'` | CSS selector for target SVG container elements |
| `attribute` | `string` | `'data-svg'` | HTML attribute containing the SVG file URL |
| `classAttribute` | `string` | `'data-class'` | HTML attribute containing CSS classes to apply directly to the injected `<svg>` element |

---

## Features & Caching

1. **In-Memory Cache**: SVGs fetched from remote URLs are stored in an internal `Map` cache (`this.svgCache`), preventing duplicate HTTP network requests for identical icon URLs across the page.
2. **Class Replacement**: If `data-class` is specified on the container element, `DSSvgFetch` sets the `<svg>` element's `class` attribute to those custom classes upon injection.
3. **Duplicate Protection**: Elements that have already been processed are marked with `data-svg-processed="true"` and skipped on subsequent `.init()` invocations.

---

## Methods

```javascript
const svgFetch = new DSSvgFetch({ selector: '.svg-icon' });

// Scan DOM and fetch/inject SVGs for all matching elements
svgFetch.init();

// Process a single element manually
svgFetch.processElement(domElement);

// Fetch raw SVG content string (with caching)
const svgText = await svgFetch.fetchSvg('/assets/icons/check.svg');
```
