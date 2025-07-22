const { GAME_CONFIG } = require('../../shared/config');

class Player {
  constructor(id, playerData, socket) {
    this.id = id;
    this.name = playerData.name || `Player${id.substring(0, 6)}`;
    this.socket = socket;
    this.room = null;
    
    // Player state
    this.position = { x: 0, y: 2, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = GAME_CONFIG.gameplay.maxHealth;
    this.stamina = GAME_CONFIG.gameplay.maxStamina;
    this.score = 0;
    
    // Game state
    this.isGrounded = false;
    this.isClimbing = false;
    this.isSwinging = false;
    this.webTarget = null;
    this.lastWebShot = 0;
    
    // Input state
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shoot: false,
      mouseX: 0,
      mouseY: 0
    };
    
    // Physics properties
    this.moveSpeed = 5;
    this.jumpForce = GAME_CONFIG.physics.jumpForce;
    this.mass = 1;
    
    console.log(`Player created: ${this.name} (${this.id})`);
  }

  update(deltaTime) {
    // Update movement
    this.updateMovement(deltaTime);
    
    // Update stamina
    this.updateStamina(deltaTime);
    
    // Update web mechanics
    this.updateWeb(deltaTime);
    
    // Apply physics
    this.applyPhysics(deltaTime);
    
    // Validate position (keep in bounds)
    this.validatePosition();
  }

  updateMovement(deltaTime) {
    const input = this.inputState;
    const force = { x: 0, y: 0, z: 0 };
    
    // Calculate movement forces
    if (input.forward) force.z -= this.moveSpeed;
    if (input.backward) force.z += this.moveSpeed;
    if (input.left) force.x -= this.moveSpeed;
    if (input.right) force.x += this.moveSpeed;
    
    // Apply movement to velocity
    this.velocity.x += force.x * deltaTime;
    this.velocity.z += force.z * deltaTime;
    
    // Jumping
    if (input.jump && (this.isGrounded || this.isClimbing) && this.stamina > 10) {
      this.velocity.y = this.jumpForce;
      this.stamina -= 10;
      this.isGrounded = false;
    }
  }

  updateStamina(deltaTime) {
    // Regenerate stamina when not using it
    if (!this.isSwinging && this.stamina < GAME_CONFIG.gameplay.maxStamina) {
      this.stamina += GAME_CONFIG.gameplay.staminaRegenRate * deltaTime;
      this.stamina = Math.min(this.stamina, GAME_CONFIG.gameplay.maxStamina);
    }
    
    // Drain stamina while swinging
    if (this.isSwinging) {
      this.stamina -= GAME_CONFIG.gameplay.webSwingStaminaCost * deltaTime;
      if (this.stamina <= 0) {
        this.breakWeb();
      }
    }
    
    // Clamp stamina
    this.stamina = Math.max(0, this.stamina);
  }

  updateWeb(deltaTime) {
    const currentTime = Date.now();
    
    // Handle web shooting
    if (this.inputState.shoot && 
        currentTime - this.lastWebShot > GAME_CONFIG.gameplay.webCooldown &&
        this.stamina > 20) {
      
      this.shootWeb();
      this.lastWebShot = currentTime;
    }
    
    // Update web swinging physics
    if (this.isSwinging && this.webTarget) {
      this.applyWebPhysics(deltaTime);
    }
  }

  applyPhysics(deltaTime) {
    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y += GAME_CONFIG.physics.gravity * deltaTime;
    }
    
    // Apply air resistance
    this.velocity.x *= GAME_CONFIG.physics.airResistance;
    this.velocity.z *= GAME_CONFIG.physics.airResistance;
    
    // Ground friction
    if (this.isGrounded) {
      this.velocity.x *= GAME_CONFIG.physics.groundFriction;
      this.velocity.z *= GAME_CONFIG.physics.groundFriction;
    }
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Simple ground collision
    if (this.position.y <= 0.3) {
      this.position.y = 0.3;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  validatePosition() {
    // Keep player within room bounds
    const roomBounds = 19; // Room is 40x40, keep player slightly inside
    
    this.position.x = Math.max(-roomBounds, Math.min(roomBounds, this.position.x));
    this.position.z = Math.max(-roomBounds, Math.min(roomBounds, this.position.z));
    this.position.y = Math.max(0.3, Math.min(11, this.position.y));
  }

  shootWeb() {
    // Simple web shooting - target point in front of player
    const webRange = 10;
    const direction = {
      x: Math.sin(this.rotation.y),
      y: 0.5, // Aim slightly upward
      z: Math.cos(this.rotation.y)
    };
    
    this.webTarget = {
      x: this.position.x + direction.x * webRange,
      y: this.position.y + direction.y * webRange,
      z: this.position.z + direction.z * webRange
    };
    
    this.isSwinging = true;
    this.stamina -= 20;
    
    console.log(`${this.name} shot web to:`, this.webTarget);
  }

  applyWebPhysics(deltaTime) {
    if (!this.webTarget) return;
    
    // Calculate direction to web target
    const dx = this.webTarget.x - this.position.x;
    const dy = this.webTarget.y - this.position.y;
    const dz = this.webTarget.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 0) {
      // Apply web tension force
      const webForce = GAME_CONFIG.physics.webStrength;
      const normalizedDirection = {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      };
      
      this.velocity.x += normalizedDirection.x * webForce * deltaTime;
      this.velocity.y += normalizedDirection.y * webForce * deltaTime;
      this.velocity.z += normalizedDirection.z * webForce * deltaTime;
    }
  }

  breakWeb() {
    this.isSwinging = false;
    this.webTarget = null;
    console.log(`${this.name} web broke`);
  }

  updateInput(inputData) {
    this.inputState = { ...this.inputState, ...inputData };
    
    // Update rotation based on mouse input
    this.rotation.y += inputData.mouseX || 0;
    this.rotation.x += inputData.mouseY || 0;
    
    // Clamp vertical rotation
    this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
  }

  takeDamage(amount) {
    this.health -= amount;
    this.health = Math.max(0, this.health);
    
    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.health += amount;
    this.health = Math.min(this.health, GAME_CONFIG.gameplay.maxHealth);
  }

  addScore(points) {
    this.score += points;
  }

  die() {
    console.log(`${this.name} died!`);
    
    // Reset player state
    this.health = GAME_CONFIG.gameplay.maxHealth;
    this.stamina = GAME_CONFIG.gameplay.maxStamina;
    this.position = { x: 0, y: 2, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.breakWeb();
    
    // Notify player
    this.socket.emit('playerDied', { 
      reason: 'Health depleted',
      score: this.score 
    });
  }

  respawn() {
    this.position = { x: 0, y: 2, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = GAME_CONFIG.gameplay.maxHealth;
    this.stamina = GAME_CONFIG.gameplay.maxStamina;
    this.breakWeb();
    
    console.log(`${this.name} respawned`);
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      stamina: this.stamina,
      score: this.score,
      isClimbing: this.isClimbing,
      isSwinging: this.isSwinging,
      webTarget: this.webTarget
    };
  }

  setRoom(room) {
    this.room = room;
  }
}

module.exports = Player;
