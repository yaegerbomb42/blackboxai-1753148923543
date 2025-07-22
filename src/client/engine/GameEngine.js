import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from '../../shared/config.js';
import { SceneManager } from '../managers/SceneManager.js';
import { PhysicsManager } from '../managers/PhysicsManager.js';
import { InputManager } from '../managers/InputManager.js';
import { CameraManager } from '../managers/CameraManager.js';
import { SpiderController } from '../entities/SpiderController.js';
import { FlyManager } from '../managers/FlyManager.js';
import { WebManager } from '../managers/WebManager.js';
import { UIManager } from '../managers/UIManager.js';

export class GameEngine {
  constructor() {
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // Managers
    this.sceneManager = new SceneManager();
    this.physicsManager = new PhysicsManager();
    this.inputManager = new InputManager();
    this.cameraManager = new CameraManager();
    this.flyManager = new FlyManager();
    this.webManager = new WebManager();
    this.uiManager = new UIManager();
    
    // Entities
    this.spider = null;
    
    // Game state
    this.gameState = {
      players: new Map(),
      flies: [],
      score: 0
    };
  }

  async init() {
    console.log('Initializing game engine...');
    
    try {
      // Initialize renderer
      this.initRenderer();
      
      // Initialize managers
      await this.sceneManager.init();
      this.physicsManager.init();
      this.inputManager.init();
      this.cameraManager.init(this.renderer);
      
      // Create spider player
      this.spider = new SpiderController();
      await this.spider.init(this.sceneManager.scene, this.cameraManager.camera);
      this.sceneManager.add(this.spider.mesh);
      this.physicsManager.addBody(this.spider.body);
      
      // Set up spider death callback
      this.spider.onDeath = () => {
        this.handlePlayerDeath();
      };
      
      // Initialize other managers
      this.flyManager.init(this.sceneManager, this.physicsManager);
      this.webManager.init(this.sceneManager, this.physicsManager);
      this.uiManager.init();
      
      // Setup camera to follow spider
      this.cameraManager.setTarget(this.spider.mesh);
      
      // Spawn initial flies
      this.flyManager.spawnFlies(GAME_CONFIG.gameplay.flyCount);
      
      console.log('Game engine initialized');
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
      this.uiManager.displayError('Failed to initialize game. Please refresh the page.');
      throw error;
    }
  }

  initRenderer() {
    const container = document.getElementById('gameContainer');
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB, 1); // Sky blue
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);
  }

  update() {
    try {
      const deltaTime = this.clock.getDelta();
      
      // Skip update if game is paused
      if (this.uiManager.isPaused) {
        return;
      }
      
      // Update physics
      this.physicsManager.update(deltaTime);
      
      // Update input
      this.inputManager.update();
      
      // Update spider
      if (this.spider && !this.spider.isDead) {
        this.spider.update(deltaTime, this.inputManager.getInputState());
      }
      
      // Update camera
      this.cameraManager.update(deltaTime, this.inputManager.getInputState());
      
      // Update flies
      this.flyManager.update(deltaTime);
      
      // Update web system
      this.webManager.update(deltaTime);
      
      // Check for collisions
      this.checkCollisions();
      
      // Update UI
      this.updateUI();
      
      // Update minimap
      if (this.spider) {
        this.uiManager.updateMinimap(this.spider.getPosition(), this.flyManager.getFlies());
      }
    } catch (error) {
      console.error('Game loop error:', error);
      this.uiManager.displayError('An error occurred during game update.');
    }
  }

  render() {
    try {
      this.renderer.render(this.sceneManager.scene, this.cameraManager.camera);
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  checkCollisions() {
    // Check spider-fly collisions
    const spiderPosition = this.spider.mesh.position;
    
    this.flyManager.flies.forEach((fly, index) => {
      const distance = spiderPosition.distanceTo(fly.mesh.position);
      if (distance < 0.5) { // Collision threshold
        this.catchFly(index);
      }
    });
    
    // Check web-fly collisions
    this.webManager.checkFlyCollisions(this.flyManager.flies, (flyIndex) => {
      this.catchFly(flyIndex);
    });
  }

  catchFly(flyIndex) {
    const fly = this.flyManager.flies[flyIndex];
    if (fly) {
      this.gameState.score += fly.points;
      this.flyManager.removeFly(flyIndex);
      this.flyManager.spawnFly(); // Spawn a new one
    }
  }

  updateUI() {
    if (this.spider) {
      this.uiManager.updateHealth(this.spider.health);
      this.uiManager.updateStamina(this.spider.stamina);
    }
    this.uiManager.updateScore(this.gameState.score);
  }

  handlePlayerDeath() {
    console.log('Player died - showing game over screen');
    this.uiManager.showGameOver(this.gameState.score);
    
    // Respawn after delay
    setTimeout(() => {
      if (this.spider) {
        this.spider.respawn();
        this.gameState.score = Math.max(0, this.gameState.score - 50); // Penalty for dying
        this.uiManager.hideGameOver();
      }
    }, 3000);
  }

  updatePlayer(data) {
    // Handle multiplayer player updates
    if (data.id !== this.spider?.id) {
      // Update other players
      // TODO: Implement multiplayer player rendering
      if (this.gameState.players.has(data.id)) {
        const player = this.gameState.players.get(data.id);
        // Update player position, health, etc.
        if (player.mesh) {
          player.mesh.position.copy(data.position);
          player.mesh.quaternion.copy(data.rotation);
        }
      }
    }
  }

  updateGameState(state) {
    // Update game state from server
    this.gameState = { ...this.gameState, ...state };
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.cameraManager.camera.aspect = width / height;
    this.cameraManager.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
