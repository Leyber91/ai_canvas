/**
 * ui/theme/tooltips/TooltipManager.js
 * 
 * Compatibility wrapper around Tooltip component
 * Maintains same API for backward compatibility
 */

import { tooltip } from '../../../core/theme/components/Tooltip.js';
import { themeService } from '../../../core/theme/ThemeService.js';

export class TooltipManager {
  /**
   * @param {HTMLElement} tooltipElement - Tooltip DOM element
   */
  constructor(tooltipElement) {
    // Store reference to tooltip element
    this.tooltipElement = tooltipElement;
    
    // Ensure tooltip styles are injected
    tooltip.injectTooltipStyles();
    
    // Subscribe to theme changes
    this.themeChangeUnsubscribe = themeService.subscribeToThemeChanges(() => {
      // Update any visible tooltips when theme changes
      this.updateTooltipTheme();
    });
  }
  
  /**
   * Create tooltip element if it doesn't exist
   */
  createTooltipElement() {
    // No need to implement as the core Tooltip handles this
    // This method is kept for API compatibility
  }
  
  /**
   * Get current theme for tooltips
   * 
   * @private
   * @returns {string} Current theme name ('light' or 'dark')
   */
  getCurrentTheme() {
    return themeService.currentThemeName || 'dark';
  }
  
  /**
   * Update theme for all visible tooltips
   * 
   * @private
   */
  updateTooltipTheme() {
    const activeTooltips = document.querySelectorAll('.tooltip.visible');
    const currentTheme = this.getCurrentTheme();
    
    activeTooltips.forEach(tooltipElement => {
      tooltipElement.classList.remove('theme-dark', 'theme-light');
      tooltipElement.classList.add(`theme-${currentTheme}`);
    });
  }
  
  /**
   * Show tooltip at specified position
   * 
   * @param {Object} position - Position {x, y}
   * @param {string} content - Tooltip content
   */
  showTooltip(position, content) {
    // Delegate to core implementation with current theme
    tooltip.showTooltip(position, content, {
      theme: this.getCurrentTheme(),
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
    // Delegate to core implementation with current theme
    tooltip.registerTooltipTarget(element, content, {
      theme: this.getCurrentTheme(),
      className: 'custom-tooltip',
      ...options
    });
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Unsubscribe from theme changes
    if (this.themeChangeUnsubscribe) {
      this.themeChangeUnsubscribe();
    }
  }
}