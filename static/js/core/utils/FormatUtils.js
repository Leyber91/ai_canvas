/**
 * core/utils/FormatUtils.js
 * 
 * Utility functions for formatting text and content.
 * Provides methods for Markdown formatting, date formatting, and text manipulation.
 */

export class FormatUtils {
  /**
   * Format message content with Markdown-like syntax
   * 
   * @param {string} content - Raw message content
   * @returns {string} - Formatted HTML content
   */
  static formatMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    return content
      // Code blocks with syntax highlighting
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language ? ` class="language-${language}"` : '';
        return `<pre class="code-block"><code${lang}>${this.escapeHtml(code.trim())}</code></pre>`;
      })
      // Regular code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Bold
      .replace(/\*\*([^*]*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]*?)\*|_([^_]*?)_/g, (match, p1, p2) => `<em>${p1 || p2}</em>`)
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Headers (h1, h2, h3)
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      // Unordered lists
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>\n)+/g, match => `<ul>${match}</ul>`)
      // Ordered lists
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>\n)+/g, match => `<ol>${match}</ol>`)
      // Line breaks
      .replace(/\n/g, '<br>');
  }
  
  /**
   * Escape HTML special characters to prevent XSS
   * 
   * @param {string} unsafe - Unsafe HTML string
   * @returns {string} - Escaped HTML string
   */
  static escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') {
      return '';
    }
    
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Format a timestamp to a readable date/time string
   * 
   * @param {number|string|Date} timestamp - Timestamp to format
   * @param {boolean} includeTime - Whether to include time
   * @returns {string} - Formatted date/time string
   */
  static formatTimestamp(timestamp, includeTime = true) {
    try {
      const date = new Date(timestamp);
      
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
      };
      
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Error formatting date';
    }
  }
  
  /**
   * Format a relative time (e.g., "2 hours ago")
   * 
   * @param {number|string|Date} timestamp - Timestamp to format
   * @returns {string} - Formatted relative time
   */
  static formatRelativeTime(timestamp) {
    try {
      const date = new Date(timestamp);
      
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);
      
      if (diffSec < 60) {
        return diffSec <= 1 ? 'just now' : `${diffSec} seconds ago`;
      } else if (diffMin < 60) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
      } else if (diffHour < 24) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
      } else if (diffDay < 30) {
        return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
      } else if (diffMonth < 12) {
        return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
      } else {
        return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
      }
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Error formatting date';
    }
  }
  
  /**
   * Format a number with thousand separators
   * 
   * @param {number} number - Number to format
   * @returns {string} - Formatted number
   */
  static formatNumber(number) {
    try {
      return new Intl.NumberFormat().format(number);
    } catch (error) {
      console.error('Error formatting number:', error);
      return String(number);
    }
  }
  
  /**
   * Format a file size in bytes to a human-readable string
   * 
   * @param {number} bytes - File size in bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Truncate text to a specified length with ellipsis
   * 
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} - Truncated text
   */
  static truncateText(text, length = 100) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    if (text.length <= length) {
      return text;
    }
    
    return text.substring(0, length) + '...';
  }
  
  /**
   * Convert plain text URLs to clickable links
   * 
   * @param {string} text - Text that may contain URLs
   * @returns {string} - Text with clickable links
   */
  static linkifyUrls(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // URL regex pattern
    const urlPattern = /((https?:\/\/|www\.)[^\s]+)/g;
    
    return text.replace(urlPattern, (url) => {
      const href = url.startsWith('www.') ? `https://${url}` : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
  
  /**
   * Convert newlines to HTML line breaks
   * 
   * @param {string} text - Text with newlines
   * @returns {string} - Text with HTML line breaks
   */
  static nl2br(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text.replace(/\n/g, '<br>');
  }
  
  /**
   * Capitalize the first letter of a string
   * 
   * @param {string} text - Text to capitalize
   * @returns {string} - Capitalized text
   */
  static capitalize(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  /**
   * Convert a string to camelCase
   * 
   * @param {string} text - Text to convert
   * @returns {string} - camelCase text
   */
  static toCamelCase(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
  
  /**
   * Convert a string to kebab-case
   * 
   * @param {string} text - Text to convert
   * @returns {string} - kebab-case text
   */
  static toKebabCase(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/\s+/g, '-')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
  
  /**
   * Format a JSON object as a pretty-printed string
   * 
   * @param {Object} obj - Object to format
   * @param {number} indent - Indentation spaces
   * @returns {string} - Formatted JSON string
   */
  static formatJson(obj, indent = 2) {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      return String(obj);
    }
  }
}
