/**
 * core/theme/ThemeRegistry.js
 * 
 * Registry for theme definitions
 * Manages theme registration and retrieval
 */

import { BaseTheme } from './presets/BaseTheme.js';
import { DarkTheme } from './presets/DarkTheme.js';
import { LightTheme } from './presets/LightTheme.js';

export class ThemeRegistry {
  constructor() {
    // Theme storage
    this.themes = new Map();
    
    // Register default themes
    this.registerDefaultThemes();
  }
  
  /**
   * Register default themes
   * 
   * @private
   */
  registerDefaultThemes() {
    this.register('base', BaseTheme);
    this.register('dark', DarkTheme);
    this.register('light', LightTheme);
  }
  
  /**
   * Register theme
   * 
   * @param {string} name - Theme name
   * @param {Object} themeDefinition - Theme definition object
   * @returns {boolean} Success
   */
  register(name, themeDefinition) {
    // Validate theme definition
    if (!this.validateThemeDefinition(themeDefinition)) {
      console.error(`Invalid theme definition for ${name}`);
      return false;
    }
    
    // Store theme
    this.themes.set(name, themeDefinition);
    return true;
  }
  
  /**
   * Get theme by name
   * 
   * @param {string} name - Theme name
   * @returns {Object} Theme definition or null if not found
   */
  get(name) {
    return this.themes.get(name) || null;
  }
  
  /**
   * Get all registered themes
   * 
   * @returns {Array} Array of theme objects with name and definition
   */
  getAll() {
    const themes = [];
    this.themes.forEach((definition, name) => {
      themes.push({
        name,
        definition
      });
    });
    return themes;
  }
  
  /**
   * Check if theme is registered
   * 
   * @param {string} name - Theme name
   * @returns {boolean} Whether theme is registered
   */
  isRegistered(name) {
    return this.themes.has(name);
  }
  
  /**
   * Get default theme
   * 
   * @returns {Object} Default theme definition
   */
  getDefaultTheme() {
    return this.get('dark') || this.get('base') || null;
  }
  
  /**
   * Create theme variant
   * 
   * @param {string} baseName - Base theme name
   * @param {Object} overrides - Theme property overrides
   * @returns {Object} Extended theme definition
   */
  extendTheme(baseName, overrides) {
    const baseTheme = this.get(baseName);
    if (!baseTheme) {
      console.error(`Base theme not found: ${baseName}`);
      return null;
    }
    
    // Deep merge base theme with overrides
    return this.deepMerge({}, baseTheme, overrides);
  }
  
  /**
   * Validate theme definition structure
   * 
   * @param {Object} theme - Theme definition
   * @returns {boolean} Whether theme is valid
   */
  validateThemeDefinition(theme) {
    if (!theme || typeof theme !== 'object') {
      console.error('Theme must be an object');
      return false;
    }
    
    // Check required properties
    if (!theme.name) {
      console.error('Theme must have a name');
      return false;
    }
    
    if (!theme.colors || typeof theme.colors !== 'object') {
      console.error('Theme must have colors object');
      return false;
    }
    
    // Additional validation could be added here
    
    return true;
  }
  
  /**
   * Deep merge objects
   * 
   * @private
   * @param {Object} target - Target object
   * @param {...Object} sources - Source objects
   * @returns {Object} Merged object
   */
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }
  
  /**
   * Check if value is an object
   * 
   * @private
   * @param {*} item - Value to check
   * @returns {boolean} Whether value is an object
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}
