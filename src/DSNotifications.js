/**
 * DSNotifications Plugin
 * Handles notification drawer, fetching, and actions
 */
import { DSAlert } from './DSAlert.js';

export class DSNotifications {
    constructor(options = {}) {
        this.options = {
            drawerToggleId: 'notification-drawer-toggle',
            buttonId: 'user-notification-button',
            listContainerId: 'notification-items',
            loadingId: 'notification-loading',
            emptyId: 'notification-empty',
            badgeId: 'notification-badge',
            topbarBadgeSelector: '#user-notification-button .indicator-item',
            markAllReadBtnId: 'mark-all-read-btn',
            templateId: 'notification-item-template',
            fetchUrl: '/dashboard/notifications/list',
            readUrl: '/dashboard/notifications/{id}/read',
            readAllUrl: '/dashboard/notifications/read-all',
            deleteUrl: '/dashboard/notifications/{id}',
            unreadCountUrl: '/dashboard/notifications/unread-count',
            refreshInterval: 60000, // 1 minute
            /**
             * Icon library to use for notification icons.
             * Supported values:
             * - 'material-symbols' (default): Google Material Symbols Outlined
             * - 'font-awesome': Font Awesome icons (expects 'fa-icon-name' format)
             * - 'heroicons': Heroicons (expects icon name, renders as SVG class)
             * - 'phosphor': Phosphor Icons (expects icon name like 'bell', renders as 'ph ph-bell')
             * - 'custom': Custom HTML (icon value is used as raw HTML)
             */
            iconLibrary: 'phosphor',
            ...options
        };

        this.notifications = [];
        this.unreadCount = 0;
        this.isLoading = false;
        this.refreshTimer = null;

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.fetchUnreadCount();
        this.startAutoRefresh();
    }

    cacheElements() {
        this.drawerToggle = document.getElementById(this.options.drawerToggleId);
        this.button = document.getElementById(this.options.buttonId);
        this.listContainer = document.getElementById(this.options.listContainerId);
        this.loading = document.getElementById(this.options.loadingId);
        this.empty = document.getElementById(this.options.emptyId);
        this.badge = document.getElementById(this.options.badgeId);
        this.topbarBadge = document.querySelector(this.options.topbarBadgeSelector);
        this.markAllReadBtn = document.getElementById(this.options.markAllReadBtnId);
        this.template = document.getElementById(this.options.templateId);
    }

    bindEvents() {
        // Open drawer on button click
        this.button?.addEventListener('click', () => {
            this.openDrawer();
        });

        // Mark all as read
        this.markAllReadBtn?.addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Drawer open/close events
        this.drawerToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.fetchNotifications();
            }
        });
    }

    openDrawer() {
        if (this.drawerToggle) {
            this.drawerToggle.checked = true;
            this.fetchNotifications();
        }
    }

    closeDrawer() {
        if (this.drawerToggle) {
            this.drawerToggle.checked = false;
        }
    }

    async fetchNotifications() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await axios.get(this.options.fetchUrl);
            const data = response.data;

            if (data.success) {
                this.notifications = data.data;
                this.unreadCount = data.unread_count;
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            this.showEmpty();
        } finally {
            this.isLoading = false;
        }
    }

    async fetchUnreadCount() {
        try {
            const response = await axios.get(this.options.unreadCountUrl);
            if (response.data.success) {
                this.unreadCount = response.data.count;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }

    async markAsRead(id) {
        try {
            const url = this.options.readUrl.replace('{id}', id);
            const response = await axios.post(url);

            if (response.data.success) {
                // Update local state
                const notification = this.notifications.find(n => n.id === id);
                if (notification) {
                    notification.read = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.renderNotifications();
                this.updateBadge();

                if (window.DSAlert) {
                    DSAlert.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: response.data.message,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await axios.post(this.options.readAllUrl);

            if (response.data.success) {
                this.notifications.forEach(n => n.read = true);
                this.unreadCount = 0;
                this.renderNotifications();
                this.updateBadge();

                if (window.DSAlert) {
                    DSAlert.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: response.data.message,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    async deleteNotification(id) {
        try {
            const url = this.options.deleteUrl.replace('{id}', id);
            const response = await axios.delete(url);

            if (response.data.success) {
                // Remove from local state
                const index = this.notifications.findIndex(n => n.id === id);
                if (index !== -1) {
                    const notification = this.notifications[index];
                    if (!notification.read) {
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                    this.notifications.splice(index, 1);
                }
                this.renderNotifications();
                this.updateBadge();

                if (window.DSAlert) {
                    DSAlert.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: response.data.message,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }

    renderNotifications() {
        this.hideLoading();

        if (this.notifications.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideEmpty();
        this.listContainer.innerHTML = '';

        this.notifications.forEach(notification => {
            const item = this.createNotificationItem(notification);
            this.listContainer.appendChild(item);
        });
    }

    createNotificationItem(notification) {
        const template = this.template.content.cloneNode(true);
        const item = template.querySelector('.notification-item');

        item.dataset.id = notification.id;

        // Apply read/unread styling
        if (!notification.read) {
            item.classList.add('bg-primary/5', 'border-l-4', 'border-l-primary');
        }

        // Icon - render based on configured icon library
        const iconWrapper = item.querySelector('.notification-icon');
        iconWrapper.classList.add(this.getColorClass(notification.color, 'bg'), this.getColorClass(notification.color, 'text'));
        this.renderIcon(iconWrapper, notification.icon);

        // Content
        item.querySelector('.notification-title').textContent = notification.title;
        item.querySelector('.notification-message').textContent = notification.message;
        item.querySelector('.notification-time').textContent = notification.time_ago;

        // Hide read button if already read
        const readBtn = item.querySelector('.notification-read-btn');
        if (notification.read) {
            readBtn.classList.add('hidden');
        }

        // Bind events
        readBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.markAsRead(notification.id);
        });

        item.querySelector('.notification-delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNotification(notification.id);
        });

        // Click to navigate
        item.addEventListener('click', () => {
            if (notification.url) {
                if (!notification.read) {
                    this.markAsRead(notification.id);
                }
                window.location.href = notification.url;
            }
        });

        return item;
    }

    getColorClass(color, type) {
        const colors = {
            primary: { bg: 'bg-primary/10', text: 'text-primary' },
            success: { bg: 'bg-success/10', text: 'text-success' },
            warning: { bg: 'bg-warning/10', text: 'text-warning' },
            error: { bg: 'bg-error/10', text: 'text-error' },
            info: { bg: 'bg-info/10', text: 'text-info' },
            neutral: { bg: 'bg-base-200', text: 'text-base-content' },
        };

        return colors[color]?.[type] || colors.neutral[type];
    }

    /**
     * Render an icon into a container based on the configured icon library.
     * Supports: material-symbols, font-awesome, heroicons, phosphor, custom
     * @param {HTMLElement} container - The container element to render the icon into
     * @param {string} icon - The icon identifier (name, class, or HTML depending on library)
     */
    /**
     * Render an icon into a container based on the configured icon library.
     */
    renderIcon(container, icon) {
        // 1. CLEAR: Wipe any existing content (fixes the empty <i> issue)
        container.innerHTML = '';

        let iconElement;
        const library = this.options.iconLibrary;

        switch (library) {
            case 'material-symbols':
                // Default: Google Material Symbols Outlined
                iconElement = document.createElement('span');
                iconElement.className = 'notification-icon-element material-symbols-outlined';
                iconElement.textContent = icon;
                break;

            case 'font-awesome':
                iconElement = document.createElement('i');
                const faClass = icon.startsWith('fa') ? icon : `fas fa-${icon}`;
                iconElement.className = `notification-icon-element ${faClass}`;
                break;

            case 'heroicons':
                iconElement = document.createElement('span');
                iconElement.className = `notification-icon-element heroicon heroicon-${icon}`;
                break;

            case 'phosphor':
                iconElement = document.createElement('i');
                // Check if the backend sent 'ph-plus-circle' or just 'plus-circle'
                // If it already has 'ph-', don't double add it.
                // Also add 'text-lg' or similar sizing if needed.
                const phName = icon.startsWith('ph-') ? icon : `ph-${icon}`;
                iconElement.className = `notification-icon-element ph ${phName} text-lg`;
                break;

            case 'custom':
                const wrapper = document.createElement('span');
                wrapper.className = 'notification-icon-element';
                wrapper.innerHTML = icon;
                iconElement = wrapper;
                break;

            default:
                // Fallback
                iconElement = document.createElement('span');
                iconElement.className = 'notification-icon-element material-symbols-outlined';
                iconElement.textContent = icon;
        }

        container.appendChild(iconElement);
    }

    updateBadge() {
        // Drawer badge
        if (this.badge) {
            if (this.unreadCount > 0) {
                this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                this.badge.classList.remove('hidden');
            } else {
                this.badge.classList.add('hidden');
            }
        }

        // Topbar badge
        if (this.topbarBadge) {
            if (this.unreadCount > 0) {
                this.topbarBadge.classList.remove('hidden');
            } else {
                this.topbarBadge.classList.add('hidden');
            }
        }
    }

    showLoading() {
        this.loading?.classList.remove('hidden');
        this.empty?.classList.add('hidden');
        this.listContainer.innerHTML = '';
    }

    hideLoading() {
        this.loading?.classList.add('hidden');
    }

    showEmpty() {
        this.empty?.classList.remove('hidden');
        this.listContainer.innerHTML = '';
    }

    hideEmpty() {
        this.empty?.classList.add('hidden');
    }

    startAutoRefresh() {
        if (this.options.refreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.fetchUnreadCount();
            }, this.options.refreshInterval);
        }
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

