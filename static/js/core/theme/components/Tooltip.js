/**
 * core/theme/components/Tooltip.js
 * 
 * Tooltip component system
 * Provides contextual information on hover/focus
 */

export class Tooltip {
  constructor() {
    // Active tooltips
    this.activeTooltips = new Map();
    
    // Tooltip counter for unique IDs
    this.tooltipCounter = 0;
    
    // Global event listeners status
    this.listenersInitialized = false;
    
    // Bind methods
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.updateTooltipContent = this.updateTooltipContent.bind(this);
    this.positionTooltip = this.positionTooltip.bind(this);
    this.createTooltipElement = this.createTooltipElement.bind(this);
    this.setupGlobalTooltipListeners = this.setupGlobalTooltipListeners.bind(this);
    this.cleanupGlobalTooltipListeners = this.cleanupGlobalTooltipListeners.bind(this);
    this.registerTooltipTarget = this.registerTooltipTarget.bind(this);
    
    // Initialize global listeners
    this.setupGlobalTooltipListeners();
  }
  
  /**
   * Show tooltip
   * 
   * @param {HTMLElement|Object} target - Target element or position {x, y}
   * @param {string|HTMLElement} content - Tooltip content
   * @param {Object} options - Tooltip options
   * @returns {HTMLElement} Tooltip element
   */
  showTooltip(target, content, options = {}) {
    // Default options
    const defaults = {
      position: 'auto', // 'top', 'right', 'bottom', 'left', 'auto'
      offset: 10,
      className: '',
      duration: 200,
      interactive: false,
      maxWidth: 300,
      zIndex: 1000,
      theme: 'dark' // 'dark', 'light'
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    // Create tooltip element
    const tooltip = this.createTooltipElement(content, opts);
    
    // Position tooltip
    if (target instanceof HTMLElement) {
      this.positionTooltip(tooltip, target, opts.position, opts.offset);
      
      // Store target reference
      tooltip.targetElement = target;
      
      // Set ARIA attributes for accessibility
      const tooltipId = tooltip.id;
      target.setAttribute('aria-describedby', tooltipId);
    } else if (typeof target === 'object' && target.x !== undefined && target.y !== undefined) {
      // Position at specific coordinates
      tooltip.style.left = `${target.x}px`;
      tooltip.style.top = `${target.y}px`;
    }
    
    // Add to active tooltips
    this.activeTooltips.set(tooltip.id, tooltip);
    
    // Show tooltip with animation
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
    
    return tooltip;
  }
  
  /**
   * Hide tooltip
   * 
   * @param {HTMLElement|string} tooltip - Tooltip element or ID
   */
  hideTooltip(tooltip) {
    // Get tooltip element if ID was provided
    if (typeof tooltip === 'string') {
      tooltip = document.getElementById(tooltip);
    }
    
    if (!tooltip) return;
    
    // Remove ARIA attributes
    if (tooltip.targetElement) {
      tooltip.targetElement.removeAttribute('aria-describedby');
    }
    
    // Hide tooltip
    tooltip.classList.remove('visible');
    
    // Remove after animation completes
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      
      // Remove from active tooltips
      this.activeTooltips.delete(tooltip.id);
    }, 200);
  }
  
  /**
   * Update tooltip content
   * 
   * @param {HTMLElement|string} tooltip - Tooltip element or ID
   * @param {string|HTMLElement} content - New tooltip content
   */
  updateTooltipContent(tooltip, content) {
    // Get tooltip element if ID was provided
    if (typeof tooltip === 'string') {
      tooltip = document.getElementById(tooltip);
    }
    
    if (!tooltip) return;
    
    // Get content container
    const contentContainer = tooltip.querySelector('.tooltip-content');
    if (!contentContainer) return;
    
    // Update content
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentContainer.innerHTML = '';
      contentContainer.appendChild(content);
    }
    
    // Reposition tooltip if target element is available
    if (tooltip.targetElement) {
      const position = tooltip.getAttribute('data-position') || 'auto';
      const offset = parseInt(tooltip.getAttribute('data-offset') || '10', 10);
      this.positionTooltip(tooltip, tooltip.targetElement, position, offset);
    }
  }
  
  /**
   * Position tooltip relative to target
   * 
   * @param {HTMLElement} tooltip - Tooltip element
   * @param {HTMLElement} target - Target element
   * @param {string} position - Preferred position
   * @param {number} offset - Distance from target
   */
  positionTooltip(tooltip, target, position = 'auto', offset = 10) {
    if (!tooltip || !target) return;
    
    // Get target and tooltip dimensions
    const targetRect = target.getBoundingClientRect();
    
    // Store original position for potential repositioning
    const originalPosition = position;
    
    // Position tooltip based on preferred position
    let top, left;
    
    // Determine best position if auto
    if (position === 'auto') {
      // Calculate available space in each direction
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const spaceAbove = targetRect.top;
      const spaceBelow = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;
      
      // Find position with most space
      const spaces = [
        { position: 'bottom', space: spaceBelow },
        { position: 'top', space: spaceAbove },
        { position: 'right', space: spaceRight },
        { position: 'left', space: spaceLeft }
      ];
      
      // Sort by available space
      spaces.sort((a, b) => b.space - a.space);
      
      // Use position with most space
      position = spaces[0].position;
    }
    
    // Store position for potential updates
    tooltip.setAttribute('data-position', position);
    tooltip.setAttribute('data-offset', offset.toString());
    
    // Apply initial positioning
    switch (position) {
      case 'top':
        top = targetRect.top - tooltip.offsetHeight - offset;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
        tooltip.classList.add('position-top');
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
        tooltip.classList.add('position-bottom');
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
        left = targetRect.left - tooltip.offsetWidth - offset;
        tooltip.classList.add('position-left');
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltip.offsetHeight / 2);
        left = targetRect.right + offset;
        tooltip.classList.add('position-right');
        break;
      default:
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width / 2) - (tooltip.offsetWidth / 2);
        tooltip.classList.add('position-bottom');
    }
    
    // Apply position
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    // Check if tooltip is outside viewport and reposition if needed
    this.adjustTooltipPosition(tooltip);
  }
  
  /**
   * Adjust tooltip position to stay within viewport
   * 
   * @private
   * @param {HTMLElement} tooltip - Tooltip element
   */
  adjustTooltipPosition(tooltip) {
    if (!tooltip) return;
    
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check horizontal position
    if (tooltipRect.left < 0) {
      tooltip.style.left = '10px';
    } else if (tooltipRect.right > viewportWidth) {
      tooltip.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
    }
    
    // Check vertical position
    if (tooltipRect.top < 0) {
      tooltip.style.top = '10px';
    } else if (tooltipRect.bottom > viewportHeight) {
      tooltip.style.top = `${viewportHeight - tooltipRect.height - 10}px`;
    }
  }
  
  /**
   * Create tooltip element
   * 
   * @param {string|HTMLElement} content - Tooltip content
   * @param {Object} options - Tooltip options
   * @returns {HTMLElement} Tooltip element
   */
  createTooltipElement(content, options = {}) {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = `tooltip-${++this.tooltipCounter}`;
    tooltip.className = `tooltip ${options.className || ''}`;
    tooltip.setAttribute('role', 'tooltip');
    
    // Apply theme
    tooltip.classList.add(`theme-${options.theme || 'dark'}`);
    
    // Apply styles
    Object.assign(tooltip.style, {
      position: 'fixed',
      zIndex: options.zIndex || 1000,
      maxWidth: `${options.maxWidth || 300}px`,
      pointerEvents: options.interactive ? 'auto' : 'none',
      opacity: 0,
      transition: `opacity ${options.duration || 200}ms ease-out`
    });
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tooltip-content';
    
    // Add content
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentContainer.appendChild(content);
    }
    
    // Add arrow element
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    
    // Assemble tooltip
    tooltip.appendChild(contentContainer);
    tooltip.appendChild(arrow);
    
    // Add to document
    document.body.appendChild(tooltip);
    
    return tooltip;
  }
  
  /**
   * Set up global tooltip listeners
   */
  setupGlobalTooltipListeners() {
    if (this.listenersInitialized) return;
    
    // Handle escape key to close tooltips
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideAllTooltips();
      }
    });
    
    // Handle scroll and resize events
    window.addEventListener('scroll', this.updateTooltipPositions.bind(this), true);
    window.addEventListener('resize', this.updateTooltipPositions.bind(this));
    
    this.listenersInitialized = true;
  }
  
  /**
   * Update positions of all active tooltips
   * 
   * @private
   */
  updateTooltipPositions() {
    this.activeTooltips.forEach((tooltip) => {
      if (tooltip.targetElement) {
        const position = tooltip.getAttribute('data-position') || 'auto';
        const offset = parseInt(tooltip.getAttribute('data-offset') || '10', 10);
        this.positionTooltip(tooltip, tooltip.targetElement, position, offset);
      }
    });
  }
  
  /**
   * Hide all tooltips
   */
  hideAllTooltips() {
    this.activeTooltips.forEach((tooltip) => {
      this.hideTooltip(tooltip);
    });
  }
  
  /**
   * Clean up global tooltip listeners
   */
  cleanupGlobalTooltipListeners() {
    if (!this.listenersInitialized) return;
    
    document.removeEventListener('keydown', this.handleEscapeKey);
    window.removeEventListener('scroll', this.updateTooltipPositions, true);
    window.removeEventListener('resize', this.updateTooltipPositions);
    
    this.listenersInitialized = false;
  }
  
  /**
   * Register element as tooltip target
   * 
   * @param {HTMLElement} element - Target element
   * @param {string|HTMLElement} content - Tooltip content
   * @param {Object} options - Tooltip options
   */
  registerTooltipTarget(element, content, options = {}) {
    if (!element) return;
    
    // Store content and options on element
    element.tooltipContent = content;
    element.tooltipOptions = options;
    
    // Add event listeners
    element.addEventListener('mouseenter', () => {
      this.showTooltip(element, element.tooltipContent, element.tooltipOptions);
    });
    
    element.addEventListener('mouseleave', () => {
      const tooltipId = element.getAttribute('aria-describedby');
      if (tooltipId) {
        this.hideTooltip(tooltipId);
      }
    });
    
    element.addEventListener('focus', () => {
      this.showTooltip(element, element.tooltipContent, element.tooltipOptions);
    });
    
    element.addEventListener('blur', () => {
      const tooltipId = element.getAttribute('aria-describedby');
      if (tooltipId) {
        this.hideTooltip(tooltipId);
      }
    });
  }
  
  /**
   * Inject tooltip styles
   */
  injectTooltipStyles() {
    // Check if styles already exist
    if (document.getElementById('tooltip-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    
    style.textContent = `
      .tooltip {
        position: fixed;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.4;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-out;
        box-sizing: border-box;
        max-width: 300px;
        z-index: 1000;
      }
      
      .tooltip.visible {
        opacity: 1;
      }
      
      .tooltip.interactive {
        pointer-events: auto;
      }
      
      .tooltip-arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        transform: rotate(45deg);
      }
      
      .tooltip.position-top .tooltip-arrow {
        bottom: -4px;
        left: calc(50% - 4px);
      }
      
      .tooltip.position-bottom .tooltip-arrow {
        top: -4px;
        left: calc(50% - 4px);
      }
      
      .tooltip.position-left .tooltip-arrow {
        right: -4px;
        top: calc(50% - 4px);
      }
      
      .tooltip.position-right .tooltip-arrow {
        left: -4px;
        top: calc(50% - 4px);
      }
      
      .tooltip.theme-dark {
        background-color: rgba(0, 0, 0, 0.8);
        color: #ffffff;
        border: 1px solid rgba(80, 120, 240, 0.3);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      
      .tooltip.theme-dark .tooltip-arrow {
        background-color: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(80, 120, 240, 0.3);
      }
      
      .tooltip.theme-light {
        background-color: rgba(255, 255, 255, 0.95);
        color: #333333;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .tooltip.theme-light .tooltip-arrow {
        background-color: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Hide all tooltips
    this.hideAllTooltips();
    
    // Clean up event listeners
    this.cleanupGlobalTooltipListeners();
    
    // Remove tooltip styles
    const tooltipStyles = document.getElementById('tooltip-styles');
    if (tooltipStyles) {
      tooltipStyles.parentNode.removeChild(tooltipStyles);
    }
  }
}

// Create singleton instance
export const tooltip = new Tooltip();
