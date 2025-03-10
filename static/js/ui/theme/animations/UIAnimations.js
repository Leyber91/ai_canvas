/**
 * ui/theme/animations/UIAnimations.js
 * 
 * Handles UI animations and transitions
 */

export class UIAnimations {
    /**
     * Initialize animations for UI elements
     */
    initializeAnimations() {
      // Add entry animations to key UI elements
      const animateElements = document.querySelectorAll('.fade-in, .slide-in-right, .slide-in-up');
      
      animateElements.forEach(element => {
        // Add visibility: hidden to prevent FOUC
        element.style.visibility = 'hidden';
        
        // Set timeout to start animation after a short delay
        setTimeout(() => {
          element.style.visibility = 'visible';
        }, 100);
      });
      
      // Inject animation styles if they don't exist
      this.injectAnimationStyles();
    }
    
    /**
     * Inject animation CSS styles
     */
    injectAnimationStyles() {
      // Check if styles already exist
      if (document.getElementById('ui-animation-styles')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'ui-animation-styles';
      
      style.textContent = `
        /* Fade in animation */
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.6s ease-in-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Slide in from right */
        .slide-in-right {
          opacity: 0;
          transform: translateX(30px);
          animation: slideInRight 0.5s ease-out forwards;
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Slide in from bottom */
        .slide-in-up {
          opacity: 0;
          transform: translateY(30px);
          animation: slideInUp 0.5s ease-out forwards;
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Pulse animation */
        .pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        /* Fade in and slide up animation */
        .fade-slide-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        
        @keyframes fadeSlideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      
      document.head.appendChild(style);
    }
    
    /**
     * Apply fade-in animation to a specific element
     * 
     * @param {HTMLElement} element - Element to animate
     * @param {number} delay - Delay in milliseconds
     */
    applyFadeIn(element, delay = 0) {
      if (!element) return;
      
      element.style.opacity = '0';
      
      setTimeout(() => {
        element.style.transition = 'opacity 0.5s ease-in-out';
        element.style.opacity = '1';
      }, delay);
    }
    
    /**
     * Apply slide-in animation to a specific element
     * 
     * @param {HTMLElement} element - Element to animate
     * @param {string} direction - Direction ('left', 'right', 'up', 'down')
     * @param {number} delay - Delay in milliseconds
     */
    applySlideIn(element, direction = 'right', delay = 0) {
      if (!element) return;
      
      let transform;
      switch (direction) {
        case 'left':
          transform = 'translateX(-30px)';
          break;
        case 'right':
          transform = 'translateX(30px)';
          break;
        case 'up':
          transform = 'translateY(-30px)';
          break;
        case 'down':
        default:
          transform = 'translateY(30px)';
      }
      
      element.style.opacity = '0';
      element.style.transform = transform;
      
      setTimeout(() => {
        element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0)';
      }, delay);
    }
  }