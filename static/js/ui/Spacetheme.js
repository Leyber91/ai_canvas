/**
 * Space Theme Generator Script
 * Creates stars, nebulae, and grid background for space theme
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create space background container if it doesn't exist
    if (!document.querySelector('.space-background')) {
      const spaceBackground = document.createElement('div');
      spaceBackground.className = 'space-background';
      document.body.prepend(spaceBackground);
      
      // Create grid lines
      const gridLines = document.createElement('div');
      gridLines.className = 'grid-lines';
      spaceBackground.appendChild(gridLines);
      
      // Create stars
      generateStars(spaceBackground);
      
      // Create nebulae
      generateNebulae(spaceBackground);
    }
    
    // Add space-theme class to body
    document.body.classList.add('space-theme');
    
    // Set Cytoscape container height if it's too small
    const cyContainer = document.getElementById('cy');
    if (cyContainer && cyContainer.clientHeight < 300) {
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer) {
        canvasContainer.style.height = '70vh';
      }
    }
    
    // Fix for cytoscape container z-index - FIXED SELECTOR
    const cytoContainer = document.getElementById('cy'); // Fixed selector
    if (cytoContainer) {
      cytoContainer.style.zIndex = '10';
    }
    
    // Initialize Cytoscape with a delay to ensure DOM is ready
    setTimeout(() => {
      if (window.graphManager && window.graphManager.cytoscapeManager) {
        if (!window.graphManager.cytoscapeManager.cy) {
          console.log('Initializing Cytoscape from SpaceTheme.js');
          window.graphManager.cytoscapeManager.initialize();
        } else {
          // If already initialized, ensure it's visible
          fixCytoscapeZIndex();
        }
      }
    }, 500);
  });
  
  /**
   * Generate stars for the space background
   * @param {HTMLElement} container - The container to add stars to
   */
  function generateStars(container) {
    const starCount = Math.min(window.innerWidth / 3, 200); // Responsive star count
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      
      // Determine star size
      if (i % 10 === 0) {
        star.className = 'star large';
      } else if (i % 5 === 0) {
        star.className = 'star medium';
      } else {
        star.className = 'star small';
      }
      
      // Position star randomly
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      // Add animation delay
      star.style.animationDelay = `${Math.random() * 3}s`;
      
      container.appendChild(star);
    }
  }
  
  /**
   * Generate nebulae for the space background
   * @param {HTMLElement} container - The container to add nebulae to
   */
  function generateNebulae(container) {
    // Create nebulae
    const nebulaColors = ['blue', 'purple', 'teal'];
    const nebulaCount = 3;
    
    for (let i = 0; i < nebulaCount; i++) {
      const nebula = document.createElement('div');
      nebula.className = `nebula ${nebulaColors[i % nebulaColors.length]}`;
      
      // Position and size nebula
      const size = Math.random() * 300 + 200;
      nebula.style.width = `${size}px`;
      nebula.style.height = `${size}px`;
      nebula.style.left = `${Math.random() * 80}%`;
      nebula.style.top = `${Math.random() * 80}%`;
      
      // Add animation delay
      nebula.style.animationDelay = `${Math.random() * 5}s`;
      
      container.appendChild(nebula);
    }
  }
  
  /**
   * Create ripple effect on button clicks
   */
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
      const button = e.target;
      
      // Create ripple element
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      button.appendChild(ripple);
      
      // Position the ripple where clicked
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      
      // Remove ripple after animation
      ripple.addEventListener('animationend', function() {
        ripple.remove();
      });
    }
  });
  
  /**
   * Fix for Cytoscape canvas z-index issues
   * This repositions the canvas elements to ensure proper stacking
   */
  function fixCytoscapeZIndex() {
    // Get all canvas elements inside the Cytoscape container
    const canvases = document.querySelectorAll('#cy canvas');
    
    if (canvases.length) {
      console.log('Fixing Cytoscape z-index for', canvases.length, 'canvas elements');
      
      // Fix the stacking order - modified layering to ensure visibility
      const layerMap = {
        'layer0-selectbox': 35,
        'layer1-drag': 34,
        'layer2-node': 33,
        'layer3-edge': 32,
        'layer4-background': 31
      };
      
      canvases.forEach(canvas => {
        const dataId = canvas.getAttribute('data-id');
        if (dataId && layerMap[dataId]) {
          canvas.style.zIndex = layerMap[dataId];
          canvas.style.position = 'absolute';
        }
      });
      
      // Ensure the Cytoscape container itself has proper z-index
      const cyContainer = document.getElementById('cy');
      if (cyContainer) {
        cyContainer.style.position = 'relative';
        cyContainer.style.zIndex = '30'; // Higher than background elements
      }
    }
  }
  
  // Run fix on load and whenever Cytoscape might be initialized
  window.addEventListener('load', function() {
    // Initial fix after a short delay
    setTimeout(fixCytoscapeZIndex, 500);
    
    // Create a mutation observer to watch for canvas elements being added
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          setTimeout(fixCytoscapeZIndex, 100);
        }
      });
    });
    
    const cyElement = document.getElementById('cy');
    if (cyElement) {
      observer.observe(cyElement, { childList: true, subtree: true });
    }
  });
  
  // Create a helper function that can be called from console for debugging
  window.fixCytoscape = function() {
    fixCytoscapeZIndex();
    console.log('Manual Cytoscape z-index fix applied');
  };