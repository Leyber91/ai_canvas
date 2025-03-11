/**
 * ui/panel/PanelUtils.js
 * 
 * Compatibility wrapper around core utilities for panel management and styling.
 * Delegates to core utilities while maintaining backward compatibility.
 */
import { DOMHelper } from '../helpers/domHelpers.js';
import { StyleUtils } from '../../core/utils/StyleUtils.js';

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
        // Delegate to StyleUtils
        return StyleUtils.applyGlassmorphism(element, options);
    }
    
    /**
     * Create a custom scrollbar for panel content
     * 
     * @param {HTMLElement} element - Target DOM element
     * @param {Object} options - Scrollbar options
     */
    static createPanelScrollbar(element, options = {}) {
        // Default panel scrollbar options
        const defaultOptions = {
            width: '5px',
            thumbColor: 'rgba(52, 152, 219, 0.5)',
            thumbHoverColor: 'rgba(52, 152, 219, 0.8)'
        };
        
        // Delegate to StyleUtils
        return StyleUtils.createCustomScrollbar(element, {
            ...defaultOptions,
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
            StyleUtils.applyStyles(container, {
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
    
    /**
     * Apply styles to an element
     * 
     * @param {HTMLElement} element - Target element
     * @param {Object} styles - CSS styles object
     * @returns {HTMLElement} The styled element
     */
    static applyStyles(element, styles) {
        // Delegate to StyleUtils
        return StyleUtils.applyStyles(element, styles);
    }
}
