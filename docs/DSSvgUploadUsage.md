# DSSvgUpload Usage Guide

`DSSvgUpload` is a specialized file upload component optimized specifically for SVG icons. It renders a horizontal compact layout featuring a 60x60px icon preview box alongside an interactive dropzone and state management UI.

## Installation

```javascript
import { DSSvgUpload } from '@doyosi/laraisy';
```

---

## Basic Usage

### HTML Structure

`DSSvgUpload` requires an `<input type="file">` element (or a container holding one) with the `data-ds-svg-upload` attribute.

```html
<!-- Input tag mode (Recommended) -->
<div class="form-group mb-4">
    <label class="form-label">Category Icon (SVG)</label>
    <input type="file" 
           data-ds-svg-upload 
           name="icon" 
           data-upload-url="/api/upload/icon"
           data-remove-url="/api/upload/icon/remove"
           data-default-image="/assets/images/default-icon.svg"
           data-old-value="/storage/icons/category-1.svg" />
</div>
```

### JavaScript Initialization

```javascript
import { DSSvgUpload } from '@doyosi/laraisy';

// Auto-initialize all elements with [data-ds-svg-upload]
DSSvgUpload.initAll();

// Or manual instantiation:
const uploader = new DSSvgUpload('input[name="icon"]', {
    uploadUrl: '/api/upload/icon',
    maxSize: 2 * 1024 * 1024 // 2MB
});
```

---

## Key Features & Layout

- **Strict SVG Validation**: Enforces `accept=".svg,image/svg+xml"` and restricts non-SVG file selections.
- **Compact Horizontal Layout**:
  - Left: 60x60px Preview Box showcasing current SVG preview, placeholder icon, or loading spinner.
  - Right: Interactive Dropzone ("Upload SVG Icon" / "Browse"), File Info (name & size), Progress Bar, and Reset/Remove Action Buttons.
- **Edit Mode Support**: Displays existing SVG icons seamlessly via `data-old-value` or `data-default-image`.

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | `string` | `'.svg,image/svg+xml'` | Allowed file extensions and mime types |
| `dropzoneText` | `string` | `'Upload SVG Icon'` | Placeholder text inside dropzone |
| `wrapperClass` | `string` | `'w-full'` | Custom classes for main container |
| `iconBoxClass` | `string` | `'bg-base-200 border border-base-300'` | Tailwind classes for 60x60px icon preview container |
| `preview` | `boolean` | `true` | Enable SVG preview rendering |
| `previewMaxHeight` | `string` | `'60px'` | Max height of rendered SVG inside preview box |
| `defaultImage` | `string` | `null` | Default/fallback placeholder SVG URL |
| `oldValue` | `string` | `null` | Existing file URL for edit forms |
| `maxSize` | `number` | `2097152` | Max file size in bytes (2MB) |
| `autoUpload` | `boolean` | `false` | Automatically upload file via AJAX upon selection |
| `uploadUrl` | `string` | `null` | Target URL for AJAX upload endpoint |
| `removeUrl` | `string` | `null` | Target URL for AJAX file deletion endpoint |
| `uploadMethod` | `string` | `'POST'` | HTTP method for AJAX upload |
| `uploadFieldName` | `string` | `null` | Custom field name for file payload in FormData |
| `translations` | `Object` | *default messages* | i18n text strings for UI and validation errors |

---

## Static & Instance Methods

```javascript
// Auto-initialize matching elements
DSSvgUpload.initAll('[data-ds-svg-upload]');

// Factory method
const uploader = DSSvgUpload.create(element, config);

// Get active instance by element
const instance = DSSvgUpload.getInstance(element);

// Instance Methods
instance.reset();                          // Reset to default / initial state
instance.removeFile();                     // Clear selected file
instance.upload();                         // Manually trigger AJAX upload
```

---

## Events

```javascript
const instance = DSSvgUpload.getInstance('input[name="icon"]');

instance.on('change', ({ file }) => console.log('File selected:', file));
instance.on('upload:success', ({ response }) => console.log('Upload success:', response));
instance.on('upload:error', ({ error }) => console.error('Upload error:', error));
instance.on('reset', () => console.log('Uploader reset'));
```
