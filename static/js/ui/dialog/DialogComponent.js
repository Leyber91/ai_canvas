/**
 * ui/dialog/DialogComponent.js
 * 
 * Base class that delegates to BaseDialog
 * Maintains backward compatibility
 */

import { BaseDialog } from '../../core/dialog/BaseDialog.js';
import { FormatHelpers } from '../helpers/formatHelpers.js';

export class DialogComponent {
  /**
   * @param {DialogManager} dialogManager - Parent dialog manager
   */
  constructor(dialogManager) {
    this.dialogManager = dialogManager;
    this.uiManager = dialogManager.uiManager;
    this.themeManager = dialogManager.themeManager;
    this.dialog = null;
  }
  
  /**
   * Show dialog with options
   * 
   * @param {Object} options - Dialog options
   * @returns {BaseDialog} The dialog instance
   */
  show(options = {}) {
    // Create BaseDialog instance
    this.dialog = new BaseDialog({
      title: options.title || '',
      content: options.content || '',
      closeOnEscape: options.closeOnEscape !== false,
      closeOnOverlayClick: options.closeOnOverlayClick !== false,
      showCloseButton: options.showCloseButton !== false,
      onClose: () => {
        if (typeof options.onClose === 'function') {
          options.onClose();
        }
      },
      ...options
    });
    
    // Show dialog
    this.dialog.show();
    
    // Return dialog overlay for backward compatibility
    return this.dialog.getOverlayElement();
  }
  
  /**
   * Hide dialog
   */
  hide() {
    if (this.dialog) {
      this.dialog.hide();
    }
  }
  
  /**
   * Create a dialog overlay element with appropriate styling
   * @returns {HTMLElement} The dialog overlay element
   */
  createDialogOverlay() {
    // Create BaseDialog instance if not already created
    if (!this.dialog) {
      this.dialog = new BaseDialog();
    }
    
    // Create overlay
    const overlay = this.dialog.createOverlay();
    
    return overlay;
  }
  
  /**
   * Create a dialog content container with appropriate styling
   * @returns {HTMLElement} The dialog content element
   */
  createDialogContent() {
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';
    
    // Apply styles based on theme
    if (this.themeManager) {
      dialogContent.classList.add('theme-dialog-content');
    }
    
    return dialogContent;
  }
  
  /**
   * Add a close/cancel button to a container
   * 
   * @param {HTMLElement} container - Container to add button to
   * @param {Function} onClose - Callback when button is clicked
   * @returns {HTMLElement} The created button
   */
  addCloseButton(container, onClose) {
    // Create BaseDialog instance if not already created
    if (!this.dialog) {
      this.dialog = new BaseDialog();
    }
    
    // Use BaseDialog's addCloseButton method
    return this.dialog.addCloseButton(container, onClose);
  }
  
  /**
   * Set dialog content
   * 
   * @param {string|HTMLElement} content - Dialog content
   */
  setContent(content) {
    if (this.dialog) {
      this.dialog.setContent(content);
    }
  }
  
  /**
   * Set dialog title
   * 
   * @param {string} title - Dialog title
   */
  setTitle(title) {
    if (this.dialog) {
      this.dialog.setTitle(title);
    }
  }
  
  /**
   * Escape HTML to prevent XSS when inserting user content
   * 
   * @param {string} unsafe - Potentially unsafe string
   * @returns {string} Safe string with HTML entities escaped
   */
  escapeHtml(unsafe) {
    return FormatHelpers.escapeHtml(unsafe);
  }
  
  /**
   * Add escape key handler to a dialog
   * 
   * @param {HTMLElement} dialogOverlay - Dialog overlay element
   * @param {Function} callback - Optional callback when escape is pressed
   * @returns {Function} The event handler function
   */
  addEscapeKeyHandler(dialogOverlay, callback = null) {
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.dialogManager.removeDialog(dialogOverlay);
        if (callback) callback();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
    
    return escapeHandler;
  }
  
  /**
   * Create a loading spinner element
   * 
   * @returns {HTMLElement} The loading spinner container
   */
  createLoadingSpinner() {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    
    if (!this.themeManager) {
      loadingContainer.style.textAlign = 'center';
      loadingContainer.style.padding = '20px';
    }
    
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    
    if (!this.themeManager) {
      Object.assign(loadingSpinner.style, {
        display: 'inline-block',
        width: '30px',
        height: '30px',
        border: '3px solid rgba(0, 0, 0, 0.1)',
        borderTopColor: '#3498db',
        borderRadius: '50%',
        animation: 'spin 1s ease-in-out infinite'
      });
      
      // Add @keyframes rule for spinner animation if it doesn't exist
      if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading...';
    loadingText.className = 'loading-text';
    
    if (!this.themeManager) {
      loadingText.style.marginTop = '10px';
    }
    
    // Add the spinner and text to loading container
    loadingContainer.appendChild(loadingSpinner);
    loadingContainer.appendChild(loadingText);
    
    return loadingContainer;
  }
}
