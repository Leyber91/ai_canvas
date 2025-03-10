/**
 * ui/panel/PanelUtils.js
 * 
 * Shared utilities for panel management and styling.
 * Consolidates common panel-related functionality used across different panel managers.
 */
import { DOMHelper } from '../helpers/domHelpers.js';

export class PanelUtils {
    /**
     * Apply glassmorphism effect to a panel element
     * 
     * @param {HTMLElement} element - Target DOM element
     * @param {Object} options - Glassmorphism options
     * @param {string} options.backgroundColor - Background color with opacity
     * @param {string} options.borderColor - Border color with opacity
     * @param {number} options.blurAmount - Blur amount in pixels
     */
    static applyGlassmorphism(element, options = {}) {
        if (!element) return;
        
        const {
            backgroundColor = 'rgba(18, 22, 36, 0.7)',
            borderColor = 'rgba(255, 255, 255, 0.1)',
            blurAmount = 10
        } = options;
        
        // Apply styles
        Object.assign(element.style, {
            backgroundColor,
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        });
    }
    
    /**
     * Create a custom scrollbar for panel content
     * 
     * @param {HTMLElement} element - Target DOM element
     * @param {Object} options - Scrollbar options
     */
    static createPanelScrollbar(element, options = {}) {
        // Uses DOMHelper's createCustomScrollbar
        DOMHelper.createCustomScrollbar(element, {
            width: '5px',
            thumbColor: 'rgba(52, 152, 219, 0.5)',
            thumbHoverColor: 'rgba(52, 152, 219, 0.8)',
            ...options
        });
    }
    
    /**
     * Find or create a panel container
     * 
     * @param {string} className - Container class name
     * @param {Object} styles - Container styles
     * @returns {HTMLElement} The container element
     */
    static findOrCreatePanelContainer(className, styles = {}) {
        // Look for existing container
        let container = document.querySelector(`.${className}`);
        
        // Create container if not found
        if (!container) {
            container = document.createElement('div');
            container.className = className;
            
            // Apply default styles
            Object.assign(container.style, {
                position: 'fixed',
                zIndex: '900',
                overflowY: 'auto',
                ...styles
            });
            
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * Create or update a panel toggle indicator
     * 
     * @param {HTMLElement} titleElement - Panel title element
     * @param {boolean} expanded - Whether panel is expanded
     */
    static updateToggleIndicator(titleElement, expanded) {
        if (!titleElement) return;
        
        // Find or create toggle indicator
        let indicator = titleElement.querySelector('.toggle-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'toggle-indicator';
            titleElement.appendChild(indicator);
        }
        
        // Update indicator text
        indicator.textContent = expanded ? '▼' : '►';
        
        // Update expanded attribute
        titleElement.setAttribute('data-expanded', expanded ? 'true' : 'false');
    }
}