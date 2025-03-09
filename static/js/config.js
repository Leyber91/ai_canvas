/**
 * config.js
 * 
 * Central configuration file for the AI Canvas application.
 * Different environments can be supported through build flags.
 */

// Determine environment
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
const isDevelopment = !isProduction;

// Base configuration
export const config = {
  // Application info
  appName: 'AI Canvas',
  version: '1.0.0',

  // Environment settings
  debug: isDevelopment,
  environment: isProduction ? 'production' : 'development',

  // API settings
  apiBaseUrl: '/api',
  apiTimeout: 30000, // 30 seconds
  maxConcurrentRequests: 5,

  // Storage settings
  storage: {
    prefix: 'aiCanvas_',
    version: '1.0'
  },

  // Graph settings
  graph: {
    defaultLayout: 'cose',
    autoSave: true,
    autoSaveInterval: 60000, // 1 minute
    nodeColors: {
      ollama: '#3498db', // Blue
      groq: '#9b59b6'    // Purple
    }
  },

  // Model settings
  models: {
    ollama: {
      defaultModel: 'llama3',
      defaultTemperature: 0.7,
      defaultMaxTokens: 1024
    },
    groq: {
      defaultModel: 'mixtral-8x7b-32768',
      defaultTemperature: 0.7,
      defaultMaxTokens: 1024
    },
    fallbackModels: {
      ollama: ['llama3', 'llama2', 'mistral'],
      groq: [
        'deepseek-r1-distill-llama-70b',
        'deepseek-r1-distill-llama-32b',
        'mixtral-8x7b-32768',
        'qwen-2.5-32b',
        'qwen-2.5-coder-32b'
      ]
    }
  },

  // UI settings
  ui: {
    theme: 'light',
    autoRefresh: true,
    messageFormatting: true,
    modalAnimations: true,
    notificationDuration: 3000 // 3 seconds
  },

  // Feature flags
  features: {
    autoSave: true,
    localStorage: true,
    streaming: true,
    markdownSupport: true,
    exportConversations: true,
    userAuth: false, // For future implementation
    teamSharing: false // For future implementation
  },

  // Error handling settings
  errors: {
    logToConsole: true,
    reportToServer: false, // Future feature
    maxErrors: 100 // Maximum number of errors to keep in history
  },

  // Event bus settings
  events: {
    debugMode: isDevelopment,
    maxHistoryLength: 100
  },

  // Workflow settings
  workflow: {
    // Whether cycles in the workflow are allowed.
    allowCycles: false,
    // How to handle cycles: 'stop' (default, disallow cycles), 'iterate', or 'unwrap'.
    cycleHandlingMode: 'stop',
    // Maximum iterations for cycles when cycle handling is set to 'iterate'.
    maxCycleIterations: 3,
    // Maximum total iterations allowed for workflow execution.
    maxTotalIterations: 50,
    // Global execution timeout for workflows (in seconds).
    timeoutSeconds: 60
  }
};

// Export environment-specific values for easy access
export const isDev = isDevelopment;
export const isProd = isProduction;

// Export default settings for specific components
export const defaultNodeSettings = {
  ollama: {
    model: config.models.ollama.defaultModel,
    temperature: config.models.ollama.defaultTemperature,
    maxTokens: config.models.ollama.defaultMaxTokens,
    systemMessage: "You are a helpful AI assistant."
  },
  groq: {
    model: config.models.groq.defaultModel,
    temperature: config.models.groq.defaultTemperature,
    maxTokens: config.models.groq.defaultMaxTokens,
    systemMessage: "You are a helpful AI assistant."
  }
};

// Export utility functions to work with configuration
export const getConfig = (path, defaultValue = null) => {
  const parts = path.split('.');
  let current = config;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current;
};
