/**
 * ui/formatHelpers.js
 * 
 * Utility functions for formatting text content in the UI.
 * Handles Markdown-like formatting for chat messages and other text elements.
 */

export const FormatHelpers = {
    /**
     * Format message content with Markdown-like syntax
     * 
     * @param {string} content - Raw message content
     * @returns {string} Formatted HTML content
     */
    formatMessageContent(content) {
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
    },
    
    /**
     * Escape HTML special characters to prevent XSS
     * 
     * @param {string} unsafe - Unsafe HTML string
     * @returns {string} Escaped HTML string
     */
    escapeHtml(unsafe) {
      if (!unsafe || typeof unsafe !== 'string') {
        return '';
      }
      
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    
    /**
     * Format a timestamp to a readable date/time string
     * 
     * @param {number|string|Date} timestamp - Timestamp to format
     * @param {boolean} includeTime - Whether to include time
     * @returns {string} Formatted date/time string
     */
    formatTimestamp(timestamp, includeTime = true) {
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
    },
    
    /**
     * Format a number with thousand separators
     * 
     * @param {number} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(number) {
      try {
        return new Intl.NumberFormat().format(number);
      } catch (error) {
        console.error('Error formatting number:', error);
        return String(number);
      }
    },
    
    /**
     * Truncate text to a specified length with ellipsis
     * 
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, length = 100) {
      if (!text || typeof text !== 'string') {
        return '';
      }
      
      if (text.length <= length) {
        return text;
      }
      
      return text.substring(0, length) + '...';
    },
    
    /**
     * Convert plain text URLs to clickable links
     * 
     * @param {string} text - Text that may contain URLs
     * @returns {string} Text with clickable links
     */
    linkifyUrls(text) {
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
  };
  
  export default FormatHelpers;