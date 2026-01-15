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

## Events

The plugin auto-initializes on DOMContentLoaded if the drawer exists.

## Requirements

- `#notification-drawer` - Drawer container
- `#notification-drawer-toggle` - Checkbox for drawer state
- `#user-notification-button` - Trigger button
- Template `#notification-item-template`
