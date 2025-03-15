I'll create a more expanded and detailed version of `file_analysis.md` with deeper analysis of components, functions, and architecture.

```md:ai_canvas/file_analysis.md
# AI Canvas Project - Comprehensive File Structure and Class Analysis

## Complete File Tree Structure

```
ai_canvas/
│
├── static/
│   ├── js/
│   │   ├── config.js                     # Configuration settings for the application
│   │   │
│   │   ├── core/                         # Core functionality
│   │   │   ├── component/                # Component system
│   │   │   │   └── behaviors/            # Component behaviors
│   │   │   │       ├── DOMBehavior.js    # DOM manipulation behavior
│   │   │   │       ├── ErrorHandlingBehavior.js # Error handling behavior
│   │   │   │       └── EventBehavior.js  # Event handling behavior
│   │   │   │
│   │   │   ├── dialog/                   # Dialog system
│   │   │   │   ├── BaseDialog.js         # Base dialog component
│   │   │   │   ├── DialogController.js   # Dialog controller
│   │   │   │   ├── DialogService.js      # Dialog service
│   │   │   │   ├── behaviors/            # Dialog-specific behaviors
│   │   │   │   │   ├── DraggableBehavior.js # Draggable dialog behavior
│   │   │   │   │   └── ResizableBehavior.js # Resizable dialog behavior
│   │   │   │   │
│   │   │   │   └── templates/            # Dialog templates
│   │   │   │       ├── ConfirmationTemplate.js # Confirmation dialog template
│   │   │   │       └── GraphSelectionTemplate.js # Graph selection dialog template
│   │   │   │
│   │   │   ├── dom/                      # DOM utilities
│   │   │   │   └── Selectors.js          # DOM selector registry
│   │   │   │
│   │   │   ├── events/                   # Event system
│   │   │   │   └── EventDelegate.js      # Event delegation and management
│   │   │   │
│   │   │   ├── factories/                # Factory patterns
│   │   │   │   └── EventManagerFactory.js # Event manager factory
│   │   │   │
│   │   │   ├── panel/                    # Panel system
│   │   │   │   ├── BasePanelComponent.js # Base panel component
│   │   │   │   └── DraggablePanelManager.js # Draggable panel manager
│   │   │   │
│   │   │   ├── state/                    # State management
│   │   │   │   └── StateManager.js       # State manager
│   │   │   │
│   │   │   ├── services/                 # Core services
│   │   │   │   └── EventBusService.js    # Event bus service
│   │   │   │
│   │   │   ├── theme/                    # Theming system
│   │   │   │   ├── ThemeRegistry.js      # Theme registry
│   │   │   │   ├── ThemeService.js       # Theme service
│   │   │   │   ├── ThemeState.js         # Theme state management
│   │   │   │   ├── PERFORMANCE_OPTIMIZATION.md # Performance optimization guide
│   │   │   │   ├── README.md             # Theme system documentation
│   │   │   │   ├── THEME_CUSTOMIZATION_GUIDE.md # Theme customization guide
│   │   │   │   ├── VERIFICATION_CHECKLIST.md # Theme verification checklist
│   │   │   │   ├── backgrounds/          # Theme backgrounds
│   │   │   │   │   └── BackgroundManager.js # Background manager
│   │   │   │   ├── components/           # Theme components
│   │   │   │   │   └── Tooltip.js        # Tooltip component
│   │   │   │   ├── effects/              # Theme effects
│   │   │   │   │   └── AnimationController.js # Animation controller
│   │   │   │   ├── presets/              # Theme presets
│   │   │   │   │   ├── BaseTheme.js      # Base theme
│   │   │   │   │   ├── DarkTheme.js      # Dark theme
│   │   │   │   │   └── LightTheme.js     # Light theme
│   │   │   │   └── utils/                # Theme utilities
│   │   │   │       ├── ColorUtils.js     # Color utilities
│   │   │   │       └── ThemeHelpers.js   # Theme helper functions
│   │   │   │
│   │   │   ├── utils/                    # Core utilities
│   │   │   │   ├── AnimationUtils.js     # Animation utilities
│   │   │   │   ├── FormatUtils.js        # Formatting utilities
│   │   │   │   └── StyleUtils.js         # Style utilities
│   │   │   │
│   │   │   └── constants/                # Constants
│   │   │       └── EventTypes.js         # Event type constants
│   │   │
│   │   ├── graph/                        # Graph-related functionality
│   │   │   ├── CytoscapeManager.js       # Manages Cytoscape.js integration for graph visualization
│   │   │   ├── CytoscapeRenderFix.js     # Fixes for Cytoscape rendering issues
│   │   │   ├── EdgeManager.js            # Handles edge operations (creation, deletion, querying)
│   │   │   ├── GraphLayoutManager.js     # Controls graph layouts and node positioning
│   │   │   ├── GraphManager.js           # Core graph management class coordinating all graph operations
│   │   │   ├── GraphStorage.js           # Graph persistence (save, load, import/export)
│   │   │   └── NodeManager.js            # Handles node operations (creation, deletion, selection, data)
│   │   │
│   │   ├── models/
│   │   │   └── ModelRegistry.js          # Manages AI model information and settings
│   │   │
│   │   ├── modules/
│   │   │   ├── ConversationPanel.js      # Handles chat interface and message exchange
│   │   │   └── GraphEditor.js            # Graph editing functionality and UI integration
│   │   │
│   │   ├── storage/
│   │   │   └── StorageManager.js         # Local storage management with prefixed keys
│   │   │
│   │   ├── ui/
│   │   │   ├── components/               # UI components
│   │   │   │   └── UIComponents.js       # Reusable UI components
│   │   │   ├── dialog/                   # Dialog UI
│   │   │   │   ├── ConfirmationDialog.js # Confirmation dialog
│   │   │   │   ├── DialogComponent.js    # Dialog component
│   │   │   │   ├── DialogManager.js      # Dialog manager
│   │   │   │   ├── GraphSelectionDialog.js # Graph selection dialog
│   │   │   │   └── WorkflowProgressDialog.js # Workflow progress dialog
│   │   │   ├── fixes/                    # UI fixes
│   │   │   │   └── WorkflowPanelFix.js   # Workflow panel fixes
│   │   │   ├── helpers/                  # UI helpers
│   │   │   │   ├── domHelpers.js         # DOM helper functions
│   │   │   │   ├── EventUtils.js         # Event utilities
│   │   │   │   └── formatHelpers.js      # Format helper functions
│   │   │   ├── managers/                 # UI managers
│   │   │   │   └── BaseManager.js        # Base manager class
│   │   │   ├── panel/                    # Panel system
│   │   │   │   ├── BasePanelManager.js   # Base panel manager
│   │   │   │   ├── EnhancedBasePanelManager.js # Enhanced panel manager
│   │   │   │   ├── PanelStateManager.js  # Panel state manager
│   │   │   │   └── PanelUtils.js         # Panel utilities
│   │   │   ├── registry/                 # UI registries
│   │   │   │   ├── DOMElementRegistry.js # DOM element registry
│   │   │   │   └── WorkflowPanelRegistry.js # Workflow panel registry
│   │   │   ├── theme/                    # UI theming
│   │   │   │   ├── animations/           # Theme animations
│   │   │   │   │   └── UIAnimations.js   # UI animations
│   │   │   │   ├── background/           # Theme backgrounds
│   │   │   │   │   └── SpaceBackground.js # Space background
│   │   │   │   ├── chat/                 # Chat theming
│   │   │   │   │   └── NodeChatDialogManager.js # Node chat dialog manager
│   │   │   │   ├── cytoscape/            # Cytoscape theming
│   │   │   │   │   └── CytoscapeThemeManager.js # Cytoscape theme manager
│   │   │   │   ├── events/               # Theme events
│   │   │   │   │   └── EventListenerSetup.js # Event listener setup
│   │   │   │   ├── execution/            # Execution theming
│   │   │   │   │   └── ExecutionUIManager.js # Execution UI manager
│   │   │   │   ├── panels/               # Panel theming
│   │   │   │   │   ├── ConversationPanelManager.js # Conversation panel manager
│   │   │   │   │   ├── HypermodularWorkflowPanel.js # Workflow panel
│   │   │   │   │   ├── controls/         # Control panels
│   │   │   │   │   │   └── ControlsManager.js # Controls manager
│   │   │   │   │   ├── draggable/        # Draggable panels
│   │   │   │   │   │   └── DraggableManager.js # Draggable manager
│   │   │   │   │   ├── errors/           # Error panels
│   │   │   │   │   │   └── ErrorManager.js # Error manager
│   │   │   │   │   ├── execution/        # Execution panels
│   │   │   │   │   │   └── ExecutionPlanManager.js # Execution plan manager
│   │   │   │   │   ├── results/          # Result panels
│   │   │   │   │   │   └── ResultsManager.js # Results manager
│   │   │   │   │   ├── status/           # Status panels
│   │   │   │   │   │   └── StatusDisplayManager.js # Status display manager
│   │   │   │   │   └── theme/            # Theme panels
│   │   │   │   │       └── ThemeManager.js # Theme manager
│   │   │   │   └── tooltips/             # Theme tooltips
│   │   │   │       └── TooltipManager.js # Tooltip manager
│   │   │   ├── utils/                    # UI utilities
│   │   │   │   └── DOMElementFinder.js   # DOM element finder
│   │   │   ├── ConversationPanelManager.js # Manages conversation UI and chat messaging
│   │   │   ├── GraphControlsManager.js   # Graph control buttons for operations
│   │   │   ├── NodeModalManager.js       # Node creation/editing modal functionality
│   │   │   ├── NodeOperationsManager.js  # Node operations UI and interaction handling
│   │   │   ├── NotificationManager.js    # Notification system for user feedback
│   │   │   ├── Spacetheme.js             # Space theme implementation
│   │   │   ├── ThemeManager.js           # Theme management (light/dark modes)
│   │   │   ├── UIManager.js              # Main UI coordination and event handling
│   │   │   └── WorkflowPanelManager.js   # Workflow panel management and state handling
│   │   │
│   │   └── workflow/                     # Workflow execution engine
│   │       ├── CycleDetector.js          # Detects and handles cycles in graph
│   │       ├── ExecutionEngine.js        # Executes workflow operations on nodes
│   │       ├── index.js                  # Workflow module entry point and exports
│   │       ├── TopologicalSorter.js      # Sorts nodes in execution order
│   │       ├── WorkflowManager.js        # Main workflow coordinator
│   │       ├── WorkflowValidator.js      # Validates workflows for execution
│   │       └── WorkflowVisualizer.js     # Visualizes workflow execution progress
│   │
│   └── css/                              # Stylesheet files
│       ├── animations.css                # Animation styles
│       ├── space-theme.css               # Space theme styles
│       ├── styles.css                    # Main stylesheet
│       ├── base/                         # Base styles
│       │   └── _theme-variables.css      # Theme variables
│       ├── modules/                      # CSS modules for different components
│       │   ├── _buttons.css              # Button styles
│       │   ├── _chat-section.css         # Chat section styles
│       │   ├── _conversation-panel.css   # Conversation panel styles
│       │   ├── _cytoscape-fixes.css      # Cytoscape fixes
│       │   ├── _cytoscape.css            # Cytoscape styles
│       │   ├── _dialog.css               # Dialog styles
│       │   ├── _header.css               # Header styles
│       │   ├── _layout.css               # Layout styles
│       │   ├── _loading-indicator.css    # Loading indicator styles
│       │   ├── _modal.css                # Modal styles
│       │   ├── _model-limits-info.css    # Model limits info styles
│       │   ├── _node-info.css            # Node info styles
│       │   ├── _node-operations.css      # Node operations styles
│       │   ├── _reset-and-base.css       # Reset and base styles
│       │   ├── _result-modal.css         # Result modal styles
│       │   ├── _space-background.css     # Space background styles
│       │   ├── _space-theme-base.css     # Space theme base styles
│       │   ├── _theme-variables.css      # Theme variables
│       │   ├── _typing-indicator.css     # Typing indicator styles
│       │   ├── _typography.css           # Typography styles
│       │   ├── _validation.css           # Validation styles
│       │   ├── _variables.css            # Variable styles
│       │   └── _workflow-panel.css       # Workflow panel styles
│       └── themes/                       # Theme-specific styles
│           ├── _space-background.css     # Space background theme
│           ├── _space-theme-base.css     # Space theme base
│           └── _space-theme.css          # Space theme
│
├── backend/                              # Server-side code
│   ├── app/                              # Backend application
│   │   ├── models/                       # Data models
│   │   │   └── __init__.py               # Models initialization
│   │   ├── routes/                       # API routes
│   │   │   └── __init__.py               # Routes initialization
│   │   ├── services/                     # Business services
│   │   │   └── __init__.py               # Services initialization
│   │   └── utils/                        # Utility functions
│   │       └── __init__.py               # Utils initialization
│   │
│   ├── templates/                        # HTML templates
│   │   └── index.html                    # Main index template
│   │
│   ├── groq_doc_test_log.txt            # Groq documentation test log
│   ├── groq_hardcoded_test_log.txt      # Groq hardcoded test log
│   ├── groq_test_log.txt                # Groq test log
│   ├── requirements.txt                 # Python dependencies
│   ├── run.py                           # Application entry point
│   ├── test_groq_curl.sh                # Groq API test script (curl)
│   └── test_groq_powershell.ps1         # Groq API test script (PowerShell)
│
├── git-server/                          # Git server implementation
│   ├── src/                             # Source code
│   │   └── index.ts                     # Entry point
│   ├── package.json                     # Node.js dependencies
│   ├── README.md                        # Git server documentation 
│   └── tsconfig.json                    # TypeScript configuration
│
├── connection_rosetta.html/             # Connection interoperability
│   └── index.html                       # Connection Rosetta interface
│
├── current_project_strcutre.md          # Current project structure document
├── file_analysis.md                     # This file - detailed analysis
├── README.md                            # Project overview and documentation
└── refactor.md                          # Refactoring documentation
```

## Core API Functions

### Model Management Functions

```javascript
/**
 * Get available models from all providers
 * 
 * Fetches and returns all available AI models from configured providers.
 * Models are organized by provider with detailed information about each model
 * including supported features and capabilities.
 * 
 * @returns {Promise<Object>} Object containing models organized by provider
 * @example
 * // Returns structure like:
 * {
 *   "groq": [
 *     { "id": "llama3-8b-8192", "displayName": "Llama3 8B", "contextLength": 8192, ... },
 *     { "id": "mixtral-8x7b-32768", "displayName": "Mixtral 8x7B", "contextLength": 32768, ... }
 *   ],
 *   "ollama": [
 *     { "id": "llama3", "displayName": "Llama3", ... },
 *     { "id": "mistral", "displayName": "Mistral", ... }
 *   ]
 * }
 */
async function get_available_models() {
  // Implementation fetches from providers like Groq, Ollama, etc.
  // Returns structured data about available models
}

/**
 * Get Groq model limits and capabilities
 * 
 * Retrieves detailed information about Groq model rate limits, context sizes,
 * and other capability metrics. This information is used for optimizing prompt
 * generation and workflow execution planning.
 * 
 * @returns {Promise<Object>} Object containing model limits by model name
 * @example
 * // Returns structure like:
 * {
 *   "llama3-8b-8192": {
 *     "tokens_per_minute": 2000000,
 *     "max_context_length": 8192,
 *     "supports_vision": false,
 *     "pricing": {
 *       "input_per_million_tokens": 0.125,
 *       "output_per_million_tokens": 0.375
 *     },
 *     "optimal_settings": {
 *       "temperature": 0.7,
 *       "top_p": 0.95
 *     }
 *   },
 *   // More model entries...
 * }
 */
async function get_groq_model_limits() {
  // Implementation fetches Groq-specific information
  // Returns structured data about model limits
}
```

## Detailed Component Analysis

### Core Component System

The core component system provides a foundation for creating reusable components with modular behaviors.

#### BaseComponent (core/component/BaseComponent.js)

Abstract base class for all components in the system.

**Properties:**
- `id` - Unique component identifier
- `element` - DOM element associated with component
- `options` - Component configuration options
- `eventBus` - Event bus for pub/sub communication
- `behaviors` - Map of attached behaviors
- `state` - Component state object

**Methods:**
- `constructor(options)` - Create new component with options
- `initialize()` - Initialize component
- `destroy()` - Clean up resources
- `render()` - Render component to DOM
- `addBehavior(behavior)` - Add a behavior to component
- `removeBehavior(behaviorId)` - Remove a behavior
- `getBehavior(behaviorId)` - Get a specific behavior
- `subscribeToEvents()` - Set up event subscriptions
- `unsubscribeFromEvents()` - Remove event subscriptions
- `setState(newState)` - Update component state
- `getState()` - Get current component state
- `on(eventName, handler)` - Subscribe to event
- `off(eventName, handler)` - Unsubscribe from event
- `emit(eventName, data)` - Emit event with data
- `querySelector(selector)` - Find element within component
- `querySelectorAll(selector)` - Find all elements matching selector

#### DOMBehavior (core/component/behaviors/DOMBehavior.js)

Behavior that provides DOM manipulation capabilities to components.

**Methods:**
- `initialize(component)` - Initialize behavior with component
- `destroy(component)` - Clean up resources
- `createElement(tagName, options, children)` - Create HTML element
- `findElement(key, required)` - Find element by key or selector
- `findElements(keys, required)` - Find multiple elements
- `clearDOMCache(key)` - Clear element cache
- `getDOMCache()` - Get element cache
- `applyStyles(element, styles)` - Apply CSS styles to element
- `applyGlassmorphism(element, options)` - Apply glassmorphism effect
- `createCustomScrollbar(element, options)` - Create custom scrollbar

#### ErrorHandlingBehavior (core/component/behaviors/ErrorHandlingBehavior.js)

Behavior that provides error handling capabilities to components.

**Methods:**
- `initialize(component)` - Initialize behavior with component
- `destroy(component)` - Clean up resources
- `handleError(error, context, options)` - Handle and process error
- `logError(message, context)` - Log error message
- `showErrorNotification(message, context, duration)` - Show error notification
- `getErrorHistory()` - Get error history
- `clearErrorHistory()` - Clear error history
- `setMaxErrorHistoryLength(length)` - Set maximum history length

#### EventBehavior (core/component/behaviors/EventBehavior.js)

Behavior that provides event handling capabilities to components.

**Methods:**
- `initialize(component)` - Initialize behavior with component
- `destroy(component)` - Clean up resources
- `addDOMEventListener(element, eventType, handler, options)` - Add DOM event listener
- `removeDOMEventListener(listener)` - Remove DOM event listener
- `setupEventListeners()` - Set up event listeners
- `cleanupEventListeners()` - Clean up event listeners
- `publish(category, action, data)` - Publish event
- `subscribe(event, handler, context)` - Subscribe to event
- `unsubscribe(subscription)` - Unsubscribe from event

### Dialog System

The dialog system provides a flexible framework for creating and managing dialogs.

#### BaseDialog Class (core/dialog/BaseDialog.js)

Provides the foundation for all dialog components with standardized behavior.

**Properties:**
- `options` - Dialog configuration options
- `dialogElement` - Main dialog element
- `overlayElement` - Semi-transparent background overlay
- `contentElement` - Dialog content container
- `isOpen` - Whether dialog is currently open
- `id` - Unique dialog identifier
- `position` - Dialog position on screen
- `title` - Dialog title text
- `content` - Dialog content (string, HTML, or function)
- `cssClass` - Additional CSS classes
- `zIndex` - Z-index for stacking order
- `closeOnEscape` - Whether to close on escape key
- `closeOnOverlayClick` - Whether to close when overlay clicked
- `showOverlay` - Whether to show overlay
- `draggable` - Whether dialog is draggable
- `resizable` - Whether dialog is resizable
- `modal` - Whether dialog is modal
- `enterAnimation` - Animation when showing
- `exitAnimation` - Animation when hiding
- `onShow` - Callback when shown
- `onHide` - Callback when hidden
- `onClose` - Callback when closed
- `onDragStart` - Callback when drag starts
- `onDragEnd` - Callback when drag ends
- `onResizeStart` - Callback when resize starts
- `onResizeEnd` - Callback when resize ends

**Methods:**
- `constructor(options)` - Create dialog with options
- `show(options)` - Display the dialog
- `hide(skipAnimation)` - Hide dialog with optional animation
- `cleanup()` - Remove event listeners and DOM elements
- `createDialogElement()` - Create the main dialog element
- `createOverlay()` - Create a semi-transparent overlay
- `createContent(template)` - Create dialog content from template
- `setContent(content)` - Update dialog content
- `setTitle(title)` - Update dialog title
- `setPosition(position)` - Set dialog position
- `positionDialog()` - Position dialog on screen
- `applyAnimation(element, animation)` - Apply entrance animation
- `applyExitAnimation(element, animation)` - Apply exit animation
- `addClass(className)` - Add a class to dialog element
- `removeClass(className)` - Remove a class from dialog element
- `addCloseButton(container, onClose)` - Add standard close button
- `trapFocus()` - Trap keyboard focus within dialog
- `handleEscapeKey(callback)` - Handle escape key press
- `getIsOpen()` - Check if dialog is open
- `getDialogElement()` - Get dialog element
- `getContentElement()` - Get content element
- `getOverlayElement()` - Get overlay element
- `getId()` - Get dialog ID
- `setZIndex(zIndex)` - Set dialog z-index

#### DialogController Class (core/dialog/DialogController.js)

Manages dialog interactions and focus management.

**Properties:**
- `lastFocusedElement` - Element that had focus before dialog opened
- `dialogs` - Collection of open dialogs
- `zIndexBase` - Base z-index for dialogs
- `zIndexIncrement` - Z-index increment for stacking
- `focusTrap` - Focus trap for modal dialogs
- `templates` - Registered dialog templates

**Methods:**
- `constructor()` - Initialize controller
- `openDialog(type, options)` - Open a dialog
- `closeDialog(id)` - Close a dialog and restore focus
- `closeAllDialogs(skipAnimation)` - Close all dialogs
- `trapFocus(dialog)` - Trap focus within dialog
- `restoreFocus()` - Restore focus to previous element
- `handleDialogAction(action, data)` - Handle common dialog actions
- `handleOverlayClick(event, dialog)` - Handle overlay click
- `setZIndex(dialog, index)` - Set z-index for a dialog
- `initGlobalEvents()` - Initialize global event listeners
- `registerTemplates()` - Register standard dialog templates
- `destroy()` - Clean up resources
- `getInstance()` - Get singleton instance

#### DialogService Class (core/dialog/DialogService.js)

Manages dialog registration, creation, and lifecycle.

**Properties:**
- `registeredTypes` - Map of registered dialog types
- `activeDialogs` - Map of currently open dialogs
- `lastFocusedElement` - Element focused before dialog opened
- `zIndexCounter` - Counter for dialog z-index values
- `controller` - DialogController instance

**Methods:**
- `register(type, constructor)` - Register a dialog type
- `unregister(type)` - Unregister a dialog type
- `isRegistered(type)` - Check if type is registered
- `getRegisteredTypes()` - Get all registered types
- `createDialog(type, options)` - Create dialog instance
- `showDialog(type, options)` - Show dialog of specified type
- `hideDialog(id)` - Hide a specific dialog
- `hideAll(skipAnimation)` - Hide all open dialogs
- `getDialogById(id)` - Get dialog by ID
- `getDialogsByType(type)` - Get all dialogs of type
- `hasOpenDialogs()` - Check if any dialogs are open
- `getOpenDialogCount()` - Get count of open dialogs
- `bringToFront(id)` - Bring dialog to front
- `updateZIndex(id, zIndex)` - Update dialog z-index
- `getNextZIndex()` - Get next z-index value
- `getInstance()` - Get singleton instance

#### DraggableBehavior Class (core/dialog/behaviors/DraggableBehavior.js)

Makes dialogs draggable by the user.

**Methods:**
- `makeDraggable(dialog, handle, options)` - Make a dialog draggable
- `dragStart(e, dialogElement, handleElement, state)` - Handle drag start
- `drag(e, dialogElement, state)` - Handle drag
- `dragEnd(dialogElement, state)` - Handle drag end
- `savePosition(dialogElement)` - Save dialog position
- `restorePosition(dialogElement)` - Restore dialog position
- `setConstraints(dialogElement, boundingElement)` - Set movement constraints

#### ResizableBehavior Class (core/dialog/behaviors/ResizableBehavior.js)

Makes dialogs resizable by the user.

**Methods:**
- `makeResizable(dialog, options)` - Make a dialog resizable
- `addResizeHandles(dialogElement, state)` - Add resize handles to dialog
- `handleResizeStart(e, dialogElement, direction, state)` - Handle resize start
- `handleResize(e, dialogElement, state)` - Handle resize
- `handleResizeEnd(dialogElement, state)` - Handle resize end
- `saveSize(dialogElement)` - Save dialog size
- `restoreSize(dialogElement)` - Restore dialog size

#### ConfirmationTemplate Class (core/dialog/templates/ConfirmationTemplate.js)

Template for creating confirmation dialogs.

**Methods:**
- `render(options)` - Render confirmation dialog with message
- `formatMessage(message)` - Format message with markdown
- `addButtons(container, confirmText, cancelText, onConfirm, onCancel, showCancel, confirmButtonClass, cancelButtonClass, type)` - Add confirmation buttons
- `createConfirmButton(text, callback, className, type)` - Create styled confirm button
- `createCancelButton(text, callback, className)` - Create styled cancel button

#### GraphSelectionTemplate Class (core/dialog/templates/GraphSelectionTemplate.js)

Template for creating graph selection dialogs.

**Methods:**
- `render(options)` - Render graph selection dialog
- `createGraphItem(graph, isSelected, onSelect, itemClass)` - Create a graph item
- `createSearchBox(container, placeholder)` - Create search box
- `createNewGraphButton(container, callback, buttonText)` - Create new graph button

### Event System

#### EventDelegate Class (core/events/EventDelegate.js)

Provides advanced event handling with support for delegation, throttling, and debouncing.

**Methods:**
- `addEventListenerWithCleanup(element, eventType, handler, options)` - Add event listener with cleanup
- `delegate(element, eventType, selector, handler)` - Delegate events to child elements
- `multiEvent(element, eventTypes, handler, options)` - Listen for multiple event types
- `once(element, eventType, handler, options)` - One-time event listener
- `passive(element, eventType, handler)` - Create passive event listener
- `handleClickOutside(element, callback)` - Handle clicks outside element
- `debounce(func, wait, immediate)` - Create debounced function
- `throttle(func, limit)` - Create throttled function
- `createObservable(target)` - Create observable object
- `set(obj, prop, value)` - Proxy setter for observable objects

#### EventManagerFactory Class (core/factories/EventManagerFactory.js)

Factory for creating event management systems.

**Methods:**
- `createEventSystem(options)` - Create event system with all components
  - Creates EventBus instance
  - Sets up error handling and monitoring
  - Configures performance tracking if requested
  - Returns complete event system ready for application use
- `createCompatibilityFacade(EventBus)` - Create backward compatibility facade
  - Wraps enhanced EventBus in a simpler interface
  - Maintains compatibility with legacy code
  - Translates between old and new event formats
- `upgradeEventBus(legacyEventBus, errorHandler)` - Upgrade legacy event bus
  - Preserves existing subscriptions
  - Adds enhanced functionality
  - Incorporates error handling

### Panel System

#### BasePanelComponent Class (core/panel/BasePanelComponent.js)

Base class for panel components with expansion/collapse functionality.

**Properties:**
- `panelType` - Type of panel (workflow, conversation, etc.)
- `panelElement` - DOM element for panel
- `panelSelector` - CSS selector for panel
- `initialExpanded` - Whether panel starts expanded
- `isExpanded` - Current expansion state
- `stateManager` - State manager for panel state
- `themeManager` - Theme manager reference

**Methods:**
- `constructor(options)` - Create panel with options
- `initialize()` - Initialize the panel component
- `destroy()` - Clean up resources
- `findDOMElements()` - Find DOM elements needed by panel
- `setupEventListeners()` - Set up event listeners
- `subscribeToEvents()` - Subscribe to events
- `expandPanel()` - Expand the panel
- `collapsePanel()` - Collapse the panel
- `togglePanel()` - Toggle panel expansion state
- `isExpanded()` - Check if panel is expanded
- `isCollapsed()` - Check if panel is collapsed
- `getPanelElement()` - Get the panel DOM element
- `handlePanelStateChanged(data)` - Handle panel state changed event
- `applyPanelState()` - Apply the current panel state to DOM
- `updateToggleIndicator()` - Update toggle indicator in panel title
- `applyThemeStyling()` - Apply theme styling to panel
- `updateThemeState()` - Update theme manager state with current panel state

#### DraggablePanelManager Class (core/panel/DraggablePanelManager.js)

Manages draggable panels in the interface.

**Properties:**
- `container` - Container element for panels
- `panels` - Map of panel objects by ID
- `zIndexCounter` - Counter for z-index values
- `onPositionChange` - Callback when panel position changes
- `onResize` - Callback when panel is resized

**Methods:**
- `constructor(options)` - Create manager with options
- `createPanel(options)` - Create a draggable panel
- `closePanel(id)` - Close a panel
- `getPanel(id)` - Get a panel by ID
- `bringToFront(id)` - Bring panel to front
- `handleMouseDown(e, panel)` - Handle mouse down for dragging
- `destroy()` - Clean up resources

### DOM Utilities

#### Selectors Class (core/dom/Selectors.js)

Registry of CSS selectors for use throughout the application.

**Properties:**
- `selectors` - Map of selectors by category and key

**Methods:**
- `constructor()` - Initialize registry
- `register(category, definitions)` - Register selectors for category
- `registerDefaults()` - Register default selectors
- `get(key)` - Get a selector by key
- `has(key)` - Check if selector key exists
- `find(key)` - Find element using selector key
- `findAll(key)` - Find all elements using selector key
- `getAll()` - Get all registered selectors
- `getCategory(category)` - Get all selectors for category
- `getKeys()` - Get all selector keys

### State Management

#### StateManager Class (core/state/StateManager.js)

Manages application state with change tracking and persistence.

**Properties:**
- `initialState` - Initial application state
- `currentState` - Current application state
- `history` - State change history
- `subscribers` - Subscribers to state changes
- `storageKey` - Key for localStorage persistence
- `persistState` - Whether to persist state to localStorage

**Methods:**
- `constructor(options)` - Create manager with options
- `initialize()` - Initialize state manager
- `getState()` - Get current application state
- `setState(newState, options)` - Update application state
- `subscribe(path, callback)` - Subscribe to state changes
- `unsubscribe(path, callback)` - Unsubscribe from state changes
- `saveState()` - Save state to localStorage
- `loadState()` - Load state from localStorage
- `resetState()` - Reset state to initial values
- `getHistoryForPath(path)` - Get history for specific path
- `applyMiddleware(middleware)` - Apply middleware to state changes

### Theme System

#### ThemeRegistry Class (core/theme/ThemeRegistry.js)

Registry of available themes and theme components.

**Properties:**
- `themes` - Map of registered themes
- `components` - Map of theme components
- `activeTheme` - Currently active theme
- `defaultTheme` - Default theme ID

**Methods:**
- `constructor(options)` - Create registry with options
- `initialize()` - Initialize theme registry
- `registerTheme(themeId, theme)` - Register a theme
- `unregisterTheme(themeId)` - Unregister a theme
- `getTheme(themeId)` - Get a theme by ID
- `getAllThemes()` - Get all registered themes
- `setActiveTheme(themeId)` - Set the active theme
- `getActiveTheme()` - Get the active theme
- `registerComponent(componentId, component)` - Register a theme component
- `getComponent(componentId)` - Get a theme component

#### ThemeService Class (core/theme/ThemeService.js)

Service for managing theme application and switching.

**Properties:**
- `registry` - ThemeRegistry instance
- `state` - ThemeState instance
- `eventBus` - Event bus for pub/sub
- `animationController` - Animation controller for transitions

**Methods:**
- `constructor(options)` - Create service with options
- `initialize()` - Initialize theme service
- `applyTheme(themeId, options)` - Apply a theme
- `getCurrentTheme()` - Get current theme
- `getThemeProperty(property, defaultValue)` - Get theme property
- `updateThemeVariable(variable, value)` - Update CSS variable
- `getThemeVariables()` - Get all theme CSS variables
- `toggleDarkMode()` - Toggle between light and dark modes
- `isDarkMode()` - Check if dark mode is active
- `subscribeToChanges(callback)` - Subscribe to theme changes
- `applyThemeToElement(element, themeId)` - Apply theme to specific element
- `getInstance()` - Get singleton instance

#### ThemeState Class (core/theme/ThemeState.js)

Manages theme state and user preferences.

**Properties:**
- `preferences` - User theme preferences
- `systemPreferences` - System theme preferences
- `activeTheme` - Currently active theme
- `darkMode` - Whether dark mode is active
- `themeVariables` - Custom theme variables
- `featureFlags` - Theme feature flags

**Methods:**
- `constructor(options)` - Create state with options
- `initialize()` - Initialize theme state
- `getPreference(key, defaultValue)` - Get user preference
- `setPreference(key, value)` - Set user preference
- `getSystemPreference(key)` - Get system preference
- `detectSystemPreferences()` - Detect system theme preferences
- `savePreferences()` - Save preferences to localStorage
- `loadPreferences()` - Load preferences from localStorage
- `setDarkMode(enabled)` - Set dark mode state
- `isDarkMode()` - Check if dark mode is active
- `getActiveTheme()` - Get active theme
- `setActiveTheme(themeId)` - Set active theme
- `resetToDefaults()` - Reset preferences to defaults

### Model Registry

#### ModelRegistry Class (models/ModelRegistry.js)

Manages information about available AI models and their settings.

**Properties:**
- `apiClient` - API client for server communications
- `eventBus` - Event bus for publish/subscribe
- `models` - Available models by backend
- `modelLimits` - Limits and capabilities of models
- `lastFetchTime` - Timestamp of last model fetch
- `fetchPromise` - Current fetch promise if active
- `recommendedModels` - Cache of recommended models by use case
- `modelCapabilityMap` - Map of model capabilities

**Methods:**
- `initialize()` - Initialize the model registry
- `fetchAvailableModels()` - Fetch available models from the API
  - Uses `get_available_models()` API
  - Processes and normalizes model data
  - Caches results for future use
  - Emits events on completion
- `fetchModelLimits()` - Fetch model limits from the API
  - Uses `get_groq_model_limits()` API
  - Processes limit information for UI use
  - Updates local cache
  - Emits events when limits change
- `refreshModels()` - Refresh the available models
- `getAllModels()` - Get all available models
- `getModelsForBackend(backend)` - Get models for specific backend
- `getModelLimits(model)` - Get limits for specific model
- `isModelAvailable(backend, model)` - Check if model is available
- `getOptimalSettings(backend, model)` - Get optimal settings for model
- `getRecommendedModels(useCase)` - Get recommended models for use case
- `getModelCapabilities(backend, model)` - Get detailed model capabilities
- `estimateCostForRequest(backend, model, inputTokens, outputTokens)` - Estimate cost for request
- `getModelContextWindow(backend, model)` - Get context window size for model
- `getModelThroughput(backend, model)` - Get throughput metrics for model
- `isVisionCapable(backend, model)` - Check if model supports vision
- `isCodingOptimized(backend, model)` - Check if model is optimized for coding

### Graph System

#### GraphManager Class (graph/GraphManager.js)

The central coordinator for all graph operations.

**Properties:**
- `apiClient` - API client for server communication
- `eventBus` - Event bus for publish/subscribe
- `storageManager` - StorageManager instance
- `currentGraphId` - ID of the current graph
- `currentGraphName` - Name of the current graph
- `isModified` - Flag for unsaved changes
- `cytoscapeManager` - CytoscapeManager instance
- `nodeManager` - NodeManager instance
- `edgeManager` - EdgeManager instance
- `graphStorage` - GraphStorage instance
- `layoutManager` - GraphLayoutManager instance

**Methods:**
- `initialize()` - Initialize the graph manager and all sub-managers
- `subscribeToEvents()` - Subscribe to required events
- `markAsModified()` - Mark the current graph as modified
- `clearModifiedFlag()` - Clear the modified flag
- `getCurrentGraphId()` - Get the current graph ID
- `getCurrentGraphName()` - Get the current graph name
- `hasUnsavedChanges()` - Check if current graph has unsaved changes
- `setCurrentGraph(id, name)` - Set the current graph details
- `exportGraph()` - Export the current graph to a data object
- `importGraph(graphData)` - Import a graph from a data object
- `clearGraph()` - Clear the graph
- `saveGraph(name, description, forceNew)` - Save the current graph to the server
- `loadGraphById(graphId)` - Load a graph by ID from the server
- `getAvailableGraphs()` - Get all available graphs from the server
- `deleteGraph(graphId)` - Delete a graph from the server
- `resetDatabase()` - Reset the database (admin function)
- `visualizeWorkflowExecution(executionOrder, results)` - Visualize workflow execution
- `highlightCycles(cycles)` - Highlight cycles in the graph
- `clearWorkflowVisualization()` - Clear workflow visualization styles

#### CytoscapeManager Class (graph/CytoscapeManager.js)

Manages the Cytoscape.js graph visualization library.

**Properties:**
- `graphManager` - Parent GraphManager instance
- `cy` - Cytoscape instance
- `cyContainer` - DOM container for Cytoscape
- `styleDefinition` - Graph style definition
- `eventHandlers` - Registered Cytoscape event handlers
- `renderFix` - CytoscapeRenderFix instance for performance
- `themeManager` - ThemeManager integration for styling
- `interactionMode` - Current interaction mode (default, edge-drawing, etc.)
- `selectedElements` - Currently selected elements
- `dragStartPosition` - Position where drag started
- `lastPanPosition` - Last pan position
- `lastZoomLevel` - Last zoom level

**Methods:**
- `initialize()` - Initialize the Cytoscape instance
- `setupEventListeners()` - Set up event listeners for the Cytoscape instance
- `getGraphStyle()` - Get the graph style definition for Cytoscape
- `addNode(id, data, classes, position)` - Add a node to the Cytoscape instance
- `findNode(nodeId)` - Find a node in the Cytoscape instance
- `addEdge(id, sourceId, targetId)` - Add an edge between nodes
- `findEdge(edgeId)` - Find an edge in the Cytoscape instance
- `removeElement(id)` - Remove an element (node or edge) from Cytoscape
- `clearAll()` - Clear all elements from the Cytoscape instance
- `getAllNodeElements()` - Get all current nodes as Cytoscape collection
- `getAllEdgeElements()` - Get all current edges as Cytoscape collection
- `findConnectedEdges(nodeId, direction)` - Find edges connecting to a node
- `selectNode(nodeId)` - Select a node
- `clearSelection()` - Clear selection
- `highlightPath(nodeIds, className)` - Highlight a path in the graph
- `zoomToFit(padding)` - Zoom to fit all elements
- `centerOn(elementId)` - Center view on specific element
- `enableEdgeDrawing(sourceNodeId)` - Enable edge drawing mode
- `disableEdgeDrawing()` - Disable edge drawing mode
- `getScreenshot(options)` - Get screenshot of current graph
- `exportImage(format, quality)` - Export graph as image
- `freezeGraph()` - Temporarily freeze graph interactions
- `unfreezeGraph()` - Unfreeze graph interactions
- `applyNodeStyle(nodeId, style)` - Apply custom style to node
- `applyEdgeStyle(edgeId, style)` - Apply custom style to edge
- `resetStyles()` - Reset all custom styles
- `updateTheme(theme)` - Update graph with theme styles

## Backend API Function Details

### Model Management Endpoints

```python
@app.route('/api/models', methods=['GET'])
def get_available_models():
    """
    Get available models from all providers.
    
    Response:
    {
        "groq": [
            {
                "id": "llama3-8b-8192",
                "display_name": "Llama3 8B",
                "context_length": 8192,
                "model_family": "llama3",
                "provider": "groq",
                "capabilities": ["text-generation", "chat"],
                "supports_tools": false
            },
            // Additional models...
        ],
        "ollama": [
            {
                "id": "llama3",
                "display_name": "Llama3",
                "provider": "ollama",
                "capabilities": ["text-generation", "chat"],
                "local": true
            },
            // Additional models...
        ]
    }
    """
    try:
        # Get models from the model service
        models = model_service.get_available_models()
        return jsonify(models)
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/groq/model-limits', methods=['GET'])
def get_groq_model_limits():
    """
    Get rate limits and capabilities for Groq models.
    
    Response:
    {
        "llama3-8b-8192": {
            "tokens_per_minute": 2000000,
            "max_context_length": 8192,
            "supports_vision": false,
            "pricing": {
                "input_per_million_tokens": 0.125,
                "output_per_million_tokens": 0.375
            },
            "optimal_settings": {
                "temperature": 0.7,
                "top_p": 0.95
            }
        },
        // Additional model limits...
    }
    """
    try:
        # Get model limits from the model service
        limits = model_service.get_groq_model_limits()
        return jsonify(limits)
    except Exception as e:
        logger.error(f"Error fetching Groq model limits: {str(e)}")
        return jsonify({"error": str(e)}), 500
```

### Model Service Implementation

```python
class ModelService:
    """Service for managing AI models."""
    
    def __init__(self, ai_factory):
        """
        Initialize the model service.
        
        Args:
            ai_factory: Factory for creating AI provider instances
        """
        self.ai_factory = ai_factory
        self.model_cache = {}
        self.model_limits_cache = {}
        self.cache_expiry = 300  # 5 minutes
        self.last_fetch_time = 0
    
    def get_available_models(self):
        """
        Get available models from all providers.
        
        Returns:
            dict: Dictionary containing available models by provider
        """
        current_time = time.time()
        
        # Return cached results if available and not expired
        if self.model_cache and (current_time - self.last_fetch_time) < self.cache_expiry:
            return self.model_cache
        
        models = {}
        
        # Get Groq models
        try:
            groq_provider = self.ai_factory.create_provider("groq")
            models["groq"] = groq_provider.list_models()
        except Exception as e:
            logger.warning(f"Failed to fetch Groq models: {str(e)}")
            models["groq"] = []
        
        # Get Ollama models
        try:
            ollama_provider = self.ai_factory.create_provider("ollama")
            models["ollama"] = ollama_provider.list_models()
        except Exception as e:
            logger.warning(f"Failed to fetch Ollama models: {str(e)}")
            models["ollama"] = []
        
        # Update cache
        self.model_cache = models
        self.last_fetch_time = current_time
        
        return models
    
    def get_groq_model_limits(self):
        """
        Get rate limits and capabilities for Groq models.
        
        Returns:
            dict: Dictionary containing model limits by model name
        """
        current_time = time.time()
        
        # Return cached results if available and not expired
        if self.model_limits_cache and (current_time - self.last_fetch_time) < self.cache_expiry:
            return self.model_limits_cache
        
        limits = {}
        
        try:
            groq_provider = self.ai_factory.create_provider("groq")
            limits = groq_provider.get_model_limits()
        except Exception as e:
            logger.error(f"Failed to fetch Groq model limits: {str(e)}")
            # Fallback to hardcoded values if API fails
            limits = self._get_hardcoded_groq_limits()
        
        # Update cache
        self.model_limits_cache = limits
        
        return limits
    
    def _get_hardcoded_groq_limits(self):
        """Fallback method to provide hardcoded Groq model limits."""
        return {
            "llama3-8b-8192": {
                "tokens_per_minute": 2000000,
                "max_context_length": 8192,
                "supports_vision": False,
                "pricing": {
                    "input_per_million_tokens": 0.125,
                    "output_per_million_tokens": 0.375
                },
                "optimal_settings": {
                    "temperature": 0.7,
                    "top_p": 0.95
                }
            },
            "mixtral-8x7b-32768": {
                "tokens_per_minute": 1800000,
                "max_context_length": 32768,
                "supports_vision": False,
                "pricing": {
                    "input_per_million_tokens": 0.27,
                    "output_per_million_tokens": 0.81
                },
                "optimal_settings": {
                    "temperature": 0.8,
                    "top_p": 0.9
                }
            }
        }
    
    def get_recommended_models(self, use_case):
        """
        Get recommended models for a specific use case.
        
        Args:
            use_case: The use case (e.g., 'chat', 'code', 'creativity')
            
        Returns:
            list: List of recommended models for the use case
        """
        models = self.get_available_models()
        recommendations = []
        
        # Define use case mappings
        use_case_models = {
            "chat": ["llama3-8b-8192", "mixtral-8x7b-32768"],
            "code": ["claude-3-opus-20240229", "llama3-70b-8192"],
            "creativity": ["gpt-4o", "claude-3-opus-20240229"],
            "reasoning": ["mixtral-8x7b-32768", "llama3-70b-8192"],
            "default": ["llama3-8b-8192"]
        }
        
        # Get list of models for the use case, or default if not found
        target_models = use_case_models.get(use_case, use_case_models["default"])
        
        # Filter available models to match recommended ones
        for provider, provider_models in models.items():
            for model in provider_models:
                if model["id"] in target_models:
                    recommendations.append({
                        "provider": provider,
                        "id": model["id"],
                        "display_name": model.get("display_name", model["id"]),
                        "context_length": model.get("context_length", 4096)
                    })
        
        return recommendations
# Super-Extended Component Relationship Diagram for AI Canvas

## Full System Integration Flow

```
┌────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ index.html  │  │   run.py    │  │git-server/  │     │
│  │(Browser EP) │  │(Backend EP) │  │index.ts     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼───────────────┼───────────────┼──────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             INITIALIZATION FLOW                          │
│                                                                         │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐         │
│  │UIManager.js │        │app/__init__.py│      │Git Server   │         │
│  │initialize() ├───────►│create_app()  ├─────►│Initialization│         │
│  └──────┬──────┘        └──────┬──────┘       └──────┬──────┘          │
│         │                      │                     │                  │
│         ▼                      ▼                     ▼                  │
│  ┌─────────────┐        ┌─────────────┐       ┌─────────────┐          │
│  │Event System │        │Route Registry│      │Repository   │          │
│  │Initialization│       │& Middleware │      │Initialization│          │
│  └──────┬──────┘        └──────┬──────┘       └─────────────┘          │
│         │                      │                                        │
│         ▼                      ▼                                        │
│  ┌─────────────┐        ┌─────────────┐                                │
│  │Core Services│        │Service      │                                │
│  │Registration │        │Initialization│                               │
│  └──────┬──────┘        └──────┬──────┘                                │
│         │                      │                                        │
│         ▼                      ▼                                        │
│  ┌─────────────┐        ┌─────────────┐                                │
│  │Theme System │        │DB Connection │                                │
│  │Initialization│       │Setup        │                                │
│  └──────┬──────┘        └─────────────┘                                │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐                                                        │
│  │Graph System │                                                        │
│  │Initialization│                                                       │
│  └──────┬──────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐                                                        │
│  │Workflow     │                                                        │
│  │Initialization│                                                       │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          CORE EVENT SYSTEM                              │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ EventBusService.js  │            │ EventDelegate.js    │            │
│  │                     │◄───────────┤                     │            │
│  │ - publish()         │            │ - delegate()        │            │
│  │ - subscribe()       │            │ - multiEvent()      │            │
│  │ - unsubscribe()     │            │ - once()            │            │
│  │ - getEventHistory() │            │ - debounce()        │            │
│  │ - clearHistory()    │            │ - throttle()        │            │
│  └─────────┬───────────┘            └────────────┬────────┘            │
│            │                                     │                      │
│            │                                     │                      │
│            ▼                                     ▼                      │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ ErrorHandling       │            │ EventManagerFactory │            │
│  │ Behavior.js         │            │                     │            │
│  │                     │◄───────────┤ - createEventSystem()│           │
│  │ - handleError()     │            │ - upgradeEventBus() │            │
│  │ - logError()        │            └─────────────────────┘            │
│  │ - showErrorNotif()  │                                               │
│  └─────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       DIALOG & COMPONENT SYSTEM                         │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ DialogService.js    │            │ BaseDialog.js       │            │
│  │                     │◄───────────┤                     │            │
│  │ - register()        │            │ - show()            │            │
│  │ - createDialog()    │            │ - hide()            │            │
│  │ - showDialog()      │            │ - setContent()      │            │
│  │ - hideDialog()      │            │ - setPosition()     │            │
│  │ - bringToFront()    │            │ - addClass()        │            │
│  └─────────┬───────────┘            └────────────┬────────┘            │
│            │                                     │                      │
│            │                                     │                      │
│            ▼                                     ▼                      │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ DialogController.js │            │ Dialog Templates     │            │
│  │                     │◄───────────┤                     │            │
│  │ - openDialog()      │            │ - ConfirmationTpl   │            │
│  │ - closeDialog()     │            │ - GraphSelectionTpl │            │
│  │ - trapFocus()       │            │ - CustomDialogTpl   │            │
│  │ - handleAction()    │            └─────────────────────┘            │
│  └─────────┬───────────┘                                               │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ Dialog Behaviors    │            │ BaseComponent.js    │            │
│  │                     │◄───────────┤                     │            │
│  │ - DraggableBehavior │            │ - initialize()      │            │
│  │ - ResizableBehavior │            │ - render()          │            │
│  │ - ModalBehavior     │            │ - addBehavior()     │            │
│  └─────────────────────┘            │ - setState()        │            │
│                                     └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        THEME SYSTEM                                     │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ ThemeService.js     │            │ ThemeRegistry.js    │            │
│  │                     │◄───────────┤                     │            │
│  │ - applyTheme()      │            │ - registerTheme()   │            │
│  │ - getCurrentTheme() │            │ - getTheme()        │            │
│  │ - getThemeProperty()│            │ - getAllThemes()    │            │
│  │ - toggleDarkMode()  │            │ - setActiveTheme()  │            │
│  │ - isDarkMode()      │            │ - registerComponent()│           │
│  └─────────┬───────────┘            └────────────┬────────┘            │
│            │                                     │                      │
│            │                                     │                      │
│            ▼                                     ▼                      │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ ThemeState.js       │            │ Theme Presets        │            │
│  │                     │◄───────────┤                     │            │
│  │ - getPreference()   │            │ - BaseTheme.js      │            │
│  │ - setPreference()   │            │ - DarkTheme.js      │            │
│  │ - isDarkMode()      │            │ - LightTheme.js     │            │
│  │ - setActiveTheme()  │            │ - CustomTheme.js    │            │
│  └─────────┬───────────┘            └────────────┬────────┘            │
│            │                                     │                      │
│            │                                     │                      │
│            ▼                                     ▼                      │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ BackgroundManager.js│            │ AnimationController │            │
│  │                     │◄───────────┤                     │            │
│  │ - setBackground()   │            │ - animate()         │            │
│  │ - createParticles() │            │ - transition()      │            │
│  │ - animateBackground()            │ - fadeIn()          │            │
│  │ - applyTheme()      │            │ - fadeOut()         │            │
│  └─────────────────────┘            └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             GRAPH SYSTEM                                │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ GraphManager.js     │            │ CytoscapeManager.js │            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - initialize()      │            │
│  │ - markAsModified()  │            │ - setupEventListen()│            │
│  │ - exportGraph()     │            │ - addNode()         │            │
│  │ - importGraph()     │            │ - addEdge()         │            │
│  │ - saveGraph()       │            │ - findNode()        │            │
│  │ - loadGraphById()   │            │ - selectNode()      │            │
│  │ - getAvailableGraphs()           │ - highlightPath()   │            │
│  └─────────┬───────────┘            └────────────┬────────┘            │
│            │                                     │                      │
│            │                                     │                      │
│            ▼                                     ▼                      │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ NodeManager.js      │            │ CytoscapeRenderFix  │            │
│  │                     │◄───────────┤                     │            │
│  │ - addNode()         │            │ - applyFix()        │            │
│  │ - updateNode()      │            │ - optimizeRendering()            │
│  │ - removeNode()      │            │ - handleLargeGraphs()            │
│  │ - getNodeData()     │            └─────────────────────┘            │
│  │ - getSelectedNodeId()                                               │
│  └─────────┬───────────┘                                               │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ EdgeManager.js      │            │ GraphLayoutManager  │            │
│  │                     │◄───────────┤                     │            │
│  │ - addEdge()         │            │ - runLayout()       │            │
│  │ - removeEdge()      │            │ - arrangeInCircle() │            │
│  │ - getEdgeById()     │            │ - arrangeHierarchical()          │
│  │ - getEdgesForNode() │            │ - applyNodePositions()           │
│  │ - wouldCreateCycle()│            │ - centerGraph()     │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐                                               │
│  │ GraphStorage.js     │                                               │
│  │                     │                                               │
│  │ - saveGraph()       │                                               │
│  │ - loadGraphById()   │                                               │
│  │ - getAvailableGraphs()                                              │
│  │ - deleteGraph()     │                                               │
│  │ - exportToJson()    │                                               │
│  │ - importFromJson()  │                                               │
│  └─────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          UI SYSTEM                                      │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ UIManager.js        │            │ NotificationManager │            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - showNotification()│            │
│  │ - destroy()         │            │ - showError()       │            │
│  │ - findDOMElements() │            │ - showSuccess()     │            │
│  │ - showNotification()│            │ - clearNotifications()           │
│  │ - openNodeChat()    │            └─────────────────────┘            │
│  └─────────┬───────────┘                                               │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ BaseManager.js      │            │ DOMElementRegistry  │            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - register()        │            │
│  │ - destroy()         │            │ - get()             │            │
│  │ - setupEventListeners()          │ - find()            │            │
│  │ - subscribeToEvents()            │ - findAll()         │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ ConversationPanel   │            │ NodeModalManager    │            │
│  │ Manager.js          │◄───────────┤                     │            │
│  │                     │            │ - showNodeModal()   │            │
│  │ - showConversation()│            │ - createNodeModal() │            │
│  │ - appendMessage()   │            │ - showEditModal()   │            │
│  │ - clearConversation()            │ - validateForm()    │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ GraphControlsManager│            │ NodeOperationsManager            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - updateNodeOps()   │            │
│  │ - setupControls()   │            │ - addOperationButton()           │
│  │ - showControl()     │            │ - startEdgeDrawingMode()         │
│  │ - hideControl()     │            │ - showEdgeRemoveButton()         │
│  └─────────────────────┘            └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW SYSTEM                               │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ WorkflowManager.js  │            │ CycleDetector.js    │            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - detectCycles()    │            │
│  │ - executeWorkflow() │            │ - wouldCreateCycle()│            │
│  │ - resetExecState()  │            │ - breakCycles()     │            │
│  │ - validateWorkflow()│            │ - findCyclesForNode()            │
│  │ - getWorkflowSuggestions()       │ - getEdgeWeights()  │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ TopologicalSorter.js│            │ ExecutionEngine.js  │            │
│  │                     │◄───────────┤                     │            │
│  │ - computeTopoSort() │            │ - executeWorkflow() │            │
│  │ - topoSortUtil()    │            │ - executeNode()     │            │
│  │ - isValidForSort()  │            │ - collectNodeInputs()            │
│  │ - getSourceNodes()  │            │ - handleNodeResult()│            │
│  │ - getSinkNodes()    │            │ - handleExecError() │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ WorkflowValidator.js│            │ WorkflowVisualizer.js            │
│  │                     │◄───────────┤                     │            │
│  │ - validateWorkflow()│            │ - visualizePath()   │            │
│  │ - getWorkflowSuggest()           │ - highlightNode()   │            │
│  │ - validateNode()    │            │ - showNodeState()   │            │
│  │ - validateEdge()    │            │ - showExecutionProgress()        │
│  │ - checkForIsolated()│            │ - clearVisualization()           │
│  └─────────────────────┘            └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          MODEL SYSTEM                                   │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ ModelRegistry.js    │            │ /api/models         │            │
│  │                     │◄───────────┤                     │            │
│  │ - initialize()      │            │ - get_available_models()         │
│  │ - fetchAvailModels()│            │ - GET /api/models   │            │
│  │ - fetchModelLimits()│            │ - Returns all models│            │
│  │ - refreshModels()   │            │   organized by      │            │
│  │ - getAllModels()    │            │   provider          │            │
│  │ - getModelLimits()  │            └─────────────────────┘            │
│  └─────────┬───────────┘                                               │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ get_groq_model_limits()          │ /api/groq/model-limits           │
│  │                     │◄───────────┤                     │            │
│  │ - Fetches Groq model│            │ - GET /api/groq/    │            │
│  │   limit information │            │   model-limits      │            │
│  │ - Updates modelLimits│           │ - Returns detailed  │            │
│  │   in ModelRegistry  │            │   model capabilities│            │
│  │ - Used for optimizing│           │   and rate limits   │            │
│  │   prompt generation │            └─────────────────────┘            │
│  └─────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API FLOW                               │
│                                                                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ API Client (front)  │            │ Backend Controllers │            │
│  │                     │─────────────────────────────────►│            │
│  │ - fetchModels()     │            │ - ChatController    │            │
│  │ - fetchModelLimits()│            │ - EdgeController    │            │
│  │ - saveGraph()       │            │ - ExecuteController │            │
│  │ - loadGraph()       │            │ - GraphController   │            │
│  │ - executeWorkflow() │            │ - ModelsController  │            │
│  │ - chatWithNode()    │            │ - NodeController    │            │
│  └─────────────────────┘            └─────────┬───────────┘            │
│                                               │                         │
│                                               │                         │
│                                               ▼                         │
│  ┌─────────────────────┐            ┌─────────────────────┐            │
│  │ Domain Services     │            │ AI Providers        │            │
│  │                     │◄───────────┤                     │            │
│  │ - ChatService       │            │ - GroqProvider      │            │
│  │ - EdgeService       │            │ - OllamaProvider    │            │
│  │ - GraphService      │            │ - Base Provider     │            │
│  │ - ModelService      │            │                     │            │
│  │ - NodeService       │            │                     │            │
│  │ - WorkflowService   │            │                     │            │
│  └─────────┬───────────┘            └─────────────────────┘            │
│            │                                                            │
│            │                                                            │
│            ▼                                                            │
│  ┌─────────────────────┐                                               │
│  │ Repositories        │                                               │
│  │                     │                                               │
│  │ - ConversationRepo  │                                               │
│  │ - EdgeRepository    │                                               │
│  │ - GraphRepository   │                                               │
│  │ - MessageRepository │                                               │
│  │ - NodeRepository    │                                               │
│  └─────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      COMMON REPEATED PATTERNS                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ 1. INITIALIZATION PATTERN                                    │       │
│  │    * initialize() -> subscribeToEvents() -> setupEventListeners()    │
│  │    * Repeated in most manager classes                        │       │
│  │    * Ensures proper initialization order                     │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ 2. EVENT HANDLING PATTERN                                    │       │
│  │    * Events from DOM -> EventDelegate -> EventBus -> Handlers │      │
│  │    * Consistent across UI interactions                       │       │
│  │    * Ensures loose coupling between components               │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ 3. DATA FETCH PATTERN                                        │       │
│  │    * Check cache -> If expired -> Fetch API -> Update cache  │       │
│  │    * Used in ModelRegistry and other data services           │       │
│  │    * Optimizes performance and reduces API calls             │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ 4. GRAPH OPERATION PATTERN                                   │       │
│  │    * Action -> GraphManager -> Specific Manager -> CytoscapeManager│ │
│  │    * Ensures data consistency across all representations      │       │
│  │    * Centralizes state management                            │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ 5. WORKFLOW EXECUTION PATTERN                                │       │
│  │    * validate -> detectCycles -> topologicalSort -> execute  │       │
│  │    * Ensures correct execution order and validation          │       │
│  │    * Consistent error handling                               │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Function Call Flow for Key Operations

### Model Retrieval Flow

```
get_available_models() Call Flow:
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ModelRegistry.js    │      │ API Client          │      │ ModelsController.py │
│ fetchAvailableModels│─────►│ fetchModels()       │─────►│ get_available_models│
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ModelRegistry.js    │      │ API Client          │      │ ModelService.py     │
│ processModelData()  │◄─────┤ processResponse()   │◄─────┤ get_available_models│
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │ AI Providers        │
                                                           │ - groq_provider.list_models()
                                                           │ - ollama_provider.list_models()
                                                           └─────────────────────┘
```

### Groq Model Limits Flow

```
get_groq_model_limits() Call Flow:
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ModelRegistry.js    │      │ API Client          │      │ ModelsController.py │
│ fetchModelLimits()  │─────►│ fetchGroqModelLimits│─────►│ get_groq_model_limits
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ModelRegistry.js    │      │ API Client          │      │ ModelService.py     │
│ processLimitData()  │◄─────┤ processResponse()   │◄─────┤ get_groq_model_limits
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │ GroqProvider.py     │
                                                           │ get_model_limits()  │
                                                           └─────────────────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │ Fallback if API fails
                                                           │ _get_hardcoded_groq_limits()
                                                           └─────────────────────┘
```

### Graph Creation and Visualization Flow

```
Create Node Flow:
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ UI (Dialog)         │      │ NodeManager.js      │      │ API Client          │
│ createNode modal    │─────►│ addNode()           │─────►│ createNode()        │
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ CytoscapeManager.js │      │ NodeController.py   │
                             │ addNode()           │      │ create_node()       │
                             └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ GraphManager.js     │      │ NodeService.py      │
                             │ markAsModified()    │      │ create_node()       │
                             └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │ NodeRepository.py   │
                                                           │ create()            │
                                                           └─────────────────────┘
```

### Workflow Execution Flow

```
Workflow Execution Flow:
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ WorkflowPanelManager│      │ WorkflowManager.js  │      │ WorkflowValidator.js│
│ executeWorkflow()   │─────►│ executeWorkflow()   │─────►│ validateWorkflow()  │
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ CycleDetector.js    │      │ API Client          │
                             │ detectCycles()      │      │ executeWorkflow()   │
                             └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ TopologicalSorter.js│      │ ExecuteController.py│
                             │ computeTopoSort()   │      │ execute_workflow()  │
                             └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ ExecutionEngine.js  │      │ WorkflowService.py  │
                             │ executeWorkflow()   │      │ execute_workflow()  │
                             └─────────────────────┘      └──────────┬──────────┘
                                    │                                 │
                                    ▼                                 ▼
                             ┌─────────────────────┐      ┌─────────────────────┐
                             │ WorkflowVisualizer.js      │ For each node in order:
                             │ visualizeExecution()│      │ execute_node()      │
                             └─────────────────────┘      └─────────────────────┘
```

### Chat with Node Flow

```
Chat with Node Flow:
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ConversationPanel   │      │ API Client          │      │ ChatController.py   │
│ sendMessage()       │─────►│ chatWithNode()      │─────►│ chat_with_node()    │
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ ConversationPanel   │      │ Stream Processor    │      │ ChatService.py      │
│ appendResponseChunk()◄─────┤ processStreamChunk()◄─────┤ chat_with_node()    │
└─────────────────────┘      └─────────────────────┘      └──────────┬──────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │ AI Provider         │
                                                           │ send_chat_request() │
                                                           └─────────────────────┘
```