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
    
    // Custom Text
    title: 'Silmek istediğinize emin misiniz?',
    text: 'Bu işlem geri alınamaz!',
    confirmButtonText: 'Evet, Sil!',
    cancelButtonText: 'İptal',
    
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
