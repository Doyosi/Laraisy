# DSAvatar Usage Guide

`DSAvatar` is a specialized JavaScript component for managing user avatar file uploads, instant preview updates, loading states, and avatar reset operations via AJAX.

## Installation

```javascript
import { DSAvatar } from '@doyosi/laraisy';
```

---

## Basic Usage

### HTML Structure

The component requires a container wrapper (`.avatar-uploader`) with data attributes specifying the API endpoints and child elements identified by `data-ds-avatar-*` attributes.

```html
<div class="avatar-uploader flex items-center gap-4" 
     data-upload-url="/profile/avatar" 
     data-remove-url="/profile/avatar/remove"
     data-name="avatar">
    
    <div class="relative w-20 h-20 rounded-full overflow-hidden">
        <!-- Avatar Image -->
        <img src="/storage/avatars/user-123.jpg" class="w-full h-full object-cover" data-ds-avatar-img alt="User Avatar" />
        
        <!-- Loading Overlay (Optional) -->
        <div class="absolute inset-0 bg-black/50 flex items-center justify-center hidden" data-ds-avatar-loading>
            <span class="loading loading-spinner loading-md text-white"></span>
        </div>
    </div>

    <!-- Hidden File Input -->
    <input type="file" class="hidden" accept="image/*" data-ds-avatar-input />

    <!-- Action Buttons -->
    <div class="flex gap-2">
        <button type="button" class="btn btn-sm btn-primary" data-ds-avatar-action="trigger-upload" data-tippy-content="Upload new picture">
            Change
        </button>
        <button type="button" class="btn btn-sm btn-soft btn-error" data-ds-avatar-action="trigger-remove" data-tippy-content="Reset to default avatar">
            Remove
        </button>
    </div>
</div>
```

### JavaScript Initialization

```javascript
import { DSAvatar } from '@doyosi/laraisy';

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.avatar-uploader')) {
        const avatar = new DSAvatar('.avatar-uploader', {
            headers: {
                'X-Custom-Header': 'value'
            }
        });
    }
});
```

---

## Required Data Attributes

### Wrapper Data Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-upload-url` | Yes | Endpoint URL for avatar upload (POST request sending FormData) |
| `data-remove-url` | Yes | Endpoint URL for avatar reset (POST request with `_method: DELETE`) |
| `data-name` | Yes | Form field name for file upload (e.g. `avatar`) |

### Child Element Target Attributes

| Attribute | Element | Required | Description |
|-----------|---------|----------|-------------|
| `data-ds-avatar-img` | `<img>` | Yes | Avatar image tag updated dynamically upon upload/reset |
| `data-ds-avatar-input` | `<input type="file">` | Yes | Hidden file input element |
| `data-ds-avatar-action="trigger-upload"` | `<button>` | Yes | Trigger button to open file selector |
| `data-ds-avatar-action="trigger-remove"` | `<button>` | Optional | Action button to reset avatar to default |
| `data-ds-avatar-loading` | `<div>` | Optional | Overlay element displayed during pending AJAX requests |

---

## Backend API Specs

### Upload Endpoint Response (`POST` to `data-upload-url`)

Expects a JSON response:

```json
{
    "success": true,
    "url": "https://example.com/storage/avatars/new-avatar.png",
    "message": "Avatar updated successfully"
}
```

### Reset Endpoint Response (`DELETE` to `data-remove-url`)

Expects a JSON response returning the default placeholder URL:

```json
{
    "success": true,
    "url": "https://example.com/assets/images/default-avatar.png",
    "message": "Avatar reset successfully"
}
```

---

## Dependencies

- **DSAlert** (Optional): Used automatically to render success/error toasts upon upload or reset.
- **Tippy.js** (Optional): Automatically initialized on action buttons if `window.tippy` is present.
