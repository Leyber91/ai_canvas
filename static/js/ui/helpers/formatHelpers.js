/**
 * ui/formatHelpers.js
 * 
 * Utility functions for formatting text content in the UI.
 * Handles Markdown-like formatting for chat messages and other text elements.
 * 
 * This is a compatibility wrapper around the new core/utils implementation.
 */

import { FormatUtils } from '../../core/utils/FormatUtils.js';

export const FormatHelpers = {
    /**
     * Format message content with Markdown-like syntax
     * 
     * @param {string} content - Raw message content
     * @returns {string} Formatted HTML content
     */
    formatMessageContent(content) {
      return FormatUtils.formatMessageContent(content);
    },
    
    /**
     * Escape HTML special characters to prevent XSS
     * 
     * @param {string} unsafe - Unsafe HTML string
     * @returns {string} Escaped HTML string
     */
    escapeHtml(unsafe) {
      return FormatUtils.escapeHtml(unsafe);
    },
    
    /**
     * Format a timestamp to a readable date/time string
     * 
     * @param {number|string|Date} timestamp - Timestamp to format
     * @param {boolean} includeTime - Whether to include time
     * @returns {string} Formatted date/time string
     */
    formatTimestamp(timestamp, includeTime = true) {
      return FormatUtils.formatTimestamp(timestamp, includeTime);
    },
    
    /**
     * Format a number with thousand separators
     * 
     * @param {number} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(number) {
      return FormatUtils.formatNumber(number);
    },
    
    /**
     * Truncate text to a specified length with ellipsis
     * 
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, length = 100) {
      return FormatUtils.truncateText(text, length);
    },
    
    /**
     * Convert plain text URLs to clickable links
     * 
     * @param {string} text - Text that may contain URLs
     * @returns {string} Text with clickable links
     */
    linkifyUrls(text) {
      return FormatUtils.linkifyUrls(text);
    },
    
    /**
     * Convert newlines to HTML line breaks
     * 
     * @param {string} text - Text with newlines
     * @returns {string} - Text with HTML line breaks
     */
    nl2br(text) {
      return FormatUtils.nl2br(text);
    },
    
    /**
     * Capitalize the first letter of a string
     * 
     * @param {string} text - Text to capitalize
     * @returns {string} - Capitalized text
     */
    capitalize(text) {
      return FormatUtils.capitalize(text);
    },
    
    /**
     * Format a relative time (e.g., "2 hours ago")
     * 
     * @param {number|string|Date} timestamp - Timestamp to format
     * @returns {string} - Formatted relative time
     */
    formatRelativeTime(timestamp) {
      return FormatUtils.formatRelativeTime(timestamp);
    },
    
    /**
     * Format a file size in bytes to a human-readable string
     * 
     * @param {number} bytes - File size in bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes, decimals = 2) {
      return FormatUtils.formatFileSize(bytes, decimals);
    },
    
    /**
     * Format a JSON object as a pretty-printed string
     * 
     * @param {Object} obj - Object to format
     * @param {number} indent - Indentation spaces
     * @returns {string} - Formatted JSON string
     */
    formatJson(obj, indent = 2) {
      return FormatUtils.formatJson(obj, indent);
    }
  };
  
  export default FormatHelpers;
