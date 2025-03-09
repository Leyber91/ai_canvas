/**
 * api/APIClient.js
 * 
 * A client for interacting with the backend API.
 * Handles request/response formatting, error handling,
 * and authentication.
 */
export class APIClient {
    constructor(baseUrl, eventBus, errorHandler) {
      this.baseUrl = baseUrl;
      this.eventBus = eventBus;
      this.errorHandler = errorHandler;
      this.requestsInProgress = 0;
      
      // Default request options
      this.defaultOptions = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Request queue for rate limiting
      this.requestQueue = [];
      this.maxConcurrentRequests = 5;
      this.processingQueue = false;
    }
    
    /**
     * Make a GET request
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Response data
     */
    async get(endpoint, options = {}) {
      return this.request(endpoint, { 
        ...options, 
        method: 'GET' 
      });
    }
    
    /**
     * Make a POST request
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} data - Data to send in the request body
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Response data
     */
    async post(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
    
    /**
     * Make a PUT request
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} data - Data to send in the request body
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Response data
     */
    async put(endpoint, data, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
    
    /**
     * Make a DELETE request
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} options - Additional fetch options
     * @returns {Promise<any>} Response data
     */
    async delete(endpoint, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'DELETE'
      });
    }
    
    /**
     * Make a request to the API with automatic error handling
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async request(endpoint, options = {}) {
      // Merge default options
      const requestOptions = {
        ...this.defaultOptions,
        ...options,
        headers: {
          ...this.defaultOptions.headers,
          ...(options.headers || {})
        }
      };
      
      // Queue the request if too many are in progress
      if (this.requestsInProgress >= this.maxConcurrentRequests) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({ endpoint, options: requestOptions, resolve, reject });
          this.processQueue();
        });
      }
      
      return this.executeRequest(endpoint, requestOptions);
    }
    
    /**
     * Execute a request and handle the response
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async executeRequest(endpoint, options) {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      
      this.requestsInProgress++;
      this.eventBus.publish('api:request:start', { url, method: options.method });
      
      try {
        const response = await fetch(url, options);
        
        // Check for HTTP errors
        if (!response.ok) {
          const errorData = await this.tryParseJson(response);
          const error = new Error(
            errorData?.message || `HTTP error ${response.status}: ${response.statusText}`
          );
          error.status = response.status;
          error.response = response;
          error.data = errorData;
          throw error;
        }
        
        // Parse JSON response
        const data = await this.tryParseJson(response);
        
        this.eventBus.publish('api:request:success', { 
          url, 
          method: options.method,
          data 
        });
        
        return data;
      } catch (error) {
        this.eventBus.publish('api:request:error', { 
          url, 
          method: options.method,
          error 
        });
        
        // Add context to error for better debugging
        error.request = {
          url,
          method: options.method,
          headers: options.headers
        };
        
        this.errorHandler.handleError(error, {
          context: 'API Request',
          silent: options.silent
        });
        
        throw error;
      } finally {
        this.requestsInProgress--;
        this.eventBus.publish('api:request:end', { url, method: options.method });
        
        // Process the next request in the queue
        this.processQueue();
      }
    }
    
    /**
     * Process the next request in the queue
     */
    async processQueue() {
      if (this.processingQueue || this.requestQueue.length === 0 || 
          this.requestsInProgress >= this.maxConcurrentRequests) {
        return;
      }
      
      this.processingQueue = true;
      
      try {
        const { endpoint, options, resolve, reject } = this.requestQueue.shift();
        
        try {
          const result = await this.executeRequest(endpoint, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } finally {
        this.processingQueue = false;
        
        // Check if there are more requests to process
        if (this.requestQueue.length > 0) {
          setTimeout(() => this.processQueue(), 0);
        }
      }
    }
    
    /**
     * Try to parse JSON from a response, falling back to text
     * 
     * @param {Response} response - Fetch response object
     * @returns {Promise<any>} Parsed response
     */
    async tryParseJson(response) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json();
        } catch (error) {
          console.warn('Error parsing JSON response:', error);
        }
      }
      
      // Fallback to text response
      return {
        text: await response.text()
      };
    }
    
    /**
     * Create a stream response handler
     * 
     * @param {string} endpoint - API endpoint to request
     * @param {Object} data - Data to send in the request body
     * @param {Function} onChunk - Callback for each chunk of data
     * @param {Function} onComplete - Callback when stream completes
     * @param {Function} onError - Callback when stream errors
     * @returns {Promise<void>}
     */
    async stream(endpoint, data, { onChunk, onComplete, onError, options = {} }) {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      
      this.eventBus.publish('api:stream:start', { url });
      
      try {
        const response = await fetch(url, {
          ...this.defaultOptions,
          ...options,
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            ...this.defaultOptions.headers,
            ...(options.headers || {})
          }
        });
        
        if (!response.ok) {
          const errorData = await this.tryParseJson(response);
          const error = new Error(
            errorData?.message || `HTTP error ${response.status}: ${response.statusText}`
          );
          error.status = response.status;
          throw error;
        }
        
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let done = false;
        let fullContent = '';
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (done) {
            break;
          }
          
          // Decode and process the chunk
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          
          // Process the chunk (it may contain multiple SSE events)
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              try {
                onChunk(data);
              } catch (error) {
                console.error('Error in stream chunk handler:', error);
              }
            }
          }
        }
        
        // Stream completed successfully
        this.eventBus.publish('api:stream:complete', { url });
        
        if (onComplete) {
          onComplete(fullContent);
        }
      } catch (error) {
        this.eventBus.publish('api:stream:error', { url, error });
        
        this.errorHandler.handleError(error, {
          context: 'API Stream',
          silent: options.silent
        });
        
        if (onError) {
          onError(error);
        }
      }
    }
  }
  
  