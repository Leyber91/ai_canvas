/**
 * ui/helpers/domHelpers.js
 * 
 * Utility functions for DOM manipulation and styling.
 * 
 * This is a compatibility wrapper around the new core/utils implementation.
 */

import { StyleUtils } from '../../core/utils/StyleUtils.js';
import { AnimationUtils } from '../../core/utils/AnimationUtils.js';

export const DOMHelper = {
    /**
     * Inject CSS styles into the document
     * 
     * @param {string} id - Style element ID
     * @param {string} cssText - CSS text content
     * @returns {HTMLStyleElement} Created style element
     */
    injectStyles(id, cssText) {
      return StyleUtils.injectStyles(id, cssText);
    },
    
    /**
     * Create a nebula effect element
     * 
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of nebula elements to create
     */
    createNebulaEffect(container, count = 3) {
      return StyleUtils.createNebulaEffect(container, count);
    },
    
    /**
     * Apply glassmorphism effect to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Optional styling options
     */
    applyGlassmorphism(element, options = {}) {
      return StyleUtils.applyGlassmorphism(element, options);
    },
    
    /**
     * Create animated text effect
     * 
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to animate
     * @param {number} speed - Animation speed in ms
     */
    createAnimatedText(element, text, speed = 50) {
      return AnimationUtils.createTypingAnimation(element, text, speed);
    },
    
    /**
     * Apply responsive sizing based on viewport
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} sizes - Size options for different breakpoints
     */
    applyResponsiveSizing(element, sizes = {}) {
      return StyleUtils.applyResponsiveSizing(element, sizes);
    },
    
    /**
     * Create a scrollable container with custom scrollbar
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scrollbar options
     */
    createCustomScrollbar(element, options = {}) {
      return StyleUtils.createCustomScrollbar(element, options);
    },
    
    /**
     * Apply hover effect to element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} hoverStyles - Styles to apply on hover
     */
    applyHoverEffect(element, hoverStyles = {}) {
      return StyleUtils.applyHoverEffect(element, hoverStyles);
    },
    
    /**
     * Apply styles to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} styles - CSS styles object
     * @returns {HTMLElement} - The styled element
     */
    applyStyles(element, styles) {
      return StyleUtils.applyStyles(element, styles);
    },
    
    /**
     * Apply fade-in animation to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {number} delay - Animation delay in ms
     * @returns {HTMLElement} - The animated element
     */
    applyFadeIn(element, delay = 0) {
      return AnimationUtils.applyFadeIn(element, delay);
    },
    
    /**
     * Apply slide-in animation to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {string} direction - Animation direction ('left', 'right', 'top', 'bottom')
     * @param {number} delay - Animation delay in ms
     * @returns {HTMLElement} - The animated element
     */
    applySlideIn(element, direction = 'left', delay = 0) {
      return AnimationUtils.applySlideIn(element, direction, delay);
    },
    
    /**
     * Initialize animations for a page or component
     * 
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Animation options
     */
    initializeAnimations(container = document, options = {}) {
      return AnimationUtils.initializeAnimations(container, options);
    }
  };
  
  export default DOMHelper;
