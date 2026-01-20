# DSButtonForm

A standalone button handler for AJAX actions (e.g., "Regenerate", "Delete", "Sync"). Manages loading states, sends custom data via Fetch/Axios/XHR, and integrates with DSAlert for toasts and confirmations.

## Installation

```javascript
import { DSButtonForm } from '@doyosi/laraisy';
```

## Basic Usage

```javascript
const regenerateBtn = new DSButtonForm({
    element: '#regenerate-btn',
    url: '/api/regenerate',
    method: 'post',
    data: { itemId: 123 }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `element` | `HTMLElement\|string` | *required* | The button selector or element |
| `url` | `string` | *required* | The endpoint URL |
| `method` | `string` | `'post'` | HTTP method: `get`, `post`, `put`, `delete`, `patch` |
| `data` | `Object\|Function` | `{}` | Data to send. If function, receives the button element |
| `requestLib` | `string` | `'fetch'` | Force specific library: `fetch`, `axios`, `xhr` |
| `headers` | `Object` | `{}` | Custom headers |
| `loadingHtml` | `string` | Spinner icon | HTML to show inside button while loading |
| `askConfirmation` | `boolean` | `false` | If true, triggers DSAlert confirm modal before request |
| `confirmOptions` | `Object` | See below | DSAlert options for confirmation |
| `disableOnSuccess` | `boolean` | `false` | Keep button disabled after success |
| `toast` | `Object` | `{ enabled: true, position: 'top-end', timer: 3000 }` | Toast configuration |
| `translations` | `Object` | See below | Customizable messages |

### Default Confirm Options

```javascript
{
    title: 'Are you sure?',
    text: 'Do you want to proceed?',
    icon: 'warning',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel'
}
```

### Default Translations

```javascript
{
    networkError: 'Network error.',
    success: 'Action completed!',
    error: 'Action failed.'
}
```

## Advanced Examples

### With Confirmation Dialog

```javascript
const deleteBtn = new DSButtonForm({
    element: '#delete-btn',
    url: '/api/items/5',
    method: 'delete',
    askConfirmation: true,
    confirmOptions: {
        title: 'Delete Item?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        confirmButtonText: 'Yes, delete it'
    }
});
```

### Dynamic Data from Button

```javascript
const syncBtn = new DSButtonForm({
    element: '.sync-btn',
    url: '/api/sync',
    method: 'post',
    data: (button) => ({
        itemId: button.dataset.itemId,
        type: button.dataset.type
    })
});
```

### Custom Loading State

```javascript
const submitBtn = new DSButtonForm({
    element: '#submit-btn',
    url: '/api/submit',
    loadingHtml: '<span class="loading loading-spinner"></span> Processing...'
});
```

### With Axios

```javascript
const actionBtn = new DSButtonForm({
    element: '#action-btn',
    url: '/api/action',
    requestLib: 'axios',
    headers: {
        'X-Custom-Header': 'value'
    }
});
```

## Events

DSButtonForm emits both internal events (via `.on()`) and bubbling DOM events.

### Internal Events

```javascript
const btn = new DSButtonForm({ element: '#btn', url: '/api/action' });

btn.on('start', ({ payload, controller }) => {
    console.log('Request starting with:', payload);
});

btn.on('success', ({ response, data }) => {
    console.log('Success:', data);
});

btn.on('error', ({ response, data, error }) => {
    console.error('Error:', data || error);
});

btn.on('complete', ({ ok }) => {
    console.log('Completed. Success:', ok);
});
```

### DOM Events

Listen on document or any parent element:

```javascript
document.addEventListener('dsbutton:success', (e) => {
    console.log('Button succeeded:', e.detail.data);
    console.log('Button element:', e.detail.element);
});

document.addEventListener('dsbutton:error', (e) => {
    console.error('Button failed:', e.detail);
});
```

## Methods

| Method | Description |
|--------|-------------|
| `on(event, handler)` | Subscribe to internal events |
| `off(event, handler)` | Unsubscribe from events |
| `submit()` | Programmatically trigger the action |
| `bind()` | Bind click listener to button |
| `unbind()` | Remove click listener |

## Response Handling

### Automatic Redirects

If the response contains `redirect` or `data.redirect`, the page will navigate there:

```json
{
    "success": true,
    "message": "Item created!",
    "redirect": "/items/new-id"
}
```

### Toast Messages

Success and error messages are automatically shown as toasts. The message is taken from:
- `response.message`
- `response.error` (for errors)
- Fallback to translation defaults

## HTML Example

```html
<button id="regenerate-btn" class="btn btn-primary" data-item-id="123">
    <i class="ph ph-arrows-clockwise"></i>
    Regenerate
</button>

<script type="module">
import { DSButtonForm } from '@doyosi/laraisy';

new DSButtonForm({
    element: '#regenerate-btn',
    url: '/api/regenerate',
    method: 'post',
    data: (btn) => ({ id: btn.dataset.itemId }),
    askConfirmation: true,
    confirmOptions: {
        title: 'Regenerate?',
        text: 'This will regenerate the item.',
        icon: 'question'
    }
});
</script>
```

## Dependencies

- **DSAlert**: Required for toast notifications and confirmation dialogs
- **axios** (Optional): Use `requestLib: 'axios'` if available
