/**
 * workflow/index.js
 * 
 * Entry point for the workflow module.
 * Exports all workflow-related classes and utilities.
 */

import { WorkflowManager } from './WorkflowManager.js';
import { CycleDetector } from './CycleDetector.js';
import { TopologicalSorter } from './TopologicalSorter.js';
import { ExecutionEngine } from './ExecutionEngine.js';
import { WorkflowValidator } from './WorkflowValidator.js';
import { WorkflowVisualizer } from './WorkflowVisualizer.js';

export {
  WorkflowManager,
  CycleDetector,
  TopologicalSorter,
  ExecutionEngine,
  WorkflowValidator,
  WorkflowVisualizer
};

// Export a factory function for creating a workflow manager with all dependencies
export const createWorkflowManager = (apiClient, eventBus, graphManager, conversationManager) => {
  const workflowManager = new WorkflowManager(
    apiClient, 
    eventBus, 
    graphManager, 
    conversationManager
  );
  
  return workflowManager;
};