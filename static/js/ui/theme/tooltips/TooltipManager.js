/**
 * ui/theme/tooltips/TooltipManager.js
 * 
 * Manages tooltips for UI elements
 */

export class TooltipManager {
    /**
     * @param {HTMLElement} tooltipElement - Tooltip DOM element
     */
    constructor(tooltipElement) {
      this.tooltipElement = tooltipElement;
      
      // Create tooltip element if it doesn't exist
      if (!this.tooltipElement) {
        this.createTooltipElement();
      }
    }
    
    /**
     * Create tooltip element if it doesn't exist
     */
    createTooltipElement() {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.id = 'custom-tooltip';
      this.tooltipElement.className = 'custom-tooltip';
      
      // Apply base styles
      Object.assign(this.tooltipElement.style, {
        position: 'absolute',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.2s',
        maxWidth: '300px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(80, 120, 240, 0.3)'
      });
      
      document.body.appendChild(this.tooltipElement);
    }
    
    /**
     * Show tooltip at specified position
     * 
     * @param {Object} position - Position {x, y}
     * @param {string} content - Tooltip content
     */
    showTooltip(position, content) {
      if (!this.tooltipElement) return;
      
      this.tooltipElement.innerHTML = content;
      
      // Position tooltip
      this.tooltipElement.style.left = `${position.x + 10}px`;
      this.tooltipElement.style.top = `${position.y + 10}px`;
      
      // Make sure tooltip stays within viewport
      this.adjustTooltipPosition();
      
      // Show tooltip
      this.tooltipElement.style.opacity = '1';
      
      // Add visible class
      this.tooltipElement.classList.add('visible');
    }
    
    /**
     * Adjust tooltip position to stay within viewport
     */
    adjustTooltipPosition() {
      if (!this.tooltipElement) return;
      
      const tooltipRect = this.tooltipElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if needed
      if (tooltipRect.right > viewportWidth) {
        const newLeft = viewportWidth - tooltipRect.width - 10;
        this.tooltipElement.style.left = `${newLeft}px`;
      }
      
      // Adjust vertical position if needed
      if (tooltipRect.bottom > viewportHeight) {
        const newTop = viewportHeight - tooltipRect.height - 10;
        this.tooltipElement.style.top = `${newTop}px`;
      }
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
      if (!this.tooltipElement) return;
      
      this.tooltipElement.style.opacity = '0';
      this.tooltipElement.classList.remove('visible');
    }
    
    /**
     * Update tooltip content
     * 
     * @param {string} content - New tooltip content
     */
    updateTooltipContent(content) {
      if (!this.tooltipElement) return;
      
      this.tooltipElement.innerHTML = content;
      
      // Readjust position after content update
      this.adjustTooltipPosition();
    }
  }