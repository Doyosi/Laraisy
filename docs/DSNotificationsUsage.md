# DSNotifications Plugin

Notification drawer management for Laravel dashboard.

## Quick Start

```javascript
import { DSNotifications } from "@doyosi/laraisy";

// Auto-initializes if #notification-drawer exists
// Or manually:
const notifications = new DSNotifications({
    refreshInterval: 60000, // Auto-refresh every 60s
});
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `fetchUrl` | `/dashboard/notifications` | API endpoint |
| `refreshInterval` | `60000` | Auto-refresh interval (ms) |
| `buttonId` | `user-notification-button` | Trigger button ID |
| `drawerToggleId` | `notification-drawer-toggle` | Drawer toggle input ID |
| `iconLibrary` | `material-symbols` | Icon library to use. Options: `material-symbols`, `font-awesome`, `heroicons`, `custom` |

## Methods

```javascript
notifications.openDrawer();      // Open drawer
notifications.closeDrawer();     // Close drawer
notifications.fetchNotifications(); // Fetch from API
notifications.fetchUnreadCount();   // Update badge
notifications.markAsRead(id);       // Mark single
notifications.markAllAsRead();      // Mark all
notifications.deleteNotification(id); // Delete
notifications.destroy();            // Cleanup
```

## Icon Libraries

The `iconLibrary` option allows you to choose which icon library to use for notification icons:

### Material Symbols (default)
```javascript
const notifications = new DSNotifications({
    iconLibrary: 'material-symbols'
});
// Icon format: 'notifications', 'check_circle', 'warning'
```

### Font Awesome
```javascript
const notifications = new DSNotifications({
    iconLibrary: 'font-awesome'
});
// Icon format: 'bell', 'fa-bell', or 'fas fa-bell'
// If no prefix given, 'fas fa-' is prepended automatically
```

### Phosphor Icons
```javascript
const notifications = new DSNotifications({
    iconLibrary: 'phosphor'
});
// Icon format: 'bell' -> 'ph ph-bell'
// Or full class: 'ph-bell-slash' -> 'ph ph-bell-slash'
```

### Heroicons
```javascript
const notifications = new DSNotifications({
    iconLibrary: 'heroicons'
});
// Icon format: 'bell', 'check-circle' (renders as .heroicon-bell class)
```

### Custom HTML
```javascript
const notifications = new DSNotifications({
    iconLibrary: 'custom'
});
// Icon format: Raw HTML like '<svg>...</svg>' or '<img src="..." />'
```

## Events

The plugin auto-initializes on DOMContentLoaded if the drawer exists.

## Requirements

- `#notification-drawer` - Drawer container
- `#notification-drawer-toggle` - Checkbox for drawer state
- `#user-notification-button` - Trigger button
- Template `#notification-item-template`
