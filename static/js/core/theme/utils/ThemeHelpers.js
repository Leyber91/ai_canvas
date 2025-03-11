/**
 * core/theme/utils/ThemeHelpers.js
 * 
 * Helper functions for theme operations
 * Utility functions for theme-related tasks
 */

import { ColorUtils } from './ColorUtils.js';

export class ThemeHelpers {
  /**
   * Apply theme to element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} theme - Theme object
   * @param {string} scope - CSS variable scope
   */
  static applyThemeToElement(element, theme, scope = '') {
    if (!element || !theme) return;
    
    // Generate CSS variables
    const cssVars = this.generateCSSVariablesObject(theme, scope);
    
    // Apply CSS variables to element
    Object.entries(cssVars).forEach(([name, value]) => {
      element.style.setProperty(name, value);
    });
  }
  
  /**
   * Generate CSS variables string
   * 
   * @param {Object} theme - Theme object
   * @param {string} scope - CSS variable scope
   * @returns {string} CSS variables string
   */
  static generateCSSVariables(theme, scope = '') {
    if (!theme) return '';
    
    // Get CSS variables object
    const cssVars = this.generateCSSVariablesObject(theme, scope);
    
    // Convert to CSS string
    let cssText = '';
    Object.entries(cssVars).forEach(([name, value]) => {
      cssText += `  ${name}: ${value};\n`;
    });
    
    // Wrap in :root selector
    return `:root {\n${cssText}}\n`;
  }
  
  /**
   * Generate CSS variables object
   * 
   * @param {Object} theme - Theme object
   * @param {string} scope - CSS variable scope
   * @returns {Object} CSS variables object
   */
  static generateCSSVariablesObject(theme, scope = '') {
    if (!theme) return {};
    
    const prefix = scope ? `--${scope}-` : '--';
    const result = {};
    
    // Process theme object recursively
    const processObject = (obj, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}-${key}` : key;
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively process nested objects
          processObject(value, currentPath);
        } else {
          // Add leaf values as CSS variables
          result[`${prefix}${currentPath}`] = value;
        }
      });
    };
    
    processObject(theme);
    return result;
  }
  
  /**
   * Inject theme stylesheet
   * 
   * @param {string} id - Stylesheet ID
   * @param {string} cssText - CSS text
   * @returns {HTMLStyleElement} Style element
   */
  static injectThemeStylesheet(id, cssText) {
    // Check if stylesheet already exists
    let styleElement = document.getElementById(id);
    
    if (!styleElement) {
      // Create new stylesheet
      styleElement = document.createElement('style');
      styleElement.id = id;
      document.head.appendChild(styleElement);
    }
    
    // Update stylesheet content
    styleElement.textContent = cssText;
    
    return styleElement;
  }
  
  /**
   * Calculate contrast color
   * 
   * @param {string} backgroundColor - Background color
   * @returns {string} Contrast color (black or white)
   */
  static calculateContrastColor(backgroundColor) {
    return ColorUtils.getReadableTextColor(backgroundColor);
  }
  
  /**
   * Lighten color
   * 
   * @param {string} color - Color to lighten
   * @param {number} amount - Amount to lighten (0-1)
   * @returns {string} Lightened color
   */
  static lightenColor(color, amount = 0.2) {
    return ColorUtils.adjustBrightness(color, amount);
  }
  
  /**
   * Darken color
   * 
   * @param {string} color - Color to darken
   * @param {number} amount - Amount to darken (0-1)
   * @returns {string} Darkened color
   */
  static darkenColor(color, amount = 0.2) {
    return ColorUtils.adjustBrightness(color, -amount);
  }
  
  /**
   * Get computed CSS variable value
   * 
   * @param {string} name - Variable name
   * @param {HTMLElement} element - Element to get variable from (defaults to :root)
   * @returns {string} Variable value
   */
  static getComputedThemeVariable(name, element = document.documentElement) {
    // Add -- prefix if not present
    if (!name.startsWith('--')) {
      name = `--${name}`;
    }
    
    return getComputedStyle(element).getPropertyValue(name).trim();
  }
  
  /**
   * Detect preferred color scheme
   * 
   * @returns {string} Preferred color scheme ('dark' or 'light')
   */
  static detectPreferredColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  /**
   * Create theme transition
   * 
   * @param {number} duration - Transition duration in ms
   * @returns {HTMLStyleElement} Style element
   */
  static createThemeTransition(duration = 300) {
    // Create transition style
    const style = document.createElement('style');
    style.id = 'theme-transition';
    
    style.textContent = `
      * {
        transition: background-color ${duration}ms ease-out,
                    color ${duration}ms ease-out,
                    border-color ${duration}ms ease-out,
                    box-shadow ${duration}ms ease-out !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Remove transition after it completes
    setTimeout(() => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, duration + 50);
    
    return style;
  }
  
  /**
   * Apply glassmorphism effect to element
   * 
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Glassmorphism options
   */
  static applyGlassmorphism(element, options = {}) {
    if (!element) return;
    
    // Default options
    const defaults = {
      backgroundColor: 'rgba(18, 22, 36, 0.6)',
      borderColor: 'rgba(80, 120, 240, 0.25)',
      blurAmount: '8px',
      borderWidth: '1px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    // Apply glassmorphism styles
    Object.assign(element.style, {
      backgroundColor: opts.backgroundColor,
      backdropFilter: `blur(${opts.blurAmount})`,
      WebkitBackdropFilter: `blur(${opts.blurAmount})`,
      border: `${opts.borderWidth} solid ${opts.borderColor}`,
      borderRadius: opts.borderRadius,
      boxShadow: opts.boxShadow
    });
  }
  
  /**
   * Generate theme CSS for component
   * 
   * @param {string} componentName - Component name
   * @param {Object} theme - Theme object
   * @returns {string} Component CSS
   */
  static generateComponentCSS(componentName, theme) {
    if (!theme || !theme.components || !theme.components[componentName]) {
      return '';
    }
    
    const componentTheme = theme.components[componentName];
    let css = `.${componentName} {\n`;
    
    // Process component properties
    Object.entries(componentTheme).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${cssKey}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }
}
