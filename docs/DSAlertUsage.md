# DSAlert Documentation

`DSAlert` is a lightweight, native JavaScript alert and toast notification system built with Tailwind CSS. Designed to mimic the SweetAlert2 API (`DSAlert.fire()`), it offers modal alerts and corner toast notifications with promises, progress bars, and custom styling.

## Features

- **SweetAlert2 Compatible API**: Easy migration via `DSAlert.fire()` and promise-based response resolution (`isConfirmed`, `isDismissed`).
- **Modal & Toast Modes**: Switch between modal popups and subtle toast notifications using `toast: true`.
- **Tailwind CSS Styled**: Native Tailwind classes for buttons, modals, overlays, and animations.
- **Customizable Icons**: Built-in icons for `success`, `error`, `warning`, `info`, and `question`. Overridable via `DSAlert.icons`.

---

## Installation

```javascript
import { DSAlert } from '@doyosi/laraisy';

// Optional: Global alias for SweetAlert2 compatibility
window.Swal = DSAlert;
window.DSAlert = DSAlert;
```

---

## Basic Usage

### Shorthand (Title, Text, Icon)

```javascript
// Fire simple alert modal
DSAlert.fire('Good job!', 'Operation completed successfully.', 'success');
```

### Configuration Object

```javascript
const result = await DSAlert.fire({
    title: 'Are you sure?',
    text: 'Do you want to proceed with deletion?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: 'btn btn-sm btn-error',
    cancelButtonColor: 'btn btn-sm btn-neutral'
});

if (result.isConfirmed) {
    DSAlert.fire('Deleted!', 'Your item has been removed.', 'success');
}
```

---

## Toast Notifications

Toasts appear in fixed screen corners without blocking interaction when `toast: true` is set.

```javascript
DSAlert.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Settings saved successfully',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
});
```

### Available Toast Positions

- `top-start`
- `top-center`
- `top-end` (default)
- `center`
- `bottom-start`
- `bottom-center`
- `bottom-end`

---

## HTML Content Support

Pass raw HTML to `html` to render rich content:

```javascript
DSAlert.fire({
    title: '<strong>Terms Update</strong>',
    icon: 'info',
    html: `
        <p class="text-sm text-gray-600">
            Please read our updated <a href="/terms" class="text-blue-500 underline">Terms of Service</a>.
        </p>
    `,
    confirmButtonText: 'I Agree',
    showCancelButton: true
});
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `''` | Alert / Toast header title |
| `text` | `string` | `''` | Body message text |
| `html` | `string` | `''` | Custom HTML content (overrides `text`) |
| `icon` | `string` | `''` | Icon type: `'success'`, `'error'`, `'warning'`, `'info'`, `'question'` |
| `toast` | `boolean` | `false` | Display as toast notification instead of modal |
| `position` | `string` | `'top-end'` | Screen position for toast notifications |
| `timer` | `number` | `0` | Auto-close timer in milliseconds (`0` disables timer) |
| `timerProgressBar` | `boolean` | `false` | Show animated progress bar for timer |
| `showConfirmButton` | `boolean` | `true` | Show confirmation button |
| `showCancelButton` | `boolean` | `false` | Show cancel button |
| `showCloseButton` | `boolean` | `true` | Show 'X' close button in top right |
| `allowOutsideClick` | `boolean` | `true` | Dismiss modal when clicking overlay backdrop |
| `allowEscapeKey` | `boolean` | `true` | Dismiss modal when pressing `Escape` key |
| `confirmButtonText` | `string` | `'OK'` | Text for confirm button |
| `cancelButtonText` | `string` | `'Cancel'` | Text for cancel button |
| `confirmButtonColor` | `string` | `'btn btn-sm btn-primary'` | CSS/Tailwind classes for confirm button |
| `cancelButtonColor` | `string` | `'btn btn-sm btn-soft btn-neutral'` | CSS/Tailwind classes for cancel button |
| `buttonsAlign` | `'start' \| 'center' \| 'end'` | `'end'` | Alignment of buttons inside footer |
| `backdrop` | `boolean` | `true` | Show dark overlay backdrop behind modal |

---

## Overriding Global Defaults & Icons

```javascript
import { DSAlert } from '@doyosi/laraisy';

// Override global defaults
DSAlert.defaults.confirmButtonColor = 'btn btn-sm btn-accent';
DSAlert.defaults.timerProgressBar = true;

// Override custom icon SVG
DSAlert.icons.success = `<svg class="w-6 h-6 text-green-600" ...></svg>`;
```