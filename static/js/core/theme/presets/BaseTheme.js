/**
 * core/theme/presets/BaseTheme.js
 * 
 * Base theme definition with default values
 * All other themes extend from this
 */

export const BaseTheme = {
  name: 'base',
  
  // Color palette
  colors: {
    primary: '#00c2ff',
    secondary: '#ae00ff',
    tertiary: '#ff3377',
    success: '#27c98f',
    warning: '#ffb545',
    error: '#ff5a65',
    info: '#2e85ff',
    
    background: {
      primary: '#121f45',
      secondary: '#0f1630',
      surface: 'rgba(18, 22, 36, 0.8)'
    },
    
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(221, 235, 255, 0.85)',
      tertiary: 'rgba(170, 200, 255, 0.7)',
      muted: 'rgba(130, 160, 210, 0.6)'
    },
    
    border: {
      light: 'rgba(80, 120, 240, 0.25)',
      medium: 'rgba(80, 120, 240, 0.3)',
      strong: 'rgba(80, 120, 240, 0.5)'
    },
    
    // Node type colors
    node: {
      ollama: '#00c2ff',
      groq: '#ae00ff',
      default: '#2e85ff'
    },
    
    // State colors
    state: {
      active: '#00c2ff',
      selected: '#ae00ff',
      executing: '#00ffd5',
      completed: '#27c98f',
      error: '#ff5a65',
      waiting: 'rgba(130, 160, 210, 0.6)'
    },
    
    // Gradients
    gradients: {
      blue: 'linear-gradient(45deg, #00c2ff, #2c6dd5)',
      purple: 'linear-gradient(45deg, #ae00ff, #6c4bb4)',
      cosmos: 'linear-gradient(180deg, #121f45, #1e1045)',
      accent: 'linear-gradient(45deg, #00c2ff, #ae00ff)'
    }
  },
  
  // Spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // Typography
  typography: {
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8
    }
  },
  
  // Borders
  borders: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      pill: '9999px'
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px'
    }
  },
  
  // Shadows
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.3)',
    glow: {
      blue: '0 0 15px rgba(0, 194, 255, 0.5)',
      purple: '0 0 15px rgba(174, 0, 255, 0.5)',
      success: '0 0 15px rgba(39, 201, 143, 0.5)',
      error: '0 0 15px rgba(255, 51, 119, 0.5)'
    }
  },
  
  // Z-index scale
  zIndex: {
    background: -10,
    base: 1,
    above: 10,
    modal: 100,
    tooltip: 200,
    notification: 300
  },
  
  // Animations
  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s'
    },
    timing: 'ease-in-out',
    transition: 'all 0.3s ease-in-out'
  },
  
  // Glass effect
  glass: {
    background: 'rgba(18, 22, 36, 0.6)',
    border: 'rgba(80, 120, 240, 0.25)',
    blur: '8px',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  
    // Component-specific styling
    components: {
      button: {
        primary: {
          background: 'rgba(0, 194, 255, 0.2)',
          hoverBackground: 'rgba(0, 194, 255, 0.3)',
          activeBackground: 'rgba(0, 194, 255, 0.4)',
          textColor: '#ffffff',
          borderColor: 'rgba(0, 194, 255, 0.5)'
        },
        secondary: {
          background: 'rgba(174, 0, 255, 0.2)',
          hoverBackground: 'rgba(174, 0, 255, 0.3)',
          activeBackground: 'rgba(174, 0, 255, 0.4)',
          textColor: '#ffffff',
          borderColor: 'rgba(174, 0, 255, 0.5)'
        },
        danger: {
          background: 'rgba(255, 51, 119, 0.2)',
          hoverBackground: 'rgba(255, 51, 119, 0.3)',
          activeBackground: 'rgba(255, 51, 119, 0.4)',
          textColor: '#ffffff',
          borderColor: 'rgba(255, 51, 119, 0.5)'
        }
      },
      
      // Workflow panel specific styling
      workflow: {
        executeButton: {
          background: '#00c2ff',
          hoverBackground: '#00a8e0',
          textColor: '#ffffff'
        },
        stopButton: {
          background: '#ff5a65',
          hoverBackground: '#e74c3c',
          textColor: '#ffffff'
        },
        validateButton: {
          background: '#ffb545',
          hoverBackground: '#f39c12',
          textColor: '#ffffff'
        },
        resetButton: {
          background: '#ff5a65',
          hoverBackground: '#e74c3c',
          textColor: '#ffffff'
        }
      },
    
    panel: {
      background: 'rgba(18, 22, 36, 0.8)',
      border: 'rgba(80, 120, 240, 0.3)',
      headerBackground: 'rgba(23, 32, 55, 0.8)',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    },
    
    card: {
      background: 'rgba(23, 32, 55, 0.6)',
      border: 'rgba(80, 120, 240, 0.3)',
      shadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      hoverShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
    },
    
    input: {
      background: 'rgba(10, 14, 23, 0.5)',
      border: 'rgba(80, 120, 240, 0.3)',
      focusBorder: 'rgba(0, 194, 255, 0.5)',
      textColor: '#ffffff',
      placeholderColor: 'rgba(130, 160, 210, 0.6)'
    },
    
    tooltip: {
      background: 'rgba(0, 0, 0, 0.8)',
      border: 'rgba(80, 120, 240, 0.3)',
      textColor: '#ffffff',
      shadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    },
    
    modal: {
      background: 'rgba(18, 22, 36, 0.9)',
      border: 'rgba(80, 120, 240, 0.3)',
      shadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
      overlayColor: 'rgba(0, 0, 0, 0.7)'
    },
    
    scrollbar: {
      track: 'rgba(0, 0, 0, 0.2)',
      thumb: 'rgba(0, 194, 255, 0.3)',
      thumbHover: 'rgba(0, 194, 255, 0.5)'
    }
  },
  
  // Space background
  spaceBackground: {
    stars: {
      colors: ['#ffffff', '#f0f8ff', '#f8f8ff'],
      count: 100,
      minSize: 0.5,
      maxSize: 3
    },
    nebula: {
      colors: [
        'hsla(210, 70%, 40%, 0.05)',
        'hsla(280, 70%, 40%, 0.05)',
        'hsla(340, 70%, 40%, 0.05)'
      ],
      count: 3,
      minSize: 200,
      maxSize: 500
    }
  }
};
