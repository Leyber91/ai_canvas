# Theme System - Phase 4 Implementation

## Overview

This directory contains the implementation of Phase 4: Theme System for AI Canvas. The theme system provides a modular, extensible theming architecture that delivers consistent styling, animations, and visual effects across the application while maintaining backward compatibility with existing code.

## Architecture

The theme system is built around several key components:

### Core Components

- **ThemeService**: Central service for theme management
- **ThemeRegistry**: Registry for theme definitions
- **ThemeState**: State management for theme-related properties

### Visual Effects

- **AnimationController**: Controls UI animations
- **BackgroundManager**: Manages dynamic background effects
- **Tooltip**: Tooltip component system

### Theme Definitions

- **BaseTheme**: Base theme with default values
- **DarkTheme**: Dark theme preset
- **LightTheme**: Light theme preset

### Utilities

- **ThemeHelpers**: Helper functions for theme operations
- **ColorUtils**: Color manipulation utilities

### Compatibility Wrappers

- **ThemeManager**: Compatibility wrapper around ThemeService
- **themeState**: Re-exports from ThemeState
- **UIAnimations**: Compatibility wrapper around AnimationController
- **SpaceBackground**: Compatibility wrapper around BackgroundManager
- **TooltipManager**: Compatibility wrapper around Tooltip

## Usage

### Applying Themes

```javascript
// Import the theme service
import { themeService } from './core/theme/ThemeService.js';

// Apply a theme
themeService.applyTheme('dark');

// Toggle between light and dark themes
themeService.toggleDarkMode();
```

### Accessing Theme Variables

```javascript
// Import the theme service
import { themeService } from './core/theme/ThemeService.js';

// Get a theme variable
const primaryColor = themeService.getThemeVariable('color-primary');

// Set a theme variable
themeService.setThemeVariable('color-primary', '#00c2ff');
```

### Using Animations

```javascript
// Import the animation controller
import { animationController } from './core/theme/effects/AnimationController.js';

// Apply fade-in animation
const element = document.querySelector('.my-element');
animationController.applyFadeIn(element, { delay: 200 });

// Apply slide-in animation
animationController.applySlideIn(element, 'right', { delay: 200 });
```

### Using Backgrounds

```javascript
// Import the background manager
import { backgroundManager } from './core/theme/backgrounds/BackgroundManager.js';

// Initialize background
const container = document.querySelector('.background-container');
backgroundManager.initializeBackground('stars', container);

// Create nebula effects
backgroundManager.createNebulaEffects(container, { count: 3 });
```

### Using Tooltips

```javascript
// Import the tooltip component
import { tooltip } from './core/theme/components/Tooltip.js';

// Show tooltip
const position = { x: 100, y: 100 };
const content = 'This is a tooltip';
tooltip.showTooltip(position, content);

// Register tooltip target
const element = document.querySelector('.tooltip-target');
tooltip.registerTooltipTarget(element, 'Tooltip content');
```

## Theme Structure

Themes are defined as objects with a consistent structure:

```javascript
{
  name: "dark",
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
  // More theme properties...
}
```

## Creating Custom Themes

To create a custom theme, extend the BaseTheme:

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
  }
};

// Register custom theme
themeRegistry.register('custom', CustomTheme);
```

## Accessibility Considerations

The theme system includes several accessibility features:

- **Contrast Checking**: Utilities for ensuring sufficient color contrast
- **Reduced Motion**: Support for the `prefers-reduced-motion` media query
- **Keyboard Navigation**: Proper focus management for interactive elements
- **Screen Reader Support**: ARIA attributes for tooltips and other components

## Performance Optimization

The theme system is optimized for performance:

- **CSS Variables**: Efficient theme switching without DOM manipulation
- **Animation Throttling**: Reduced animation complexity on lower-end devices
- **Lazy Loading**: Components are loaded only when needed
- **Cleanup**: All visual effects properly clean up resources

## Backward Compatibility

The theme system maintains backward compatibility with existing code through wrapper classes that implement the original APIs but delegate to the new implementation.
