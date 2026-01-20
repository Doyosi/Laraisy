# DSDelete Usage Guide

`DSDelete` is a lightweight plugin to handle delete actions with confirmation dialogs (via `DSAlert`) and AJAX requests.

## Installation

Ensure `DSDelete.js` and `DSAlert.js` are available in your assets.

```javascript
import { DSDelete } from '@doyosi/laraisy';
// Initialize globally or per page
const dsDelete = new DSDelete();
```

## HTML Usage

Add `data-delete` attribute to any button or link. The value should be the URL to send the DELETE request to.

```html
<!-- Simple Delete -->
<button data-delete="/dashboard/pages/1" class="btn btn-error">
    Delete Page
</button>

<!-- Delete associated with an ID payload (optional) -->
<button data-delete="/dashboard/pages/delete-action" data-delete-id="1" class="btn btn-error">
    Delete with ID Payload
</button>

<!-- Custom Title in Confirmation -->
<button data-delete="/dashboard/pages/1" data-delete-title="About Us Page" class="btn btn-error">
    Delete
</button>
<!-- Confirmation will read: "You won't be able to revert this! About Us Page" (Default text + title) -->
```

## JavaScript Configuration

You can customize all text and behavior during initialization.

```javascript
const deletePlugin = new DSDelete({
    selector: '.delete-btn', // Custom selector (default: [data-delete])
    method: 'DELETE',        // HTTP method (default: DELETE)
    ajaxFunction: 'axios',   // 'axios' | 'fetch' (default: axios)
    
    // Translations (i18n support)
    translations: {
        // Confirmation Dialog
        title: 'Silmek istediğinize emin misiniz?',
        text: 'Bu işlem geri alınamaz!',
        confirmButtonText: 'Evet, Sil!',
        cancelButtonText: 'İptal',
        
        // Success Dialog
        successTitle: 'Silindi!',
        successText: 'Kayıt başarıyla silindi.',
        
        // Error Dialog
        errorTitle: 'Hata!',
        errorText: 'Bir şeyler ters gitti.',
    },
    
    // Callbacks
    onSuccess: function(response, element) {
        console.log('Deleted successfully', response);
        // Custom DOM removal if not in a table row, or other logic
    },
    onError: function(error, element) {
        console.error('Delete failed', error);
    }
});
```

## Static Programmatic Usage

You can also trigger delete confirmation programmatically without DOM elements:

```javascript
import { DSDelete } from '@doyosi/laraisy';

// Simple usage
await DSDelete.confirm({
    url: '/api/users/123',
    translations: {
        title: 'Delete User?',
        text: 'This will permanently remove the user account.'
    },
    onSuccess: (response) => {
        console.log('User deleted', response);
    }
});
```

## Backend Response

The plugin expects a JSON response. 

**Success Response:**
```json
{
    "success": true,
    "message": "Resource deleted successfully."
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Unauthorized action."
}
```

## Events

The plugin emits custom events on the `document`.

- `ds:delete:start` - Dispatched before request is sent.
- `ds:delete:success` - Dispatched after successful deletion.
- `ds:delete:error` - Dispatched on error.

```javascript
document.addEventListener('ds:delete:success', (e) => {
    console.log('Global delete success handler', e.detail);
    // Reload a table instance if needed
    // myDstable.refresh();
});
```
