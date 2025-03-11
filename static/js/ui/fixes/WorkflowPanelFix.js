/**
 * ui/fixes/WorkflowPanelFix.js
 * 
 * Fix for the workflow panel initialization issues.
 * This script creates the necessary DOM elements for the workflow panel
 * if they don't already exist in the document.
 */

export class WorkflowPanelFix {
  /**
   * Apply the workflow panel fix
   */
  static apply() {
    console.log('Applying workflow panel fix...');
    
    // Check if workflow panel already exists
    if (document.getElementById('workflow-panel')) {
      console.log('Workflow panel already exists, no fix needed.');
      return;
    }
    
    // Create workflow panel container if it doesn't exist
    let workflowPanelContainer = document.querySelector('.workflow-panel-container');
    if (!workflowPanelContainer) {
      workflowPanelContainer = document.createElement('div');
      workflowPanelContainer.className = 'workflow-panel-container';
      
      // Position and style the container
      Object.assign(workflowPanelContainer.style, {
        position: 'fixed',
        top: '60px',
        right: '20px',
        width: '350px',
        maxHeight: 'calc(100vh - 80px)',
        zIndex: '900',
        overflowY: 'auto'
      });
      
      // Append to body
      document.body.appendChild(workflowPanelContainer);
      console.log('Created workflow panel container');
    }
    
    // Create workflow panel
    const workflowPanel = document.createElement('div');
    workflowPanel.id = 'workflow-panel';
    workflowPanel.className = 'panel workflow-panel';
    workflowPanel.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title" data-expanded="false">
          <span>Workflow Execution</span>
          <span class="toggle-indicator">►</span>
        </h3>
      </div>
      <div class="panel-content">
        <div class="workflow-status-container"></div>
        <div class="execution-progress-container"></div>
        <div class="execution-steps-container"></div>
        <div class="execution-results-container"></div>
        <div class="workflow-controls-container"></div>
        <div class="workflow-errors-container"></div>
      </div>
    `;
    
    // Append panel to container
    workflowPanelContainer.appendChild(workflowPanel);
    console.log('Created workflow panel');
    
    // Create toggle button if it doesn't exist
    if (!document.getElementById('workflow-panel-toggle')) {
      const toggleButton = document.createElement('button');
      toggleButton.id = 'workflow-panel-toggle';
      toggleButton.className = 'panel-toggle workflow-panel-toggle';
      toggleButton.textContent = 'Workflow';
      toggleButton.title = 'Toggle Workflow Panel';
      
      // Position and style the toggle button
      Object.assign(toggleButton.style, {
        position: 'fixed',
        top: '10px',
        right: '20px',
        zIndex: '901',
        padding: '5px 10px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      });
      
      // Append to body
      document.body.appendChild(toggleButton);
      console.log('Created workflow panel toggle button');
    }
    
    console.log('Workflow panel fix applied successfully');
  }
}

// No longer auto-applying the fix to prevent duplicate panels
// The fix will be applied manually when needed through the exported class

// Export for manual application if needed
export default WorkflowPanelFix;
