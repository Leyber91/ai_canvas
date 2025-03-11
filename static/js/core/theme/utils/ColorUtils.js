/**
 * core/theme/utils/ColorUtils.js
 * 
 * Color manipulation utilities
 * Functions for working with colors in the theme system
 */

export class ColorUtils {
  /**
   * Parse color string to components
   * 
   * @param {string} color - Color string (hex, rgb, rgba)
   * @returns {Object|null} Color components {r, g, b, a}
   */
  static parseColor(color) {
    if (!color) return null;
    
    // Hex color
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    }
    
    // RGB/RGBA color
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          a: match[4] ? parseFloat(match[4]) : 1
        };
      }
    }
    
    // HSL/HSLA color
    if (color.startsWith('hsl')) {
      const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([0-9.]+))?\)/);
      if (match) {
        const h = parseInt(match[1], 10) / 360;
        const s = parseInt(match[2], 10) / 100;
        const l = parseInt(match[3], 10) / 100;
        const a = match[4] ? parseFloat(match[4]) : 1;
        
        // Convert HSL to RGB
        const rgb = this.hslToRgb(h, s, l);
        return {
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          a
        };
      }
    }
    
    return null;
  }
  
  /**
   * Convert RGB to hex
   * 
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} Hex color
   */
  static rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  /**
   * Convert hex to RGB
   * 
   * @param {string} hex - Hex color
   * @returns {Object} RGB components {r, g, b, a}
   */
  static hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : null;
  }
  
  /**
   * Convert HSL to RGB
   * 
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Object} RGB components {r, g, b}
   */
  static hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
      // Achromatic (gray)
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  /**
   * Convert RGB to HSL
   * 
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {Object} HSL components {h, s, l}
   */
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      // Achromatic (gray)
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  /**
   * Adjust brightness of a color
   * 
   * @param {string} color - Color to adjust
   * @param {number} amount - Amount to adjust (-1 to 1)
   * @returns {string} Adjusted color
   */
  static adjustBrightness(color, amount) {
    const rgb = this.parseColor(color);
    if (!rgb) return color;
    
    // Adjust RGB values
    const r = Math.max(0, Math.min(255, Math.round(rgb.r + (amount * 255))));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g + (amount * 255))));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b + (amount * 255))));
    
    // Return as hex
    return this.rgbToHex(r, g, b);
  }
  
  /**
   * Get contrast ratio between two colors
   * 
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @returns {number} Contrast ratio (1-21)
   */
  static getContrastRatio(color1, color2) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    // Calculate luminance
    const luminance1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const luminance2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    // Calculate contrast ratio
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  /**
   * Calculate relative luminance
   * 
   * @private
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {number} Luminance (0-1)
   */
  static calculateLuminance(r, g, b) {
    // Convert RGB to sRGB
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;
    
    // Calculate luminance
    const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
    const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
    const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }
  
  /**
   * Get readable text color for background
   * 
   * @param {string} backgroundColor - Background color
   * @returns {string} Text color (black or white)
   */
  static getReadableTextColor(backgroundColor) {
    const rgb = this.parseColor(backgroundColor);
    if (!rgb) return '#000000';
    
    // Calculate luminance
    const luminance = this.calculateLuminance(rgb.r, rgb.g, rgb.b);
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  /**
   * Blend two colors
   * 
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @param {number} ratio - Blend ratio (0-1)
   * @returns {string} Blended color
   */
  static blendColors(color1, color2, ratio = 0.5) {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    // Blend RGB values
    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
    
    // Return as hex
    return this.rgbToHex(r, g, b);
  }
  
  /**
   * Generate color shades
   * 
   * @param {string} baseColor - Base color
   * @param {number} steps - Number of shades to generate
   * @returns {Array} Array of color shades
   */
  static generateColorShades(baseColor, steps = 5) {
    const rgb = this.parseColor(baseColor);
    if (!rgb) return [baseColor];
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const shades = [];
    
    // Generate shades by adjusting lightness
    for (let i = 0; i < steps; i++) {
      const l = Math.max(0, Math.min(100, hsl.l - 40 + (i * 80 / (steps - 1))));
      const shade = `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
      shades.push(shade);
    }
    
    return shades;
  }
  
  /**
   * Convert color to RGBA string
   * 
   * @param {string} color - Color to convert
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGBA color string
   */
  static toRgba(color, alpha = 1) {
    const rgb = this.parseColor(color);
    if (!rgb) return color;
    
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
}
