# DSNotifications Plugin Usage Guide

`DSNotifications` is a notification drawer management plugin for Laravel dashboard applications. It handles fetching unread notification counts, rendering template items, marking single/all notifications as read, deleting notifications, auto-refreshing badges, and emitting global update events.

## Installation

```javascript
import { DSNotifications } from '@doyosi/laraisy';
```

---

## Basic Usage

```javascript
import { DSNotifications } from '@doyosi/laraisy';

document.addEventListener('DOMContentLoaded', () => {
    // Instantiate notification drawer
    const notifications = new DSNotifications({
        refreshInterval: 60000, // Refresh unread count every 60s
        iconLibrary: 'phosphor'
    });
    
    // Assign globally if needed
    window.DSNotifications = notifications;
});
```

---

## HTML Requirements

`DSNotifications` expects the following elements in your Blade layout:

```html
<!-- Notification Trigger Button -->
<button id="user-notification-button" class="btn btn-ghost btn-circle relative">
    <i class="ph ph-bell text-xl"></i>
    <span class="indicator-item badge badge-primary badge-xs hidden" id="notification-badge"></span>
</button>

<!-- Drawer Toggle Checkbox -->
<input id="notification-drawer-toggle" type="checkbox" class="drawer-toggle" />

<!-- Notification Drawer Content -->
<div class="drawer-side z-50">
    <label for="notification-drawer-toggle" class="drawer-overlay"></label>
    <div class="p-4 w-80 min-h-full bg-base-100 text-base-content flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-base-200">
            <h3 class="font-bold text-lg">Notifications</h3>
            <button id="mark-all-read-btn" class="btn btn-xs btn-ghost text-primary">Mark all as read</button>
        </div>

        <!-- Notification List Container -->
        <div id="notification-items" class="flex-1 overflow-y-auto py-2 space-y-2"></div>

        <!-- Loading State -->
        <div id="notification-loading" class="hidden text-center py-8">
            <span class="loading loading-spinner loading-md"></span>
        </div>

        <!-- Empty State -->
        <div id="notification-empty" class="hidden text-center py-8 text-base-content/50">
            <i class="ph ph-bell-slash text-4xl mb-2"></i>
            <p>No notifications</p>
        </div>
    </div>
</div>

<!-- Template Item -->
<template id="notification-item-template">
    <div class="notification-item p-3 rounded-lg border border-base-200 hover:bg-base-200/50 transition-colors cursor-pointer flex gap-3">
        <div class="notification-icon w-10 h-10 rounded-full flex items-center justify-center shrink-0"></div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
                <h4 class="notification-title font-semibold text-sm truncate"></h4>
                <span class="notification-time text-xs text-base-content/50"></span>
            </div>
            <p class="notification-message text-xs text-base-content/70 mt-1 line-clamp-2"></p>
            <div class="flex gap-2 mt-2">
                <button class="notification-read-btn btn btn-xs btn-ghost">Mark as read</button>
                <button class="notification-delete-btn btn btn-xs btn-ghost text-error">Delete</button>
            </div>
        </div>
    </div>
</template>
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fetchUrl` | `string` | `'/dashboard/notifications/list'` | Endpoint to fetch notifications list |
| `readUrl` | `string` | `'/dashboard/notifications/{id}/read'` | Endpoint to mark a single notification as read |
| `readAllUrl` | `string` | `'/dashboard/notifications/read-all'` | Endpoint to mark all notifications as read |
| `deleteUrl` | `string` | `'/dashboard/notifications/{id}'` | Endpoint to delete a notification |
| `unreadCountUrl` | `string` | `'/dashboard/notifications/unread-count'` | Endpoint to fetch unread notifications count |
| `refreshInterval` | `number` | `60000` | Auto-refresh interval in milliseconds for unread count |
| `iconLibrary` | `'phosphor' \| 'material-symbols' \| 'font-awesome' \| 'heroicons' \| 'custom'` | `'phosphor'` | Icon library used for rendering notification category icons |
| `drawerToggleId` | `string` | `'notification-drawer-toggle'` | ID of drawer checkbox toggle |
| `buttonId` | `string` | `'user-notification-button'` | ID of trigger button |
| `listContainerId` | `string` | `'notification-items'` | ID of notification items container |
| `loadingId` | `string` | `'notification-loading'` | ID of loading indicator container |
| `emptyId` | `string` | `'notification-empty'` | ID of empty state container |
| `badgeId` | `string` | `'notification-badge'` | ID of badge element |
| `topbarBadgeSelector` | `string` | `'#user-notification-button .indicator-item'` | Selector for topbar badge element |
| `markAllReadBtnId` | `string` | `'mark-all-read-btn'` | ID of "Mark all as read" button |
| `templateId` | `string` | `'notification-item-template'` | ID of template element for items |

---

## Instance Methods

```javascript
const notifications = new DSNotifications();

notifications.openDrawer();          // Open notification drawer
notifications.closeDrawer();         // Close notification drawer
notifications.fetchNotifications();  // Fetch notifications list from API
notifications.fetchUnreadCount();    // Refresh unread count badge
notifications.markAsRead(id);        // Mark single notification as read
notifications.markAllAsRead();       // Mark all notifications as read
notifications.deleteNotification(id);// Delete single notification
notifications.stopAutoRefresh();     // Pause periodic unread count checking
notifications.startAutoRefresh();    // Resume periodic checking
notifications.destroy();             // Cleanup timers and instance
```

---

## External Badge Update Events

`DSNotifications` dispatches a custom event on `window` whenever the unread notification count is updated. This allows sidebar or external navigation elements to react to notification state changes:

```javascript
window.addEventListener('ds-notifications:update', (event) => {
    const { unreadCount, hasUnread } = event.detail;
    const asideDot = document.getElementById('aside-notification-dot');
    
    if (asideDot) {
        if (hasUnread) {
            asideDot.classList.remove('hidden');
        } else {
            asideDot.classList.add('hidden');
        }
    }
});
```

---

## Icon Libraries

The `iconLibrary` option configures how `notification.icon` values from the backend are rendered:

- **`phosphor`** (default): Converts `'bell'` to `<i class="notification-icon-element ph ph-bell text-lg">`
- **`material-symbols`**: Converts `'notifications'` to `<span class="notification-icon-element material-symbols-outlined">notifications</span>`
- **`font-awesome`**: Converts `'bell'` to `<i class="notification-icon-element fas fa-bell">`
- **`heroicons`**: Converts `'bell'` to `<span class="notification-icon-element heroicon heroicon-bell">`
- **`custom`**: Renders raw SVG or HTML content string directly.
