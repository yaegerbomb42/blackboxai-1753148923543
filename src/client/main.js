import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { io } from 'socket.io-client';
import { GameEngine } from './engine/GameEngine.js';
import { LoadingManager } from './managers/LoadingManager.js';

class Game {
  constructor() {
    this.engine = null;
    this.socket = null;
    this.loadingManager = new LoadingManager();
    this.isConnected = false;
    this.isInitialized = false;
    this.gameStarted = false;
    this.menuElements = {};
  }

  async init() {
    console.log('Initializing Web Warriors Home...');

    try {
      // Initialize menu system
      this.initMenuSystem();
      
      // Show main menu initially
      this.showMainMenu();

    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showError('Failed to initialize game. Please refresh the page.');
    }
  }

  initMenuSystem() {
    // Get menu elements
    this.menuElements = {
      mainMenu: document.getElementById('mainMenu'),
      loadingScreen: document.getElementById('loadingScreen'),
      startGameBtn: document.getElementById('startGameBtn'),
      settingsBtn: document.getElementById('settingsBtn'),
      controlsBtn: document.getElementById('controlsBtn'),
      leaderboardBtn: document.getElementById('leaderboardBtn'),
      todoBtn: document.getElementById('todoBtn'),
      hud: document.getElementById('hud'),
      minimap: document.getElementById('minimap'),
      crosshair: document.getElementById('crosshair'),
      controlsInfo: document.getElementById('controlsInfo')
    };

    // Add event listeners
    this.menuElements.startGameBtn.addEventListener('click', () => this.startGame());
    this.menuElements.settingsBtn.addEventListener('click', () => this.showSettings());
    this.menuElements.controlsBtn.addEventListener('click', () => this.toggleControls());
    this.menuElements.leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
    this.menuElements.todoBtn.addEventListener('click', () => this.showTodoPage());

    console.log('Menu system initialized');
  }

  showMainMenu() {
    this.menuElements.mainMenu.classList.remove('hidden');
    this.menuElements.loadingScreen.classList.add('hidden');
    this.hideGameUI();
  }

  async startGame() {
    if (this.gameStarted) return;

    try {
      // Hide main menu and show loading
      this.menuElements.mainMenu.classList.add('hidden');
      this.menuElements.loadingScreen.classList.remove('hidden');
      
      // Initialize loading manager
      this.loadingManager.updateProgress(10, 'Preparing your spider home...');

      // Initialize socket connection (optional for single player)
      try {
        await this.initSocket();
        this.loadingManager.updateProgress(30, 'Connecting to web...');
      } catch (socketError) {
        console.warn('Socket connection failed, continuing in offline mode:', socketError);
        this.loadingManager.updateProgress(30, 'Starting in offline mode...');
      }

      // Initialize game engine
      this.loadingManager.updateProgress(50, 'Building your home...');
      this.engine = new GameEngine();
      await this.engine.init();
      
      this.loadingManager.updateProgress(80, 'Spawning insects...');
      
      // Start game loop
      this.startGameLoop();
      this.loadingManager.updateProgress(100, 'Welcome home!');

      // Hide loading screen and show game
      setTimeout(() => {
        this.menuElements.loadingScreen.classList.add('hidden');
        this.showGameUI();
        this.gameStarted = true;
        
        if (this.engine && this.engine.uiManager) {
          this.engine.uiManager.updateConnectionStatus(this.isConnected);
        }
      }, 1000);

      this.isInitialized = true;
      console.log('Game started successfully!');
      
    } catch (error) {
      console.error('Failed to start game:', error);
      this.showError('Failed to start game. Please try again.');
      this.showMainMenu();
    }
  }

  async initSocket() {
    // Skip server connection for now - run in offline mode
    console.log('Running in offline mode (server connection skipped)');
    this.isConnected = false;
    return Promise.resolve();
  }

  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.engine && this.isInitialized && this.gameStarted) {
        try {
          this.engine.update();
          this.engine.render();
        } catch (error) {
          console.error('Game loop error:', error);
        }
      }
    };

    animate();
  }

  showGameUI() {
    this.menuElements.hud.classList.remove('hidden');
    this.menuElements.minimap.classList.remove('hidden');
    this.menuElements.crosshair.classList.remove('hidden');
    this.menuElements.controlsInfo.classList.remove('hidden');
  }

  hideGameUI() {
    this.menuElements.hud.classList.add('hidden');
    this.menuElements.minimap.classList.add('hidden');
    this.menuElements.crosshair.classList.add('hidden');
    this.menuElements.controlsInfo.classList.add('hidden');
  }

  showSettings() {
    // TODO: Implement settings menu
    console.log('Settings menu - Coming soon!');
    alert('Settings menu coming soon!');
  }

  toggleControls() {
    const controlsInfo = this.menuElements.controlsInfo;
    if (controlsInfo.classList.contains('hidden')) {
      controlsInfo.classList.remove('hidden');
      setTimeout(() => controlsInfo.classList.add('hidden'), 5000);
    } else {
      controlsInfo.classList.add('hidden');
    }
  }

  showLeaderboard() {
    // TODO: Implement leaderboard
    console.log('Leaderboard - Coming soon!');
    alert('Leaderboard coming soon!');
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 10, 5, 0.95);
      color: #f5f5f5;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      z-index: 2000;
      font-family: 'Roboto', sans-serif;
      border: 2px solid #d4af37;
      backdrop-filter: blur(10px);
      max-width: 400px;
    `;
    errorDiv.innerHTML = `
      <h3 style="color: #d4af37; margin-bottom: 15px;">🕷️ Oops!</h3>
      <p style="margin-bottom: 20px;">${message}</p>
      <button onclick="this.parentElement.remove(); location.reload()" style="
        background: linear-gradient(45deg, #8b4513, #a0522d);
        color: #f5f5f5;
        border: 2px solid #d4af37;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='linear-gradient(45deg, #a0522d, #cd853f)'"
         onmouseout="this.style.background='linear-gradient(45deg, #8b4513, #a0522d)'">
        🔄 Refresh Page
      </button>
    `;
    document.body.appendChild(errorDiv);
  }

  returnToMenu() {
    if (this.engine) {
      // Clean up game engine
      this.engine = null;
    }
    this.gameStarted = false;
    this.isInitialized = false;
    this.hideGameUI();
    this.showMainMenu();
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  const game = new Game();
  window.game = game;
  game.init().catch((error) => {
    console.error('Failed to initialize:', error);
    game.showError('Failed to initialize the game. Please refresh the page.');
  });
});

// Handle window resize
window.addEventListener('resize', () => {
  if (window.game && window.game.engine) {
    window.game.engine.handleResize();
  }
});

// Handle pause/resume with Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.game) {
    e.preventDefault();
    
    if (window.game.gameStarted && window.game.engine && window.game.engine.uiManager) {
      // In-game pause
      if (window.game.engine.uiManager.isPaused) {
        window.game.engine.uiManager.hidePauseMenu();
      } else {
        window.game.engine.uiManager.showPauseMenu();
      }
    } else if (window.game.gameStarted) {
      // Return to main menu
      window.game.returnToMenu();
    }
  }
});

// Handle visibility change (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
  if (window.game && window.game.engine && window.game.engine.uiManager && window.game.gameStarted) {
    if (document.hidden) {
      window.game.engine.uiManager.showPauseMenu();
    }
  }
});

export { Game };
