/**
 * graph-modal.js - Modal dialogs for displaying node information
 */

class GraphModal {
    constructor(graphInteraction) {
        this.graphInteraction = graphInteraction;
        this.graphCore = graphInteraction.graphCore;
        this.cy = graphInteraction.cy;
    }

    showModelInfo(nodeId) {
        const nodeData = this.graphInteraction.getNodeData(nodeId);
        if (!nodeData) return;
        
        // Create modal for model info
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const title = document.createElement('h2');
        title.textContent = `Model Information: ${nodeData.name}`;
        
        const infoContent = document.createElement('div');
        infoContent.innerHTML = `
            <div class="model-info">
                <p><strong>Backend:</strong> ${nodeData.backend}</p>
                <p><strong>Model:</strong> ${nodeData.model}</p>
                <p><strong>Temperature:</strong> ${nodeData.temperature}</p>
                <p><strong>Max Tokens:</strong> ${nodeData.maxTokens}</p>
                <h3>System Message:</h3>
                <pre>${nodeData.systemMessage}</pre>
            </div>
        `;
        
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(infoContent);
        overlay.appendChild(content);
        
        document.body.appendChild(overlay);
    }
    
    showApiUsage(nodeId) {
        const nodeData = this.graphInteraction.getNodeData(nodeId);
        if (!nodeData) return;
        
        // Create modal for API usage
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const title = document.createElement('h2');
        title.textContent = `API Usage: ${nodeData.name}`;
        
        // Fetch Groq model limits
        fetch('/api/models/groq/limits')
            .then(response => response.json())
            .then(data => {
                const modelLimits = data.data.find(model => model.id === nodeData.model) || {};
                
                const usageContent = document.createElement('div');
                usageContent.innerHTML = `
                    <div class="api-usage">
                        <h3>Model Rate Limits</h3>
                        <div class="limits-grid">
                            <div>Requests per minute:</div>
                            <div>${modelLimits.req_per_min || 'N/A'}</div>
                            
                            <div>Requests per day:</div>
                            <div>${modelLimits.req_per_day || 'N/A'}</div>
                            
                            <div>Tokens per minute:</div>
                            <div>${modelLimits.tokens_per_min || 'N/A'}</div>
                            
                            <div>Tokens per day:</div>
                            <div>${modelLimits.tokens_per_day || 'N/A'}</div>
                        </div>
                        
                        <h3>Current Usage</h3>
                        <p>Usage tracking is under development. Check back soon for detailed usage statistics.</p>
                    </div>
                `;
                
                content.appendChild(closeBtn);
                content.appendChild(title);
                content.appendChild(usageContent);
                overlay.appendChild(content);
                
                document.body.appendChild(overlay);
            })
            .catch(error => {
                console.error('Error fetching Groq model limits:', error);
                
                const usageContent = document.createElement('div');
                usageContent.innerHTML = `
                    <div class="api-usage">
                        <p>Error fetching API usage information.</p>
                        <p>Please try again later.</p>
                    </div>
                `;
                
                content.appendChild(closeBtn);
                content.appendChild(title);
                content.appendChild(usageContent);
                overlay.appendChild(content);
                
                document.body.appendChild(overlay);
            });
    }

    showNodeEditor(nodeData) {
        // Create modal for editing node
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.display = 'block';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const title = document.createElement('h2');
        title.textContent = nodeData ? 'Edit Node' : 'Add Node';
        
        // Create form
        const form = document.createElement('form');
        form.id = 'node-edit-form';
        
        // Node name
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = 'node-name';
        nameLabel.textContent = 'Node Name';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'node-name';
        nameInput.value = nodeData ? nodeData.name : '';
        nameInput.required = true;
        
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        form.appendChild(nameGroup);
        
        // Backend selection
        const backendGroup = document.createElement('div');
        backendGroup.className = 'form-group';
        
        const backendLabel = document.createElement('label');
        backendLabel.htmlFor = 'node-backend';
        backendLabel.textContent = 'Backend';
        
        const backendSelect = document.createElement('select');
        backendSelect.id = 'node-backend';
        backendSelect.required = true;
        
        const ollamaOption = document.createElement('option');
        ollamaOption.value = 'ollama';
        ollamaOption.textContent = 'Ollama';
        
        const groqOption = document.createElement('option');
        groqOption.value = 'groq';
        groqOption.textContent = 'Groq';
        
        backendSelect.appendChild(ollamaOption);
        backendSelect.appendChild(groqOption);
        
        if (nodeData) {
            backendSelect.value = nodeData.backend;
        }
        
        backendGroup.appendChild(backendLabel);
        backendGroup.appendChild(backendSelect);
        form.appendChild(backendGroup);
        
        // Model selection (dynamic based on backend)
        const modelGroup = document.createElement('div');
        modelGroup.className = 'form-group';
        
        const modelLabel = document.createElement('label');
        modelLabel.htmlFor = 'node-model';
        modelLabel.textContent = 'Model';
        
        const modelSelect = document.createElement('select');
        modelSelect.id = 'node-model';
        modelSelect.required = true;
        
        // Placeholder options
        const loadingOption = document.createElement('option');
        loadingOption.value = '';
        loadingOption.textContent = 'Loading models...';
        modelSelect.appendChild(loadingOption);
        
        modelGroup.appendChild(modelLabel);
        modelGroup.appendChild(modelSelect);
        form.appendChild(modelGroup);
        
        // Temperature
        const tempGroup = document.createElement('div');
        tempGroup.className = 'form-group';
        
        const tempLabel = document.createElement('label');
        tempLabel.htmlFor = 'node-temperature';
        tempLabel.textContent = 'Temperature';
        
        const tempInput = document.createElement('input');
        tempInput.type = 'number';
        tempInput.id = 'node-temperature';
        tempInput.min = 0;
        tempInput.max = 1;
        tempInput.step = 0.1;
        tempInput.value = nodeData ? nodeData.temperature : 0.7;
        
        tempGroup.appendChild(tempLabel);
        tempGroup.appendChild(tempInput);
        form.appendChild(tempGroup);
        
        // Max tokens
        const tokensGroup = document.createElement('div');
        tokensGroup.className = 'form-group';
        
        const tokensLabel = document.createElement('label');
        tokensLabel.htmlFor = 'node-max-tokens';
        tokensLabel.textContent = 'Max Tokens';
        
        const tokensInput = document.createElement('input');
        tokensInput.type = 'number';
        tokensInput.id = 'node-max-tokens';
        tokensInput.min = 1;
        tokensInput.value = nodeData ? nodeData.maxTokens : 1000;
        
        tokensGroup.appendChild(tokensLabel);
        tokensGroup.appendChild(tokensInput);
        form.appendChild(tokensGroup);
        
        // System message
        const sysGroup = document.createElement('div');
        sysGroup.className = 'form-group';
        
        const sysLabel = document.createElement('label');
        sysLabel.htmlFor = 'node-system-message';
        sysLabel.textContent = 'System Message';
        
        const sysTextarea = document.createElement('textarea');
        sysTextarea.id = 'node-system-message';
        sysTextarea.value = nodeData ? nodeData.systemMessage : '';
        
        sysGroup.appendChild(sysLabel);
        sysGroup.appendChild(sysTextarea);
        form.appendChild(sysGroup);
        
        // Form actions
        const actions = document.createElement('div');
        actions.className = 'form-actions';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.textContent = 'Save';
        
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        form.appendChild(actions);
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                name: nameInput.value,
                backend: backendSelect.value,
                model: modelSelect.value,
                temperature: parseFloat(tempInput.value),
                maxTokens: parseInt(tokensInput.value),
                systemMessage: sysTextarea.value
            };
            
            if (nodeData) {
                // Update existing node
                formData.id = nodeData.id;
                this.graphCore.updateNode(formData);
            } else {
                // Add new node
                this.graphCore.addNode(formData);
            }
            
            document.body.removeChild(overlay);
        });
        
        // Load models based on selected backend
        const loadModels = (backend) => {
            // Clear existing options
            modelSelect.innerHTML = '';
            
            // Add loading option
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.textContent = 'Loading models...';
            modelSelect.appendChild(loadingOption);
            
            // Fetch models from API
            fetch(`/api/models/${backend}`)
                .then(response => response.json())
                .then(data => {
                    // Clear loading option
                    modelSelect.innerHTML = '';
                    
                    // Add models
                    data.data.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name || model.id;
                        modelSelect.appendChild(option);
                    });
                    
                    // Set selected model if editing
                    if (nodeData && nodeData.backend === backend) {
                        modelSelect.value = nodeData.model;
                    }
                })
                .catch(error => {
                    console.error(`Error fetching ${backend} models:`, error);
                    
                    // Show error option
                    modelSelect.innerHTML = '';
                    const errorOption = document.createElement('option');
                    errorOption.value = '';
                    errorOption.textContent = 'Error loading models';
                    modelSelect.appendChild(errorOption);
                });
        };
        
        // Load models when backend changes
        backendSelect.addEventListener('change', () => {
            loadModels(backendSelect.value);
        });
        
        // Initial load of models
        loadModels(backendSelect.value);
        
        // Assemble modal
        content.appendChild(closeBtn);
        content.appendChild(title);
        content.appendChild(form);
        overlay.appendChild(content);
        
        // Add to document
        document.body.appendChild(overlay);
    }
}

export default GraphModal;