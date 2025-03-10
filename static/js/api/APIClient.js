/**
 * api/APIClient.js
 * 
 * A client for interacting with the backend API.
 * Handles request/response formatting, error handling,
 * and authentication.
 */
export class APIClient {
  constructor(baseUrl, eventBus, errorHandler) {
    // Validate and normalize the base URL
    if (!baseUrl) {
      console.error('No base URL provided to APIClient');
      baseUrl = window.location.origin; // Default to current origin as fallback
    }
    
    // Ensure the base URL has a protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      // Check if it's a relative URL (starts with /)
      if (baseUrl.startsWith('/')) {
        // Use the current origin
        baseUrl = `${window.location.origin}${baseUrl}`;
      } else {
        // Assume http if no protocol
        baseUrl = `http://${baseUrl}`;
      }
    }
    
    // Ensure the base URL ends with a slash
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    this.eventBus = eventBus;
    this.errorHandler = errorHandler;
    this.requestsInProgress = 0;
    this.apiPrefix = 'api'; // Without leading slash for better URL joining
    
    // Log configuration for debugging
    console.log('APIClient initialized with:', {
      baseUrl: this.baseUrl,
      apiPrefix: this.apiPrefix
    });
    
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
   * Safely constructs a URL with proper error handling
   * 
   * @param {string} path - The path to append to the base URL
   * @returns {string} The complete URL
   */
  buildApiUrl(endpoint) {
    // Remove leading/trailing slashes and api prefix if present
    const cleanEndpoint = endpoint
      .replace(/^\/+|\/+$/g, '')
      .replace(/^api\/+/, '');
    
    // Build the full URL - handle both absolute and relative base URLs
    let url;
    try {
      // Try to use URL constructor for absolute URLs
      url = new URL(this.joinUrl(this.apiPrefix, cleanEndpoint), this.baseUrl).toString();
    } catch (error) {
      // For relative URLs, construct the path directly
      const basePath = this.baseUrl.replace(/\/$/, ''); // Remove trailing slash
      const apiPath = this.joinUrl(this.apiPrefix, cleanEndpoint);
      url = `${basePath}/${apiPath}`;
      
      // If running in browser, use absolute URL relative to current origin
      if (typeof window !== 'undefined') {
        url = new URL(url, window.location.origin).toString();
      }
    }
    
    // Log the URL for debugging
    console.log(`Built API URL: ${url} from endpoint: ${endpoint}`);
    
    return url;
  }
  
  /**
   * Construct a complete API URL
   * 
   * @param {string} endpoint - API endpoint
   * @returns {string} Complete URL
   */
  buildApiUrl(endpoint) {
    try {
      // Clean up the endpoint
      const cleanEndpoint = endpoint
        .replace(/^\/+|\/+$/g, '')  // Remove leading/trailing slashes
        .replace(/^api\/+/, '');     // Remove api prefix if present
      
      // Construct the path with api prefix
      const path = this.apiPrefix 
        ? `${this.apiPrefix}/${cleanEndpoint}`
        : cleanEndpoint;
      
      // Use the safer buildUrl method
      const url = this.buildUrl(path);
      
      // Log for debugging
      console.log(`Built API URL: ${url} from endpoint: ${endpoint}`);
      
      return url;
    } catch (error) {
      console.error('Error in buildApiUrl:', error, {
        endpoint,
        baseUrl: this.baseUrl,
        apiPrefix: this.apiPrefix
      });
      
      // Fallback to a simple URL construction that should work in most cases
      const fallback = `${window.location.origin}/api/${endpoint.replace(/^\/+|api\/+/g, '')}`;
      console.warn(`Using fallback URL: ${fallback}`);
      return fallback;
    }
  }
  
  /**
   * Make a GET request
   * 
   * @param {string} endpoint - API endpoint to request
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    const url = this.buildApiUrl(endpoint);
    return this.request(url, { 
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
    const url = this.buildApiUrl(endpoint);
    return this.request(url, {
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
    const url = this.buildApiUrl(endpoint);
    return this.request(url, {
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
    const url = this.buildApiUrl(endpoint);
    return this.request(url, {
      ...options,
      method: 'DELETE'
    });
  }
  
  /**
   * Make a request to the API with automatic error handling
   * 
   * @param {string} url - API URL to request
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async request(url, options = {}) {
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
        this.requestQueue.push({ url, options: requestOptions, resolve, reject });
        this.processQueue();
      });
    }
    
    return this.executeRequest(url, requestOptions);
  }
  
  /**
   * Execute a request with improved error handling
   * 
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async executeRequest(url, options) {
    const method = options.method || 'GET';
    
    // Publish request start event
    this.eventBus?.publish('api:request:start', { url, method });
    
    console.log(`Starting ${method} request to: ${url}`);
    
    try {
      this.requestsInProgress++;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // Track timing
      console.log(`Fetch finished loading: ${method} "${url}" with status: ${response.status}`);
      
      if (!response.ok) {
        // Log request details for debugging
        console.error(`Request failed with status ${response.status}:`, {
          url,
          method,
          status: response.status,
          statusText: response.statusText
        });
        
        // Create detailed error with status and response body when possible
        const errorBody = await response.text();
        let parsedError;
        
        try {
          parsedError = JSON.parse(errorBody);
          console.error('Error response body:', parsedError);
        } catch (e) {
          parsedError = { detail: errorBody };
          console.error('Error response text:', errorBody);
        }
        
        const errorMessage = parsedError.detail || parsedError.message || 
                           `HTTP error ${response.status}: ${response.statusText}`;
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.responseData = parsedError;
        error.url = url;
        
        throw error;
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType) {
        console.log('Response has no content-type, returning empty object');
        return {};
      }
      
      // Parse JSON response
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses
        const text = await response.text();
        data = { text, contentType };
      }
      
      // Publish success event
      this.eventBus?.publish('api:request:success', { url, method, data });
      
      return data;
    } catch (error) {
      // For network-level errors or non-JSON responses
      console.error(`${method} ${url} failed:`, error);
      
      // Enrich error with request details if not already present
      if (!error.url) {
        error.url = url;
        error.method = method;
      }
      
      // Publish error event
      this.eventBus?.publish('api:request:error', { 
        url, 
        method, 
        error,
        status: error.status || 'network-error'
      });
      
      throw error;
    } finally {
      this.requestsInProgress--;
      
      // Publish end event in all cases
      this.eventBus?.publish('api:request:end', { url, method });
      
      // Process next request in queue if any
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
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
      const { url, options, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this.executeRequest(url, options);
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
   * @param {Object} handlers - Object containing callback handlers
   * @param {Function} handlers.onChunk - Callback for each chunk of data
   * @param {Function} handlers.onComplete - Callback when stream completes
   * @param {Function} handlers.onError - Callback when stream errors
   * @param {Object} handlers.options - Additional options
   * @returns {Promise<void>}
   */
  async stream(endpoint, data, { onChunk, onComplete, onError, options = {} }) {
    try {
      // Build proper URL
      const url = this.buildApiUrl(endpoint);
      
      console.log(`Starting stream to: ${url}`, {
        data: JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''),
        options
      });
      
      this.eventBus?.publish('api:stream:start', { url });
      
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
      
      console.log(`Stream request got response with status: ${response.status}`);
      
      if (!response.ok) {
        // Log detailed error info
        console.error(`Stream request failed with status ${response.status}:`, {
          url,
          status: response.status,
          statusText: response.statusText
        });
        
        const errorData = await this.tryParseJson(response);
        console.error('Error response data:', errorData);
        
        const errorMessage = (errorData && (errorData.message || errorData.detail)) || 
                           `HTTP error ${response.status}: ${response.statusText}`;
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.url = url;
        throw error;
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let fullContent = '';
      
      console.log('Starting to read stream...');
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (done) {
          console.log('Stream reading completed');
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
          } else if (line.trim()) {
            console.log('Non-data line in stream:', line);
          }
        }
      }
      
      // Stream completed successfully
      console.log('Stream completed successfully');
      this.eventBus?.publish('api:stream:complete', { url });
      
      if (onComplete) {
        onComplete(fullContent);
      }
    } catch (error) {
      console.error('Stream error:', error);
      
      if (this.eventBus) {
        this.eventBus.publish('api:stream:error', { 
          url: error.url || endpoint, 
          error 
        });
      }
      
      if (this.errorHandler && typeof this.errorHandler.handleError === 'function') {
        this.errorHandler.handleError(error, {
          context: 'API Stream',
          silent: options.silent
        });
      } else {
        console.error('Error handler not available, logging stream error:', error);
      }
      
      if (onError) {
        onError(error);
      }
    }
  }
}