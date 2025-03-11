/**
 * core/theme/presets/DarkTheme.js
 * 
 * Dark theme preset
 * Extends BaseTheme with dark mode colors and settings
 */

import { BaseTheme } from './BaseTheme.js';

export const DarkTheme = {
  ...BaseTheme,
  name: 'dark',
  
  // Override colors for dark theme
  colors: {
    ...BaseTheme.colors,
    
    background: {
      primary: '#070b14',
      secondary: '#0e1525',
      surface: 'rgba(22, 28, 45, 0.8)'
    },
    
    text: {
      ...BaseTheme.colors.text
    },
    
    gradients: {
      ...BaseTheme.colors.gradients,
      cosmos: 'linear-gradient(180deg, #070b14, #0e1525)'
    }
  },
  
  // Override glass effect for dark theme
  glass: {
    ...BaseTheme.glass,
    background: 'rgba(18, 22, 36, 0.6)'
  },
  
  // Override component-specific styling for dark theme
  components: {
    ...BaseTheme.components,
    
    panel: {
      ...BaseTheme.components.panel,
      background: 'rgba(18, 22, 36, 0.8)',
      headerBackground: 'rgba(23, 32, 55, 0.8)'
    },
    
    card: {
      ...BaseTheme.components.card,
      background: 'rgba(23, 32, 55, 0.6)'
    },
    
    input: {
      ...BaseTheme.components.input,
      background: 'rgba(10, 14, 23, 0.5)'
    },
    
    tooltip: {
      ...BaseTheme.components.tooltip,
      background: 'rgba(0, 0, 0, 0.8)'
    },
    
    modal: {
      ...BaseTheme.components.modal,
      background: 'rgba(18, 22, 36, 0.9)',
      overlayColor: 'rgba(0, 0, 0, 0.7)'
    }
  },
  
  // Override space background for dark theme
  spaceBackground: {
    ...BaseTheme.spaceBackground,
    stars: {
      ...BaseTheme.spaceBackground.stars,
      count: 100
    },
    nebula: {
      ...BaseTheme.spaceBackground.nebula,
      colors: [
        'hsla(210, 70%, 40%, 0.05)',
        'hsla(280, 70%, 40%, 0.05)',
        'hsla(340, 70%, 40%, 0.05)'
      ]
    }
  },
  
  // Dark theme specific effects
  effects: {
    nodeGlow: '0 0 15px rgba(0, 194, 255, 0.3)',
    selectionGlow: '0 0 20px rgba(174, 0, 255, 0.4)',
    executionGlow: '0 0 25px rgba(0, 255, 213, 0.5)'
  }
};
