/**
   * storage/StorageManager.js
   * 
   * A manager for persisting data to localStorage with 
   * versioning, namespacing, and fallback mechanisms.
   */
export class StorageManager {
    constructor(eventBus, prefix = 'aiCanvas_') {
      this.eventBus = eventBus;
      this.prefix = prefix;
      this.isAvailable = this.checkAvailability();
      
      if (!this.isAvailable) {
        console.warn('localStorage is not available. Using in-memory storage fallback.');
        this.memoryStorage = new Map();
      }
    }
    
    /**
     * Check if localStorage is available
     * 
     * @returns {boolean} Whether localStorage is available
     */
    checkAvailability() {
      try {
        const testKey = `${this.prefix}__test__`;
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    }
    
    /**
     * Get a prefixed key
     * 
     * @param {string} key - Base key
     * @returns {string} Prefixed key
     */
    getKey(key) {
      return `${this.prefix}${key}`;
    }
    
    /**
     * Set an item in storage
     * 
     * @param {string} key - Key to store under
     * @param {any} value - Value to store
     * @returns {boolean} Success
     */
    setItem(key, value) {
      const prefixedKey = this.getKey(key);
      
      try {
        // Serialize value if needed
        const serializedValue = typeof value === 'string' 
          ? value 
          : JSON.stringify(value);
        
        if (this.isAvailable) {
          localStorage.setItem(prefixedKey, serializedValue);
        } else {
          this.memoryStorage.set(prefixedKey, serializedValue);
        }
        
        this.eventBus.publish('storage:changed', { key, action: 'set' });
        return true;
      } catch (error) {
        console.error(`Error storing item ${key}:`, error);
        return false;
      }
    }
    
    /**
     * Get an item from storage
     * 
     * @param {string} key - Key to retrieve
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Retrieved value or default
     */
    getItem(key, defaultValue = null) {
      const prefixedKey = this.getKey(key);
      
      try {
        let value;
        
        if (this.isAvailable) {
          value = localStorage.getItem(prefixedKey);
        } else {
          value = this.memoryStorage.get(prefixedKey);
        }
        
        if (value === null || value === undefined) {
          return defaultValue;
        }
        
        // Try to parse as JSON, but fall back to raw value
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      } catch (error) {
        console.error(`Error retrieving item ${key}:`, error);
        return defaultValue;
      }
    }
    
    /**
     * Remove an item from storage
     * 
     * @param {string} key - Key to remove
     * @returns {boolean} Success
     */
    removeItem(key) {
      const prefixedKey = this.getKey(key);
      
      try {
        if (this.isAvailable) {
          localStorage.removeItem(prefixedKey);
        } else {
          this.memoryStorage.delete(prefixedKey);
        }
        
        this.eventBus.publish('storage:changed', { key, action: 'remove' });
        return true;
      } catch (error) {
        console.error(`Error removing item ${key}:`, error);
        return false;
      }
    }
    
    /**
     * Clear all items with this prefix
     * 
     * @returns {boolean} Success
     */
    clear() {
      try {
        if (this.isAvailable) {
          // Only clear keys with our prefix
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
              localStorage.removeItem(key);
            }
          }
        } else {
          // Clear memory storage (just keys with our prefix)
          for (const key of this.memoryStorage.keys()) {
            if (key.startsWith(this.prefix)) {
              this.memoryStorage.delete(key);
            }
          }
        }
        
        this.eventBus.publish('storage:changed', { action: 'clear' });
        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    }
    
    /**
     * Get all stored keys with this prefix
     * 
     * @returns {string[]} Array of keys
     */
    getKeys() {
      const keys = [];
      
      try {
        if (this.isAvailable) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
              keys.push(key.slice(this.prefix.length));
            }
          }
        } else {
          for (const key of this.memoryStorage.keys()) {
            if (key.startsWith(this.prefix)) {
              keys.push(key.slice(this.prefix.length));
            }
          }
        }
      } catch (error) {
        console.error('Error getting keys:', error);
      }
      
      return keys;
    }
  }