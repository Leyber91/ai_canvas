/**
 * core/dom/ElementCache.js
 * 
 * Element reference caching system for improved DOM access performance.
 * Provides methods to store, retrieve, and manage cached DOM elements.
 */

export class ElementCache {
  constructor() {
    // Internal cache storage
    this.cache = new Map();
    
    // Track cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
  }
  
  /**
   * Get an element from the cache
   * 
   * @param {string} key - Cache key
   * @returns {HTMLElement|NodeList|null} - Cached element or null if not found
   */
  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    
    this.stats.misses++;
    return null;
  }
  
  /**
   * Store an element in the cache
   * 
   * @param {string} key - Cache key
   * @param {HTMLElement|NodeList} element - Element to cache
   * @returns {ElementCache} - This instance for chaining
   */
  set(key, element) {
    this.cache.set(key, element);
    this.stats.sets++;
    return this;
  }
  
  /**
   * Check if an element exists in the cache
   * 
   * @param {string} key - Cache key
   * @returns {boolean} - True if element is cached
   */
  has(key) {
    return this.cache.has(key);
  }
  
  /**
   * Clear a specific element or all elements from the cache
   * 
   * @param {string} key - Optional key to clear specific element
   * @returns {ElementCache} - This instance for chaining
   */
  clear(key = null) {
    if (key) {
      this.cache.delete(key);
      // Also clear array version if it exists
      if (!key.endsWith('[]')) {
        this.cache.delete(`${key}[]`);
      }
    } else {
      this.cache.clear();
    }
    
    this.stats.clears++;
    return this;
  }
  
  /**
   * Refresh cached elements by forcing a re-query
   * 
   * @param {string} key - Optional key to refresh specific element
   * @param {Function} refreshFn - Function to refresh the element
   * @returns {ElementCache} - This instance for chaining
   */
  refresh(key = null, refreshFn = null) {
    if (!refreshFn) {
      // If no refresh function provided, just clear the cache
      return this.clear(key);
    }
    
    if (key) {
      // Refresh specific element
      if (this.cache.has(key)) {
        const refreshedElement = refreshFn(key);
        if (refreshedElement) {
          this.set(key, refreshedElement);
        } else {
          this.clear(key);
        }
      }
    } else {
      // Refresh all elements
      const keys = Array.from(this.cache.keys());
      keys.forEach(cacheKey => {
        const refreshedElement = refreshFn(cacheKey);
        if (refreshedElement) {
          this.set(cacheKey, refreshedElement);
        } else {
          this.clear(cacheKey);
        }
      });
    }
    
    return this;
  }
  
  /**
   * Get cache statistics
   * 
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const totalAccesses = this.stats.hits + this.stats.misses;
    const hitRate = totalAccesses > 0 ? (this.stats.hits / totalAccesses) * 100 : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate.toFixed(2)}%`,
      totalAccesses
    };
  }
  
  /**
   * Reset cache statistics
   * 
   * @returns {ElementCache} - This instance for chaining
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      clears: 0
    };
    
    return this;
  }
  
  /**
   * Get all cached keys
   * 
   * @returns {Array<string>} - Array of cached keys
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get the number of cached elements
   * 
   * @returns {number} - Number of cached elements
   */
  size() {
    return this.cache.size;
  }
}
