/**
 * ui/dialog/ConfirmationDialog.js
 * 
 * Specialized dialog component for confirmation prompts.
 */

import { DialogComponent } from './DialogComponent.js';
import { EventUtils } from '../helpers/EventUtils.js';

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
   * @returns {HTMLElement} The dialog overlay element
   */
  show(message, onConfirm, onCancel = null) {
    // Create dialog overlay
    const dialogOverlay = this.createDialogOverlay();
    
    // Create dialog content
    const dialog = this.createDialogContent();
    
    // Add message
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    dialog.appendChild(messageElement);
    
    // Add buttons
    this.addConfirmButtons(dialog, dialogOverlay, onConfirm, onCancel);
    
    // Add dialog to overlay
    dialogOverlay.appendChild(dialog);
    
    // Add to document
    document.body.appendChild(dialogOverlay);
    
    // Add escape key handler to cancel
    this.addEscapeKeyHandler(dialogOverlay, onCancel);
    
    return dialogOverlay;
  }
  
  /**
   * Add confirmation buttons to the dialog
   * 
   * @param {HTMLElement} dialog - Dialog element
   * @param {HTMLElement} dialogOverlay - Dialog overlay element
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   */
  addConfirmButtons(dialog, dialogOverlay, onConfirm, onCancel) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    if (!this.themeManager) {
      Object.assign(buttonContainer.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '20px',
        gap: '10px'
      });
    }
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-btn';
    
    if (this.themeManager) {
      cancelButton.classList.add('theme-btn', 'secondary-btn');
    } else {
      cancelButton.style.padding = '8px 16px';
    }
    
    cancelButton.addEventListener('click', () => {
      this.dialogManager.removeDialog(dialogOverlay);
      if (onCancel) onCancel();
    });
    
    // Add ripple effect if available
    if (EventUtils && typeof EventUtils.createRippleEffect === 'function') {
      cancelButton.addEventListener('click', (e) => {
        EventUtils.createRippleEffect(e);
      });
    }
    
    // Confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.className = 'confirm-btn';
    
    if (this.themeManager) {
      confirmButton.classList.add('theme-btn', 'primary-btn');
    } else {
      Object.assign(confirmButton.style, {
        padding: '8px 16px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      });
    }
    
    confirmButton.addEventListener('click', () => {
      this.dialogManager.removeDialog(dialogOverlay);
      onConfirm();
    });
    
    // Add ripple effect if available
    if (EventUtils && typeof EventUtils.createRippleEffect === 'function') {
      confirmButton.addEventListener('click', (e) => {
        EventUtils.createRippleEffect(e);
      });
    }
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    dialog.appendChild(buttonContainer);
  }
}