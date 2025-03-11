/**
 * ui/theme/animations/UIAnimations.js
 * 
 * Compatibility wrapper around AnimationController
 * Maintains same API for backward compatibility
 */

import { animationController } from '../../../core/theme/effects/AnimationController.js';

export class UIAnimations {
  /**
   * Initialize animations for UI elements
   */
  initializeAnimations() {
    // Delegate to core implementation
    animationController.initializeAnimations(document, {
      staggered: true
    });
  }
  
  /**
   * Inject animation styles
   */
  injectAnimationStyles() {
    // Delegate to core implementation
    animationController.injectAnimationStyles();
  }
  
  /**
   * Apply fade-in animation to a specific element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {number} delay - Delay in milliseconds
   */
  applyFadeIn(element, delay = 0) {
    // Delegate to core implementation
    animationController.applyFadeIn(element, { delay });
  }
  
  /**
   * Apply slide-in animation to a specific element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {string} direction - Direction ('left', 'right', 'up', 'down')
   * @param {number} delay - Delay in milliseconds
   */
  applySlideIn(element, direction = 'right', delay = 0) {
    // Delegate to core implementation
    animationController.applySlideIn(element, direction, { delay });
  }
  
  /**
   * Apply pulse animation to an element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {Object} options - Animation options
   */
  applyPulseAnimation(element, options = {}) {
    // Delegate to core implementation
    animationController.applyPulse(element, options);
  }
  
  /**
   * Create a transition for element properties
   * 
   * @param {HTMLElement} element - Element to transition
   * @param {Object} properties - CSS properties to transition
   * @param {number} duration - Transition duration in ms
   */
  createTransition(element, properties, duration = 300) {
    // Delegate to core implementation
    animationController.createTransition(element, properties, duration);
  }
  
  /**
   * Cancel ongoing animation
   * 
   * @param {HTMLElement} element - Element with animation
   */
  cancelAnimation(element) {
    // Delegate to core implementation
    animationController.cancelAnimation(element);
  }
}
