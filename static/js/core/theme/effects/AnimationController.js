/**
 * core/theme/effects/AnimationController.js
 * 
 * Controls UI animations throughout the application
 * Manages animation timing, sequencing, and performance
 */

export class AnimationController {
  constructor() {
    // Animation registry for tracking and cleanup
    this.animations = new Map();
    
    // Default animation options
    this.defaultOptions = {
      duration: 300,
      easing: 'ease-out',
      delay: 0,
      iterations: 1,
      fill: 'forwards'
    };
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Bind methods
    this.initializeAnimations = this.initializeAnimations.bind(this);
    this.applyFadeIn = this.applyFadeIn.bind(this);
    this.applySlideIn = this.applySlideIn.bind(this);
    this.applyPulse = this.applyPulse.bind(this);
    this.applyTypewriter = this.applyTypewriter.bind(this);
    this.createTransition = this.createTransition.bind(this);
    this.injectAnimationStyles = this.injectAnimationStyles.bind(this);
    this.cancelAnimation = this.cancelAnimation.bind(this);
    this.getAnimationDuration = this.getAnimationDuration.bind(this);
    
    // Set up reduced motion listener
    this.setupReducedMotionListener();
  }
  
  /**
   * Set up listener for reduced motion preference changes
   * 
   * @private
   */
  setupReducedMotionListener() {
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      try {
        // Chrome & Firefox
        motionQuery.addEventListener('change', (e) => {
          this.prefersReducedMotion = e.matches;
        });
      } catch (error1) {
        try {
          // Safari
          motionQuery.addListener((e) => {
            this.prefersReducedMotion = e.matches;
          });
        } catch (error2) {
          console.warn('Browser does not support media query listeners');
        }
      }
    }
  }
  
  /**
   * Initialize animations for UI elements
   * 
   * @param {HTMLElement} container - Container element (defaults to document)
   * @param {Object} options - Animation options
   */
  initializeAnimations(container = document, options = {}) {
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion && !options.ignoreReducedMotion) {
      this.makeElementsVisible(container);
      return;
    }
    
    // Inject animation styles if they don't exist
    this.injectAnimationStyles();
    
    // Find elements with animation classes
    const fadeElements = container.querySelectorAll('.fade-in');
    const slideRightElements = container.querySelectorAll('.slide-in-right');
    const slideUpElements = container.querySelectorAll('.slide-in-up');
    const slideLeftElements = container.querySelectorAll('.slide-in-left');
    const slideDownElements = container.querySelectorAll('.slide-in-down');
    
    // Set initial visibility to hidden to prevent FOUC
    [...fadeElements, ...slideRightElements, ...slideUpElements, 
     ...slideLeftElements, ...slideDownElements].forEach(element => {
      element.style.visibility = 'hidden';
    });
    
    // Apply animations with staggered delays
    setTimeout(() => {
      // Apply fade-in animations
      fadeElements.forEach((element, index) => {
        const delay = options.staggered ? index * 50 : 0;
        this.applyFadeIn(element, { delay });
      });
      
      // Apply slide-in-right animations
      slideRightElements.forEach((element, index) => {
        const delay = options.staggered ? index * 50 : 0;
        this.applySlideIn(element, 'right', { delay });
      });
      
      // Apply slide-in-up animations
      slideUpElements.forEach((element, index) => {
        const delay = options.staggered ? index * 50 : 0;
        this.applySlideIn(element, 'up', { delay });
      });
      
      // Apply slide-in-left animations
      slideLeftElements.forEach((element, index) => {
        const delay = options.staggered ? index * 50 : 0;
        this.applySlideIn(element, 'left', { delay });
      });
      
      // Apply slide-in-down animations
      slideDownElements.forEach((element, index) => {
        const delay = options.staggered ? index * 50 : 0;
        this.applySlideIn(element, 'down', { delay });
      });
    }, 10);
  }
  
  /**
   * Make elements visible without animation
   * 
   * @private
   * @param {HTMLElement} container - Container element
   */
  makeElementsVisible(container) {
    const animatedElements = container.querySelectorAll(
      '.fade-in, .slide-in-right, .slide-in-up, .slide-in-left, .slide-in-down'
    );
    
    animatedElements.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
    });
  }
  
  /**
   * Apply fade-in animation to an element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {Object} options - Animation options
   * @returns {HTMLElement} Animated element
   */
  applyFadeIn(element, options = {}) {
    if (!element) return null;
    
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion && !options.ignoreReducedMotion) {
      element.style.opacity = '1';
      element.style.visibility = 'visible';
      return element;
    }
    
    // Cancel any existing animations
    this.cancelAnimation(element);
    
    // Merge with default options
    const animOptions = { ...this.defaultOptions, ...options };
    
    // Set initial state
    element.style.opacity = '0';
    element.style.visibility = 'visible';
    
    // Create animation
    const animation = element.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: animOptions.duration,
      easing: animOptions.easing,
      delay: animOptions.delay,
      iterations: animOptions.iterations,
      fill: animOptions.fill
    });
    
    // Store animation for potential cancellation
    this.animations.set(element, animation);
    
    // Set final state when animation completes
    animation.onfinish = () => {
      element.style.opacity = '1';
      this.animations.delete(element);
      
      if (animOptions.onComplete) {
        animOptions.onComplete(element);
      }
    };
    
    return element;
  }
  
  /**
   * Apply slide-in animation to an element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {string} direction - Direction ('left', 'right', 'up', 'down')
   * @param {Object} options - Animation options
   * @returns {HTMLElement} Animated element
   */
  applySlideIn(element, direction = 'right', options = {}) {
    if (!element) return null;
    
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion && !options.ignoreReducedMotion) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
      return element;
    }
    
    // Cancel any existing animations
    this.cancelAnimation(element);
    
    // Merge with default options
    const animOptions = { ...this.defaultOptions, ...options };
    
    // Determine transform based on direction
    let startTransform;
    switch (direction) {
      case 'left':
        startTransform = 'translateX(-30px)';
        break;
      case 'right':
        startTransform = 'translateX(30px)';
        break;
      case 'up':
        startTransform = 'translateY(-30px)';
        break;
      case 'down':
        startTransform = 'translateY(30px)';
        break;
      default:
        startTransform = 'translateX(30px)';
    }
    
    // Set initial state
    element.style.opacity = '0';
    element.style.transform = startTransform;
    element.style.visibility = 'visible';
    
    // Create animation
    const animation = element.animate([
      { opacity: 0, transform: startTransform },
      { opacity: 1, transform: 'translate(0, 0)' }
    ], {
      duration: animOptions.duration,
      easing: animOptions.easing,
      delay: animOptions.delay,
      iterations: animOptions.iterations,
      fill: animOptions.fill
    });
    
    // Store animation for potential cancellation
    this.animations.set(element, animation);
    
    // Set final state when animation completes
    animation.onfinish = () => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      this.animations.delete(element);
      
      if (animOptions.onComplete) {
        animOptions.onComplete(element);
      }
    };
    
    return element;
  }
  
  /**
   * Apply pulse animation to an element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {Object} options - Animation options
   * @returns {HTMLElement} Animated element
   */
  applyPulse(element, options = {}) {
    if (!element) return null;
    
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion && !options.ignoreReducedMotion) {
      return element;
    }
    
    // Cancel any existing animations
    this.cancelAnimation(element);
    
    // Merge with default options
    const animOptions = {
      ...this.defaultOptions,
      iterations: Infinity,
      duration: 2000,
      ...options
    };
    
    // Create animation
    const animation = element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration: animOptions.duration,
      easing: 'ease-in-out',
      delay: animOptions.delay,
      iterations: animOptions.iterations,
      fill: animOptions.fill
    });
    
    // Store animation for potential cancellation
    this.animations.set(element, animation);
    
    return element;
  }
  
  /**
   * Apply typewriter effect to an element
   * 
   * @param {HTMLElement} element - Element to animate
   * @param {string} text - Text to type
   * @param {number} speed - Typing speed in ms per character
   * @returns {HTMLElement} Animated element
   */
  applyTypewriter(element, text, speed = 50) {
    if (!element) return null;
    
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion) {
      element.textContent = text;
      return element;
    }
    
    // Clear existing content
    element.textContent = '';
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    cursor.style.animation = 'cursor-blink 1s infinite';
    element.appendChild(cursor);
    
    // Type characters one by one
    let i = 0;
    const typeNextChar = () => {
      if (i < text.length) {
        const char = text.charAt(i);
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        element.insertBefore(charSpan, cursor);
        i++;
        setTimeout(typeNextChar, speed);
      } else {
        // Remove cursor when typing is complete
        setTimeout(() => {
          if (cursor.parentNode === element) {
            element.removeChild(cursor);
          }
        }, 1000);
      }
    };
    
    // Start typing
    setTimeout(typeNextChar, speed);
    
    return element;
  }
  
  /**
   * Create transition for element properties
   * 
   * @param {HTMLElement} element - Element to transition
   * @param {Object} properties - CSS properties to transition
   * @param {number} duration - Transition duration in ms
   * @returns {HTMLElement} Transitioned element
   */
  createTransition(element, properties, duration = 300) {
    if (!element) return null;
    
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion) {
      Object.assign(element.style, properties);
      return element;
    }
    
    // Set transition property
    const propNames = Object.keys(properties).join(', ');
    element.style.transition = `${propNames} ${duration}ms ease-out`;
    
    // Apply properties after a small delay to ensure transition works
    setTimeout(() => {
      Object.assign(element.style, properties);
    }, 10);
    
    return element;
  }
  
  /**
   * Inject animation styles into document
   */
  injectAnimationStyles() {
    // Check if styles already exist
    if (document.getElementById('animation-controller-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'animation-controller-styles';
    
    style.textContent = `
      /* Cursor blink animation */
      @keyframes cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      
      /* Pulse animation */
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      /* Fade in animation */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Slide in animations */
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Animation classes */
      .fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .slide-in-right {
        animation: slideInRight 0.5s ease-out forwards;
      }
      
      .slide-in-left {
        animation: slideInLeft 0.5s ease-out forwards;
      }
      
      .slide-in-up {
        animation: slideInUp 0.5s ease-out forwards;
      }
      
      .slide-in-down {
        animation: slideInDown 0.5s ease-out forwards;
      }
      
      .pulse {
        animation: pulse 2s infinite ease-in-out;
      }
      
      /* Typing cursor */
      .typing-cursor {
        display: inline-block;
        width: 3px;
        background-color: currentColor;
        margin-left: 2px;
        animation: cursor-blink 1s infinite;
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .fade-in, .slide-in-right, .slide-in-left, .slide-in-up, .slide-in-down, .pulse {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Cancel ongoing animation
   * 
   * @param {HTMLElement} element - Element with animation
   */
  cancelAnimation(element) {
    if (!element) return;
    
    const animation = this.animations.get(element);
    if (animation) {
      animation.cancel();
      this.animations.delete(element);
    }
  }
  
  /**
   * Get animation duration for element
   * 
   * @param {HTMLElement} element - Element to check
   * @returns {number} Animation duration in ms
   */
  getAnimationDuration(element) {
    if (!element) return 0;
    
    const style = window.getComputedStyle(element);
    const animDuration = style.animationDuration || '0s';
    const transDuration = style.transitionDuration || '0s';
    
    // Convert to milliseconds
    const animMs = this.timeToMs(animDuration);
    const transMs = this.timeToMs(transDuration);
    
    return Math.max(animMs, transMs);
  }
  
  /**
   * Convert time string to milliseconds
   * 
   * @private
   * @param {string} time - Time string (e.g., '0.5s', '500ms')
   * @returns {number} Time in milliseconds
   */
  timeToMs(time) {
    if (time.endsWith('ms')) {
      return parseFloat(time);
    } else if (time.endsWith('s')) {
      return parseFloat(time) * 1000;
    }
    return 0;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Cancel all animations
    this.animations.forEach(animation => {
      animation.cancel();
    });
    this.animations.clear();
    
    // Remove event listeners
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.removeEventListener('change', this.handleReducedMotionChange);
      motionQuery.removeListener(this.handleReducedMotionChange);
    }
  }
}

// Create singleton instance
export const animationController = new AnimationController();
