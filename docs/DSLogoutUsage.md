# DSLogout Usage Guide

`DSLogout` is a multi-element JavaScript helper for handling Laravel logout operations via AJAX. It automatically handles CSRF token resolution, UI loading/disabled states, request library fallbacks (`axios` → `fetch` → `XHR`), and session redirects.

## Installation

```javascript
import { DSLogout } from '@doyosi/laraisy';
```

---

## Basic Usage

### HTML

```html
<!-- Single button or link -->
<button class="js-logout" data-logout-url="/logout">Logout</button>

<!-- Multiple logout buttons across navbar, sidebar, etc. -->
<a href="#" class="js-logout" data-logout-url="/logout">Sign Out</a>
```

### JavaScript

```javascript
import { DSLogout } from '@doyosi/laraisy';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('.js-logout');
    
    logoutButtons.forEach(button => {
        const logoutUrl = button.getAttribute('data-logout-url') || '/logout';
        
        new DSLogout({
            elements: button,                          // Element, NodeList, selector or Array
            url: logoutUrl,                             // Endpoint URL (e.g. "/logout")
            requestLibrary: 'axios',                    // 'auto' | 'axios' | 'fetch' | 'xhr'
            translations: { 
                loading: 'Logging out...', 
                error: 'Error logging out' 
            },
            disabledClasses: ['pointer-events-none', 'opacity-60', 'cursor-not-allowed']
        });
    });
});
```

---

## Event Delegation Usage

For dynamic navigation or Single Page Applications where elements are rendered dynamically, use event delegation:

```javascript
new DSLogout({
    delegate: {
        root: document,
        match: '.js-logout'
    },
    url: '/logout',
    requestLibrary: 'axios'
});
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `element` | `HTMLElement \| string` | `null` | Single target element or selector |
| `elements` | `NodeList \| HTMLElement[] \| string` | `null` | Multiple target elements, NodeList, or selector |
| `delegate` | `Object` | `null` | Event delegation configuration: `{ root, match }` |
| `url` | `string` | `'/logout'` | Logout POST endpoint URL |
| `redirect` | `string` | `null` | Target redirect URL after logout (overrides response `redirect` property) |
| `requestLibrary` | `'auto' \| 'axios' \| 'fetch' \| 'xhr'` | `'auto'` | HTTP client library preference |
| `csrfToken` | `string` | `null` | Explicit CSRF token string (if not auto-resolved) |
| `translations` | `Object` | `{ loading: 'Logging out...', error: 'Error logging out' }` | Customizable UI text strings |
| `disabledClasses` | `Array<string>` | `['pointer-events-none', 'opacity-60', 'cursor-not-allowed']` | CSS classes applied while logout request is pending |
| `eventType` | `string` | `'click'` | Event type to listen for |

---

## Methods

### `destroy()`

Removes all click event listeners and destroys the instance.

```javascript
const logoutHandler = new DSLogout({ elements: '.js-logout' });

// Cleanup
logoutHandler.destroy();
```

---

## CSRF Token Resolution

`DSLogout` automatically attempts to resolve the Laravel CSRF token in the following order:
1. `<meta name="csrf-token" content="...">`
2. `data-csrf` attribute on the clicked element
3. `window.Laravel.csrfToken`
4. Cookie `XSRF-TOKEN` (Sanctum style)
5. Explicit `csrfToken` option passed in constructor config
