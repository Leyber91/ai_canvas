/**
 * ui/theme/background/SpaceBackground.js
 * 
 * Compatibility wrapper around BackgroundManager
 * Maintains same API for backward compatibility
 */

import { backgroundManager } from '../../../core/theme/backgrounds/BackgroundManager.js';

export class SpaceBackground {
  /**
   * Initialize space background effects
   */
  initializeSpaceBackground() {
    // Delegate to core implementation with space theme
    backgroundManager.initializeBackground('stars', document.body, {
      starCount: 100,
      colors: ['#ffffff', '#f0f8ff', '#f8f8ff'],
      twinkle: true
    });
    
    // Add nebula effects for the space theme
    this.createNebulaEffects(backgroundManager.bgContainer, 3);
  }
  
  /**
   * Add stars to space background
   * 
   * @param {HTMLElement} container - Container element
   */
  addStarsToBackground(container) {
    // Delegate to core implementation
    backgroundManager.addStarsToBackground(container, {
      starCount: 100,
      colors: ['#ffffff', '#f0f8ff', '#f8f8ff'],
      minSize: 0.5,
      maxSize: 3,
      twinkle: true
    });
  }
  
  /**
   * Create nebula effects in the background
   * 
   * @param {HTMLElement} container - Container element
   * @param {number} count - Number of nebula elements to create
   */
  createNebulaEffects(container, count) {
    // Delegate to core implementation
    backgroundManager.createNebulaEffects(container, {
      count: count,
      colors: [
        'hsla(210, 70%, 40%, 0.05)',
        'hsla(280, 70%, 40%, 0.05)',
        'hsla(340, 70%, 40%, 0.05)'
      ],
      minSize: 200,
      maxSize: 500,
      animate: true
    });
  }
  
  /**
   * Pause background animations
   */
  pauseAnimations() {
    backgroundManager.pauseAnimations();
  }
  
  /**
   * Resume background animations
   */
  resumeAnimations() {
    backgroundManager.resumeAnimations();
  }
  
  /**
   * Clean up background
   */
  cleanupBackground() {
    backgroundManager.cleanupBackground();
  }
}
