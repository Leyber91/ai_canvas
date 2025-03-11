/**
 * core/theme/ThemeService.js
 * 
 * Main theme management service
 * Coordinates theme application across the application
 */

import { ThemeRegistry } from './ThemeRegistry.js';
import { ThemeState } from './ThemeState.js';
import { ThemeHelpers } from './utils/ThemeHelpers.js';

export class ThemeService {
  /**
   * @param {Object} options - Configuration options
   * @param {Object} options.eventBus - Event bus for theme change notifications
   * @param {string} options.defaultTheme - Default theme name
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus;
    this.defaultThemeName = options.defaultTheme || 'dark';
    
    // Initialize theme registry
    this.registry = new ThemeRegistry();
    
    // Initialize theme state
    this.state = new ThemeState({
      eventBus: this.eventBus
    });
    
    // Current theme name
    this.currentThemeName = this.defaultThemeName;
    
    // Theme stylesheet element
    this.styleElement = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
    this.getTheme = this.getTheme.bind(this);
    this.getThemeVariable = this.getThemeVariable.bind(this);
    this.setThemeVariable = this.setThemeVariable.bind(this);
    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleNodeExecuting = this.handleNodeExecuting.bind(this);
    this.subscribeToThemeChanges = this.subscribeToThemeChanges.bind(this);
    this.saveThemePreference = this.saveThemePreference.bind(this);
  }
  
  /**
   * Initialize theme system and load preferences
   * 
   * @returns {ThemeService} This instance for chaining
   */
  initialize() {
    // Load saved theme preference
    this.loadThemePreference();
    
    // Apply default theme if no preference found
    if (!this.currentThemeName) {
      this.currentThemeName = this.defaultThemeName;
    }
    
    // Apply theme
    this.applyTheme(this.currentThemeName);
    
    // Set up media query listener for system theme changes
    this.setupSystemThemeListener();
    
    // Publish theme initialized event
    if (this.eventBus) {
      this.eventBus.publish('theme:initialized', {
        theme: this.currentThemeName
      });
    }
    
    return this;
  }
  
  /**
   * Set up listener for system theme changes
   * 
   * @private
   */
  setupSystemThemeListener() {
    // Check if browser supports prefers-color-scheme
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Add listener for changes
      try {
        // Chrome & Firefox
        darkModeMediaQuery.addEventListener('change', (e) => {
          if (this.state.useSystemTheme) {
            this.applyTheme(e.matches ? 'dark' : 'light');
          }
        });
      } catch (error1) {
        try {
          // Safari
          darkModeMediaQuery.addListener((e) => {
            if (this.state.useSystemTheme) {
              this.applyTheme(e.matches ? 'dark' : 'light');
            }
          });
        } catch (error2) {
          console.warn('Browser does not support media query listeners');
        }
      }
    }
  }
  
  /**
   * Load saved theme preference
   * 
   * @private
   */
  loadThemePreference() {
    try {
      const savedPreference = localStorage.getItem('theme-preference');
      if (savedPreference) {
        const preference = JSON.parse(savedPreference);
        this.currentThemeName = preference.theme || this.defaultThemeName;
        this.state.useSystemTheme = preference.useSystemTheme || false;
      } else {
        // If no preference, check system preference
        this.state.useSystemTheme = true;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.currentThemeName = 'dark';
        } else {
          this.currentThemeName = 'light';
        }
      }
    } catch (error) {
      console.warn('Error loading theme preference:', error);
      this.currentThemeName = this.defaultThemeName;
    }
  }
  
  /**
   * Save theme preference to storage
   */
  saveThemePreference() {
    try {
      const preference = {
        theme: this.currentThemeName,
        useSystemTheme: this.state.useSystemTheme
      };
      localStorage.setItem('theme-preference', JSON.stringify(preference));
    } catch (error) {
      console.warn('Error saving theme preference:', error);
    }
  }
  
  /**
   * Apply theme by name
   * 
   * @param {string} themeName - Theme name
   * @returns {boolean} Success
   */
  applyTheme(themeName) {
    // Get theme from registry
    const theme = this.registry.get(themeName);
    if (!theme) {
      console.warn(`Theme not found: ${themeName}`);
      return false;
    }
    
    // Update current theme name
    this.currentThemeName = themeName;
    
    // Update theme state
    this.state.currentTheme = themeName;
    this.state.isDarkTheme = themeName === 'dark';
    
    // Generate CSS variables
    const cssText = ThemeHelpers.generateCSSVariables(theme);
    
    // Apply CSS variables
    ThemeHelpers.injectThemeStylesheet('theme-variables', cssText);
    
    // Add theme class to body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${themeName}`);
    
    // Publish theme changed event
    if (this.eventBus) {
      this.eventBus.publish('theme:changed', {
        theme: themeName,
        isDark: themeName === 'dark'
      });
    }
    
    // Save preference
    this.saveThemePreference();
    
    return true;
  }
  
  /**
   * Toggle between light/dark themes
   * 
   * @returns {string} New theme name
   */
  toggleDarkMode() {
    const newTheme = this.currentThemeName === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Get current theme object
   * 
   * @returns {Object} Theme object
   */
  getTheme() {
    return this.registry.get(this.currentThemeName);
  }
  
  /**
   * Get theme CSS variable value
   * 
   * @param {string} name - Variable name
   * @returns {string} Variable value
   */
  getThemeVariable(name) {
    return ThemeHelpers.getComputedThemeVariable(name);
  }
  
  /**
   * Override theme variable
   * 
   * @param {string} name - Variable name
   * @param {string} value - Variable value
   */
  setThemeVariable(name, value) {
    document.documentElement.style.setProperty(`--${name}`, value);
  }
  
  /**
   * Apply node-specific theming
   * 
   * @param {Object} data - Node data
   */
  handleNodeSelected(data) {
    if (!data || !data.id) {
      return;
    }
    
    // Update active node in state
    this.state.activeNodeId = data.id;
    
    // Publish node selected theme event
    if (this.eventBus) {
      this.eventBus.publish('theme:node-selected', {
        nodeId: data.id,
        nodeType: data.type
      });
    }
  }
  
  /**
   * Apply execution-specific theming
   * 
   * @param {Object} data - Execution data
   */
  handleNodeExecuting(data) {
    if (!data || !data.nodeId) {
      return;
    }
    
    // Publish node executing theme event
    if (this.eventBus) {
      this.eventBus.publish('theme:node-executing', {
        nodeId: data.nodeId,
        progress: data.progress
      });
    }
  }
  
  /**
   * Subscribe to theme changes
   * 
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToThemeChanges(callback) {
    if (!this.eventBus) {
      console.warn('Event bus not available for theme subscriptions');
      return () => {};
    }
    
    return this.eventBus.subscribe('theme:changed', callback);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clean up event listeners
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeMediaQuery.removeEventListener('change', this.handleSystemThemeChange);
      darkModeMediaQuery.removeListener(this.handleSystemThemeChange);
    }
  }
}

// Create singleton instance
export const themeService = new ThemeService();
