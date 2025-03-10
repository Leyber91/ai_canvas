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
        this.currentX = 0;
        this.currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
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
        
        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }
        
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
        
        let clientX, clientY;
        
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Calculate the new cursor position
        this.currentX = clientX - this.initialX;
        this.currentY = clientY - this.initialY;
        
        // Update position state
        this.xOffset = this.currentX;
        this.yOffset = this.currentY;
        
        // Apply transform to move the panel
        this.setTranslate(this.currentX, this.currentY);
    }
    
    /**
     * Handle drag end event
     */
    dragEnd() {
        // Remove dragging class
        this.panel.classList.remove('dragging');
        this.handle.style.cursor = 'grab';
        
        // Reset dragging state
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
        
        // Convert translate to absolute positioning
        this.applyPositionFromTransform();
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('touchend', this.dragEnd);
        
        // Call onDragEnd callback
        this.onDragEnd();
    }
    
    /**
     * Apply transform to the panel
     * @param {number} x - X translation
     * @param {number} y - Y translation
     */
    setTranslate(x, y) {
        // Ensure the panel stays within the container boundaries
        const { left, top, right, bottom } = this.getConstraints(x, y);
        
        // Apply the constrained position
        this.panel.style.transform = `translate(${left}px, ${top}px)`;
    }
    
    /**
     * Convert translateX/Y to absolute positioning
     */
    applyPositionFromTransform() {
        // Get the current transform
        const style = window.getComputedStyle(this.panel);
        const matrix = new DOMMatrix(style.transform);
        
        // Get panel dimensions
        const rect = this.panel.getBoundingClientRect();
        
        // Get container dimensions
        const containerRect = this.container.getBoundingClientRect();
        
        // Calculate position relative to the container
        let left = matrix.m41;
        let top = matrix.m42;
        
        // Set absolute position
        this.panel.style.transform = 'none';
        this.panel.style.left = `${left}px`;
        this.panel.style.top = `${top}px`;
        
        // Reset offset
        this.xOffset = left;
        this.yOffset = top;
    }
    
    /**
     * Calculate position constraints
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Object} Constrained coordinates
     */
    getConstraints(x, y) {
        // Get panel dimensions
        const rect = this.panel.getBoundingClientRect();
        
        // Get container dimensions
        const containerRect = this.container.getBoundingClientRect();
        
        // Calculate the bounds
        const minLeft = 0;
        const maxLeft = containerRect.width - rect.width;
        const minTop = 0;
        const maxTop = containerRect.height - rect.height;
        
        // Apply constraints
        const left = Math.max(minLeft, Math.min(x, maxLeft));
        const top = Math.max(minTop, Math.min(y, maxTop));
        
        return { left, top, right: left + rect.width, bottom: top + rect.height };
    }
    
    /**
     * Update the panel's position
     * @param {Object} position - New position coordinates
     */
    updatePosition(position) {
        if (!this.panel) return;
        
        if (position.left !== undefined) this.panel.style.left = position.left;
        if (position.top !== undefined) this.panel.style.top = position.top;
        if (position.right !== undefined) this.panel.style.right = position.right;
        if (position.bottom !== undefined) this.panel.style.bottom = position.bottom;
    }
    
    /**
     * Clean up event listeners and resources
     */
    destroy() {
        if (!this.panel || !this.handle) return;
        
        this.handle.removeEventListener('mousedown', this.dragStart);
        this.handle.removeEventListener('touchstart', this.dragStart);
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('mouseup', this.dragEnd);
        document.removeEventListener('touchend', this.dragEnd);
    }
}