/**
 * ui/helpers/domHelpers.js
 * 
 * Utility functions for DOM manipulation and styling.
 */

export const DOMHelper = {
    /**
     * Inject CSS styles into the document
     * 
     * @param {string} id - Style element ID
     * @param {string} cssText - CSS text content
     * @returns {HTMLStyleElement} Created style element
     */
    injectStyles(id, cssText) {
      // Check if style already exists
      let styleEl = document.getElementById(id);
      
      if (!styleEl) {
        // Create new style element
        styleEl = document.createElement('style');
        styleEl.id = id;
        document.head.appendChild(styleEl);
      }
      
      // Set or update style content
      styleEl.textContent = cssText;
      
      return styleEl;
    },
    
    /**
     * Create a nebula effect element
     * 
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of nebula elements to create
     */
    createNebulaEffect(container, count = 3) {
      if (!container) return;
      
      for (let i = 0; i < count; i++) {
        const nebula = document.createElement('div');
        nebula.className = 'space-nebula';
        
        // Random position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 200 + Math.random() * 300;
        
        // Random colors
        const hue = Math.floor(Math.random() * 360);
        const color = `hsla(${hue}, 70%, 40%, 0.05)`;
        
        Object.assign(nebula.style, {
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: color,
          filter: 'blur(80px)',
          opacity: '0.03'
        });
        
        container.appendChild(nebula);
        
        // Set up animation for this nebula
        const randomX = Math.random() * 10 - 5;
        const randomY = Math.random() * 10 - 5;
        
        // Apply subtle animation
        nebula.style.animation = `
          nebula-float-${i} ${30 + i * 10}s infinite ease-in-out,
          nebula-pulse-${i} ${15 + i * 5}s infinite ease-in-out
        `;
        
        // Create keyframe animations
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes nebula-float-${i} {
            0%, 100% { transform: translate(${randomX}px, ${randomY}px); }
            50% { transform: translate(${-randomX}px, ${-randomY}px); }
          }
          @keyframes nebula-pulse-${i} {
            0%, 100% { opacity: 0.03; filter: blur(80px); }
            50% { opacity: 0.08; filter: blur(70px); }
          }
        `;
        document.head.appendChild(styleSheet);
      }
    },
    
    /**
     * Apply glassmorphism effect to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Optional styling options
     */
    applyGlassmorphism(element, options = {}) {
      if (!element) return;
      
      // Default glassmorphism styles
      const defaultOptions = {
        backgroundColor: 'rgba(18, 22, 36, 0.6)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(80, 120, 240, 0.3)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      };
      
      // Merge default options with provided options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Apply styles
      Object.assign(element.style, mergedOptions);
    },
    
    /**
     * Create animated text effect
     * 
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to animate
     * @param {number} speed - Animation speed in ms
     */
    createAnimatedText(element, text, speed = 50) {
      if (!element) return;
      
      // Clear existing content
      element.textContent = '';
      
      // Track current character index
      let index = 0;
      
      // Start animation interval
      const interval = setInterval(() => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
        } else {
          clearInterval(interval);
        }
      }, speed);
    },
    
    /**
     * Apply responsive sizing based on viewport
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} sizes - Size options for different breakpoints
     */
    applyResponsiveSizing(element, sizes = {}) {
      if (!element) return;
      
      // Default sizing options
      const defaultSizes = {
        xs: { width: '100%' },         // < 576px
        sm: { width: '540px' },        // >= 576px
        md: { width: '720px' },        // >= 768px
        lg: { width: '960px' },        // >= 992px
        xl: { width: '1140px' }        // >= 1200px
      };
      
      // Merge with provided sizes
      const mergedSizes = { ...defaultSizes, ...sizes };
      
      // Create and apply media queries
      const styleEl = document.createElement('style');
      
      styleEl.textContent = `
        ${element.id || `.${element.className.split(' ')[0]}`} {
          width: ${mergedSizes.xs.width};
          margin-left: auto;
          margin-right: auto;
        }
        
        @media (min-width: 576px) {
          ${element.id || `.${element.className.split(' ')[0]}`} {
            width: ${mergedSizes.sm.width};
          }
        }
        
        @media (min-width: 768px) {
          ${element.id || `.${element.className.split(' ')[0]}`} {
            width: ${mergedSizes.md.width};
          }
        }
        
        @media (min-width: 992px) {
          ${element.id || `.${element.className.split(' ')[0]}`} {
            width: ${mergedSizes.lg.width};
          }
        }
        
        @media (min-width: 1200px) {
          ${element.id || `.${element.className.split(' ')[0]}`} {
            width: ${mergedSizes.xl.width};
          }
        }
      `;
      
      document.head.appendChild(styleEl);
    },
    
    /**
     * Create a scrollable container with custom scrollbar
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scrollbar options
     */
    createCustomScrollbar(element, options = {}) {
      if (!element) return;
      
      // Default options
      const defaultOptions = {
        width: '6px',
        trackColor: 'rgba(0, 0, 0, 0.2)',
        thumbColor: 'rgba(0, 194, 255, 0.3)',
        thumbHoverColor: 'rgba(0, 194, 255, 0.5)',
        borderRadius: '8px'
      };
      
      // Merge with provided options
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Apply scrollbar styles
      const styleId = `scrollbar-style-${Date.now()}`;
      this.injectStyles(styleId, `
        ${element.id ? `#${element.id}` : `.${element.className.split(' ')[0]}`}::-webkit-scrollbar {
          width: ${mergedOptions.width};
          height: ${mergedOptions.width};
        }
        
        ${element.id ? `#${element.id}` : `.${element.className.split(' ')[0]}`}::-webkit-scrollbar-track {
          background-color: ${mergedOptions.trackColor};
          border-radius: ${mergedOptions.borderRadius};
        }
        
        ${element.id ? `#${element.id}` : `.${element.className.split(' ')[0]}`}::-webkit-scrollbar-thumb {
          background-color: ${mergedOptions.thumbColor};
          border-radius: ${mergedOptions.borderRadius};
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        ${element.id ? `#${element.id}` : `.${element.className.split(' ')[0]}`}::-webkit-scrollbar-thumb:hover {
          background-color: ${mergedOptions.thumbHoverColor};
        }
      `);
      
      // Set scroll properties
      element.style.overflowY = 'auto';
    },
    
    /**
     * Apply hover effect to element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} hoverStyles - Styles to apply on hover
     */
    applyHoverEffect(element, hoverStyles = {}) {
      if (!element) return;
      
      // Default hover styles
      const defaultHoverStyles = {
        transform: 'translateY(-3px)',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease'
      };
      
      // Merge with provided styles
      const mergedHoverStyles = { ...defaultHoverStyles, ...hoverStyles };
      
      // Store original styles
      const originalStyles = {};
      for (const prop in mergedHoverStyles) {
        originalStyles[prop] = element.style[prop] || '';
      }
      
      // Set transition on the element
      element.style.transition = mergedHoverStyles.transition;
      
      // Add event listeners
      element.addEventListener('mouseenter', () => {
        Object.assign(element.style, mergedHoverStyles);
      });
      
      element.addEventListener('mouseleave', () => {
        Object.assign(element.style, originalStyles);
      });
    }
  };
  
  export default DOMHelper;