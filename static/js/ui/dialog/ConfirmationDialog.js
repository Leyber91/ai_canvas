/**
 * ui/dialog/ConfirmationDialog.js
 * 
 * Extends DialogComponent for backward compatibility
 * Uses new ConfirmationTemplate internally
 */

import { DialogComponent } from './DialogComponent.js';
import { ConfirmationTemplate } from '../../core/dialog/templates/ConfirmationTemplate.js';

export class ConfirmationDialog extends DialogComponent {
  /**
   * @param {DialogManager} dialogManager - Parent dialog manager
   */
  constructor(dialogManager) {
    super(dialogManager);
  }
  
  /**
   * Show a confirmation dialog
   * 
   * @param {string} message - The confirmation message
   * @param {Function} onConfirm - Function to call when confirmed
   * @param {Function} onCancel - Function to call when cancelled
   * @param {Object} options - Additional options
   * @returns {BaseDialog} The dialog instance
   */
  show(message, onConfirm, onCancel = null, options = {}) {
    // Create options for the template
    const templateOptions = {
      message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm,
      onCancel,
      icon: options.icon || null,
      type: options.type || 'default',
      showCancel: options.showCancel !== false,
      confirmButtonClass: options.confirmButtonClass || '',
      cancelButtonClass: options.cancelButtonClass || '',
      messageClass: options.messageClass || '',
      markdown: options.markdown !== false
    };
    
    // Create content using the template
    const content = ConfirmationTemplate.render(templateOptions);
    
    // Show dialog with the content
    return super.show({
      title: options.title || '',
      content,
      closeOnEscape: options.closeOnEscape !== false,
      closeOnOverlayClick: options.closeOnOverlayClick !== false,
      showCloseButton: options.showCloseButton !== false,
      width: options.width || '400px',
      height: options.height || 'auto',
      className: options.className || 'confirmation-dialog',
      onClose: () => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel();
        }
      }
    });
  }
  
  /**
   * Set message
   * 
   * @param {string} message - New message
   */
  setMessage(message) {
    if (this.dialog) {
      const messageElement = this.dialog.getContentElement().querySelector('.confirmation-dialog-message');
      
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }
  
  /**
   * Set button text
   * 
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   */
  setButtons(confirmText, cancelText) {
    if (this.dialog) {
      const confirmButton = this.dialog.getContentElement().querySelector('.confirmation-dialog-confirm');
      const cancelButton = this.dialog.getContentElement().querySelector('.confirmation-dialog-cancel');
      
      if (confirmButton && confirmText) {
        confirmButton.textContent = confirmText;
      }
      
      if (cancelButton && cancelText) {
        cancelButton.textContent = cancelText;
      }
    }
  }
}
