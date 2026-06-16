/**
 * models/ModelRegistry.js
 * 
 * Manages the available AI models for different backends
 * and their capabilities.
 */
export class ModelRegistry {
    constructor(apiClient, eventBus) {
      this.apiClient = apiClient;
      this.eventBus = eventBus;
      
      this.availableModels = {
        ollama: [],
        groq: [],
        nvidia: []
      };

      this.modelLimits = {};
      // Capability metadata keyed by model id, e.g. { 'nvidia/...': { reasoning: true } }
      this.modelMetadata = {};

      // Default values for when API is unavailable
      this.fallbackModels = {
        ollama: ['llama3', 'llama2', 'mistral'],
        groq: [
          'llama-3.3-70b-versatile',
          'deepseek-r1-distill-llama-70b',
          'deepseek-r1-distill-qwen-32b',
          'qwen-2.5-32b',
          'qwen-2.5-coder-32b'
        ],
        nvidia: [
          'nvidia/nemotron-3-ultra-550b-a55b',
          'nvidia/llama-3.3-nemotron-super-49b-v1',
          'deepseek-ai/deepseek-r1',
          'qwen/qwq-32b',
          'meta/llama-3.3-70b-instruct'
        ]
      };
    }
    
    /**
     * Initialize the model registry
     */
    async initialize() {
      try {
        await this.fetchAvailableModels();
        await this.fetchModelLimits();
        
        // Publish models loaded event
        this.eventBus.publish('models:loaded', this.availableModels);
      } catch (error) {
        console.error('Error initializing model registry:', error);
        
        // Fall back to default models
        this.availableModels = { ...this.fallbackModels };
        
        // Publish models loaded event with fallback models
        this.eventBus.publish('models:loaded', this.availableModels);
      }
    }
    
    /**
     * Fetch available models from the API
     */
    async fetchAvailableModels() {
      try {
        console.log('Fetching available models...');
        const response = await this.apiClient.get('/models');
        
        console.log('Raw API response:', response);
        
        // Check for response structure to debug
        if (!response || typeof response !== 'object') {
          console.error('Invalid response format from /models API', response);
          throw new Error('Invalid API response format');
        }
        
        // Explicitly check if ollama and groq properties exist
        if (!Array.isArray(response.ollama)) {
          console.warn('API response is missing ollama array:', response);
          // Initialize with empty array rather than undefined
          response.ollama = [];
        }
        
        if (!Array.isArray(response.groq)) {
          console.warn('API response is missing groq array:', response);
          // Initialize with empty array rather than undefined
          response.groq = [];
        }

        if (!Array.isArray(response.nvidia)) {
          console.warn('API response is missing nvidia array:', response);
          response.nvidia = [];
        }

        // Update available models - ensure we always have arrays
        this.availableModels.ollama = response.ollama.length > 0 ?
          response.ollama :
          this.fallbackModels.ollama;

        this.availableModels.groq = response.groq.length > 0 ?
          response.groq :
          this.fallbackModels.groq;

        this.availableModels.nvidia = response.nvidia.length > 0 ?
          response.nvidia :
          this.fallbackModels.nvidia;

        console.log('Available models loaded:', this.availableModels);
        
        // Important: publish event after updating models
        this.eventBus.publish('models:updated', this.availableModels);
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fall back to default models
        this.availableModels = { ...this.fallbackModels };
        
        // Still publish the event with fallback models
        this.eventBus.publish('models:updated', this.availableModels);
      }
    }
    
    /**
     * Fetch model limits from the API (for Groq models)
     */
    async fetchModelLimits() {
      try {
        const modelLimits = await this.apiClient.get('/groq/model-limits');
        this.modelLimits = modelLimits;
        console.log('Groq model limits:', this.modelLimits);
      } catch (error) {
        console.error('Error fetching Groq model limits:', error);
      }

      // NVIDIA capability metadata (reasoning flags). Non-fatal if unavailable.
      try {
        const metadata = await this.apiClient.get('/nvidia/model-metadata');
        if (metadata && typeof metadata === 'object') {
          this.modelMetadata = { ...this.modelMetadata, ...metadata };
          console.log('NVIDIA model metadata:', metadata);
        }
      } catch (error) {
        console.warn('Error fetching NVIDIA model metadata:', error);
      }
    }

    /**
     * Whether a model is a reasoning model (emits a chain-of-thought trace).
     * Uses backend metadata when available, falls back to an id heuristic that
     * also covers DeepSeek-R1 on Groq/Ollama.
     *
     * @param {string} model - Model id
     * @returns {boolean}
     */
    isReasoningModel(model) {
      if (!model) return false;
      if (this.modelMetadata[model] && this.modelMetadata[model].reasoning) {
        return true;
      }
      const low = model.toLowerCase();
      return ['nemotron', 'deepseek-r1', 'qwq', 'gpt-oss', '-r1', 'reason']
        .some(fragment => low.includes(fragment));
    }
    
    /**
     * Get available models for a specific backend
     * 
     * @param {string} backend - Backend name ('ollama' or 'groq')
     * @returns {Array} Available models
     */
    getModelsForBackend(backend) {
      // Make sure we never return undefined or null
      const models = this.availableModels[backend] || [];
      
      console.log(`Getting models for ${backend}:`, models);
      
      // If we have no models for the backend, use fallbacks
      if (models.length === 0) {
        console.log(`No models found for ${backend}, using fallbacks`);
        return this.fallbackModels[backend] || [];
      }
      
      return models;
    }
    
    /**
     * Get all available models
     * 
     * @returns {Object} Available models by backend
     */
    getAllModels() {
      return this.availableModels;
    }
    
    /**
     * Get model limits for a specific model
     * 
     * @param {string} model - Model name
     * @returns {Object|null} Model limits or null if not found
     */
    getModelLimits(model) {
      return this.modelLimits[model] || null;
    }
    
    /**
     * Check if a model is available for a specific backend
     * 
     * @param {string} backend - Backend name ('ollama' or 'groq')
     * @param {string} model - Model name
     * @returns {boolean} Whether the model is available
     */
    isModelAvailable(backend, model) {
      const models = this.availableModels[backend] || [];
      return models.includes(model);
    }
    
    /**
     * Get recommended models for a specific use case
     * 
     * @param {string} useCase - Use case (e.g., 'chat', 'code', 'summarization')
     * @returns {Object} Recommended models by backend
     */
    getRecommendedModels(useCase) {
      // Simple recommendations based on use case
      switch (useCase) {
        case 'code':
          return {
            ollama: this.availableModels.ollama.filter(m => m.includes('code') || m.includes('coder')),
            groq: ['qwen-2.5-coder-32b']
          };
        case 'summarization':
          return {
            ollama: this.availableModels.ollama.filter(m => m.includes('llama3')),
            groq: ['deepseek-r1-distill-llama-70b']
          };
        case 'chat':
        default:
          return {
            ollama: this.availableModels.ollama.filter(m => m.includes('llama3')),
            groq: ['llama-3.3-70b-versatile']
          };
      }
    }
    
    /**
     * Get optimal settings for a specific model
     * 
     * @param {string} backend - Backend name
     * @param {string} model - Model name
     * @returns {Object} Optimal settings
     */
    getOptimalSettings(backend, model) {
      // Default settings
      const defaultSettings = {
        temperature: 0.7,
        maxTokens: 1024
      };
      
      // Model-specific optimizations
      if (backend === 'groq') {
        if (model.includes('mixtral')) {
          return {
            temperature: 0.8,
            maxTokens: 2048
          };
        }
        
        if (model.includes('coder')) {
          return {
            temperature: 0.5,
            maxTokens: 2048
          };
        }
      }
      
      if (backend === 'ollama') {
        if (model.includes('llama3')) {
          return {
            temperature: 0.7,
            maxTokens: 2048
          };
        }
      }

      if (backend === 'nvidia') {
        // Reasoning models want headroom for the trace and lower temperature.
        if (this.isReasoningModel(model)) {
          return {
            temperature: 0.6,
            maxTokens: 4096
          };
        }
        return {
          temperature: 0.7,
          maxTokens: 2048
        };
      }

      return defaultSettings;
    }
    
    /**
     * Refresh the available models
     */
    async refreshModels() {
      console.log('Refreshing available models...');
      await this.fetchAvailableModels();
      await this.fetchModelLimits();
      
      // Publish models updated event
      this.eventBus.publish('models:updated', this.availableModels);
      console.log('Models refresh complete');
    }
  }