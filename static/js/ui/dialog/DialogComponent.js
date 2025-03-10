/**
 * ui/dialog/DialogComponent.js
 * 
 * Base component for all dialog types.
 * Provides common functionality and integration with ThemeManager.
 */

import { DOMHelper } from '../helpers/domHelpers.js';
import { EventUtils } from '../helpers/EventUtils.js';
import { FormatHelpers } from '../helpers/formatHelpers.js';

export class DialogComponent {
  /**
   * @param {DialogManager} dialogManager - Parent dialog manager
   */
  constructor(dialogManager) {
    this.dialogManager = dialogManager;
    this.uiManager = dialogManager.uiManager;
    this.themeManager = dialogManager.themeManager;
  }
  
  /**
   * Create a dialog overlay element with appropriate styling
   * @returns {HTMLElement} The dialog overlay element
   */
  createDialogOverlay() {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    // Apply styles using ThemeManager if available
    if (this.themeManager) {
      DOMHelper.applyGlassmorphism(dialogOverlay, {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '1000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(3px)'
      });
    } else {
      // Fallback inline styles
      Object.assign(dialogOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '1000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      });
    }
    
    return dialogOverlay;
  }
  
  /**
   * Create a dialog content container with appropriate styling
   * @returns {HTMLElement} The dialog content element
   */
  createDialogContent() {
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';
    
    // Apply glassmorphism effect if ThemeManager is available
    if (this.themeManager) {
      DOMHelper.applyGlassmorphism(dialogContent, {
        backgroundColor: 'rgba(18, 22, 36, 0.8)',
        color: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      });
    } else {
      // Fallback inline styles
      Object.assign(dialogContent.style, {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      });
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
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.textAlign = 'right';
    buttonContainer.style.marginTop = '15px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'dialog-btn';
    
    if (this.themeManager) {
      // Add the theme class for styling
      closeButton.classList.add('theme-btn');
    } else {
      // Fallback inline styles
      closeButton.style.padding = '8px 16px';
    }
    
    closeButton.addEventListener('click', onClose);
    
    // Add ripple effect if EventUtils is available
    if (EventUtils && typeof EventUtils.createRippleEffect === 'function') {
      closeButton.addEventListener('click', (e) => {
        EventUtils.createRippleEffect(e);
      });
    }
    
    buttonContainer.appendChild(closeButton);
    container.appendChild(buttonContainer);
    
    return closeButton;
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