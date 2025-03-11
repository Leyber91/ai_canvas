/**
 * core/dialog/templates/ConfirmationTemplate.js
 * 
 * Template for confirmation dialogs
 * Standard yes/no or ok/cancel dialog template
 */

import { FormatUtils } from '../../utils/FormatUtils.js';
import { StyleUtils } from '../../utils/StyleUtils.js';
import { AnimationUtils } from '../../utils/AnimationUtils.js';

export class ConfirmationTemplate {
  /**
   * Render confirmation dialog with message
   * 
   * @param {Object} options - Template options
   * @returns {HTMLElement} The rendered content
   */
  static render(options = {}) {
    const {
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm = null,
      onCancel = null,
      icon = null,
      type = 'default', // default, success, warning, error, info
      showCancel = true,
      confirmButtonClass = '',
      cancelButtonClass = '',
      messageClass = '',
      markdown = true
    } = options;
    
    // Create container
    const container = document.createElement('div');
    container.className = 'confirmation-dialog-content';
    
    // Add icon if provided
    if (icon) {
      const iconContainer = document.createElement('div');
      iconContainer.className = 'confirmation-dialog-icon';
      
      if (typeof icon === 'string') {
        // Icon is a string (URL or HTML)
        if (icon.startsWith('<svg') || icon.startsWith('<i')) {
          // Icon is HTML/SVG
          iconContainer.innerHTML = icon;
        } else {
          // Icon is an image URL
          const img = document.createElement('img');
          img.src = icon;
          img.alt = 'Confirmation Icon';
          iconContainer.appendChild(img);
        }
      } else if (icon instanceof HTMLElement) {
        // Icon is an HTML element
        iconContainer.appendChild(icon);
      }
      
      StyleUtils.applyStyles(iconContainer, {
        textAlign: 'center',
        marginBottom: '15px'
      });
      
      container.appendChild(iconContainer);
    } else if (type !== 'default') {
      // Add standard icon based on type
      const iconContainer = document.createElement('div');
      iconContainer.className = `confirmation-dialog-icon confirmation-dialog-icon-${type}`;
      
      // Create SVG icon based on type
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '48');
      svg.setAttribute('height', '48');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      
      let path;
      let color;
      
      switch (type) {
        case 'success':
          path = '<circle cx="12" cy="12" r="10"></circle><path d="M8 12l2 2 6-6"></path>';
          color = '#4caf50';
          break;
        case 'warning':
          path = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
          color = '#ff9800';
          break;
        case 'error':
          path = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
          color = '#f44336';
          break;
        case 'info':
          path = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
          color = '#2196f3';
          break;
      }
      
      svg.innerHTML = path;
      svg.style.color = color;
      
      iconContainer.appendChild(svg);
      
      StyleUtils.applyStyles(iconContainer, {
        textAlign: 'center',
        marginBottom: '15px'
      });
      
      container.appendChild(iconContainer);
    }
    
    // Add message
    const messageElement = document.createElement('div');
    messageElement.className = `confirmation-dialog-message ${messageClass}`;
    
    // Format message with markdown if enabled
    if (markdown) {
      messageElement.innerHTML = FormatUtils.formatMessageContent(message);
    } else {
      messageElement.textContent = message;
    }
    
    StyleUtils.applyStyles(messageElement, {
      marginBottom: '20px',
      textAlign: 'center'
    });
    
    container.appendChild(messageElement);
    
    // Add buttons
    ConfirmationTemplate.addButtons(
      container,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      showCancel,
      confirmButtonClass,
      cancelButtonClass,
      type
    );
    
    return container;
  }
  
  /**
   * Add confirmation buttons to container
   * 
   * @param {HTMLElement} container - Container element
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   * @param {boolean} showCancel - Whether to show cancel button
   * @param {string} confirmButtonClass - Additional confirm button class
   * @param {string} cancelButtonClass - Additional cancel button class
   * @param {string} type - Dialog type
   */
  static addButtons(
    container,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    showCancel,
    confirmButtonClass,
    cancelButtonClass,
    type
  ) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'confirmation-dialog-buttons';
    
    StyleUtils.applyStyles(buttonContainer, {
      display: 'flex',
      justifyContent: showCancel ? 'space-between' : 'center',
      marginTop: '20px',
      gap: '10px'
    });
    
    // Create buttons
    if (showCancel) {
      const cancelButton = ConfirmationTemplate.createCancelButton(
        cancelText,
        onCancel,
        cancelButtonClass
      );
      buttonContainer.appendChild(cancelButton);
    }
    
    const confirmButton = ConfirmationTemplate.createConfirmButton(
      confirmText,
      onConfirm,
      confirmButtonClass,
      type
    );
    buttonContainer.appendChild(confirmButton);
    
    container.appendChild(buttonContainer);
  }
  
  /**
   * Create styled confirm button
   * 
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @param {string} className - Additional class name
   * @param {string} type - Dialog type
   * @returns {HTMLElement} The created button
   */
  static createConfirmButton(text, callback, className, type) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `confirmation-dialog-confirm ${className}`;
    button.setAttribute('data-type', type || 'default');
    
    // Apply styles based on type
    let backgroundColor;
    let hoverColor;
    
    switch (type) {
      case 'success':
        backgroundColor = '#4caf50';
        hoverColor = '#45a049';
        break;
      case 'warning':
        backgroundColor = '#ff9800';
        hoverColor = '#e68900';
        break;
      case 'error':
        backgroundColor = '#f44336';
        hoverColor = '#d32f2f';
        break;
      case 'info':
        backgroundColor = '#2196f3';
        hoverColor = '#0b7dda';
        break;
      default:
        backgroundColor = '#3498db';
        hoverColor = '#2980b9';
    }
    
    StyleUtils.applyStyles(button, {
      padding: '10px 20px',
      backgroundColor,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      minWidth: '100px',
      transition: 'background-color 0.2s ease'
    });
    
    // Add hover effect
    StyleUtils.applyHoverEffect(button, {
      backgroundColor: hoverColor
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Create ripple effect
      AnimationUtils.createRippleEffect(e);
      
      if (typeof callback === 'function') {
        callback();
      }
    });
    
    return button;
  }
  
  /**
   * Create styled cancel button
   * 
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @param {string} className - Additional class name
   * @returns {HTMLElement} The created button
   */
  static createCancelButton(text, callback, className) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `confirmation-dialog-cancel ${className}`;
    
    StyleUtils.applyStyles(button, {
      padding: '10px 20px',
      backgroundColor: 'transparent',
      color: '#666',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      minWidth: '100px',
      transition: 'background-color 0.2s ease'
    });
    
    // Add hover effect
    StyleUtils.applyHoverEffect(button, {
      backgroundColor: 'rgba(0, 0, 0, 0.05)'
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Create ripple effect
      AnimationUtils.createRippleEffect(e);
      
      if (typeof callback === 'function') {
        callback();
      }
    });
    
    return button;
  }
  
  /**
   * Format message with markdown
   * 
   * @param {string} message - Message to format
   * @returns {string} Formatted message
   */
  static formatMessage(message) {
    return FormatUtils.formatMessageContent(message);
  }
}
