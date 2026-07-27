# AI Agent Skill Reference — `@doyosi/laraisy`

> **Package:** `@doyosi/laraisy` · **Version:** 1.0.17 · **License:** MIT  
> **Module System:** ESM (`"type": "module"`) · **Entry Point:** `src/index.js`  
> **Types:** `dist/index.d.ts`  
> **Stack:** Laravel + Tailwind CSS v4.1 + DaisyUI 5.1.14  
> **Description:** Missing Laravel / Tailwind v4.1 & DaisyUI 5.1.14 JavaScript Plugins

---

## Table of Contents

1. [Package Overview](#1-package-overview)
2. [Installation & Import](#2-installation--import)
3. [Repository Structure](#3-repository-structure)
4. [Component Reference](#4-component-reference)
   - [CodeInput](#41-codeinput)
   - [DSAlert](#42-dsalert)
   - [DSAvatar](#43-dsavatar)
   - [DSButtonForm](#44-dsbuttonform)
   - [DSDelete](#45-dsdelete)
   - [DSForm](#46-dsform)
   - [DSGridOrTable](#47-dsgridortable)
   - [DSLocaleSwitcher](#48-dslocaleswitcher)
   - [DSLogout](#49-dslogout)
   - [DSNotifications](#410-dsnotifications)
   - [DSRestore](#411-dsrestore)
   - [DSSelect](#412-dsselect)
   - [DSSelectBox](#413-dsselectbox)
   - [DSSimpleSlider](#414-dssimpleslider)
   - [DSSvgFetch](#415-dssvgfetch)
   - [DSSvgUpload](#416-dssvgupload)
   - [DSTable](#417-dstable)
   - [DSTabs](#418-dstabs)
   - [DSUpload](#419-dsupload)
5. [Cross-Cutting Patterns](#5-cross-cutting-patterns)
6. [Laravel Backend Expectations](#6-laravel-backend-expectations)
7. [Integration Recipes](#7-integration-recipes)
8. [File-to-Component Mapping](#8-file-to-component-mapping)
9. [AI Agent Constraints & Notes](#9-ai-agent-constraints--notes)

---

## 1. Package Overview

`@doyosi/laraisy` provides 19 browser-only ESM JavaScript components that fill the gap between a Laravel backend and Tailwind CSS v4.1 / DaisyUI 5.1.14 frontend. Every component is a class that can be instantiated with `new`, and several also expose static factory methods.

**Peer Dependencies (optional):**

| Package | Version | Used By |
|---------|---------|---------|
| `axios` | `^1.0.0` | Most components (graceful fallback to `fetch`/`XHR` when absent) |
| `tippy.js` | `^6.0.0` | `DSAvatar` tooltips (optional enhancement) |

---

## 2. Installation & Import

```bash
npm install @doyosi/laraisy
```

**Import all (tree-shakeable):**

```js
import { DSForm, DSAlert, DSSelect, DSDelete } from '@doyosi/laraisy';
```

**Import individual:**

```js
import { DSAlert } from '@doyosi/laraisy/src/DSAlert.js';
import { DSForm }  from '@doyosi/laraisy/src/DSForm.js';
```

**CDN / direct ESM (no build step):**

```html
<script type="module">
  import { DSAlert } from '/node_modules/@doyosi/laraisy/src/DSAlert.js';
  DSAlert.fire({ title: 'Hello!', icon: 'success' });
</script>
```

---

## 3. Repository Structure

```
Laraisy/
├── src/
│   ├── index.js                 # Barrel export — re-exports all 19 components
│   ├── CodeInput.js             # Multi-input OTP/verification code handler
│   ├── DSAlert.js               # SweetAlert2-like toast & modal system
│   ├── DSAvatar.js              # Avatar file upload with preview and reset
│   ├── DSButtonForm.js          # Standalone button AJAX handler with loading states
│   ├── DSDelete.js              # Deletion confirmation and AJAX handling
│   ├── DSForm.js                # Robust AJAX form handler with validation
│   ├── DSGridOrTable.js         # Flexible data display (Table/Grid/Gridable toggle)
│   ├── DSLocaleSwitcher.js      # Locale switching for translatable form fields
│   ├── DSLogout.js              # Secure AJAX logout handler
│   ├── DSNotifications.js       # Notification drawer management
│   ├── DSRestore.js             # Restore (soft-delete) action handler
│   ├── DSSelect.js              # Advanced searchable select/dropdown
│   ├── DSSelectBox.js           # Dual-list selector for transferring items
│   ├── DSSimpleSlider.js        # Carousel/Slider component
│   ├── DSSvgFetch.js            # Inline SVG injector (fetch + cache)
│   ├── DSSvgUpload.js           # SVG icon uploader (specialised)
│   ├── DSTable.js               # Data table with sort, filter, pagination, export
│   ├── DSTabs.js                # Tab switching management
│   ├── DSUpload.js              # File uploader with drag-and-drop
│   ├── DSGridOrTable/
│   │   ├── DSGOTRenderer.js     # Grid/Table row renderer
│   │   └── DSGOTViewToggle.js   # View toggle (grid ↔ table) logic
│   └── DSTable/
│       ├── DSTablePagination.js
│       ├── DSTableSearch.js
│       ├── DSTableSort.js
│       ├── DSTableFilter.js
│       ├── DSTableExport.js
│       └── DSTableSelection.js
├── docs/                        # Per-component Markdown usage docs
└── skill.md                     # This file
```

---

## 4. Component Reference

### 4.1 CodeInput

**File:** `src/CodeInput.js` · **Export:** `export default class CodeInput`

OTP-style multi-input handler. Accepts single digits (0–9), auto-focuses next input, supports Backspace navigation and paste distribution. Concatenates all inputs into a single hidden field.

#### Quick Start

```js
import CodeInput from '@doyosi/laraisy/src/CodeInput.js';

// HTML: <input data-id="otp_code"> × N  +  <input type="hidden" name="otp_code">
new CodeInput('[data-id="otp_code"]', 'otp_code');
```

#### Constructor

```js
new CodeInput(selector, hiddenName)
```

| Param | Type | Description |
|-------|------|-------------|
| `selector` | `string` | CSS selector matching **all** digit inputs |
| `hiddenName` | `string` | `name` attribute of the hidden input that receives the concatenated value |

#### Required HTML

```html
<div class="flex gap-2">
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
  <input type="text" maxlength="1" data-id="otp_code" class="input input-bordered w-12 text-center text-xl" />
</div>
<input type="hidden" name="otp_code" />
```

#### Key Internal Methods

| Method | Description |
|--------|-------------|
| `_bindEvents()` | Attaches input / keydown / paste handlers |
| `_onInput(e)` | Restricts to digits, advances focus |
| `_onKeyDown(e)` | Handles Backspace to move focus back |
| `_onPaste(e)` | Distributes pasted string across inputs |
| `_updateHidden()` | Writes concatenated value to hidden input |

---

### 4.2 DSAlert

**File:** `src/DSAlert.js` · **Export:** `export class DSAlert`

Lightweight SweetAlert2-compatible alert/toast system built with Tailwind CSS. No external library required.

#### Quick Start

```js
import { DSAlert } from '@doyosi/laraisy';

// Shorthand
DSAlert.fire('Success!', 'Item saved.', 'success');

// Object API
DSAlert.fire({ title: 'Delete?', text: 'Cannot be undone.', icon: 'warning',
               showCancelButton: true, confirmButtonText: 'Yes, delete!' })
  .then(result => {
    if (result.isConfirmed) { /* proceed */ }
  });

// Toast
DSAlert.fire({ title: 'Saved', icon: 'success', toast: true, timer: 3000, timerProgressBar: true });
```

#### Static Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `DSAlert.fire` | `(...args)` → Promise | `Promise<{isConfirmed?, isDismissed?, timer?}>` |

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `''` | Dialog title |
| `text` | `string` | `''` | Body text |
| `html` | `string` | `''` | Body HTML (overrides `text`) |
| `icon` | `string` | `''` | `success` \| `error` \| `warning` \| `info` \| `question` |
| `toast` | `boolean` | `false` | Render as toast notification |
| `position` | `string` | `'top-end'` | Toast position — see table below |
| `timer` | `number` | `0` | Auto-close after N ms (0 = manual) |
| `timerProgressBar` | `boolean` | `false` | Animate progress bar during timer |
| `showConfirmButton` | `boolean` | `true` | Show confirm button |
| `showCancelButton` | `boolean` | `false` | Show cancel button |
| `showCloseButton` | `boolean` | `true` | Show × close button |
| `allowOutsideClick` | `boolean` | `true` | Click backdrop to close |
| `allowEscapeKey` | `boolean` | `true` | Esc key to close |
| `confirmButtonText` | `string` | `'OK'` | Confirm button label |
| `cancelButtonText` | `string` | `'Cancel'` | Cancel button label |
| `confirmButtonColor` | `string` | `'btn btn-sm btn-primary'` | Confirm button CSS classes |
| `cancelButtonColor` | `string` | `'btn btn-sm btn-soft btn-neutral'` | Cancel button CSS classes |
| `buttonsAlign` | `string` | `'end'` | `start` \| `center` \| `end` |
| `backdrop` | `boolean` | `true` | Show backdrop overlay |

#### Toast Positions

`top-start` · `top-center` · `top-end` · `center` · `bottom-start` · `bottom-center` · `bottom-end`

#### Promise Result

```js
{ isConfirmed: true }            // Confirm button clicked
{ isConfirmed: false, isDismissed: true }  // Cancel / close / backdrop
{ isDismissed: true, timer: true }         // Auto-closed by timer
```

#### Override Icons

```js
DSAlert.icons.success = '<svg>…</svg>';
DSAlert.icons.warning = '<svg>…</svg>';
```

---

### 4.3 DSAvatar

**File:** `src/DSAvatar.js` · **Export:** `export class DSAvatar`  
**Dependencies:** `DSAlert` (internal), `window.tippy` (optional, for tooltips)

Avatar file upload with instant preview, remove/reset to default, CSRF-aware AJAX, and optional loading overlay.

#### Quick Start

```js
import { DSAvatar } from '@doyosi/laraisy';

new DSAvatar('#avatar-wrapper', {
  headers: { 'X-Custom': 'value' }
});
```

#### Constructor

```js
new DSAvatar(selector, config)
```

| Param | Type | Description |
|-------|------|-------------|
| `selector` | `string` | Wrapper element containing the avatar sub-elements |
| `config.headers` | `Object` | Extra HTTP headers sent with every request |

#### Data Attributes on Wrapper

| Attribute | Description |
|-----------|-------------|
| `data-upload-url` | POST endpoint for avatar upload |
| `data-remove-url` | POST/DELETE endpoint for avatar removal |
| `data-default-avatar` | URL of the default avatar image (used on reset) |

#### Required HTML Structure

```html
<div id="avatar-wrapper"
     data-upload-url="/profile/avatar"
     data-remove-url="/profile/avatar/remove"
     data-default-avatar="/images/default-avatar.png">

  <img data-ds-avatar-img src="/current-avatar.png" class="w-20 h-20 rounded-full" />
  <input type="file" data-ds-avatar-input accept="image/*" class="hidden" />

  <div data-ds-avatar-loading class="hidden">
    <span class="loading loading-spinner"></span>
  </div>

  <button type="button" data-ds-avatar-action="trigger-upload">Change</button>
  <button type="button" data-ds-avatar-action="trigger-remove">Remove</button>
</div>
```

#### Internal Element Selectors

| Selector | Role |
|----------|------|
| `[data-ds-avatar-img]` | `<img>` that shows current avatar |
| `[data-ds-avatar-input]` | Hidden file `<input>` |
| `[data-ds-avatar-loading]` | Loading overlay |
| `[data-ds-avatar-action="trigger-upload"]` | Button that opens file picker |
| `[data-ds-avatar-action="trigger-remove"]` | Button that sends remove request |

---

### 4.4 DSButtonForm

**File:** `src/DSButtonForm.js` · **Export:** `export class DSButtonForm`  
**Dependencies:** `DSAlert`

Standalone button AJAX handler. Useful for "Regenerate", "Sync", "Delete" style actions. Replaces button content with a spinner during loading and shows toast/modal results.

#### Quick Start

```js
import { DSButtonForm } from '@doyosi/laraisy';

new DSButtonForm({
  element: '#regenerate-btn',
  url: '/api/regenerate',
  method: 'post',
  data: { id: 42 },
  toast: { enabled: true, position: 'top-end', timer: 3000 },
  onSuccess(data) { console.log('Done', data); }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `element` | `string \| HTMLElement` | — | Button selector or element |
| `url` | `string` | — | Request endpoint |
| `method` | `string` | `'post'` | HTTP method: `get` \| `post` \| `put` \| `delete` \| `patch` |
| `data` | `Object \| Function(btn)` | `{}` | Payload. If function, receives the button element |
| `requestLib` | `string` | `'fetch'` | `'fetch'` \| `'axios'` \| `'xhr'` |
| `headers` | `Object` | `{}` | Custom HTTP headers |
| `loadingHtml` | `string` | spinner icon | HTML injected into button while busy |
| `askConfirmation` | `boolean` | `false` | Show DSAlert confirm dialog before request |
| `confirmOptions` | `Object` | default confirm opts | DSAlert options for confirmation |
| `disableOnSuccess` | `boolean` | `false` | Keep button disabled after success |
| `disableOnLoading` | `boolean` | `true` | Disable button during request |
| `toast` | `Object` | `{ enabled: true, position: 'top-end', timer: 3000 }` | Toast config |
| `translations` | `Object` | `{ networkError, success, error }` | i18n strings |
| `onSuccess` | `Function(data, response)` | — | Success callback |
| `onError` | `Function(error, response)` | — | Error callback |
| `onComplete` | `Function()` | — | Always-run callback |

#### Public Methods

| Method | Description |
|--------|-------------|
| `bind()` | Attach click listener |
| `unbind()` | Remove click listener |
| `submit()` | Programmatically fire the request |
| `on(event, handler)` | Subscribe to `start` \| `success` \| `error` \| `complete` |
| `off(event, handler)` | Unsubscribe |

#### Events

| Event (internal) | DOM Event | Detail |
|-----------------|-----------|--------|
| `start` | `dsbutton:start` | `{ payload, controller, instance, element }` |
| `success` | `dsbutton:success` | `{ data, response, instance, element }` |
| `error` | `dsbutton:error` | `{ error, instance, element }` |
| `complete` | `dsbutton:complete` | `{ instance, element }` |

---

### 4.5 DSDelete

**File:** `src/DSDelete.js` · **Export:** `export class DSDelete` (also `export default`)  
**Dependencies:** `DSAlert`

Binds to elements matching a CSS selector via event delegation. Shows a confirmation dialog, performs a DELETE (or any method) AJAX request, then shows success/error feedback. Optionally removes the parent `<tr>` from the DOM on success.

#### Quick Start

```js
import { DSDelete } from '@doyosi/laraisy';

// Instance mode — delegates clicks on [data-delete]
new DSDelete({
  onSuccess(response, element) {
    element.closest('tr')?.remove();
  }
});

// Static one-shot confirm mode
await DSDelete.confirm({
  url: '/api/items/1',
  onSuccess: () => location.reload()
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | `string` | `'[data-delete]'` | Delegated click target |
| `method` | `string` | `'DELETE'` | HTTP method |
| `ajaxFunction` | `string` | `'axios'` | `'axios'` \| `'fetch'` |
| `icon` | `string` | `'warning'` | Confirm dialog icon |
| `successIcon` | `string` | `'success'` | Success dialog icon |
| `errorIcon` | `string` | `'error'` | Error dialog icon |
| `confirmButtonColor` | `string` | `'btn btn-sm btn-error'` | Confirm button classes |
| `translations` | `Object` | see below | i18n strings |
| `onSuccess` | `Function(response, element)` | — | Success callback |
| `onError` | `Function(error, element)` | — | Error callback |
| `onDelete` | `Function(element)` | — | Pre-delete hook; return `false` to cancel |

**Default Translations:**

```js
{
  title: 'Are you sure?',
  text: "You won't be able to revert this!",
  confirmButtonText: 'Yes, delete it!',
  cancelButtonText: 'Cancel',
  successTitle: 'Deleted!',
  successText: 'Your file has been deleted.',
  errorTitle: 'Error!',
  errorText: 'Something went wrong.'
}
```

#### Required HTML

```html
<!-- URL in data-delete attribute -->
<button data-delete="/api/items/1" data-delete-title="Item Name">Delete</button>

<!-- Or as href -->
<a href="/api/items/1" data-delete data-delete-title="Item Name">Delete</a>
```

#### DOM Events

| Event | Fired on |
|-------|----------|
| `ds:delete:start` | `document` |
| `ds:delete:success` | `document` |
| `ds:delete:error` | `document` |

---

### 4.6 DSForm

**File:** `src/DSForm.js` · **Export:** `export class DSForm`  
**Dependencies:** `DSAlert`

Full-featured AJAX form handler. Handles serialisation (JSON or FormData), validation error mapping (Laravel dot-notation → HTML elements), loading states, redirects, and lifecycle hooks.

#### Quick Start

```js
import { DSForm } from '@doyosi/laraisy';

new DSForm({
  form: '#my-form',
  toast: { enabled: true, timer: 3000 },
  onSuccess(data) { window.location.href = data.redirect ?? '/dashboard'; }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `form` | `string \| HTMLFormElement` | — | Form selector or element |
| `url` | `string` | form `action` attr | Submit URL |
| `method` | `string` | form `method` attr | HTTP method |
| `triggers` | `Array` | `[]` | External elements that trigger submission |
| `requestLib` | `string` | auto-detect | `'fetch'` \| `'axios'` \| `'xhr'` |
| `headers` | `Object` | `{}` | Custom headers |
| `additionalData` | `Object \| Function` | `{}` | Extra payload fields |
| `disableSelectors` | `Array<string>` | `[]` | Elements to disable on submit |
| `primaryButtonSelector` | `string` | `'button[type="submit"]'` | Submit button (receives loading state) |
| `loadingTemplate` | `Function \| string` | DaisyUI loading bars | Spinner HTML or selector |
| `translations` | `Object` | `{ loading, networkError, unknownError, success, error }` | i18n |
| `toast` | `Object` | `{ enabled, position, timer, timerProgressBar }` | Toast config |
| `autoRedirect` | `boolean` | `true` | Follow `payload.redirect` or `payload.url` |
| `disableOnSuccess` | `boolean` | `false` | Disable form after success |
| `successTitle` | `string` | `'Success'` | Modal title on success |
| `errorTitle` | `string` | `'Error'` | Modal title on error |
| `onBeforeSubmit` | `Function` | — | Return `false` to abort |
| `onSubmit` | `Function` | — | On submit start |
| `onSuccess` | `Function(data, response)` | — | On success |
| `onError` | `Function(error, response)` | — | On error |
| `onComplete` | `Function` | — | Always called after request |

#### Public Methods

| Method | Description |
|--------|-------------|
| `bind()` | Attach form submit listener |
| `unbind()` | Remove listener |
| `submit({ trigger })` | Programmatic submit |
| `addData(extra)` | Merge extra fields into next submission |
| `on(event, handler)` | Subscribe to lifecycle events |
| `off(event, handler)` | Unsubscribe |

#### Lifecycle Events

| Internal Event | DOM CustomEvent | Fired When |
|---------------|-----------------|------------|
| `submit:start` | `smartform:submit:start` | Submission begins |
| `success` | `smartform:success` | Server returns success |
| `error` | `smartform:error` | Server returns error |
| `submit:complete` | `smartform:submit:complete` | Request finished (success or error) |

#### Laravel Validation Error Mapping

The form maps `errors.field` from the Laravel JSON response to `.form-error[data-input="field"]` elements:

```html
<!-- Blade template -->
<input name="user[name]" class="input input-bordered" />
<span class="form-error" data-input="user.name"></span>
```

Falls back to `.form-error-summary` container or DSAlert modal if no matching element found.

#### Body Serialisation

- Detects `<input type="file">` → uses `FormData` (multipart)
- Otherwise → `JSON.stringify` with `Content-Type: application/json`
- Supports nested keys via `_assignDeep` (converts `user.name` ↔ `user[name]`)

---

### 4.7 DSGridOrTable

**File:** `src/DSGridOrTable.js` · **Export:** `export class DSGridOrTable`  
**Dependencies:** `DSTablePagination`, `DSTableSearch`, `DSTableSort`, `DSTableFilter`, `DSTableExport`, `DSTableSelection`, `DSGOTRenderer`, `DSGOTViewToggle`

Extends DSTable to support card-grid and table-row views, optionally with a toggle between them.

#### Quick Start

```js
import { DSGridOrTable } from '@doyosi/laraisy';

// Table mode
new DSGridOrTable('#container', {
  type: 'table',
  ajax_url: '/api/items',
  rowTemplate: { source: 'response', response: 'html' }
});

// Grid mode
new DSGridOrTable('#container', {
  type: 'grid',
  ajax_url: '/api/items',
  gridTemplate: { source: 'response', response: 'grid_html' }
});

// Gridable (toggle)
new DSGridOrTable('#container', {
  type: 'gridable',
  ajax_url: '/api/items',
  rowTemplate: { source: 'response', response: 'html' },
  gridTemplate: { source: 'response', response: 'grid_html' },
  defaultView: 'grid',
  showToggle: true
});
```

#### Key Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `string` | `'table'` | `'table'` \| `'grid'` \| `'gridable'` |
| `defaultView` | `string` | `'grid'` | Initial view for `gridable` mode |
| `showToggle` | `boolean` | `true` | Render view toggle buttons |
| `pagination` | `boolean` | `true` | Enable pagination |
| `search` | `boolean` | `true` | Enable search |
| `sort` | `boolean` | `true` | Enable sorting |
| `filter` | `boolean` | `true` | Enable filtering |
| `export` | `boolean` | `true` | Enable export |
| `selection` | `boolean` | `true` | Enable row selection |
| `table_source` | `string` | `'ajax'` | `'ajax'` \| `'html'` \| `'json'` |
| `ajax_url` | `string` | `null` | AJAX data URL |
| `ajax_data` | `Object` | `{}` | Extra AJAX params |
| `ajax_method` | `string` | `'GET'` | HTTP method |
| `ajax_function` | `string` | `'axios'` | `'axios'` \| `'fetch'` \| `'xhr'` |
| `rowTemplate` | `Object` | — | Table row template config |
| `gridTemplate` | `Object` | — | Grid card template config |
| `gridContainerClass` | `string` | — | CSS classes for grid wrapper |

---

### 4.8 DSLocaleSwitcher

**File:** `src/DSLocaleSwitcher.js` · **Export:** `export class DSLocaleSwitcher`

Shows/hides locale-specific input fields based on the selected locale. Ideal for multi-language CMS admin panels.

#### Quick Start

```js
import { DSLocaleSwitcher } from '@doyosi/laraisy';

new DSLocaleSwitcher('#translatable-form', {
  defaultLocale: 'en',
  onSwitch(locale) { console.log('Switched to', locale); }
});

// Static helpers
DSLocaleSwitcher.initAll('[data-ds-locale-switcher]');
DSLocaleSwitcher.create('#form', { defaultLocale: 'fr' });
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | `string` | `'en'` | Initially visible locale |
| `onSwitch` | `Function(locale)` | `null` | Callback on locale change |

#### Static Methods

| Method | Description |
|--------|-------------|
| `DSLocaleSwitcher.create(selector, config)` | Factory |
| `DSLocaleSwitcher.getInstance(element)` | Retrieve by element |
| `DSLocaleSwitcher.initAll(selector)` | Auto-initialise all matching elements |

#### Required HTML Pattern

```html
<div id="translatable-form" data-ds-locale-switcher>
  <!-- Locale buttons -->
  <button type="button" data-locale="en">EN</button>
  <button type="button" data-locale="ar">AR</button>

  <!-- Locale-specific inputs -->
  <div data-locale-field="en">
    <input name="title[en]" type="text" />
  </div>
  <div data-locale-field="ar" class="hidden">
    <input name="title[ar]" type="text" dir="rtl" />
  </div>
</div>
```

---

### 4.9 DSLogout

**File:** `src/DSLogout.js` · **Export:** `export class DSLogout`

Secure AJAX logout handler with multi-element support, event delegation, and a 4-level CSRF resolution chain.

#### Quick Start

```js
import { DSLogout } from '@doyosi/laraisy';

new DSLogout({
  elements: '.js-logout',
  url: '/logout',
  requestLibrary: 'axios',
  translations: { loading: 'Logging out…', error: 'Could not log out' }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `element` | `string \| HTMLElement` | — | Single element |
| `elements` | `string \| NodeList \| Array \| HTMLElement` | — | Multiple elements |
| `delegate` | `{ root, match }` | — | Event delegation (alternative to `elements`) |
| `url` | `string` | `'/logout'` | Logout endpoint |
| `redirect` | `string` | `null` | Redirect URL after logout (overrides server response) |
| `requestLibrary` | `string` | `'auto'` | `'auto'` \| `'axios'` \| `'fetch'` \| `'xhr'` |
| `csrfToken` | `string` | auto-resolved | Override CSRF token |
| `disabledClasses` | `Array<string>` | `['pointer-events-none', 'opacity-60', 'cursor-not-allowed']` | Classes added to elements while busy |
| `eventType` | `string` | `'click'` | DOM event to listen for |
| `translations` | `Object` | `{ loading, error }` | i18n strings |

#### CSRF Resolution Chain

1. `<meta name="csrf-token" content="...">` (preferred)
2. `data-csrf` attribute on the element
3. `window._token`
4. Browser cookie named `XSRF-TOKEN`

#### Public Methods

| Method | Description |
|--------|-------------|
| `destroy()` | Remove all event listeners |

---

### 4.10 DSNotifications

**File:** `src/DSNotifications.js` · **Export:** `export class DSNotifications`  
**Dependencies:** `DSAlert`

Full notification drawer system with polling, mark-read, mark-all-read, delete, and badge count updates.

#### Quick Start

```js
import { DSNotifications } from '@doyosi/laraisy';

new DSNotifications({
  fetchUrl: '/notifications/list',
  readUrl: '/notifications/{id}/read',
  readAllUrl: '/notifications/read-all',
  deleteUrl: '/notifications/{id}',
  unreadCountUrl: '/notifications/unread-count',
  refreshInterval: 60000
});
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `drawerToggleId` | `string` | `'notification-drawer-toggle'` | ID of the DaisyUI drawer checkbox |
| `buttonId` | `string` | `'user-notification-button'` | ID of the bell button |
| `listContainerId` | `string` | `'notification-items'` | ID of the notification list container |
| `loadingId` | `string` | `'notification-loading'` | ID of loading indicator |
| `emptyId` | `string` | `'notification-empty'` | ID of empty-state element |
| `badgeId` | `string` | `'notification-badge'` | ID of badge element inside drawer |
| `topbarBadgeSelector` | `string` | `'#user-notification-button .indicator-item'` | Selector for topbar badge |
| `markAllReadBtnId` | `string` | `'mark-all-read-btn'` | ID of mark-all-read button |
| `templateId` | `string` | `'notification-item-template'` | ID of `<template>` element for items |
| `fetchUrl` | `string` | `'/dashboard/notifications/list'` | List endpoint |
| `readUrl` | `string` | `'/dashboard/notifications/{id}/read'` | Mark-read endpoint (`{id}` placeholder) |
| `readAllUrl` | `string` | `'/dashboard/notifications/read-all'` | Mark-all-read endpoint |
| `deleteUrl` | `string` | `'/dashboard/notifications/{id}'` | Delete endpoint (`{id}` placeholder) |
| `unreadCountUrl` | `string` | `'/dashboard/notifications/unread-count'` | Unread count endpoint |
| `refreshInterval` | `number` | `60000` | Auto-refresh interval in ms |
| `iconLibrary` | `string` | `'phosphor'` | `'material-symbols'` \| `'font-awesome'` \| `'heroicons'` \| `'phosphor'` \| `'custom'` |

#### Public Methods

| Method | Description |
|--------|-------------|
| `openDrawer()` | Programmatically open the notification drawer |
| `closeDrawer()` | Close the drawer |
| `fetchNotifications()` | Reload the notification list |
| `fetchUnreadCount()` | Refresh the badge count |

---

### 4.11 DSRestore

**File:** `src/DSRestore.js` · **Export:** `export class DSRestore`  
**Dependencies:** `DSAlert`

Mirrors `DSDelete` but for soft-delete restore actions. Uses PATCH method by default.

#### Quick Start

```js
import { DSRestore } from '@doyosi/laraisy';

new DSRestore({
  onSuccess(response, element) {
    element.closest('tr')?.remove();
  }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | `string` | `'[data-restore]'` | Delegated click target |
| `method` | `string` | `'PATCH'` | HTTP method |
| `ajaxFunction` | `string` | `'axios'` | `'axios'` \| `'fetch'` |
| `icon` | `string` | `'question'` | Confirm dialog icon |
| `confirmButtonText` | `string` | `'Yes, restore it!'` | Confirm button label |
| `cancelButtonText` | `string` | `'Cancel'` | Cancel button label |
| `confirmButtonColor` | `string` | `'btn btn-sm btn-success'` | Confirm button classes |
| `successTitle` | `string` | `'Restored!'` | Success dialog title |
| `successText` | `string` | `'Item has been restored successfully.'` | Success body |
| `successIcon` | `string` | `'success'` | Success dialog icon |
| `errorTitle` | `string` | `'Error!'` | Error dialog title |
| `errorText` | `string` | `'Something went wrong.'` | Error body |
| `errorIcon` | `string` | `'error'` | Error dialog icon |
| `onSuccess` | `Function(response, element)` | — | Success callback |
| `onError` | `Function(error, element)` | — | Error callback |
| `onRestore` | `Function(element)` | — | Pre-restore hook; return `false` to cancel |

#### Required HTML

```html
<button data-restore="/api/items/1/restore" data-restore-title="Item Name">Restore</button>
```

---

### 4.12 DSSelect

**File:** `src/DSSelect.js` · **Export:** `export class DSSelect`

Advanced searchable select/dropdown with local and remote data sources, single/multiple selection, Laravel old-value support, and full event system.

#### Quick Start

```js
import { DSSelect } from '@doyosi/laraisy';

// Local options
new DSSelect('#country-select', {
  options: [{ id: 'us', name: 'United States' }, { id: 'gb', name: 'United Kingdom' }],
  placeholder: 'Choose country'
});

// Remote (axios)
new DSSelect('#user-select', {
  axiosUrl: '/api/users',
  axiosSearchParam: 'q',
  axiosDataPath: 'data',
  multiple: true,
  maxSelections: 5
});

// Static helpers
DSSelect.create('#el', config);
DSSelect.initAll('[data-ds-select]');
const instance = DSSelect.getInstance(document.querySelector('#el'));
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options` | `Array \| Object` | `[]` | `[{id, name}]` or `{key: label}` |
| `axiosUrl` | `string` | `null` | Remote data URL |
| `axiosMethod` | `string` | `'GET'` | HTTP method for remote |
| `axiosParams` | `Object` | `{}` | Extra query params |
| `axiosSearchParam` | `string` | `'search'` | Search query param name |
| `axiosDataPath` | `string` | `'data'` | Dot-path to options in response |
| `valueKey` | `string` | `'id'` | Key for option value |
| `labelKey` | `string` | `'name'` | Key for option label |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `maxSelections` | `number` | `null` | Max selections in multiple mode |
| `searchable` | `boolean` | `true` | Enable search input |
| `searchMinLength` | `number` | `0` | Min chars to trigger search |
| `searchDebounce` | `number` | `300` | Debounce delay in ms |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `searchPlaceholder` | `string` | `'Type to search...'` | Search input placeholder |
| `noResultsText` | `string` | `'No results found'` | Text when no match |
| `loadingText` | `string` | `'Loading...'` | Text while fetching |
| `clearable` | `boolean` | `true` | Show clear button |
| `disabled` | `boolean` | `false` | Disable the select |
| `closeOnSelect` | `boolean` | `true` | Close dropdown on selection (single mode) |
| `openOnFocus` | `boolean` | `true` | Open on input focus |
| `maxHeight` | `string` | `'240px'` | Dropdown max-height |
| `wrapperClass` | `string` | `''` | Extra classes on wrapper |
| `inputClass` | `string` | `''` | Extra classes on input |
| `dropdownClass` | `string` | `''` | Extra classes on dropdown |
| `optionClass` | `string` | `''` | Extra classes on option items |
| `translations` | `Object` | `{ noResults, loading, maxSelected }` | i18n |

#### Data Attributes (auto-parsed from wrapper element)

`data-options` · `data-axios-url` · `data-multiple` · `data-placeholder` · `data-value-key` · `data-label-key` · `data-clearable` · `data-disabled` · `data-max-selections`

#### Laravel Value Priority

`data-old-value` → `data-current-value` → `data-default-value` → `config.initialValue`

#### Public Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the dropdown |
| `close()` | Close the dropdown |
| `clear()` | Clear selection |
| `getValue()` | Get current value(s) |
| `setValue(value)` | Set value programmatically |
| `enable()` | Enable the select |
| `disable()` | Disable the select |
| `destroy()` | Remove DOM and listeners |

#### Events

| Event | Fired When |
|-------|-----------|
| `search` | Search query changes |
| `select` | An option is selected |
| `deselect` | An option is deselected (multiple mode) |
| `change` | Value changes |
| `maxReached` | `maxSelections` limit hit |
| `load` | Remote data loaded |
| `error` | Remote fetch failed |
| `open` | Dropdown opened |
| `close` | Dropdown closed |

Listen with `instance.on('change', handler)` or `element.addEventListener('dsselect:change', handler)`.

#### Hidden Input

Auto-created with `name` from `data-name` attribute. Appends `[]` for multiple mode.

---

### 4.13 DSSelectBox

**File:** `src/DSSelectBox.js` · **Export:** `export class DSSelectBox`

Dual-list (available ↔ selected) selector for transferring items between two lists. Supports search/filter on both lists, select-all, invert selection, and AJAX data source.

#### Quick Start

```js
import { DSSelectBox } from '@doyosi/laraisy';

new DSSelectBox('#selectbox-wrapper', {
  availableOptions: [{ id: 1, name: 'Option A' }, { id: 2, name: 'Option B' }],
  selectedOptions: [{ id: 3, name: 'Option C' }],
  valueKey: 'id',
  labelKey: 'name',
  onChange(selected) { console.log('Selected IDs:', selected.map(o => o.id)); }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `availableOptions` | `Array` | `[]` | Items in the left (available) list |
| `selectedOptions` | `Array` | `[]` | Items in the right (selected) list |
| `axiosUrl` | `string` | `null` | Remote URL to fetch available options |
| `valueKey` | `string` | `'id'` | Key for item value |
| `labelKey` | `string` | `'name'` | Key for item label |
| `onChange` | `Function(selected)` | — | Callback when selection changes |

#### Default Icons

Uses Material Symbols: `chevron_right`, `chevron_left`, `keyboard_double_arrow_right`, `keyboard_double_arrow_left`.  
Override via `DSSelectBox.defaultIcons`.

---

### 4.14 DSSimpleSlider

**File:** `src/DSSimpleSlider.js` · **Export:** `class DSSimpleSlider`

Carousel/Slider component with auto-play, hover-pause, animated timer border, and click-to-navigate support.

#### Quick Start

```js
import DSSimpleSlider from '@doyosi/laraisy/src/DSSimpleSlider.js';

new DSSimpleSlider('#hero-slider', {
  source: 'ajax',
  ajax_url: '/api/slides',
  autoPlay: true,
  interval: 5000,
  pauseOnHover: true
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | `string` | `'ajax'` | `'ajax'` \| `'json'` \| `'html'` |
| `ajax_url` | `string` | — | Data endpoint (for `ajax` source) |
| `ajax_method` | `string` | `'GET'` | HTTP method |
| `ajax_data` | `Object` | `{}` | Extra request params |
| `ajax_function` | `string` | `'axios'` | `'axios'` \| `'fetch'` \| `'xhr'` |
| `data` | `Array` | `[]` | Slide data (for `json` source) |
| `autoPlay` | `boolean` | `true` | Enable auto-advance |
| `interval` | `number` | `5000` | Auto-play interval in ms |
| `pauseOnHover` | `boolean` | `true` | Pause on mouse hover |

---

### 4.15 DSSvgFetch

**File:** `src/DSSvgFetch.js` · **Export:** `export class DSSvgFetch`

Fetches SVG files from URLs and injects them inline into the page. Uses a `Map`-based in-memory cache to avoid duplicate requests.

#### Quick Start

```js
import { DSSvgFetch } from '@doyosi/laraisy';

const fetcher = new DSSvgFetch({
  selector: '.icon-fetch-web',
  attribute: 'data-svg',
  classAttribute: 'data-class'
});
fetcher.init();
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selector` | `string` | `'.icon-fetch-web'` | Elements to process |
| `attribute` | `string` | `'data-svg'` | Attribute holding the SVG URL |
| `classAttribute` | `string` | `'data-class'` | Attribute holding CSS classes for the injected SVG |

#### Public Methods

| Method | Description |
|--------|-------------|
| `init()` | Process all matching elements on the page |
| `processElement(element)` | Process a single element |
| `fetchSvg(url)` | Fetch and cache SVG from URL; returns `Promise<string>` |

#### Required HTML

```html
<span class="icon-fetch-web"
      data-svg="/icons/star.svg"
      data-class="w-5 h-5 text-primary">
</span>
```

After `init()`, the `<span>` is replaced by the inline `<svg>` with the specified classes applied.

---

### 4.16 DSSvgUpload

**File:** `src/DSSvgUpload.js` · **Export:** `export class DSSvgUpload`

Specialised SVG icon uploader with a horizontal layout: `[60×60 Icon Preview] [Dropzone/Actions]`. Supports drag-and-drop, SVG-only validation, preview, and reset.

#### Quick Start

```js
import { DSSvgUpload } from '@doyosi/laraisy';

new DSSvgUpload('#svg-upload-wrapper', {
  inputName: 'icon',
  maxSize: 512 * 1024 // 512 KB
});
```

#### Static Properties

| Property | Description |
|----------|-------------|
| `DSSvgUpload.instances` | `Map` of all instances by ID |
| `DSSvgUpload.instanceCounter` | Auto-increment counter |
| `DSSvgUpload.icons` | Override default UI icons |

---

### 4.17 DSTable

**File:** `src/DSTable.js` · **Export:** `export class DSTable`  
**Dependencies:** `DSTablePagination`, `DSTableSearch`, `DSTableSort`, `DSTableFilter`, `DSTableExport`, `DSTableSelection`

Full-featured data table with server-side or client-side pagination, sorting, filtering, search, CSV/Excel export, and row selection.

#### Quick Start

```js
import { DSTable } from '@doyosi/laraisy';

new DSTable('#table-wrapper', {
  ajax_url: '/api/users',
  ajax_function: 'axios',
  pagination: true,
  search: true,
  sort: true,
  filter: true,
  export: true,
  selection: true,
  success(data) { console.log('Loaded', data); }
});
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pagination` | `boolean` | `true` | Enable pagination |
| `search` | `boolean` | `true` | Enable search |
| `sort` | `boolean` | `true` | Enable sorting |
| `filter` | `boolean` | `true` | Enable filtering |
| `export` | `boolean` | `true` | Enable export |
| `selection` | `boolean` | `true` | Enable row selection |
| `table_source` | `string` | `'ajax'` | `'ajax'` \| `'html'` \| `'json'` |
| `ajax_url` | `string` | `null` | Data endpoint |
| `ajax_data` | `Object` | `{}` | Extra params sent with every request |
| `ajax_method` | `string` | `'GET'` | HTTP method |
| `ajax_function` | `string` | `'axios'` | `'axios'` \| `'fetch'` \| `'xhr'` |
| `pagination_translations` | `Object` | `{ prev, next, goto, stats }` | Pagination i18n |
| `table_translations` | `Object` | `{ no_data, loading, error, empty }` | Table state i18n |
| `iconLibrary` | `string` | `'material-symbols'` | `'material-symbols'` \| `'font-awesome'` \| `'heroicons'` \| `'phosphor'` \| `'custom'` |
| `tableSelector` | `string` | `'table'` | Selector for the `<table>` element |
| `bodySelector` | `string` | `'tbody'` | Selector for `<tbody>` |
| `messageSelector` | `string` | `'.ds-table-message'` | Selector for status message area |
| `success` | `Function(data)` | — | Called after successful data load |
| `error` | `Function(err)` | — | Called on load failure |
| `beforeSend` | `Function` | — | Called before each request |

#### Sub-Modules

| Module | File | Responsibility |
|--------|------|---------------|
| `DSTablePagination` | `DSTable/DSTablePagination.js` | Page navigation, page-size selection |
| `DSTableSearch` | `DSTable/DSTableSearch.js` | Debounced search input |
| `DSTableSort` | `DSTable/DSTableSort.js` | Column header click sorting |
| `DSTableFilter` | `DSTable/DSTableFilter.js` | Filterable column dropdowns |
| `DSTableExport` | `DSTable/DSTableExport.js` | CSV / Excel export |
| `DSTableSelection` | `DSTable/DSTableSelection.js` | Row checkbox selection |

---

### 4.18 DSTabs

**File:** `src/DSTabs.js` · **Export:** `export class DSTabs`

Lightweight tab switching with button/link click handlers, radio input synchronisation, and CSS class-based content show/hide.

#### Quick Start

```js
import { DSTabs } from '@doyosi/laraisy';

new DSTabs('#tab-container', {
  onTabChange(tab, prevTab) { console.log(`Switched: ${prevTab} → ${tab}`); }
});

// Static helpers
DSTabs.create('#container', config);
DSTabs.getInstance(element);
```

#### Constructor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buttonSelector` | `string` | `'button[data-tab], a[data-tab]'` | Tab trigger buttons/links |
| `radioSelector` | `string` | `'input[type="radio"][data-tab]'` | Tab radio inputs |
| `contentSelector` | `string` | `'.tab-content'` | Tab content containers |
| `tabsContainer` | `string` | `'.tabs'` | Container for radios + content |
| `tabsContainerGlobal` | `boolean` | `false` | Search `tabsContainer` in document instead of main container |
| `activeClass` | `string` | `'active'` | Class added to active button |
| `disableActive` | `boolean` | `true` | Disable the currently active button |
| `showFirst` | `boolean` | `true` | Auto-show first tab on init |
| `buttonActiveClass` | `string` | `'btn-active'` | Additional class for active button |
| `contentHiddenClass` | `string` | `'hidden'` | Class to hide inactive content |
| `onTabChange` | `Function(tab, prevTab)` | `null` | Callback on tab change |

#### Required HTML

```html
<div id="tab-container">
  <!-- Trigger buttons -->
  <div class="flex gap-2">
    <button data-tab="overview" class="btn">Overview</button>
    <button data-tab="settings" class="btn">Settings</button>
  </div>

  <!-- DaisyUI tabs (radio sync) -->
  <div class="tabs">
    <input type="radio" name="my_tabs" data-tab="overview" checked />
    <input type="radio" name="my_tabs" data-tab="settings" />

    <!-- Content areas -->
    <div class="tab-content">Overview content…</div>
    <div class="tab-content hidden">Settings content…</div>
  </div>
</div>
```

---

### 4.19 DSUpload

**File:** `src/DSUpload.js` · **Export:** `export class DSUpload`

Comprehensive file uploader with image/file preview, progress bar, file type validation, file size validation, old/default image support, reset, drag-and-drop, and full event system.

#### Quick Start

```js
import { DSUpload } from '@doyosi/laraisy';

new DSUpload('#upload-wrapper', {
  inputName: 'photo',
  accept: 'image/*',
  maxSize: 2 * 1024 * 1024, // 2 MB
  multiple: false
});
```

#### Static Properties

| Property | Description |
|----------|-------------|
| `DSUpload.instances` | `Map` of all active instances |
| `DSUpload.instanceCounter` | Auto-increment counter |
| `DSUpload.icons` | Override default UI icons |

---

## 5. Cross-Cutting Patterns

### 5.1 CSRF Token Auto-Detection

All HTTP-mutating components resolve the CSRF token via a 4-level fallback chain:

```
1. <meta name="csrf-token" content="...">    ← Laravel default
2. <input name="_token" value="...">         ← Hidden form input
3. window._token                             ← Global JS variable
4. document.cookie (XSRF-TOKEN)             ← Cookie fallback
```

Sent as `X-CSRF-TOKEN` request header.

**Recommended Blade setup:**

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

### 5.2 Transport Layer Fallback

Most components use this resolution order:

```
window.axios available?  → use axios
else window.fetch?       → use fetch
else                     → use XMLHttpRequest
```

Force a specific library with `requestLib: 'axios'|'fetch'|'xhr'` (exact option name varies by component — see individual config tables).

### 5.3 i18n / Translations

Every user-facing string is configurable via a `translations` object passed to the constructor. Example (DSDelete):

```js
new DSDelete({
  translations: {
    title: 'Emin misiniz?',
    text: 'Bu işlem geri alınamaz!',
    confirmButtonText: 'Evet, sil!',
    cancelButtonText: 'İptal',
    successTitle: 'Silindi!',
    successText: 'Kayıt başarıyla silindi.',
    errorTitle: 'Hata!',
    errorText: 'Bir hata oluştu.'
  }
});
```

### 5.4 Event System

All components support two event layers:

1. **Internal event emitter** — `instance.on(event, handler)` / `instance.off(event, handler)`
2. **DOM CustomEvent** bubbling on `document` — e.g., `ds:delete:success`, `smartform:success`, `dsbutton:error`

Listen to DOM events globally:

```js
document.addEventListener('ds:delete:success', (e) => {
  console.log('Deleted:', e.detail);
});
```

### 5.5 DaisyUI CSS Classes Used

Components rely on these DaisyUI 5.x utility classes. Ensure DaisyUI 5.1.14+ is loaded.

| Class | Used By |
|-------|---------|
| `btn`, `btn-primary`, `btn-soft`, `btn-error`, `btn-success`, `btn-neutral` | DSAlert, DSDelete, DSRestore, DSButtonForm |
| `loading`, `loading-bars`, `loading-spinner`, `loading-md`, `loading-sm` | DSForm, DSButtonForm, DSSelect |
| `alert` | DSAlert (toast wrapper) |
| `input`, `input-bordered` | DSSelect, DSForm error display |
| `badge`, `indicator-item` | DSNotifications |

### 5.6 Static Instance Registry

Several components maintain a static `Map` registry for programmatic retrieval:

```js
// Components with static instances registry:
// DSSelect, DSSelectBox, DSTabs, DSUpload, DSSvgUpload, DSLocaleSwitcher

const instance = DSSelect.getInstance('#my-select');
instance.setValue('US');
```

---

## 6. Laravel Backend Expectations

### Standard JSON Response

```json
{
  "message": "Operation completed successfully.",
  "data": {
    "redirect": "/dashboard",
    "id": 42
  }
}
```

### Validation Error Response (HTTP 422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "user.name": ["The name field is required."],
    "email": ["The email has already been taken."]
  }
}
```

DSForm maps `errors.user.name` → `<span class="form-error" data-input="user.name"></span>`  
and `errors.email` → `<span class="form-error" data-input="email"></span>`.

### Delete / Restore Response

```json
{ "message": "Item deleted successfully." }
```

### Notification List Response

```json
{
  "data": [
    {
      "id": 1,
      "title": "New message",
      "body": "You have a new message.",
      "icon": "bell",
      "read_at": null,
      "created_at": "2025-03-01T12:00:00Z"
    }
  ]
}
```

### Unread Count Response

```json
{ "count": 5 }
```

---

## 7. Integration Recipes

### Recipe 1: AJAX Form with Toast + Redirect

```js
import { DSForm } from '@doyosi/laraisy';

new DSForm({
  form: '#create-user-form',
  toast: { enabled: true, position: 'top-end', timer: 3000, timerProgressBar: true },
  autoRedirect: true,
  onSuccess(data) {
    // Fires before autoRedirect — use for cleanup
    console.log('User created:', data);
  }
});
```

```html
<form id="create-user-form" action="/users" method="POST">
  @csrf
  <input name="name" class="input input-bordered" />
  <span class="form-error" data-input="name"></span>
  <input name="email" type="email" class="input input-bordered" />
  <span class="form-error" data-input="email"></span>
  <button type="submit" class="btn btn-primary">Create</button>
</form>
```

### Recipe 2: Delete Row from Table

```js
import { DSDelete } from '@doyosi/laraisy';

new DSDelete({
  selector: '[data-delete]',
  translations: { title: 'Delete User?', confirmButtonText: 'Delete' },
  onSuccess(response, element) {
    element.closest('tr')?.remove();
  }
});
```

```html
<tr>
  <td>John Doe</td>
  <td>
    <button data-delete="/users/1" data-delete-title="John Doe"
            class="btn btn-sm btn-error">Delete</button>
  </td>
</tr>
```

### Recipe 3: Searchable Select with Remote Data

```js
import { DSSelect } from '@doyosi/laraisy';

new DSSelect('#category-select', {
  axiosUrl: '/api/categories',
  axiosSearchParam: 'q',
  axiosDataPath: 'data',
  valueKey: 'id',
  labelKey: 'name',
  placeholder: 'Search categories…',
  multiple: false,
  clearable: true
});
```

```html
<div id="category-select"
     data-name="category_id"
     data-old-value="{{ old('category_id') }}"
     data-current-value="{{ $item->category_id ?? '' }}">
</div>
```

### Recipe 4: Inline SVG Icons

```js
import { DSSvgFetch } from '@doyosi/laraisy';

// On page load
new DSSvgFetch({ selector: '.svg-icon' }).init();

// Or re-process after dynamic content insertion
const fetcher = new DSSvgFetch();
document.querySelectorAll('.svg-icon').forEach(el => fetcher.processElement(el));
```

```html
<span class="svg-icon" data-svg="/icons/home.svg" data-class="w-5 h-5 text-primary"></span>
<span class="svg-icon" data-svg="/icons/user.svg" data-class="w-5 h-5 text-gray-600"></span>
```

### Recipe 5: Notification Bell with Polling

```js
import { DSNotifications } from '@doyosi/laraisy';

new DSNotifications({
  fetchUrl: '/api/notifications',
  readUrl: '/api/notifications/{id}/read',
  readAllUrl: '/api/notifications/read-all',
  deleteUrl: '/api/notifications/{id}',
  unreadCountUrl: '/api/notifications/unread-count',
  refreshInterval: 30000,
  iconLibrary: 'phosphor'
});
```

```html
<!-- Topbar bell button -->
<div class="indicator">
  <button id="user-notification-button" class="btn btn-ghost btn-circle">
    <i class="ph ph-bell text-xl"></i>
    <span class="indicator-item badge badge-primary badge-sm">0</span>
  </button>
</div>

<!-- DaisyUI Drawer -->
<input type="checkbox" id="notification-drawer-toggle" class="drawer-toggle" />
<div class="drawer-side z-50">
  <label for="notification-drawer-toggle" class="drawer-overlay"></label>
  <div class="bg-base-100 w-80 h-full p-4">
    <div id="notification-items"></div>
    <div id="notification-loading" class="hidden">Loading…</div>
    <div id="notification-empty" class="hidden">No notifications</div>
    <button id="mark-all-read-btn" class="btn btn-sm btn-ghost">Mark all read</button>
  </div>
</div>

<!-- Notification item template -->
<template id="notification-item-template">
  <div class="notification-item" data-id="">
    <span class="notification-icon"></span>
    <div>
      <p class="notification-title font-semibold"></p>
      <p class="notification-body text-sm text-gray-500"></p>
      <time class="notification-time text-xs text-gray-400"></time>
    </div>
    <button class="notification-read-btn btn btn-xs">Read</button>
    <button class="notification-delete-btn btn btn-xs btn-error">×</button>
  </div>
</template>
```

---

## 8. File-to-Component Mapping

| File | Export Name | Export Type | Category |
|------|-------------|-------------|----------|
| `src/CodeInput.js` | `CodeInput` | `export default class` | Input |
| `src/DSAlert.js` | `DSAlert` | `export class` | Feedback |
| `src/DSAvatar.js` | `DSAvatar` | `export class` | Upload |
| `src/DSButtonForm.js` | `DSButtonForm` | `export class` | Form / Action |
| `src/DSDelete.js` | `DSDelete` | `export class` + `default` | CRUD Action |
| `src/DSForm.js` | `DSForm` | `export class` | Form |
| `src/DSGridOrTable.js` | `DSGridOrTable` | `export class` | Data Display |
| `src/DSLocaleSwitcher.js` | `DSLocaleSwitcher` | `export class` | i18n / UI |
| `src/DSLogout.js` | `DSLogout` | `export class` | Auth |
| `src/DSNotifications.js` | `DSNotifications` | `export class` | Notifications |
| `src/DSRestore.js` | `DSRestore` | `export class` | CRUD Action |
| `src/DSSelect.js` | `DSSelect` | `export class` | Input / Select |
| `src/DSSelectBox.js` | `DSSelectBox` | `export class` | Input / Select |
| `src/DSSimpleSlider.js` | `DSSimpleSlider` | `class` (non-named) | Display |
| `src/DSSvgFetch.js` | `DSSvgFetch` | `export class` | Utility |
| `src/DSSvgUpload.js` | `DSSvgUpload` | `export class` | Upload |
| `src/DSTable.js` | `DSTable` | `export class` | Data Display |
| `src/DSTabs.js` | `DSTabs` | `export class` | Navigation |
| `src/DSUpload.js` | `DSUpload` | `export class` | Upload |

---

## 9. AI Agent Constraints & Notes

1. **Browser-only:** All components require `document` and `window`. They will throw or silently fail in Node.js, SSR, or non-browser environments. Do not attempt to import them in server-side code.

2. **No build step required:** Source `src/*.js` files are directly importable as native ESM. No transpilation or bundling is necessary (though bundling is supported).

3. **Peer dependency fallbacks:** `axios` (if `window.axios` is defined) and `tippy.js` (if `window.tippy` is defined) are used automatically when present. Components gracefully fall back to `fetch` or `XMLHttpRequest` when axios is absent.

4. **Laravel-centric:** CSRF handling, validation error JSON structure (`errors.field`), and redirect patterns all assume a Laravel backend. The pattern `{ message, errors: { field: [messages] }, data: { redirect? } }` is the assumed server response contract.

5. **DaisyUI 5.x required:** Components reference DaisyUI 5.1.14 component classes. Using with DaisyUI v4.x or lower may cause visual inconsistencies.

6. **Tailwind v4.1:** Utility classes follow Tailwind CSS v4.1 syntax. Ensure your Tailwind configuration is v4.1-compatible.

7. **All components are classes:** Instantiate with `new ComponentName(selector, config)`. Some also provide static factory methods (`DSAlert.fire()`, `DSSelect.create()`, `DSTabs.create()`, `DSLocaleSwitcher.create()`). The static methods are preferred for one-liners; use `new` when you need the instance reference.

8. **Multiple instances:** Components that maintain a static `instances` Map (`DSSelect`, `DSSelectBox`, `DSTabs`, `DSUpload`, `DSSvgUpload`, `DSLocaleSwitcher`) support multiple independent instances on the same page. Retrieve instances programmatically with the static `getInstance(element)` method.

9. **Index barrel exports:** Import from `@doyosi/laraisy` (the barrel `src/index.js`) for tree-shaking. All components except `CodeInput` (default export) and `DSSimpleSlider` (non-named export) can be destructured:
   ```js
   import { DSForm, DSAlert, DSSelect } from '@doyosi/laraisy';
   // CodeInput requires:
   import CodeInput from '@doyosi/laraisy/src/CodeInput.js';
   ```

10. **DOM readiness:** Instantiate components after the DOM is ready (inside `DOMContentLoaded` or at the bottom of `<body>`):
    ```js
    document.addEventListener('DOMContentLoaded', () => {
      new DSForm({ form: '#my-form' });
    });
    ```
