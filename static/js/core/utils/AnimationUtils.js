/**
 * core/utils/AnimationUtils.js
 * 
 * Utility functions for creating and managing animations.
 * Provides methods for fade-in, slide-in, and ripple effects.
 */

import { StyleUtils } from './StyleUtils.js';

export class AnimationUtils {
  /**
   * Apply fade-in animation to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {number} delay - Animation delay in ms
   * @returns {HTMLElement} - The animated element
   */
  static applyFadeIn(element, delay = 0) {
    if (!element) return element;
    
    // Ensure animation styles are injected
    this.ensureAnimationStylesInjected();
    
    // Set initial opacity
    element.style.opacity = '0';
    
    // Apply animation
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transition = 'opacity 0.5s ease-in-out';
    }, delay);
    
    return element;
  }
  
  /**
   * Apply slide-in animation to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {string} direction - Animation direction ('left', 'right', 'top', 'bottom')
   * @param {number} delay - Animation delay in ms
   * @returns {HTMLElement} - The animated element
   */
  static applySlideIn(element, direction = 'left', delay = 0) {
    if (!element) return element;
    
    // Ensure animation styles are injected
    this.ensureAnimationStylesInjected();
    
    // Set initial position and opacity
    element.style.opacity = '0';
    element.style.position = element.style.position || 'relative';
    
    // Set initial transform based on direction
    switch (direction) {
      case 'left':
        element.style.transform = 'translateX(-20px)';
        break;
      case 'right':
        element.style.transform = 'translateX(20px)';
        break;
      case 'top':
        element.style.transform = 'translateY(-20px)';
        break;
      case 'bottom':
        element.style.transform = 'translateY(20px)';
        break;
      default:
        element.style.transform = 'translateX(-20px)';
    }
    
    // Apply animation
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
      element.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    }, delay);
    
    return element;
  }
  
  /**
   * Create a ripple effect on click
   * 
   * @param {Event} event - Click event
   * @returns {number} - Timeout ID for cleanup
   */
  static createRippleEffect(event) {
    const button = event.currentTarget;
    
    // Ensure ripple styles are injected
    this.ensureRippleStylesInjected();
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    // Calculate ripple size and position
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    // Apply styles to ripple
    StyleUtils.applyStyles(ripple, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`
    });
    
    // Remove existing ripples
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    // Add ripple to button
    button.appendChild(ripple);
    
    // Remove ripple after animation
    const timeout = setTimeout(() => {
      if (ripple.parentElement === button) {
        button.removeChild(ripple);
      }
    }, 600);
    
    return timeout;
  }
  
  /**
   * Apply a pulse animation to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Animation options
   * @returns {HTMLElement} - The animated element
   */
  static applyPulseAnimation(element, options = {}) {
    if (!element) return element;
    
    // Default options
    const defaultOptions = {
      duration: '1.5s',
      iterationCount: 'infinite',
      scale: 1.05,
      delay: 0
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Generate a unique animation name
    const animationName = `pulse-${Math.random().toString(36).substring(2, 11)}`;
    
    // Create keyframes
    StyleUtils.injectStyles(`${animationName}-keyframes`, `
      @keyframes ${animationName} {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(${mergedOptions.scale});
        }
      }
    `);
    
    // Apply animation
    setTimeout(() => {
      StyleUtils.applyStyles(element, {
        animation: `${animationName} ${mergedOptions.duration} ease-in-out ${mergedOptions.iterationCount}`
      });
    }, mergedOptions.delay);
    
    return element;
  }
  
  /**
   * Apply a typing animation to text
   * 
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to animate
   * @param {number} speed - Animation speed in ms
   * @returns {Object} - Animation control object
   */
  static createTypingAnimation(element, text, speed = 50) {
    if (!element) return { stop: () => {} };
    
    // Clear existing content
    element.textContent = '';
    
    // Track current character index
    let index = 0;
    let stopped = false;
    
    // Start animation interval
    const interval = setInterval(() => {
      if (stopped || index >= text.length) {
        clearInterval(interval);
        return;
      }
      
      element.textContent += text.charAt(index);
      index++;
    }, speed);
    
    // Return control object
    return {
      stop: () => {
        stopped = true;
        clearInterval(interval);
        element.textContent = text; // Complete the text immediately
      },
      pause: () => {
        stopped = true;
        clearInterval(interval);
      },
      resume: () => {
        if (stopped && index < text.length) {
          stopped = false;
          this.createTypingAnimation(element, text.substring(index), speed);
        }
      }
    };
  }
  
  /**
   * Ensure animation styles are injected
   * 
   * @private
   */
  static ensureAnimationStylesInjected() {
    // Check if styles are already injected
    if (document.getElementById('core-animation-styles')) {
      return;
    }
    
    // Inject base animation styles
    StyleUtils.injectStyles('core-animation-styles', `
      .fade-in {
        opacity: 0;
        animation: fadeIn 0.5s ease-in-out forwards;
      }
      
      .slide-in-left {
        opacity: 0;
        transform: translateX(-20px);
        animation: slideInLeft 0.5s ease-in-out forwards;
      }
      
      .slide-in-right {
        opacity: 0;
        transform: translateX(20px);
        animation: slideInRight 0.5s ease-in-out forwards;
      }
      
      .slide-in-top {
        opacity: 0;
        transform: translateY(-20px);
        animation: slideInTop 0.5s ease-in-out forwards;
      }
      
      .slide-in-bottom {
        opacity: 0;
        transform: translateY(20px);
        animation: slideInBottom 0.5s ease-in-out forwards;
      }
      
      @keyframes fadeIn {
        to {
          opacity: 1;
        }
      }
      
      @keyframes slideInLeft {
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideInRight {
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideInTop {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInBottom {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `);
  }
  
  /**
   * Ensure ripple styles are injected
   * 
   * @private
   */
  static ensureRippleStylesInjected() {
    // Check if styles are already injected
    if (document.getElementById('core-ripple-styles')) {
      return;
    }
    
    // Inject ripple styles
    StyleUtils.injectStyles('core-ripple-styles', `
      .ripple {
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `);
  }
  
  /**
   * Initialize animations for a page or component
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Animation options
   */
  static initializeAnimations(container = document, options = {}) {
    // Default options
    const defaultOptions = {
      staggerDelay: 100,
      initialDelay: 0
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Ensure animation styles are injected
    this.ensureAnimationStylesInjected();
    
    // Find elements with animation classes
    const fadeInElements = container.querySelectorAll('.fade-in:not(.animated)');
    const slideInLeftElements = container.querySelectorAll('.slide-in-left:not(.animated)');
    const slideInRightElements = container.querySelectorAll('.slide-in-right:not(.animated)');
    const slideInTopElements = container.querySelectorAll('.slide-in-top:not(.animated)');
    const slideInBottomElements = container.querySelectorAll('.slide-in-bottom:not(.animated)');
    
    // Apply animations with staggered delay
    let delay = mergedOptions.initialDelay;
    
    // Fade in animations
    fadeInElements.forEach(element => {
      this.applyFadeIn(element, delay);
      element.classList.add('animated');
      delay += mergedOptions.staggerDelay;
    });
    
    // Slide in animations
    slideInLeftElements.forEach(element => {
      this.applySlideIn(element, 'left', delay);
      element.classList.add('animated');
      delay += mergedOptions.staggerDelay;
    });
    
    slideInRightElements.forEach(element => {
      this.applySlideIn(element, 'right', delay);
      element.classList.add('animated');
      delay += mergedOptions.staggerDelay;
    });
    
    slideInTopElements.forEach(element => {
      this.applySlideIn(element, 'top', delay);
      element.classList.add('animated');
      delay += mergedOptions.staggerDelay;
    });
    
    slideInBottomElements.forEach(element => {
      this.applySlideIn(element, 'bottom', delay);
      element.classList.add('animated');
      delay += mergedOptions.staggerDelay;
    });
  }
}
