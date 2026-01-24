# @doyosi/laraisy

Missing Laravel / Tailwind v4.1 & Daisy UI 5.1.14 Javascript Plugins for interactive UI components.

## Installation

```bash
npm install @doyosi/laraisy
```

Or clone the repository:

```bash
git clone https://github.com/Doyosi/Laraisy.git
```

## Usage

Import the components you need:

```javascript
import { DSForm, DSAvatar, DSAlert } from '@doyosi/laraisy';

// Initialize DSForm
const form = new DSForm({
    form: '#my-form',
    onSuccess: (response) => {
        console.log('Success!', response);
    }
});

// Use DSAlert
DSAlert.fire('Hello World!', 'This is a success message', 'success');
```

## Components

- **[DSAlert](docs/DSAlertUsage.md)**: SweetAlert2-like toast and modal system.
- **[DSAvatar](docs/DSAvatarUsage.md)**: Avatar file upload with preview and reset. (See code for usage)
- **[DSButtonForm](docs/DSButtonFormUsage.md)**: Standalone button handler for AJAX actions with loading states.
- **[DSForm](docs/DSFormUsage.md)**: Robust AJAX form handler with validation display.
- **[DSDelete](docs/DSDeleteUsage.md)**: Deletion confirmation and handling.
- **[DSSelect](docs/DSSelectUsage.md)**: Advanced select/dropdown component.
- **[DSSelectBox](docs/DSSelectBoxUsage.md)**: Dual-list selector for transferring items.
- **[DSNotifications](docs/DSNotificationsUsage.md)**: Notification drawer management.
- **[DSUpload](docs/DSUploadUsage.md)**: File uploader with drag-and-drop. (Docs pending)
- **[DSGridOrTable](docs/DSGridOrTableUsage.md)**: flexible data display (Table/Grid).
- **[DSTable](docs/DSTableUsage.md)**: Data tables with sorting, filtering, and pagination.
- **[DSTabs](docs/DSTabsUsage.md)**: Tab switching management.
- **[DSRestore](docs/DSRestoreUsage.md)**: Restore actions handling.
- **[DSSimpleSlider](docs/DSSimpleSliderUsage.md)**: Carousel/Slider component.
- **[CodeInput](docs/CodeInputUsage.md)**: Multi-input verification code handler.
- **[DSLogout](docs/DSLogoutUsage.md)**: Secure AJAX logout handler.
- **[DSSvgFetch](docs/DSSvgFetchUsage.md)**: Inline SVG injector.
- **[DSSvgUpload](docs/DSSvgUploadUsage.md)**: SVG icon uploader.

## Dependencies

- **tippy.js** (Optional/Peer): Used by `DSAvatar` for tooltips. Ensure `window.tippy` is available or install `tippy.js`.
- **axios** (Optional/Peer): Used for AJAX requests. Falls back to `fetch` if not available.

## License

MIT
