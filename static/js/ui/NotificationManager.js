/**
 * ui/NotificationManager.js
 * 
 * Manages temporary notifications displayed to the user.
 */
export class NotificationManager {
    constructor() {
      this.activeNotifications = [];
      this.notificationContainer = null;
      
      // Create notification container if it doesn't exist
      this.createNotificationContainer();
      
      // Add styles for notifications if they don't exist
      this.addNotificationStyles();
    }
    
    /**
     * Create a container for notifications
     */
    createNotificationContainer() {
      if (document.getElementById('notification-container')) {
        this.notificationContainer = document.getElementById('notification-container');
        return;
      }
      
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      this.notificationContainer.style.position = 'fixed';
      this.notificationContainer.style.bottom = '20px';
      this.notificationContainer.style.right = '20px';
      this.notificationContainer.style.zIndex = '9999';
      this.notificationContainer.style.display = 'flex';
      this.notificationContainer.style.flexDirection = 'column';
      this.notificationContainer.style.gap = '10px';
      
      document.body.appendChild(this.notificationContainer);
    }
    
    /**
     * Add CSS styles for notifications
     */
    addNotificationStyles() {
      if (document.getElementById('notification-styles')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification {
          padding: 12px 16px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 10px;
          max-width: 400px;
          animation: notification-slide-in 0.3s ease-out forwards;
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
          color: white;
          position: relative;
        }
        
        .notification-close {
          position: absolute;
          top: 8px;
          right: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 14px;
          width: 16px;
          height: 16px;
          line-height: 14px;
          text-align: center;
          border-radius: 50%;
        }
        
        .notification-close:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .notification-success {
          background-color: #2ecc71;
        }
        
        .notification-error {
          background-color: #e74c3c;
        }
        
        .notification-info {
          background-color: #3498db;
        }
        
        .notification-warning {
          background-color: #f39c12;
        }
        
        @keyframes notification-slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes notification-slide-out {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
    
    /**
     * Show a notification
     * 
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info, warning)
     * @param {number} duration - Duration in milliseconds (0 for no auto-hide)
     * @returns {HTMLElement} The notification element
     */
    show(message, type = 'success', duration = 3000) {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      // Create close button
      const closeButton = document.createElement('span');
      closeButton.className = 'notification-close';
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => this.hide(notification));
      
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      
      // Add elements to notification
      notification.appendChild(closeButton);
      notification.appendChild(messageElement);
      
      // Add to container
      this.notificationContainer.appendChild(notification);
      
      // Track notification
      this.activeNotifications.push(notification);
      
      // Auto-hide after duration
      if (duration > 0) {
        setTimeout(() => {
          this.hide(notification);
        }, duration);
      }
      
      return notification;
    }
    
    /**
     * Hide a notification
     * 
     * @param {HTMLElement} notification - The notification element to hide
     */
    hide(notification) {
      if (!notification || !this.notificationContainer.contains(notification)) {
        return;
      }
      
      // Animate out
      notification.style.animation = 'notification-slide-out 0.3s ease-out forwards';
      
      // Remove after animation completes
      setTimeout(() => {
        if (notification && this.notificationContainer.contains(notification)) {
          this.notificationContainer.removeChild(notification);
          this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
        }
      }, 300);
    }
    
    /**
     * Show a success notification
     * 
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} The notification element
     */
    success(message, duration = 3000) {
      return this.show(message, 'success', duration);
    }
    
    /**
     * Show an error notification
     * 
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} The notification element
     */
    error(message, duration = 4000) {
      return this.show(message, 'error', duration);
    }
    
    /**
     * Show an info notification
     * 
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} The notification element
     */
    info(message, duration = 3000) {
      return this.show(message, 'info', duration);
    }
    
    /**
     * Show a warning notification
     * 
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} The notification element
     */
    warning(message, duration = 4000) {
      return this.show(message, 'warning', duration);
    }
    
    /**
     * Clear all active notifications
     */
    clearAll() {
      // Hide all notifications (copies array to avoid modification during iteration)
      [...this.activeNotifications].forEach(notification => {
        this.hide(notification);
      });
    }
}