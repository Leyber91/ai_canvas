/**
 * core/utils/StyleUtils.js
 * 
 * Utility functions for styling DOM elements with advanced effects.
 * Provides methods for applying styles, glassmorphism, and custom scrollbars.
 */

export class StyleUtils {
  /**
   * Apply styles to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} styles - CSS styles object
   * @returns {HTMLElement} - The styled element
   */
  static applyStyles(element, styles) {
    if (!element || !styles) return element;
    
    Object.assign(element.style, styles);
    return element;
  }
  
  /**
   * Inject CSS styles into the document
   * 
   * @param {string} id - Style element ID
   * @param {string} cssText - CSS text content
   * @returns {HTMLStyleElement} - Created style element
   */
  static injectStyles(id, cssText) {
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
  }
  
  /**
   * Apply glassmorphism effect to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Optional styling options
   * @returns {HTMLElement} - The styled element
   */
  static applyGlassmorphism(element, options = {}) {
    if (!element) return element;
    
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
    return this.applyStyles(element, mergedOptions);
  }
  
  /**
   * Create a custom scrollbar for an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Scrollbar options
   * @returns {HTMLElement} - The element with custom scrollbar
   */
  static createCustomScrollbar(element, options = {}) {
    if (!element) return element;
    
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
    
    // Generate a unique ID for this scrollbar style
    const styleId = `scrollbar-style-${element.id || Math.random().toString(36).substring(2, 11)}`;
    
    // Create selector based on element
    const selector = element.id ? 
      `#${element.id}` : 
      `.${element.className.split(' ')[0]}`;
    
    // Apply scrollbar styles
    this.injectStyles(styleId, `
      ${selector}::-webkit-scrollbar {
        width: ${mergedOptions.width};
        height: ${mergedOptions.width};
      }
      
      ${selector}::-webkit-scrollbar-track {
        background-color: ${mergedOptions.trackColor};
        border-radius: ${mergedOptions.borderRadius};
      }
      
      ${selector}::-webkit-scrollbar-thumb {
        background-color: ${mergedOptions.thumbColor};
        border-radius: ${mergedOptions.borderRadius};
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      ${selector}::-webkit-scrollbar-thumb:hover {
        background-color: ${mergedOptions.thumbHoverColor};
      }
    `);
    
    // Set scroll properties
    element.style.overflowY = 'auto';
    
    return element;
  }
  
  /**
   * Apply responsive sizing to an element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} sizes - Size options for different breakpoints
   * @returns {HTMLElement} - The styled element
   */
  static applyResponsiveSizing(element, sizes = {}) {
    if (!element) return element;
    
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
    
    // Generate a unique ID for this responsive style
    const styleId = `responsive-style-${element.id || Math.random().toString(36).substring(2, 11)}`;
    
    // Create selector based on element
    const selector = element.id ? 
      `#${element.id}` : 
      `.${element.className.split(' ')[0]}`;
    
    // Create and apply media queries
    this.injectStyles(styleId, `
      ${selector} {
        width: ${mergedSizes.xs.width};
        margin-left: auto;
        margin-right: auto;
      }
      
      @media (min-width: 576px) {
        ${selector} {
          width: ${mergedSizes.sm.width};
        }
      }
      
      @media (min-width: 768px) {
        ${selector} {
          width: ${mergedSizes.md.width};
        }
      }
      
      @media (min-width: 992px) {
        ${selector} {
          width: ${mergedSizes.lg.width};
        }
      }
      
      @media (min-width: 1200px) {
        ${selector} {
          width: ${mergedSizes.xl.width};
        }
      }
    `);
    
    return element;
  }
  
  /**
   * Create a nebula effect element
   * 
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of nebula elements to create
   * @returns {Array<HTMLElement>} - Created nebula elements
   */
  static createNebulaEffect(container, count = 3) {
    if (!container) return [];
    
    const nebulaElements = [];
    
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
      
      this.applyStyles(nebula, {
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
      nebulaElements.push(nebula);
      
      // Set up animation for this nebula
      const randomX = Math.random() * 10 - 5;
      const randomY = Math.random() * 10 - 5;
      
      // Apply subtle animation
      nebula.style.animation = `
        nebula-float-${i} ${30 + i * 10}s infinite ease-in-out,
        nebula-pulse-${i} ${15 + i * 5}s infinite ease-in-out
      `;
      
      // Create keyframe animations
      this.injectStyles(`nebula-keyframes-${i}`, `
        @keyframes nebula-float-${i} {
          0%, 100% { transform: translate(${randomX}px, ${randomY}px); }
          50% { transform: translate(${-randomX}px, ${-randomY}px); }
        }
        @keyframes nebula-pulse-${i} {
          0%, 100% { opacity: 0.03; filter: blur(80px); }
          50% { opacity: 0.08; filter: blur(70px); }
        }
      `);
    }
    
    return nebulaElements;
  }
  
  /**
   * Apply hover effect to element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} hoverStyles - Styles to apply on hover
   * @returns {HTMLElement} - The element with hover effect
   */
  static applyHoverEffect(element, hoverStyles = {}) {
    if (!element) return element;
    
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
      this.applyStyles(element, mergedHoverStyles);
    });
    
    element.addEventListener('mouseleave', () => {
      this.applyStyles(element, originalStyles);
    });
    
    return element;
  }
}
