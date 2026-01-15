# DSRestore Usage Guide

`DSRestore` is a plugin to handle restore actions for soft-deleted items with confirmation dialogs (via `DSAlert`) and AJAX requests (default `PATCH` method).

## Installation

Ensure `DSRestore.js` and `DSAlert.js` are available in your assets.

```javascript
import { DSRestore } from '@doyosi/laraisy';
// Initialize globally or per page, ideally OUTSIDE render loops
const dsRestore = new DSRestore();
```

## HTML Usage

Add `data-restore` attribute to any button or link. The value should be the URL to send the PATCH request to.

```html
<!-- Simple Restore -->
<button data-restore="/dashboard/pages/1/restore" class="btn btn-success">
    Restore Page
</button>

<!-- Restore with custom title in confirmation -->
<button data-restore="/dashboard/pages/1/restore" data-restore-title="About Us" class="btn btn-success">
    Restore
</button>
<!-- Confirmation will read: "You are about to restore this item. About Us" -->
```

## JavaScript Configuration

You can customize all text and behavior during initialization.

```javascript
const restorePlugin = new DSRestore({
    selector: '.restore-btn', // Custom selector (default: [data-restore])
    
    // Custom Text
    title: 'Geri Yükle?',
    text: 'Bu öğeyi geri yüklemek üzeresiniz.',
    confirmButtonText: 'Evet, Geri Yükle!',
    cancelButtonText: 'İptal',
    // confirmButtonColor: 'btn btn-sm btn-success', // Default
    
    // Callbacks
    onSuccess: function(response, element) {
        console.log('Restored successfully', response);
        // Refresh a table if needed
        // MyTable.refresh();
    },
    onError: function(error, element) {
        console.error('Restore failed', error);
    }
});
```

## Backend Response

The plugin expects a JSON response. 

**Success Response (200 OK):**
```json
{
    "success": true,
    "message": "Page restored successfully"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
    "success": false,
    "message": "Page was not restored. Maybe it is not deleted yet."
}
```

## Events

The plugin emits custom events on the `document`.

- `ds:restore:start` - Dispatched before request is sent.
- `ds:restore:success` - Dispatched after successful restoration.
- `ds:restore:error` - Dispatched on error.
