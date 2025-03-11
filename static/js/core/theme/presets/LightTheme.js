/**
 * core/theme/presets/LightTheme.js
 * 
 * Light theme preset
 * Extends BaseTheme with light mode colors and settings
 */

import { BaseTheme } from './BaseTheme.js';

export const LightTheme = {
  ...BaseTheme,
  name: 'light',
  
  // Override colors for light theme
  colors: {
    ...BaseTheme.colors,
    
    primary: '#0078d4',
    secondary: '#8a2be2',
    tertiary: '#e91e63',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    background: {
      primary: '#f8f9fa',
      secondary: '#edf2f7',
      surface: 'rgba(255, 255, 255, 0.9)'
    },
    
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      tertiary: 'rgba(0, 0, 0, 0.4)',
      muted: 'rgba(0, 0, 0, 0.38)'
    },
    
    border: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.15)',
      strong: 'rgba(0, 0, 0, 0.2)'
    },
    
    // State colors
    state: {
      active: '#0078d4',
      selected: '#8a2be2',
      executing: '#00b8d4',
      completed: '#10b981',
      error: '#ef4444',
      waiting: 'rgba(0, 0, 0, 0.38)'
    },
    
    // Gradients
    gradients: {
      blue: 'linear-gradient(45deg, #0078d4, #00b8d4)',
      purple: 'linear-gradient(45deg, #8a2be2, #9370db)',
      cosmos: 'linear-gradient(180deg, #f8f9fa, #edf2f7)',
      accent: 'linear-gradient(45deg, #0078d4, #8a2be2)'
    }
  },
  
  // Override glass effect for light theme
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(0, 0, 0, 0.1)',
    blur: '8px',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  },
  
  // Override component-specific styling for light theme
  components: {
    button: {
      primary: {
        background: 'rgba(0, 120, 212, 0.1)',
        hoverBackground: 'rgba(0, 120, 212, 0.2)',
        activeBackground: 'rgba(0, 120, 212, 0.3)',
        textColor: '#0078d4',
        borderColor: 'rgba(0, 120, 212, 0.5)'
      },
      secondary: {
        background: 'rgba(138, 43, 226, 0.1)',
        hoverBackground: 'rgba(138, 43, 226, 0.2)',
        activeBackground: 'rgba(138, 43, 226, 0.3)',
        textColor: '#8a2be2',
        borderColor: 'rgba(138, 43, 226, 0.5)'
      },
      danger: {
        background: 'rgba(239, 68, 68, 0.1)',
        hoverBackground: 'rgba(239, 68, 68, 0.2)',
        activeBackground: 'rgba(239, 68, 68, 0.3)',
        textColor: '#ef4444',
        borderColor: 'rgba(239, 68, 68, 0.5)'
      }
    },
    
    panel: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(0, 0, 0, 0.1)',
      headerBackground: 'rgba(237, 242, 247, 0.9)',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    
    card: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(0, 0, 0, 0.1)',
      shadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      hoverShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
    },
    
    input: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(0, 0, 0, 0.2)',
      focusBorder: 'rgba(0, 120, 212, 0.5)',
      textColor: 'rgba(0, 0, 0, 0.87)',
      placeholderColor: 'rgba(0, 0, 0, 0.38)'
    },
    
    tooltip: {
      background: 'rgba(50, 50, 50, 0.9)',
      border: 'rgba(0, 0, 0, 0.1)',
      textColor: '#ffffff',
      shadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    },
    
    modal: {
      background: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(0, 0, 0, 0.1)',
      shadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
      overlayColor: 'rgba(0, 0, 0, 0.5)'
    },
    
    scrollbar: {
      track: 'rgba(0, 0, 0, 0.05)',
      thumb: 'rgba(0, 120, 212, 0.2)',
      thumbHover: 'rgba(0, 120, 212, 0.4)'
    }
  },
  
  // Override space background for light theme
  spaceBackground: {
    stars: {
      colors: ['#333333', '#555555', '#777777'],
      count: 50,
      minSize: 0.5,
      maxSize: 2
    },
    nebula: {
      colors: [
        'hsla(210, 70%, 70%, 0.03)',
        'hsla(280, 70%, 70%, 0.03)',
        'hsla(340, 70%, 70%, 0.03)'
      ],
      count: 2,
      minSize: 200,
      maxSize: 400
    }
  },
  
  // Light theme specific effects
  effects: {
    nodeGlow: '0 0 15px rgba(0, 120, 212, 0.2)',
    selectionGlow: '0 0 20px rgba(138, 43, 226, 0.3)',
    executionGlow: '0 0 25px rgba(0, 184, 212, 0.4)'
  }
};
