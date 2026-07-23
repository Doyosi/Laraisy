# DSUpload Usage Guide

`DSUpload` is a comprehensive file upload component supporting drag-and-drop file selection, real-time image/file preview, size & MIME type validation, progress tracking, and optional AJAX uploads.

## Installation

```javascript
import { DSUpload } from '@doyosi/laraisy';

// Auto-initialize elements with [data-ds-upload]
DSUpload.initAll();
```

---

## Basic Usage

### HTML Structure

`DSUpload` requires an `<input type="file">` element (or a wrapper containing one) with `data-ds-upload`.

```html
<!-- Single File Upload Input -->
<div class="form-group mb-4">
    <label class="form-label">Avatar Image</label>
    <input type="file" 
           data-ds-upload 
           name="avatar" 
           accept="image/*"
           data-upload-url="/api/upload/avatar"
           data-remove-url="/api/upload/avatar/remove"
           data-default-image="/assets/images/default-avatar.png"
           data-old-value="/storage/avatars/user-1.jpg" />
</div>
```

### JavaScript Initialization

```javascript
import { DSUpload } from '@doyosi/laraisy';

// Manual initialization
const uploader = new DSUpload('input[name="avatar"]', {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/*',
    uploadUrl: '/api/upload/avatar',
    autoUpload: true
});
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accept` | `string` | `'*'` | Accepted MIME types / file extensions (e.g. `'image/*', '.pdf,.docx'`) |
| `maxSize` | `number` | `5242880` | Maximum file size in bytes (default 5MB) |
| `minSize` | `number` | `0` | Minimum file size in bytes |
| `preview` | `boolean` | `true` | Enable preview rendering for images and document file icons |
| `previewMaxHeight` | `string` | `'200px'` | Maximum height of preview image container |
| `defaultImage` | `string` | `null` | Default placeholder image URL |
| `oldValue` | `string` | `null` | Existing file URL for edit forms |
| `dropzone` | `boolean` | `true` | Enable drag and drop functionality |
| `dropzoneText` | `string` | `'Drop file here or click to upload'` | Text displayed inside dropzone area |
| `browseText` | `string` | `'Browse'` | Text displayed on file selection button |
| `showProgressBar` | `boolean` | `true` | Show progress bar during AJAX upload |
| `showFileInfo` | `boolean` | `true` | Show file name and human-readable file size |
| `showResetButton` | `boolean` | `true` | Show reset button to restore initial state |
| `showRemoveButton` | `boolean` | `true` | Show remove button to clear selected file |
| `autoUpload` | `boolean` | `false` | Automatically upload file via AJAX upon selection |
| `uploadUrl` | `string` | `null` | Target URL for AJAX upload endpoint |
| `removeUrl` | `string` | `null` | Target URL for AJAX removal endpoint |
| `uploadMethod` | `string` | `'POST'` | HTTP method for upload request |
| `sizeUnit` | `'auto' \| 'KB' \| 'MB' \| 'GB'` | `'auto'` | Unit formatting for file size display |
| `translations` | `Object` | *default messages* | i18n text strings for UI elements and error dialogs |

---

## Static & Instance Methods

```javascript
// Auto-initialize matching elements
DSUpload.initAll('[data-ds-upload]');

// Factory creation
const instance = DSUpload.create('#file-input', config);

// Instance retrieval
const uploader = DSUpload.getInstance('#file-input');

// Methods
uploader.reset();                         // Reset uploader to original state (oldValue / defaultImage)
uploader.removeFile();                    // Clear selected file and reset DOM
uploader.upload();                        // Trigger AJAX file upload
uploader.destroy();                       // Clean up event listeners and restore original DOM
```

---

## Event Listener API

### Internal Event Emitter (`.on()`)

```javascript
uploader.on('change', ({ file }) => console.log('Selected file:', file.name));
uploader.on('upload:start', () => console.log('Upload started'));
uploader.on('upload:progress', ({ percent }) => console.log(`Progress: ${percent}%`));
uploader.on('upload:success', ({ response }) => console.log('Upload success:', response));
uploader.on('upload:error', ({ error }) => console.error('Upload error:', error));
uploader.on('reset', () => console.log('Form reset'));
uploader.on('remove', () => console.log('File removed'));
```

### DOM CustomEvents

`DSUpload` dispatches custom events on the input element:

```javascript
document.querySelector('input[data-ds-upload]').addEventListener('dsupload:upload:success', (e) => {
    console.log('Upload payload:', e.detail.response);
});
```
