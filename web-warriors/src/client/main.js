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
  }

  async init() {
    console.log('Initializing Web Warriors...');

    try {
      // Show loading screen
      this.loadingManager.show();

      // Initialize socket connection
      await this.initSocket();
      this.loadingManager.updateProgress(20, 'Connecting to server...');

      // Initialize game engine
      this.engine = new GameEngine();
      await this.engine.init();
      this.loadingManager.updateProgress(80, 'Loading game assets...');

      // Start game loop
      this.startGameLoop();
      this.loadingManager.updateProgress(100, 'Ready!');

      // Hide loading screen
      setTimeout(() => {
        this.loadingManager.hide();
        this.showGameUI();
        if (this.engine && this.engine.uiManager) {
          this.engine.uiManager.updateConnectionStatus(this.isConnected);
        }
      }, 500);

      this.isInitialized = true;
      console.log('Game initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }

  async initSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io('http://localhost:3001');

      this.socket.on('connect', () => {
        console.log('Connected to game server');
        this.isConnected = true;
        if (this.engine && this.engine.uiManager) {
          this.engine.uiManager.updateConnectionStatus(true);
        }
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection failed:', error);
        this.isConnected = false;
        if (this.engine && this.engine.uiManager) {
          this.engine.uiManager.updateConnectionStatus(false);
        }
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        if (this.engine && this.engine.uiManager) {
          this.engine.uiManager.updateConnectionStatus(false);
        }
      });

      this.socket.on('playerUpdate', (data) => {
        if (this.engine) {
          this.engine.updatePlayer(data);
        }
      });

      this.socket.on('gameState', (state) => {
        if (this.engine) {
          this.engine.updateGameState(state);
        }
      });
    });
  }

  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.engine && this.isInitialized) {
        this.engine.update();
        this.engine.render();
      }
    };

    animate();
  }

  showGameUI() {
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('minimap').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  const game = new Game();
  window.game = game;
  game.init().catch((error) => {
    console.error('Failed to start game:', error);
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
      <h3>Failed to Start Game</h3>
      <p>Please refresh the page and try again.</p>
      <button onclick="location.reload()" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
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
  if (
    e.key === 'Escape' &&
    window.game &&
    window.game.engine &&
    window.game.engine.uiManager
  ) {
    e.preventDefault();
    if (window.game.engine.uiManager.isPaused) {
      window.game.engine.uiManager.hidePauseMenu();
    } else {
      window.game.engine.uiManager.showPauseMenu();
    }
  }
});

// Handle visibility change (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
  if (window.game && window.game.engine && window.game.engine.uiManager) {
    if (document.hidden) {
      window.game.engine.uiManager.showPauseMenu();
    }
  }
});

export { Game };
