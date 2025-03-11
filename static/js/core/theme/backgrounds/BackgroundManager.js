/**
 * core/theme/backgrounds/BackgroundManager.js
 * 
 * Manages dynamic background effects
 * Handles creation and updating of background elements
 */

export class BackgroundManager {
  constructor() {
    // Background container reference
    this.container = null;
    
    // Background type
    this.type = 'stars';
    
    // Background elements
    this.elements = [];
    
    // Animation frame ID for cleanup
    this.animationFrameId = null;
    
    // Paused state
    this.isPaused = false;
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Bind methods
    this.initializeBackground = this.initializeBackground.bind(this);
    this.addStarsToBackground = this.addStarsToBackground.bind(this);
    this.createNebulaEffects = this.createNebulaEffects.bind(this);
    this.createGradientBackground = this.createGradientBackground.bind(this);
    this.createParticleEffect = this.createParticleEffect.bind(this);
    this.updateBackgroundResponsiveness = this.updateBackgroundResponsiveness.bind(this);
    this.cleanupBackground = this.cleanupBackground.bind(this);
    this.pauseAnimations = this.pauseAnimations.bind(this);
    this.resumeAnimations = this.resumeAnimations.bind(this);
    
    // Set up reduced motion listener
    this.setupReducedMotionListener();
  }
  
  /**
   * Set up listener for reduced motion preference changes
   * 
   * @private
   */
  setupReducedMotionListener() {
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      try {
        // Chrome & Firefox
        motionQuery.addEventListener('change', (e) => {
          this.prefersReducedMotion = e.matches;
          this.updateBackgroundResponsiveness();
        });
      } catch (error1) {
        try {
          // Safari
          motionQuery.addListener((e) => {
            this.prefersReducedMotion = e.matches;
            this.updateBackgroundResponsiveness();
          });
        } catch (error2) {
          console.warn('Browser does not support media query listeners');
        }
      }
    }
  }
  
  /**
   * Initialize background
   * 
   * @param {string} type - Background type ('stars', 'nebula', 'gradient', 'particles')
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Background options
   */
  initializeBackground(type = 'stars', container = null, options = {}) {
    // Clean up existing background
    this.cleanupBackground();
    
    // Store type and container
    this.type = type;
    this.container = container || document.body;
    
    // Create background container if it doesn't exist
    let bgContainer = this.container.querySelector('.theme-background');
    
    if (!bgContainer) {
      bgContainer = document.createElement('div');
      bgContainer.className = 'theme-background';
      
      Object.assign(bgContainer.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden'
      });
      
      this.container.appendChild(bgContainer);
    }
    
    // Store background container
    this.bgContainer = bgContainer;
    
    // Create background based on type
    switch (type) {
      case 'stars':
        this.addStarsToBackground(bgContainer, options);
        break;
      case 'nebula':
        this.createNebulaEffects(bgContainer, options);
        break;
      case 'gradient':
        this.createGradientBackground(bgContainer, options.colors);
        break;
      case 'particles':
        this.createParticleEffect(bgContainer, options);
        break;
      default:
        this.addStarsToBackground(bgContainer, options);
    }
    
    // Set up resize listener for responsiveness
    window.addEventListener('resize', this.updateBackgroundResponsiveness);
  }
  
  /**
   * Add stars to background
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Star options
   */
  addStarsToBackground(container, options = {}) {
    // Default options
    const defaults = {
      starCount: this.prefersReducedMotion ? 50 : 100,
      twinkle: !this.prefersReducedMotion,
      minSize: 0.5,
      maxSize: 3,
      colors: ['#ffffff', '#f0f8ff', '#f8f8ff']
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    
    // Create stars
    for (let i = 0; i < opts.starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      // Random position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      // Random size
      const size = (Math.random() * (opts.maxSize - opts.minSize) + opts.minSize).toFixed(1);
      
      // Random opacity and animation delay
      const opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
      const animationDelay = (Math.random() * 10).toFixed(1);
      
      // Random color
      const colorIndex = Math.floor(Math.random() * opts.colors.length);
      const color = opts.colors[colorIndex];
      
      Object.assign(star.style, {
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        opacity: opacity
      });
      
      // Add animation if twinkle is enabled
      if (opts.twinkle) {
        star.style.animation = `star-twinkle 5s infinite ${animationDelay}s`;
      }
      
      starsContainer.appendChild(star);
      this.elements.push(star);
    }
    
    container.appendChild(starsContainer);
    this.elements.push(starsContainer);
    
    // Add star animation if it doesn't exist
    if (opts.twinkle && !document.querySelector('#star-animation')) {
      const style = document.createElement('style');
      style.id = 'star-animation';
      style.textContent = `
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
      this.elements.push(style);
    }
  }
  
  /**
   * Create nebula effects
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Nebula options
   */
  createNebulaEffects(container, options = {}) {
    // Default options
    const defaults = {
      count: this.prefersReducedMotion ? 2 : 3,
      minSize: 200,
      maxSize: 500,
      colors: [
        'hsla(210, 70%, 40%, 0.05)',
        'hsla(280, 70%, 40%, 0.05)',
        'hsla(340, 70%, 40%, 0.05)'
      ],
      animate: !this.prefersReducedMotion
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    for (let i = 0; i < opts.count; i++) {
      const nebula = document.createElement('div');
      nebula.className = 'space-nebula';
      
      // Random position
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = opts.minSize + Math.random() * (opts.maxSize - opts.minSize);
      
      // Random color
      const colorIndex = Math.floor(Math.random() * opts.colors.length);
      const color = opts.colors[colorIndex];
      
      Object.assign(nebula.style, {
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        filter: 'blur(80px)',
        opacity: '0.05'
      });
      
      container.appendChild(nebula);
      this.elements.push(nebula);
      
      // Apply animation if enabled
      if (opts.animate) {
        // Random movement
        const randomX = Math.random() * 10 - 5;
        const randomY = Math.random() * 10 - 5;
        
        // Apply animation
        nebula.style.animation = `
          nebula-float-${i} ${30 + i * 10}s infinite ease-in-out,
          nebula-pulse-${i} ${15 + i * 5}s infinite ease-in-out
        `;
        
        // Create keyframe animations
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes nebula-float-${i} {
            0%, 100% { transform: translate(${randomX}px, ${randomY}px); }
            50% { transform: translate(${-randomX}px, ${-randomY}px); }
          }
          @keyframes nebula-pulse-${i} {
            0%, 100% { opacity: 0.03; filter: blur(80px); }
            50% { opacity: 0.08; filter: blur(70px); }
          }
        `;
        document.head.appendChild(styleSheet);
        this.elements.push(styleSheet);
      }
    }
  }
  
  /**
   * Create gradient background
   * 
   * @param {HTMLElement} container - Container element
   * @param {Array} colors - Array of colors for gradient
   */
  createGradientBackground(container, colors = ['#070b14', '#0e1525']) {
    // Create gradient element
    const gradient = document.createElement('div');
    gradient.className = 'gradient-background';
    
    // Apply gradient
    Object.assign(gradient.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(to bottom, ${colors.join(', ')})`
    });
    
    container.appendChild(gradient);
    this.elements.push(gradient);
  }
  
  /**
   * Create particle effect
   * 
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Particle options
   */
  createParticleEffect(container, options = {}) {
    // Skip if reduced motion is preferred
    if (this.prefersReducedMotion && !options.ignoreReducedMotion) {
      return;
    }
    
    // Default options
    const defaults = {
      particleCount: 50,
      particleColor: 'rgba(255, 255, 255, 0.5)',
      minSize: 1,
      maxSize: 3,
      speed: 1,
      linked: true,
      linkColor: 'rgba(255, 255, 255, 0.1)',
      linkDistance: 150
    };
    
    // Merge with provided options
    const opts = { ...defaults, ...options };
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    
    Object.assign(canvas.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    });
    
    container.appendChild(canvas);
    this.elements.push(canvas);
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    const particles = [];
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < opts.particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (opts.maxSize - opts.minSize) + opts.minSize,
        vx: (Math.random() - 0.5) * opts.speed,
        vy: (Math.random() - 0.5) * opts.speed
      });
    }
    
    // Animation function
    const animate = () => {
      if (this.isPaused) {
        this.animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = opts.particleColor;
        ctx.fill();
        
        // Draw links
        if (opts.linked) {
          particles.forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < opts.linkDistance) {
              const opacity = 1 - (distance / opts.linkDistance);
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = opts.linkColor.replace(')', `, ${opacity})`).replace('rgba', 'rgba');
              ctx.stroke();
            }
          });
        }
      });
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * Update background responsiveness
   */
  updateBackgroundResponsiveness() {
    // Get viewport dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust background based on viewport size
    if (width < 768) {
      // Mobile: reduce complexity
      this.reduceBackgroundComplexity();
    } else {
      // Desktop: restore full complexity
      this.restoreBackgroundComplexity();
    }
    
    // Adjust for reduced motion preference
    if (this.prefersReducedMotion) {
      this.pauseAnimations();
    } else {
      this.resumeAnimations();
    }
  }
  
  /**
   * Reduce background complexity for performance
   * 
   * @private
   */
  reduceBackgroundComplexity() {
    // Implement based on background type
    switch (this.type) {
      case 'stars':
        // Hide some stars
        const stars = this.bgContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
          if (index % 2 === 0) {
            star.style.display = 'none';
          }
        });
        break;
      case 'particles':
        // Pause particle animation
        this.pauseAnimations();
        break;
      case 'nebula':
        // Reduce blur for better performance
        const nebulas = this.bgContainer.querySelectorAll('.space-nebula');
        nebulas.forEach(nebula => {
          nebula.style.filter = 'blur(40px)';
        });
        break;
    }
  }
  
  /**
   * Restore full background complexity
   * 
   * @private
   */
  restoreBackgroundComplexity() {
    // Implement based on background type
    switch (this.type) {
      case 'stars':
        // Show all stars
        const stars = this.bgContainer.querySelectorAll('.star');
        stars.forEach(star => {
          star.style.display = '';
        });
        break;
      case 'particles':
        // Resume particle animation if not reduced motion
        if (!this.prefersReducedMotion) {
          this.resumeAnimations();
        }
        break;
      case 'nebula':
        // Restore blur
        const nebulas = this.bgContainer.querySelectorAll('.space-nebula');
        nebulas.forEach(nebula => {
          nebula.style.filter = 'blur(80px)';
        });
        break;
    }
  }
  
  /**
   * Pause background animations
   */
  pauseAnimations() {
    this.isPaused = true;
    
    // Pause CSS animations
    if (this.bgContainer) {
      this.bgContainer.querySelectorAll('.star, .space-nebula').forEach(element => {
        element.style.animationPlayState = 'paused';
      });
    }
  }
  
  /**
   * Resume background animations
   */
  resumeAnimations() {
    this.isPaused = false;
    
    // Resume CSS animations
    if (this.bgContainer) {
      this.bgContainer.querySelectorAll('.star, .space-nebula').forEach(element => {
        element.style.animationPlayState = 'running';
      });
    }
  }
  
  /**
   * Clean up background
   */
  cleanupBackground() {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.updateBackgroundResponsiveness);
    
    // Remove elements
    this.elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clear elements array
    this.elements = [];
    
    // Remove background container
    if (this.bgContainer && this.bgContainer.parentNode) {
      this.bgContainer.parentNode.removeChild(this.bgContainer);
      this.bgContainer = null;
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clean up background
    this.cleanupBackground();
    
    // Remove event listeners
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.removeEventListener('change', this.handleReducedMotionChange);
      motionQuery.removeListener(this.handleReducedMotionChange);
    }
  }
}

// Create singleton instance
export const backgroundManager = new BackgroundManager();
