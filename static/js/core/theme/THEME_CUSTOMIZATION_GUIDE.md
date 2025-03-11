# Theme Customization Guide

This guide explains how to customize and extend the AI Canvas theme system. You can create your own themes, modify existing ones, or add new visual effects.

## Table of Contents

- [Theme Customization Guide](#theme-customization-guide)
  - [Table of Contents](#table-of-contents)
  - [Understanding the Theme Structure](#understanding-the-theme-structure)
    - [Theme Object Structure](#theme-object-structure)
    - [Core Theme Properties](#core-theme-properties)
  - [Creating a Custom Theme](#creating-a-custom-theme)
    - [Example: Creating a Custom Theme](#example-creating-a-custom-theme)
    - [Extending an Existing Theme](#extending-an-existing-theme)
  - [Registering Your Theme](#registering-your-theme)
  - [Using CSS Variables](#using-css-variables)
    - [CSS Variable Naming Convention](#css-variable-naming-convention)
    - [Using CSS Variables in Your Styles](#using-css-variables-in-your-styles)
  - [Adding Custom Visual Effects](#adding-custom-visual-effects)
    - [Example: Creating a Custom Animation](#example-creating-a-custom-animation)
  - [Performance Considerations](#performance-considerations)
  - [Accessibility Guidelines](#accessibility-guidelines)
    - [Testing Accessibility](#testing-accessibility)
  - [Example: Complete Custom Theme](#example-complete-custom-theme)

## Understanding the Theme Structure

The AI Canvas theme system is built around a hierarchical structure of theme objects. Each theme extends from the `BaseTheme` and overrides specific properties to create a unique visual style.

### Theme Object Structure

```javascript
{
  name: "theme-name",
  colors: {
    primary: "#00c2ff",
    secondary: "#ae00ff",
    // More colors...
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    // More spacing values...
  },
  typography: {
    // Typography settings...
  },
  // More theme properties...
}
```

### Core Theme Properties

- **name**: Unique identifier for the theme
- **colors**: Color palette for the theme
- **spacing**: Spacing scale for consistent layout
- **typography**: Font settings
- **borders**: Border styles
- **shadows**: Shadow definitions
- **animations**: Animation timing
- **components**: Component-specific styling

## Creating a Custom Theme

To create a custom theme, you'll extend the `BaseTheme` and override the properties you want to change.

### Example: Creating a Custom Theme

```javascript
import { BaseTheme } from './core/theme/presets/BaseTheme.js';
import { themeRegistry } from './core/theme/ThemeRegistry.js';

// Create custom theme
const CustomTheme = {
  ...BaseTheme,
  name: 'custom',
  colors: {
    ...BaseTheme.colors,
    primary: '#ff0000',
    secondary: '#00ff00'
  },
  // Override other properties as needed
};

// Register custom theme
themeRegistry.register('custom', CustomTheme);
```

### Extending an Existing Theme

You can also extend an existing theme other than `BaseTheme`:

```javascript
import { DarkTheme } from './core/theme/presets/DarkTheme.js';
import { themeRegistry } from './core/theme/ThemeRegistry.js';

// Create a variant of the dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  name: 'custom-dark',
  colors: {
    ...DarkTheme.colors,
    primary: '#ff0000',
    secondary: '#00ff00'
  }
};

// Register custom theme
themeRegistry.register('custom-dark', CustomDarkTheme);
```

## Registering Your Theme

After creating your theme, you need to register it with the `ThemeRegistry`:

```javascript
import { themeRegistry } from './core/theme/ThemeRegistry.js';

// Register your theme
themeRegistry.register('my-theme', MyTheme);

// Apply your theme
import { themeService } from './core/theme/ThemeService.js';
themeService.applyTheme('my-theme');
```

## Using CSS Variables

The theme system generates CSS variables from your theme object. These variables are available throughout the application for styling components.

### CSS Variable Naming Convention

CSS variables follow this naming pattern:

```
--theme-[category]-[property]
```

For example:
- `--theme-color-primary`
- `--theme-spacing-md`
- `--theme-border-radius-lg`

### Using CSS Variables in Your Styles

```css
.my-component {
  color: var(--theme-text-primary);
  background-color: var(--theme-bg-surface);
  padding: var(--theme-spacing-md);
  border-radius: var(--theme-border-radius-md);
  box-shadow: var(--theme-shadow-md);
}
```

## Adding Custom Visual Effects

You can extend the theme system with custom visual effects by creating new effect controllers or extending existing ones.

### Example: Creating a Custom Animation

```javascript
import { animationController } from './core/theme/effects/AnimationController.js';

// Add a custom animation
animationController.registerAnimation('bounce', (element, options = {}) => {
  // Implementation of bounce animation
  const animation = element.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(-20px)' },
    { transform: 'translateY(0)' }
  ], {
    duration: options.duration || 500,
    iterations: options.iterations || 1,
    easing: 'ease-in-out'
  });
  
  return animation;
});

// Use your custom animation
animationController.applyAnimation('bounce', myElement, { iterations: 3 });
```

## Performance Considerations

When customizing themes, keep these performance tips in mind:

1. **Minimize DOM Manipulations**: Use CSS variables for theme changes instead of directly manipulating the DOM.
2. **Optimize Animations**: Use CSS animations where possible and limit JavaScript animations to essential elements.
3. **Reduce Complexity for Mobile**: Detect device capabilities and reduce animation complexity on lower-end devices.
4. **Use Hardware Acceleration**: Add `transform: translateZ(0)` or `will-change` for smoother animations.
5. **Clean Up Resources**: Always clean up animations, event listeners, and other resources when components unmount.

## Accessibility Guidelines

Ensure your custom themes follow these accessibility guidelines:

1. **Color Contrast**: Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.
2. **Reduced Motion**: Respect the user's `prefers-reduced-motion` setting.
3. **Focus Indicators**: Ensure focus indicators are visible in all themes.
4. **Text Sizing**: Allow text to be resized up to 200% without loss of content or functionality.
5. **Keyboard Navigation**: Ensure all interactive elements are accessible via keyboard.

### Testing Accessibility

Use tools like:
- [WAVE Web Accessibility Evaluation Tool](https://wave.webaim.org/)
- [Axe DevTools](https://www.deque.com/axe/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Example: Complete Custom Theme

Here's a complete example of a custom theme:

```javascript
import { BaseTheme } from './core/theme/presets/BaseTheme.js';
import { themeRegistry } from './core/theme/ThemeRegistry.js';
import { themeService } from './core/theme/ThemeService.js';

// Create custom theme
const OceanTheme = {
  ...BaseTheme,
  name: 'ocean',
  
  colors: {
    ...BaseTheme.colors,
    primary: '#0077b6',
    secondary: '#00b4d8',
    tertiary: '#90e0ef',
    
    background: {
      primary: '#03045e',
      secondary: '#023e8a',
      surface: 'rgba(2, 62, 138, 0.8)'
    },
    
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(230, 240, 255, 0.85)',
      tertiary: 'rgba(180, 210, 255, 0.7)',
      muted: 'rgba(140, 170, 210, 0.6)'
    }
  },
  
  gradients: {
    primary: 'linear-gradient(45deg, #0077b6, #00b4d8)',
    background: 'linear-gradient(180deg, #03045e, #023e8a)'
  },
  
  shadows: {
    ...BaseTheme.shadows,
    glow: {
      primary: '0 0 15px rgba(0, 119, 182, 0.5)',
      secondary: '0 0 15px rgba(0, 180, 216, 0.5)'
    }
  },
  
  components: {
    ...BaseTheme.components,
    button: {
      primary: {
        background: 'rgba(0, 119, 182, 0.2)',
        hoverBackground: 'rgba(0, 119, 182, 0.3)',
        activeBackground: 'rgba(0, 119, 182, 0.4)',
        textColor: '#ffffff',
        borderColor: 'rgba(0, 119, 182, 0.5)'
      }
    }
  }
};

// Register and apply the theme
themeRegistry.register('ocean', OceanTheme);
themeService.applyTheme('ocean');
```

By following this guide, you can create custom themes that maintain consistency with the core theme system while expressing your unique visual style.
