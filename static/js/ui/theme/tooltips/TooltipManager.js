/**
 * ui/theme/tooltips/TooltipManager.js
 * 
 * Compatibility wrapper around Tooltip component
 * Maintains same API for backward compatibility
 */

import { tooltip } from '../../../core/theme/components/Tooltip.js';

export class TooltipManager {
  /**
   * @param {HTMLElement} tooltipElement - Tooltip DOM element
   */
  constructor(tooltipElement) {
    // Store reference to tooltip element
    this.tooltipElement = tooltipElement;
    
    // Ensure tooltip styles are injected
    tooltip.injectTooltipStyles();
  }
  
  /**
   * Create tooltip element if it doesn't exist
   */
  createTooltipElement() {
    // No need to implement as the core Tooltip handles this
    // This method is kept for API compatibility
  }
  
  /**
   * Show tooltip at specified position
   * 
   * @param {Object} position - Position {x, y}
   * @param {string} content - Tooltip content
   */
  showTooltip(position, content) {
    // Delegate to core implementation
    tooltip.showTooltip(position, content, {
      theme: 'dark',
      className: 'custom-tooltip'
    });
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip() {
    // Delegate to core implementation
    tooltip.hideAllTooltips();
  }
  
  /**
   * Update tooltip content
   * 
   * @param {string} content - New tooltip content
   */
  updateTooltipContent(content) {
    // Find active tooltip and update content
    const activeTooltips = document.querySelectorAll('.tooltip.visible');
    if (activeTooltips.length > 0) {
      tooltip.updateTooltipContent(activeTooltips[0], content);
    }
  }
  
  /**
   * Adjust tooltip position to stay within viewport
   */
  adjustTooltipPosition() {
    // This is handled automatically by the core Tooltip component
    // This method is kept for API compatibility
  }
  
  /**
   * Register element as tooltip target
   * 
   * @param {HTMLElement} element - Target element
   * @param {string} content - Tooltip content
   * @param {Object} options - Tooltip options
   */
  registerTooltipTarget(element, content, options = {}) {
    // Delegate to core implementation
    tooltip.registerTooltipTarget(element, content, {
      theme: 'dark',
      className: 'custom-tooltip',
      ...options
    });
  }
}
