# DSForm Usage Guide

DSForm is a modern, feature-rich AJAX form handler for Laravel applications. It provides seamless integration with DSAlert for notifications, automatic CSRF handling, Laravel-style validation error mapping, and comprehensive lifecycle hooks.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Configuration Options](#configuration-options)
- [Events & Lifecycle Hooks](#events--lifecycle-hooks)
- [Error Handling](#error-handling)
- [Toast Notifications](#toast-notifications)
- [Request Libraries](#request-libraries)
- [TinyMCE Integration](#tinymce-integration)
- [Examples](#examples)
- [API Reference](#api-reference)

---

## Installation

Import the plugin in your page-specific JavaScript:

```javascript
import { DSForm } from '@doyosi/laraisy';
import { DSAlert } from '@doyosi/laraisy';

// DSAlert must be globally available for toasts/modals
window.DSAlert = DSAlert;
```

---

## Basic Usage

### Minimal Example

```javascript
import { DSForm } from '@doyosi/laraisy';

const form = document.querySelector('#my-form');

new DSForm({ form }).bind();
```

### Standard Example (with all common options)

```javascript
import { DSForm } from '@doyosi/laraisy';
import { DSAlert } from '@doyosi/laraisy';

window.DSAlert = DSAlert;

const form = document.querySelector('#register-form');

const submitter = new DSForm({
    form,
    requestLib: 'axios',
    primaryButtonSelector: '#submit-btn',
    toast: { enabled: true, position: 'top-end', timer: 3000, timerProgressBar: true },
    autoRedirect: true,
    successTitle: 'Success!',
    errorTitle: 'Something went wrong',
})
    .on('success', ({ data }) => console.log('Success:', data))
    .on('error', ({ data }) => console.log('Error:', data))
    .bind();  // IMPORTANT: Must call .bind()!
```

> **⚠️ Important:** Always call `.bind()` at the end to attach the form submit listener!

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `form` | `HTMLFormElement \| string` | *required* | Form element or CSS selector |
| `url` | `string` | `form.action` | Submit URL (defaults to form's action attribute) |
| `method` | `'post' \| 'put'` | `form.method` | HTTP method |
| `requestLib` | `'fetch' \| 'axios' \| 'xhr'` | `'fetch'` | Request library (falls back gracefully) |
| `headers` | `Object` | `{}` | Additional request headers |
| `additionalData` | `Object \| Function` | `null` | Extra data to merge before submit |
| `triggers` | `Array<string \| HTMLElement>` | `[]` | External trigger elements/selectors |
| `primaryButtonSelector` | `string` | `'button[type="submit"]'` | Selector for loading state target |
| `loadingTemplate` | `Function \| string` | *default spinner* | Loading state HTML template |
| `disableSelectors` | `Array<string>` | `[]` | Extra selectors to disable during submit |
| `excludeEnableSelectors` | `Array<string>` | `[]` | Keep these disabled after complete |
| `toast` | `Object` | `{ enabled: false, ... }` | Toast notification options |
| `autoRedirect` | `boolean` | `true` | Auto-redirect on `data.redirect` or `data.url` |
| `disableOnSuccess` | `boolean` | `false` | Keep form disabled after success |
| `successTitle` | `string` | `null` | Custom success toast message |
| `errorTitle` | `string` | `null` | Custom error toast message |
| `translations` | `Object` | *defaults* | i18n translations |

### Translations Object

```javascript
translations: {
    loading: 'Loading...',
    networkError: 'Network error.',
    unknownError: 'Something went wrong.',
    success: 'Success!',
    error: 'There was a problem.'
}
```

---

## Events & Lifecycle Hooks

DSForm provides both callback hooks and an event emitter system.

### Callback Hooks (in config)

```javascript
new DSForm({
    form,
    onBeforeSubmit: ({ formData, json }) => {
        // Called before form submission, after form data is collected
        // Use to sync editors, modify data, etc.
    },
    onSubmit: ({ controller }) => {
        // Called when submission starts
        // controller is AbortController for cancellation
    },
    onSuccess: ({ response, data }) => {
        // Called on successful response (2xx status)
    },
    onError: ({ response, data, error }) => {
        // Called on error response or network failure
    },
    onComplete: ({ ok }) => {
        // Always called after success or error
        // ok = true if successful, false otherwise
    },
}).bind();
```

### Event Emitter (chainable .on())

```javascript
new DSForm({ form })
    .on('submit:start', ({ controller }) => {
        console.log('Submitting...');
    })
    .on('success', ({ response, data }) => {
        console.log('Success:', data);
    })
    .on('error', ({ response, data, error }) => {
        console.log('Error:', data);
    })
    .on('submit:complete', ({ ok }) => {
        console.log('Complete, success:', ok);
    })
    .bind();
```

### DOM CustomEvents

DSForm also dispatches CustomEvents on the form element:

```javascript
form.addEventListener('smartform:success', (e) => {
    console.log('Success via DOM event:', e.detail);
});

form.addEventListener('smartform:error', (e) => {
    console.log('Error via DOM event:', e.detail);
});

form.addEventListener('smartform:submit:start', (e) => {
    console.log('Submit started:', e.detail);
});

form.addEventListener('smartform:submit:complete', (e) => {
    console.log('Submit complete:', e.detail);
});
```

---

## Error Handling

DSForm automatically handles Laravel validation errors and displays them in the form.

### Error Display Requirements

Add `.form-error` spans with `data-input` attribute matching field names:

```html
<input type="text" name="email" />
<span class="form-error hidden" data-input="email"></span>

<!-- For nested fields (Laravel style) -->
<input type="text" name="title[en]" />
<span class="form-error hidden" data-input="title.en"></span>

<!-- General error summary -->
<div class="form-error-summary hidden alert alert-error"></div>
```

### Error Name Mapping

DSForm handles both dot and bracket notation:
- `title.en` ↔ `title[en]`
- `meta.en.title` ↔ `meta[en][title]`

---

## Toast Notifications

Enable toasts by setting `toast.enabled: true`:

```javascript
new DSForm({
    form,
    toast: {
        enabled: true,
        position: 'top-end',      // 'top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'
        timer: 3000,              // Auto-close duration (ms)
        timerProgressBar: true    // Show progress bar
    },
    successTitle: 'Created successfully!',
    errorTitle: 'Validation failed',
}).bind();
```

> **Note:** Toasts require `window.DSAlert` to be available.

---

## Request Libraries

DSForm supports multiple request libraries with automatic fallback:

### Priority Order
1. **axios** (if `requestLib: 'axios'` and `window.axios` exists)
2. **fetch** (default, always available in modern browsers)
3. **xhr** (XMLHttpRequest fallback)

### Using Axios

```javascript
// If axios is available globally (via window.axios)
new DSForm({
    form,
    requestLib: 'axios',
}).bind();
```

### File Uploads

DSForm automatically detects file inputs or `enctype="multipart/form-data"` and uses FormData:

```html
<form id="my-form" enctype="multipart/form-data">
    <input type="file" name="avatar" />
</form>
```

---

## TinyMCE Integration

When using TinyMCE editors, sync content before form submission:

```javascript
function syncTinyMCE() {
    if (typeof tinymce !== 'undefined' && tinymce.editors) {
        tinymce.editors.forEach(editor => {
            if (editor && editor.targetElm) {
                editor.save();  // Syncs editor content to textarea
            }
        });
    }
}

new DSForm({
    form,
    onBeforeSubmit: () => {
        syncTinyMCE();
    },
}).bind();
```

---

## Examples

### Registration Form

```javascript
import { DSForm } from '@doyosi/laraisy';
import { DSAlert } from '@doyosi/laraisy';

window.DSAlert = DSAlert;

const form = document.querySelector('#register-form');
const timer = 3500;

new DSForm({
    form,
    requestLib: 'axios',
    primaryButtonSelector: '#register-submit',
    loadingTemplate: '#btn-loading-template',
    toast: { enabled: true, position: 'top-end', timer, timerProgressBar: true },
    autoRedirect: false,
    disableOnSuccess: true,
    successTitle: 'Registration complete, redirecting...',
    errorTitle: 'Registration failed',
    onSuccess: ({ data }) => console.log('Registered:', data),
})
    .on('success', ({ data }) => {
        const redirectUrl = data?.redirect || '/';
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, timer);
    })
    .bind();
```

### Page Creation with TinyMCE

```javascript
import { DSForm } from '@doyosi/laraisy';
import { DSAlert } from '@doyosi/laraisy';

window.DSAlert = DSAlert;

const form = document.querySelector('#pageForm');
const redirectUrl = form?.dataset.redirectUrl || '/dashboard/pages';
const timer = 3500;

function syncTinyMCE() {
    if (typeof tinymce !== 'undefined' && tinymce.editors) {
        tinymce.editors.forEach(editor => {
            if (editor?.targetElm) editor.save();
        });
    }
}

new DSForm({
    form,
    requestLib: 'axios',
    toast: { enabled: true, position: 'top-end', timer, timerProgressBar: true },
    autoRedirect: false,
    disableOnSuccess: true,
    successTitle: 'Page created successfully!',
    errorTitle: 'Failed to create page',
    onBeforeSubmit: () => syncTinyMCE(),
    onError: ({ data }) => {
        const firstError = form.querySelector('.form-error:not(.hidden)');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
})
    .on('success', ({ data }) => {
        const url = data?.redirect || redirectUrl;
        setTimeout(() => window.location.href = url, timer);
    })
    .bind();
```

### Custom Submit Button

```javascript
new DSForm({
    form: '#my-form',
    triggers: ['#external-submit-btn', '#another-trigger'],
    primaryButtonSelector: '#main-submit',
    loadingTemplate: (text) => `<span class="spinner"></span> ${text}`,
}).bind();
```

### Adding Extra Data

```javascript
const dsform = new DSForm({ form }).bind();

// Add data programmatically
dsform.addData({ _extra: 'value' });

// Or use additionalData in config
new DSForm({
    form,
    additionalData: { source: 'web' },
    // Or as a function:
    additionalData: (formData) => ({
        ...formData,
        timestamp: Date.now(),
    }),
}).bind();
```

---

## API Reference

### Constructor

```javascript
new DSForm(config)
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `.bind()` | `this` | Attach form submit listener (required!) |
| `.unbind()` | `this` | Detach form submit listener |
| `.on(event, handler)` | `this` | Subscribe to events |
| `.off(event, handler)` | `this` | Unsubscribe from events |
| `.submit({ trigger? })` | `void` | Programmatically submit the form |
| `.addData(extra)` | `void` | Add extra data to be submitted |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `submit:start` | `{ controller }` | Submission started, AbortController available |
| `success` | `{ response, data }` | Request succeeded (2xx status) |
| `error` | `{ response, data, error? }` | Request failed or network error |
| `submit:complete` | `{ ok }` | Request finished (success or error) |

### HTML Structure Requirements

```html
<!-- Form with proper attributes -->
<form id="my-form" action="/api/submit" method="POST">
    @csrf  <!-- Laravel CSRF token -->
    
    <!-- Or via meta tag -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Form fields with error spans -->
    <input type="text" name="email" />
    <span class="form-error hidden" data-input="email"></span>
    
    <!-- General error summary (optional) -->
    <div class="form-error-summary hidden alert alert-error"></div>
    
    <!-- Submit button -->
    <button type="submit">Submit</button>
</form>
```

---

## Backend Response Format

DSForm expects JSON responses in this format:

### Success Response

```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": { ... },
    "redirect": "/dashboard"  // Optional: auto-redirect URL
}
```

### Error Response (422 Validation)

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "title.en": ["The title is required for English."]
    }
}
```

---

## Tips & Best Practices

1. **Always call `.bind()`** - Without it, the form won't intercept submissions
2. **Set `window.DSAlert`** - Required for toast notifications to work
3. **Use `autoRedirect: false`** with custom redirect timing when showing success toasts
4. **Add `data-input` attributes** to error spans for proper error display
5. **Sync TinyMCE** in `onBeforeSubmit` hook when using rich text editors
6. **Use `enctype="multipart/form-data"`** on forms with file uploads
