export class UIManager {
  constructor() {
    this.healthElement = null;
    this.staminaElement = null;
    this.scoreElement = null;
    this.minimapCanvas = null;
    this.minimapContext = null;
    this.isPaused = false;
    this.isGameOver = false;
    this.elements = {};
  }

  init() {
    console.log('Initializing UI manager...');

    // Get existing UI elements
    this.healthElement = document.getElementById('healthValue');
    this.staminaElement = document.getElementById('staminaValue');
    this.scoreElement = document.getElementById('scoreValue');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    if (this.minimapCanvas) {
      this.minimapContext = this.minimapCanvas.getContext('2d');
      this.initMinimap();
    }

    // Create modern UI elements
    this.createModernUI();

    console.log('UI manager initialized');
  }

  initMinimap() {
    if (!this.minimapContext) return;

    // Set up minimap
    this.minimapContext.fillStyle = '#000';
    this.minimapContext.fillRect(0, 0, 196, 196);

    // Draw room outline
    this.minimapContext.strokeStyle = '#fff';
    this.minimapContext.lineWidth = 2;
    this.minimapContext.strokeRect(10, 10, 176, 176);
  }

  updateHealth(health) {
    if (this.healthElement) {
      this.healthElement.textContent = Math.round(health);

      // Change color based on health
      const healthBar = this.healthElement.parentElement.parentElement;
      if (health < 30) {
        healthBar.style.background = 'rgba(255, 0, 0, 0.7)';
      } else if (health < 60) {
        healthBar.style.background = 'rgba(255, 255, 0, 0.7)';
      } else {
        healthBar.style.background = 'rgba(0, 0, 0, 0.5)';
      }
    }
  }

  updateStamina(stamina) {
    if (this.staminaElement) {
      this.staminaElement.textContent = Math.round(stamina);

      // Change color based on stamina
      const staminaBar = this.staminaElement.parentElement.parentElement;
      if (stamina < 20) {
        staminaBar.style.background = 'rgba(255, 165, 0, 0.7)';
      } else {
        staminaBar.style.background = 'rgba(0, 0, 0, 0.5)';
      }
    }
  }

  updateScore(score) {
    if (this.scoreElement) {
      this.scoreElement.textContent = score;
    }
  }

  updateMinimap(playerPosition, flies = [], otherPlayers = []) {
    if (!this.minimapContext) return;

    // Clear minimap
    this.minimapContext.fillStyle = '#000';
    this.minimapContext.fillRect(0, 0, 196, 196);

    // Draw room outline
    this.minimapContext.strokeStyle = '#fff';
    this.minimapContext.lineWidth = 2;
    this.minimapContext.strokeRect(10, 10, 176, 176);

    // Convert world coordinates to minimap coordinates
    const worldToMinimap = (worldPos) => {
      const roomSize = 40; // World room size
      const mapSize = 176; // Minimap room size
      const scale = mapSize / roomSize;

      return {
        x: 10 + (worldPos.x + roomSize / 2) * scale,
        y: 10 + (worldPos.z + roomSize / 2) * scale, // Note: using z for y in 2D map
      };
    };

    // Draw player
    if (playerPosition) {
      const playerMapPos = worldToMinimap(playerPosition);
      this.minimapContext.fillStyle = '#00ff00';
      this.minimapContext.beginPath();
      this.minimapContext.arc(
        playerMapPos.x,
        playerMapPos.y,
        4,
        0,
        Math.PI * 2
      );
      this.minimapContext.fill();

      // Draw player direction indicator
      this.minimapContext.strokeStyle = '#00ff00';
      this.minimapContext.lineWidth = 2;
      this.minimapContext.beginPath();
      this.minimapContext.moveTo(playerMapPos.x, playerMapPos.y);
      this.minimapContext.lineTo(playerMapPos.x, playerMapPos.y - 8);
      this.minimapContext.stroke();
    }

    // Draw flies
    flies.forEach((fly) => {
      const flyMapPos = worldToMinimap(fly.mesh.position);
      this.minimapContext.fillStyle = '#ffff00';
      this.minimapContext.beginPath();
      this.minimapContext.arc(flyMapPos.x, flyMapPos.y, 2, 0, Math.PI * 2);
      this.minimapContext.fill();
    });

    // Draw other players
    otherPlayers.forEach((player) => {
      const playerMapPos = worldToMinimap(player.position);
      this.minimapContext.fillStyle = '#ff0000';
      this.minimapContext.beginPath();
      this.minimapContext.arc(
        playerMapPos.x,
        playerMapPos.y,
        3,
        0,
        Math.PI * 2
      );
      this.minimapContext.fill();
    });
  }

  createModernUI() {
    // Create crosshair
    this.elements.crosshair = this.createElement('div', 'modern-crosshair', {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '50',
    });

    // Create notification container
    this.elements.notificationContainer = this.createElement(
      'div',
      'notification-container',
      {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '200',
        maxWidth: '300px',
      }
    );

    // Add elements to DOM
    document.body.appendChild(this.elements.crosshair);
    document.body.appendChild(this.elements.notificationContainer);
  }

  createElement(tag, id, styles = {}, textContent = '') {
    const element = document.createElement(tag);
    element.id = id;

    Object.assign(element.style, styles);

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  createButton(text, onClick) {
    const button = this.createElement(
      'button',
      `btn-${text.toLowerCase().replace(/\s+/g, '-')}`,
      {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        color: '#ffffff',
        padding: '12px 24px',
        margin: '8px',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        fontFamily: 'Arial, sans-serif',
        transition: 'all 0.3s ease',
        minWidth: '120px',
      },
      text
    );

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.1)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });

    button.addEventListener('click', onClick);
    return button;
  }

  showGameOver(score, reason = 'Game Over') {
    this.isGameOver = true;

    // Remove existing game over screen
    const existing = document.getElementById('modern-gameover-overlay');
    if (existing) existing.remove();

    // Create modern game over overlay
    const overlay = this.createElement('div', 'modern-gameover-overlay', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      backdropFilter: 'blur(5px)',
    });

    // Game over container
    const container = this.createElement('div', 'gameover-container', {
      background: 'rgba(20, 20, 20, 0.95)',
      padding: '40px',
      borderRadius: '15px',
      textAlign: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      minWidth: '350px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
    });

    // Title
    const title = this.createElement(
      'h2',
      'gameover-title',
      {
        margin: '0 0 20px 0',
        fontSize: '32px',
        fontWeight: 'normal',
        color: '#ff4444',
      },
      reason
    );

    // Score
    const scoreDisplay = this.createElement(
      'div',
      'final-score-display',
      {
        fontSize: '18px',
        marginBottom: '30px',
        color: '#cccccc',
      },
      `Final Score: ${score}`
    );

    // Buttons
    const respawnButton = this.createButton('Respawn', () =>
      this.hideGameOver()
    );
    const restartButton = this.createButton('Restart Game', () =>
      this.restartGame()
    );

    // Assemble
    container.appendChild(title);
    container.appendChild(scoreDisplay);
    container.appendChild(respawnButton);
    container.appendChild(restartButton);
    overlay.appendChild(container);

    document.body.appendChild(overlay);
    document.body.style.cursor = 'default';
  }

  hideGameOver() {
    this.isGameOver = false;
    const overlay = document.getElementById('modern-gameover-overlay');
    if (overlay) {
      overlay.remove();
    }
    document.body.style.cursor = 'none';
  }

  showPauseMenu() {
    this.isPaused = true;

    // Remove existing pause menu
    const existing = document.getElementById('modern-pause-overlay');
    if (existing) existing.remove();

    // Create modern pause overlay
    const overlay = this.createElement('div', 'modern-pause-overlay', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      backdropFilter: 'blur(5px)',
    });

    // Pause menu container
    const container = this.createElement('div', 'pause-container', {
      background: 'rgba(20, 20, 20, 0.95)',
      padding: '40px',
      borderRadius: '15px',
      textAlign: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      minWidth: '300px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
    });

    // Title
    const title = this.createElement(
      'h2',
      'pause-title',
      {
        margin: '0 0 30px 0',
        fontSize: '28px',
        fontWeight: 'normal',
      },
      'Game Paused'
    );

    // Buttons
    const resumeButton = this.createButton('Resume', () =>
      this.hidePauseMenu()
    );
    const restartButton = this.createButton('Restart', () =>
      this.restartGame()
    );
    const settingsButton = this.createButton('Settings', () =>
      this.showSettings()
    );

    // Assemble
    container.appendChild(title);
    container.appendChild(resumeButton);
    container.appendChild(restartButton);
    container.appendChild(settingsButton);
    overlay.appendChild(container);

    // Handle clicks outside menu to resume
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hidePauseMenu();
      }
    });

    document.body.appendChild(overlay);
    document.body.style.cursor = 'default';
  }

  hidePauseMenu() {
    this.isPaused = false;
    const overlay = document.getElementById('modern-pause-overlay');
    if (overlay) {
      overlay.remove();
    }
    document.body.style.cursor = 'none';
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = this.createElement(
      'div',
      `notification-${Date.now()}`,
      {
        background: this.getNotificationColor(type),
        color: '#ffffff',
        padding: '12px 16px',
        marginBottom: '8px',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        border: `2px solid ${this.getNotificationBorderColor(type)}`,
      },
      message
    );

    this.elements.notificationContainer.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  getNotificationColor(type) {
    switch (type) {
      case 'error':
        return 'rgba(255, 68, 68, 0.9)';
      case 'success':
        return 'rgba(68, 255, 68, 0.9)';
      case 'info':
        return 'rgba(68, 136, 255, 0.9)';
      default:
        return 'rgba(68, 136, 255, 0.9)';
    }
  }

  getNotificationBorderColor(type) {
    switch (type) {
      case 'error':
        return 'rgba(255, 68, 68, 0.5)';
      case 'success':
        return 'rgba(68, 255, 68, 0.5)';
      case 'info':
        return 'rgba(68, 136, 255, 0.5)';
      default:
        return 'rgba(68, 136, 255, 0.5)';
    }
  }

  // Convenience methods for different notification types
  displayError(message) {
    this.showNotification(message, 'error', 5000);
  }

  displaySuccess(message) {
    this.showNotification(message, 'success', 3000);
  }

  displayInfo(message) {
    this.showNotification(message, 'info', 3000);
  }

  // Game control methods
  restartGame() {
    this.hidePauseMenu();
    this.hideGameOver();
    // Trigger game restart
    if (window.game && window.game.engine) {
      window.game.engine.gameState.score = 0;
      if (window.game.engine.spider) {
        window.game.engine.spider.respawn();
      }
    }
    this.displayInfo('Game restarted');
  }

  showSettings() {
    this.displayInfo('Settings menu coming soon!');
  }

  updateConnectionStatus(connected) {
    const indicator =
      document.getElementById('connectionIndicator') ||
      this.createConnectionIndicator();
    indicator.style.background = connected ? '#4CAF50' : '#f44336';
    indicator.title = connected ? 'Connected' : 'Disconnected';
  }

  createConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connectionIndicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 240px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #4CAF50;
      z-index: 100;
    `;
    document.body.appendChild(indicator);
    return indicator;
  }
}
