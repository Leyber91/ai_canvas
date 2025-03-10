/**
 * ui/theme/background/SpaceBackground.js
 * 
 * Handles the creation and animation of the space-themed background
 */

export class SpaceBackground {
    /**
     * Initialize space background effects
     */
    initializeSpaceBackground() {
      // Create background container if it doesn't exist
      let bgContainer = document.querySelector('.space-background');
      
      if (!bgContainer) {
        bgContainer = document.createElement('div');
        bgContainer.className = 'space-background';
        
        Object.assign(bgContainer.style, {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #070b14 0%, #0e1525 100%)'
        });
        
        document.body.appendChild(bgContainer);
      }
      
      // Add stars
      this.addStarsToBackground(bgContainer);
      
      // Create nebula effects
      this.createNebulaEffects(bgContainer, 3);
    }
    
    /**
     * Add stars to space background
     * 
     * @param {HTMLElement} container - Container element
     */
    addStarsToBackground(container) {
      // Create stars
      const starCount = 100;
      const starsContainer = document.createElement('div');
      starsContainer.className = 'stars-container';
      
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size (0.5px to 3px)
        const size = (Math.random() * 2.5 + 0.5).toFixed(1);
        
        // Random opacity and animation delay
        const opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
        const animationDelay = (Math.random() * 10).toFixed(1);
        
        Object.assign(star.style, {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          opacity: opacity,
          animation: `star-twinkle 5s infinite ${animationDelay}s`
        });
        
        starsContainer.appendChild(star);
      }
      
      container.appendChild(starsContainer);
      
      // Add star animation if it doesn't exist
      if (!document.querySelector('#star-animation')) {
        const style = document.createElement('style');
        style.id = 'star-animation';
        style.textContent = `
          @keyframes star-twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    /**
     * Create nebula effects in the background
     * 
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of nebula elements to create
     */
    createNebulaEffects(container, count) {
      for (let i = 0; i < count; i++) {
        const nebula = document.createElement('div');
        nebula.className = 'space-nebula';
        
        // Random position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 200 + Math.random() * 300;
        
        // Random colors
        const hue = Math.floor(Math.random() * 360);
        const color = `hsla(${hue}, 70%, 40%, 0.05)`;
        
        Object.assign(nebula.style, {
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: color,
          filter: 'blur(80px)',
          opacity: '0.03'
        });
        
        container.appendChild(nebula);
        
        // Set up animation for this nebula
        const randomX = Math.random() * 10 - 5;
        const randomY = Math.random() * 10 - 5;
        
        // Apply subtle animation
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
      }
    }
  }