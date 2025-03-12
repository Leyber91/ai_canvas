/**
 * ui/components/workflow/draggable/DraggableManager.js
 * 
 * Manages the draggable functionality for the workflow panel.
 */
export class DraggableManager {
    /**
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.panel - The panel element to make draggable
     * @param {HTMLElement} options.handle - The element to use as drag handle
     * @param {HTMLElement} options.container - The container element that bounds the draggable area
     * @param {Function} options.onDragStart - Callback for drag start event
     * @param {Function} options.onDragEnd - Callback for drag end event
     */
    constructor(options = {}) {
        this.panel = options.panel;
        this.handle = options.handle || this.panel;
        this.container = options.container || document.body;
        this.onDragStart = options.onDragStart || (() => {});
        this.onDragEnd = options.onDragEnd || (() => {});
        
        // Dragging state
        this.isDragging = false;
        this.initialX = 0;
        this.initialY = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        // Animation frame for smoother performance
        this.animationFrame = null;
        
        // Bound methods
        this.dragStart = this.dragStart.bind(this);
        this.dragEnd = this.dragEnd.bind(this);
        this.drag = this.drag.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the draggable functionality
     */
    init() {
        if (!this.panel || !this.handle) return;
        
        // Add the draggable class to the panel
        this.panel.classList.add('draggable');
        
        // Ensure panel has absolute positioning
        const computedStyle = window.getComputedStyle(this.panel);
        if (computedStyle.position === 'static') {
            this.panel.style.position = 'absolute';
        }
        
        // Store initial position
        this.initialLeft = parseInt(computedStyle.left) || 0;
        this.initialTop = parseInt(computedStyle.top) || 0;
        
        // Add cursor style to the handle
        this.handle.style.cursor = 'grab';
        
        // Add event listeners
        this.handle.addEventListener('mousedown', this.dragStart);
        this.handle.addEventListener('touchstart', this.dragStart, { passive: false });
    }
    
    /**
     * Handle drag start event
     * @param {Event} e - The event object
     */
    dragStart(e) {
        e.preventDefault();
        
        // Mark panel as actively being dragged
        this.panel.classList.add('dragging');
        this.handle.style.cursor = 'grabbing';
        
        // Get current panel position (absolute)
        const rect = this.panel.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(this.panel);
        
        // Set initial positions
        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX;
            this.initialY = e.touches[0].clientY;
        } else {
            this.initialX = e.clientX;
            this.initialY = e.clientY;
        }
        
        // Store initial left/top position
        this.initialLeft = parseInt(computedStyle.left) || rect.left;
        this.initialTop = parseInt(computedStyle.top) || rect.top;
        
        this.isDragging = true;
        
        // Add move and end event listeners
        document.addEventListener('mousemove', this.drag);
        document.addEventListener('touchmove', this.drag, { passive: false });
        document.addEventListener('mouseup', this.dragEnd);
        document.addEventListener('touchend', this.dragEnd);
        
        // Call onDragStart callback
        this.onDragStart();
    }
    
    /**
     * Handle drag move event
     * @param {Event} e - The event object
     */
    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        // Cancel any existing animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Use requestAnimationFrame for smoother movement
        this.animationFrame = requestAnimationFrame(() => {
            let clientX, clientY;
            
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            // Calculate the change in position
            const dx = clientX - this.initialX;
            const dy = clientY - this.initialY;
            
            // Calculate new position
            const newLeft = this.initialLeft + dx;
            const newTop = this.initialTop + dy;
            
            // Apply position constraints
            const { left, top } = this.getConstraints(newLeft, newTop);
            
            // Apply position directly (more consistent than transform)
            this.panel.style.left = `${left}px`;
            this.panel.style.top = `${top}px`;
        });
    }
    
    /**
     * Handle drag end event
     */
    dragEnd() {
        if (!this.isDragging) return;
        
        // Cancel any pending animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Remove dragging class
        this.panel.classList.remove('dragging');
        this.handle.style.cursor = 'grab';
        
        // Reset dragging state
        this.isDragging = false;
        
        // Update initial position for next drag
        const computedStyle = window.getComputedStyle(this.panel);
        this.initialLeft = parseInt(computedStyle.left);
        this.initialTop = parseInt(computedStyle.top);
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('touchend', this.dragEnd);
        
        // Call onDragEnd callback
        this.onDragEnd();
    }
    
    /**
     * Calculate position constraints
     * @param {number} left - Proposed left position
     * @param {number} top - Proposed top position
     * @returns {Object} Constrained coordinates
     */
    getConstraints(left, top) {
        // Get panel dimensions
        const panelRect = this.panel.getBoundingClientRect();
        
        // Get container dimensions
        const containerRect = this.container.getBoundingClientRect();
        
        // Calculate the bounds
        const minLeft = containerRect.left;
        const maxLeft = containerRect.right - panelRect.width;
        const minTop = containerRect.top;
        const maxTop = containerRect.bottom - panelRect.height;
        
        // Apply constraints with a buffer to prevent sticking at edges
        const constrainedLeft = Math.max(minLeft, Math.min(left, maxLeft));
        const constrainedTop = Math.max(minTop, Math.min(top, maxTop));
        
        return { left: constrainedLeft, top: constrainedTop };
    }
    
    /**
     * Update the panel's position
     * @param {Object} position - New position coordinates
     */
    updatePosition(position) {
        if (!this.panel) return;
        
        if (position.left !== undefined) this.panel.style.left = typeof position.left === 'number' ? `${position.left}px` : position.left;
        if (position.top !== undefined) this.panel.style.top = typeof position.top === 'number' ? `${position.top}px` : position.top;
        
        // Update initial position
        const computedStyle = window.getComputedStyle(this.panel);
        this.initialLeft = parseInt(computedStyle.left);
        this.initialTop = parseInt(computedStyle.top);
    }
    
    /**
     * Clean up event listeners and resources
     */
    destroy() {
        if (!this.panel || !this.handle) return;
        
        // Cancel any pending animation
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.handle.removeEventListener('mousedown', this.dragStart);
        this.handle.removeEventListener('touchstart', this.dragStart);
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('touchend', this.dragEnd);
        
        this.panel.classList.remove('draggable');
        this.panel.classList.remove('dragging');
    }
}