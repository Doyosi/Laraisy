# DSTabs Plugin Usage Guide

A lightweight, dependency-free JavaScript plugin for tab switching with button/link click handlers, radio input synchronization, active state management, and a full event system.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [HTML Structure](#html-structure)
- [Configuration](#configuration)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)

---

## Installation

Import the plugin in your JavaScript file:

```javascript
import { DSTabs } from '@doyosi/laraisy';
```

---

## Basic Usage

### 1. Add the HTML structure

```html
<div id="myTabContainer">
    <!-- Tab Buttons (placed anywhere in the container) -->
    <div class="flex gap-2">
        <button type="button" class="btn btn-primary btn-sm" data-tab="tab1" disabled>
            Tab 1
        </button>
        <button type="button" class="btn btn-primary btn-sm" data-tab="tab2">
            Tab 2
        </button>
        <button type="button" class="btn btn-primary btn-sm" data-tab="tab3">
            Tab 3
        </button>
    </div>

    <!-- Tab Content -->
    <div class="tabs">
        <input type="radio" name="my_tabs" class="tab hidden" data-tab="tab1" checked />
        <div class="tab-content">
            Content for Tab 1
        </div>

        <input type="radio" name="my_tabs" class="tab hidden" data-tab="tab2" />
        <div class="tab-content">
            Content for Tab 2
        </div>

        <input type="radio" name="my_tabs" class="tab hidden" data-tab="tab3" />
        <div class="tab-content">
            Content for Tab 3
        </div>
    </div>
</div>
```

### 2. Initialize the plugin

```javascript
import { DSTabs } from '@doyosi/laraisy';

const tabs = new DSTabs('#myTabContainer');
```

Or use the factory method:

```javascript
const tabs = DSTabs.create('#myTabContainer');
```

---

## HTML Structure

The plugin expects the following structure:

| Element | Attribute | Description |
|---------|-----------|-------------|
| **Container** | Any selector | The parent element that wraps everything |
| **Buttons** | `data-tab="tabName"` | Clickable buttons/links to switch tabs |
| **Radio Inputs** | `data-tab="tabName"`, `checked` | Hidden radio inputs (one should be `checked`) |
| **Content** | `.tab-content` | Content divs that follow each radio input |

> [!IMPORTANT]
> Each radio input must be immediately followed by its corresponding `.tab-content` div. The plugin pairs them by their order.

### Minimal Example

```html
<div data-ds-tabs>
    <button data-tab="a" disabled>A</button>
    <button data-tab="b">B</button>

    <div class="tabs">
        <input type="radio" data-tab="a" checked />
        <div class="tab-content">Content A</div>

        <input type="radio" data-tab="b" />
        <div class="tab-content">Content B</div>
    </div>
</div>
```

---

## Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buttonSelector` | string | `'[data-tab]'` | Selector for tab buttons/links |
| `radioSelector` | string | `'input[type="radio"][data-tab]'` | Selector for hidden radio inputs |
| `contentSelector` | string | `'.tab-content'` | Selector for tab content containers |
| `tabsContainer` | string\|null | `'.tabs'` | Container for radios/content. Set to `null` for flexible mode |
| `tabsContainerGlobal` | boolean | `false` | If true, search `tabsContainer` in document, not inside main container |
| `activeClass` | string | `'active'` | Class added to active button |
| `buttonActiveClass` | string | `'btn-active'` | Additional class for active button |
| `contentHiddenClass` | string | `'hidden'` | Class to hide inactive content |
| `disableActive` | boolean | `true` | Disable the active button |
| `showFirst` | boolean | `true` | Auto-show first tab on init |
| `onTabChange` | function | `null` | Callback when tab changes |

### Global Container Search

When buttons and content are in **completely different parts of the page**, use `tabsContainerGlobal: true` to search for the tabs container anywhere in the document:

```javascript
// Buttons in #app-wrapper, content in #content-area elsewhere in page
const tabs = new DSTabs('#app-wrapper', {
    tabsContainer: '#content-area',
    tabsContainerGlobal: true  // Search document, not inside #app-wrapper
});
```

```html
<!-- Buttons in header -->
<div id="app-wrapper">
    <button data-tab="home">Home</button>
    <button data-tab="settings">Settings</button>
</div>

<!-- Content area elsewhere in page -->
<div id="content-area">
    <input type="radio" data-tab="home" checked />
    <div class="tab-content">Home content</div>
    
    <input type="radio" data-tab="settings" />
    <div class="tab-content">Settings content</div>
</div>
```

### Flexible Mode (No Sub-Container)

By default, DSTabs expects radios and content inside a `.tabs` sub-container. If your HTML doesn't use a sub-container, set `tabsContainer` to `null`:

```javascript
// When buttons, radios, and content are all at the same level
const tabs = new DSTabs('#app-wrapper', {
    tabsContainer: null  // Search entire container
});
```

```html
<!-- Flexible structure - no .tabs wrapper needed -->
<div id="app-wrapper">
    <button data-tab="home">Home</button>
    <button data-tab="settings">Settings</button>
    
    <input type="radio" data-tab="home" checked />
    <div class="tab-content">Home content</div>
    
    <input type="radio" data-tab="settings" />
    <div class="tab-content">Settings content</div>
</div>
```

> [!TIP]
> The plugin will also automatically fall back to the main container if the configured `tabsContainer` selector doesn't match any element.

### Content Matching

Content elements are matched to tabs in two passes:

1. **By `data-tab` attribute** (preferred): Content with `data-tab="tabName"` is linked to the matching tab
2. **By order** (legacy fallback): Remaining content is linked to tabs by their DOM order

```html
<!-- Explicit matching with data-tab (recommended) -->
<div class="tab-content" data-tab="settings">Settings content</div>

<!-- Or implicit matching by order (legacy) -->
<input type="radio" data-tab="home" />
<div class="tab-content">Home content</div>  <!-- Matched by position -->
```

### Using Configuration

```javascript
const tabs = new DSTabs('#container', {
    disableActive: true,
    activeClass: 'tab-active',
    buttonActiveClass: 'btn-primary-active',
    onTabChange: (tabName, prevTabName) => {
        console.log(`Switched from ${prevTabName} to ${tabName}`);
    }
});
```

### Data Attributes

You can also configure via data attributes on the container:

```html
<div data-ds-tabs 
     data-disable-active="true" 
     data-active-class="my-active-class">
    ...
</div>
```


---

## Methods

### `switchTo(tabName)`

Switch to a specific tab programmatically.

```javascript
tabs.switchTo('tab2');
```

### `getCurrentTab()`

Get the currently active tab name.

```javascript
const current = tabs.getCurrentTab(); // 'tab1'
```

### `getPreviousTab()`

Get the previously active tab name.

```javascript
const previous = tabs.getPreviousTab(); // 'tab2'
```

### `getTabNames()`

Get an array of all tab names.

```javascript
const names = tabs.getTabNames(); // ['tab1', 'tab2', 'tab3']
```

### `hasTab(tabName)`

Check if a tab exists.

```javascript
if (tabs.hasTab('settings')) {
    tabs.switchTo('settings');
}
```

### `next()` / `prev()`

Navigate to next/previous tab (loops around).

```javascript
tabs.next(); // Go to next tab
tabs.prev(); // Go to previous tab
```

### `enableTab(tabName)` / `disableTab(tabName)`

Enable or disable a specific tab button.

```javascript
tabs.disableTab('premium'); // Disable the premium tab
tabs.enableTab('premium');  // Re-enable it
```

### `refresh()`

Re-cache elements and reinitialize (useful after dynamic content changes).

```javascript
tabs.refresh();
```

### `destroy()`

Clean up and remove all event listeners.

```javascript
tabs.destroy();
```

---

## Events

### Available Events

| Event | Data | Description |
|-------|------|-------------|
| `ready` | `{ activeTab }` | Fired when tabs are initialized |
| `change` | `{ tab, prevTab }` | Fired when tab changes |
| `refresh` | `{}` | Fired after refresh() is called |
| `destroy` | `{}` | Fired when instance is destroyed |

### Using `on()` Method

```javascript
tabs.on('change', ({ tab, prevTab }) => {
    console.log(`Tab changed: ${prevTab} → ${tab}`);
});

tabs.on('ready', ({ activeTab }) => {
    console.log(`Tabs ready, active: ${activeTab}`);
});
```

### Chaining

```javascript
tabs
    .on('change', handleChange)
    .on('ready', handleReady)
    .switchTo('tab2');
```

### DOM CustomEvents

You can also listen via DOM events:

```javascript
document.querySelector('#myTabContainer').addEventListener('dstabs:change', (e) => {
    console.log('Tab changed:', e.detail);
});
```

### Removing Event Listeners

```javascript
// Remove specific handler
tabs.off('change', myHandler);

// Remove all handlers for an event
tabs.off('change');
```

---

## Examples

### Basic Implementation

```javascript
import { DSTabs } from '@doyosi/laraisy';

// Initialize
const tabs = new DSTabs('#pageImagesCard');

// Listen for changes
tabs.on('change', ({ tab, prevTab }) => {
    console.log(`Switched to ${tab}`);
});
```

### With Blade Template (Laravel)

```html
<x-card variant="secondary" style="header" radius="sm">
    <x-slot name="header">
        <div class="flex w-full items-center justify-between">
            <h3>Page Images</h3>
            <div class="flex flex-row gap-1">
                <button type="button" class="btn btn-primary btn-sm" data-tab="primary" disabled>
                    Primary
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-tab="header">
                    Header
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-tab="social">
                    Social
                </button>
            </div>
        </div>
    </x-slot>
    <div class="tabs">
        <input type="radio" name="page_images" class="tab hidden" data-tab="primary" checked />
        <div class="tab-content">
            <!-- Primary image content -->
        </div>
        <input type="radio" name="page_images" class="tab hidden" data-tab="header" />
        <div class="tab-content">
            <!-- Header image content -->
        </div>
        <input type="radio" name="page_images" class="tab hidden" data-tab="social" />
        <div class="tab-content">
            <!-- Social image content -->
        </div>
    </div>
</x-card>
```

```javascript
// In your PageCreate.js
import { DSTabs } from '@doyosi/laraisy';

// Find the card containing the image tabs
const imageCard = document.querySelector('.tabs')?.closest('section, article, div[class*="card"]');
if (imageCard) {
    const imageTabs = new DSTabs(imageCard);
    
    imageTabs.on('change', ({ tab }) => {
        console.log(`Now showing ${tab} image uploader`);
    });
}
```

### Auto-Initialize All Tabs

```javascript
// Initialize all elements with data-ds-tabs attribute
DSTabs.initAll();
```

```html
<div data-ds-tabs>
    <!-- tabs structure -->
</div>

<div data-ds-tabs>
    <!-- another tabs structure -->
</div>
```

### Get Existing Instance

```javascript
// Get instance from an element
const instance = DSTabs.getInstance('#myTabContainer');
if (instance) {
    instance.switchTo('settings');
}
```

---

## CSS Considerations

The plugin uses these classes by default:

```css
/* Hidden content (applied to inactive tabs) */
.hidden {
    display: none;
}

/* Active button (optional) */
.active,
.btn-active {
    /* Your active button styles */
}
```

> [!TIP]
> If using DaisyUI or Tailwind CSS, the default `.hidden` class works out of the box.

---

## TypeScript Support

The plugin is written in ES6+ JavaScript. For TypeScript projects, you can create a declaration file:

```typescript
// DSTabs.d.ts
declare class DSTabs {
    constructor(containerSelector: string | HTMLElement, config?: DSTabsConfig);
    static create(containerSelector: string | HTMLElement, config?: DSTabsConfig): DSTabs;
    static getInstance(element: string | HTMLElement): DSTabs | null;
    static initAll(selector?: string): void;
    
    switchTo(tabName: string): boolean;
    getCurrentTab(): string | null;
    getPreviousTab(): string | null;
    getTabNames(): string[];
    hasTab(tabName: string): boolean;
    next(): string | null;
    prev(): string | null;
    enableTab(tabName: string): void;
    disableTab(tabName: string): void;
    on(event: string, handler: Function): DSTabs;
    off(event: string, handler?: Function): DSTabs;
    refresh(): void;
    destroy(): void;
}
```
