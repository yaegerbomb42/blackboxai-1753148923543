export class UIManager {
  constructor() {
    this.healthElement = null;
    this.staminaElement = null;
    this.scoreElement = null;
    this.minimapCanvas = null;
    this.minimapContext = null;
  }

  init() {
    console.log('Initializing UI manager...');
    
    // Get UI elements
    this.healthElement = document.getElementById('healthValue');
    this.staminaElement = document.getElementById('staminaValue');
    this.scoreElement = document.getElementById('scoreValue');
    this.minimapCanvas = document.getElementById('minimapCanvas');
    
    if (this.minimapCanvas) {
      this.minimapContext = this.minimapCanvas.getContext('2d');
      this.initMinimap();
    }
    
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
        x: 10 + (worldPos.x + roomSize/2) * scale,
        y: 10 + (worldPos.z + roomSize/2) * scale // Note: using z for y in 2D map
      };
    };
    
    // Draw player
    if (playerPosition) {
      const playerMapPos = worldToMinimap(playerPosition);
      this.minimapContext.fillStyle = '#00ff00';
      this.minimapContext.beginPath();
      this.minimapContext.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
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
    flies.forEach(fly => {
      const flyMapPos = worldToMinimap(fly.mesh.position);
      this.minimapContext.fillStyle = '#ffff00';
      this.minimapContext.beginPath();
      this.minimapContext.arc(flyMapPos.x, flyMapPos.y, 2, 0, Math.PI * 2);
      this.minimapContext.fill();
    });
    
    // Draw other players
    otherPlayers.forEach(player => {
      const playerMapPos = worldToMinimap(player.position);
      this.minimapContext.fillStyle = '#ff0000';
      this.minimapContext.beginPath();
      this.minimapContext.arc(playerMapPos.x, playerMapPos.y, 3, 0, Math.PI * 2);
      this.minimapContext.fill();
    });
  }

  showGameOver(score, reason = 'Game Over') {
    // Create game over overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 24px;
      z-index: 1000;
    `;
    
    overlay.innerHTML = `
      <h1>${reason}</h1>
      <p>Final Score: ${score}</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 10px 20px;
        font-size: 18px;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Play Again</button>
    `;
    
    document.body.appendChild(overlay);
  }

  showPauseMenu() {
    const overlay = document.createElement('div');
    overlay.id = 'pauseMenu';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 20px;
      z-index: 1000;
    `;
    
    overlay.innerHTML = `
      <h1>Game Paused</h1>
      <button onclick="this.parentElement.remove()" style="
        margin: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Resume</button>
      <button onclick="location.reload()" style="
        margin: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background: #cc0000;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      ">Restart</button>
    `;
    
    document.body.appendChild(overlay);
  }

  hidePauseMenu() {
    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) {
      pauseMenu.remove();
    }
  }

  showNotification(message, duration = 3000, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 5px;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionIndicator') || this.createConnectionIndicator();
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
