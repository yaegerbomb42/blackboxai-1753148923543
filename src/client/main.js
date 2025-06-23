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
  game.init();
});

// Handle window resize
window.addEventListener('resize', () => {
  if (window.game && window.game.engine) {
    window.game.engine.handleResize();
  }
});

export { Game };
