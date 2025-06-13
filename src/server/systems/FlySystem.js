const { FLY_CONFIGS, GAME_CONFIG } = require('../../shared/config');

class FlySystem {
  constructor() {
    this.flies = [];
    this.maxFlies = GAME_CONFIG.gameplay.flyCount;
    this.spawnTimer = 0;
    this.spawnInterval = GAME_CONFIG.gameplay.flyRespawnTime / 1000; // Convert to seconds
  }

  init() {
    console.log('Initializing fly system...');
    
    // Spawn initial flies
    for (let i = 0; i < this.maxFlies; i++) {
      this.spawnFly();
    }
    
    console.log(`Spawned ${this.maxFlies} flies`);
  }

  update(deltaTime) {
    // Update existing flies
    this.flies.forEach(fly => {
      this.updateFly(fly, deltaTime);
    });
    
    // Spawn new flies if needed
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0 && this.flies.length < this.maxFlies) {
      this.spawnFly();
      this.spawnTimer = this.spawnInterval;
    }
    
    // Remove flies that are out of bounds or dead
    this.flies = this.flies.filter(fly => fly.isAlive && this.isInBounds(fly.position));
  }

  spawnFly(type = null) {
    // Random fly type if not specified
    if (!type) {
      const types = Object.keys(FLY_CONFIGS);
      const weights = [60, 25, 12, 3]; // Common, Fast, Rare, Golden
      type = this.weightedRandomSelect(types, weights);
    }

    const config = FLY_CONFIGS[type];
    const fly = {
      id: this.generateId(),
      type: type,
      position: this.getRandomPosition(),
      velocity: this.getRandomVelocity(config.speed),
      direction: this.getRandomDirection(),
      speed: config.speed,
      points: config.points,
      color: config.color,
      size: config.size,
      isAlive: true,
      changeDirectionTimer: this.randomInRange(1, 3),
      wingPhase: Math.random() * Math.PI * 2
    };

    this.flies.push(fly);
    return fly;
  }

  updateFly(fly, deltaTime) {
    // Update direction change timer
    fly.changeDirectionTimer -= deltaTime;
    if (fly.changeDirectionTimer <= 0) {
      fly.direction = this.getRandomDirection();
      fly.changeDirectionTimer = this.randomInRange(1, 3);
    }

    // Apply movement
    fly.velocity.x += fly.direction.x * fly.speed * deltaTime;
    fly.velocity.y += fly.direction.y * fly.speed * deltaTime;
    fly.velocity.z += fly.direction.z * fly.speed * deltaTime;

    // Apply air resistance
    const resistance = 0.98;
    fly.velocity.x *= resistance;
    fly.velocity.y *= resistance;
    fly.velocity.z *= resistance;

    // Update position
    fly.position.x += fly.velocity.x * deltaTime;
    fly.position.y += fly.velocity.y * deltaTime;
    fly.position.z += fly.velocity.z * deltaTime;

    // Add random bobbing motion
    fly.wingPhase += deltaTime * 10;
    fly.position.y += Math.sin(fly.wingPhase) * 0.1 * deltaTime;

    // Keep flies in bounds
    this.keepInBounds(fly);
  }

  keepInBounds(fly) {
    const bounds = 18;
    const minHeight = 1;
    const maxHeight = 10;

    // Bounce off walls
    if (Math.abs(fly.position.x) > bounds) {
      fly.direction.x *= -1;
      fly.velocity.x *= -0.5;
      fly.position.x = Math.sign(fly.position.x) * bounds;
    }

    if (fly.position.y > maxHeight || fly.position.y < minHeight) {
      fly.direction.y *= -1;
      fly.velocity.y *= -0.5;
      fly.position.y = fly.position.y > maxHeight ? maxHeight : minHeight;
    }

    if (Math.abs(fly.position.z) > bounds) {
      fly.direction.z *= -1;
      fly.velocity.z *= -0.5;
      fly.position.z = Math.sign(fly.position.z) * bounds;
    }
  }

  isInBounds(position) {
    const bounds = 20;
    return Math.abs(position.x) <= bounds && 
           Math.abs(position.z) <= bounds && 
           position.y >= 0 && 
           position.y <= 12;
  }

  removeFly(flyId) {
    const index = this.flies.findIndex(fly => fly.id === flyId);
    if (index !== -1) {
      this.flies.splice(index, 1);
      return true;
    }
    return false;
  }

  getFlyAt(position, radius = 0.5) {
    for (const fly of this.flies) {
      const distance = this.calculateDistance(position, fly.position);
      if (distance <= radius) {
        return fly;
      }
    }
    return null;
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  getRandomPosition() {
    return {
      x: this.randomInRange(-15, 15),
      y: this.randomInRange(3, 8),
      z: this.randomInRange(-15, 15)
    };
  }

  getRandomVelocity(maxSpeed) {
    return {
      x: this.randomInRange(-maxSpeed, maxSpeed) * 0.1,
      y: this.randomInRange(-maxSpeed, maxSpeed) * 0.1,
      z: this.randomInRange(-maxSpeed, maxSpeed) * 0.1
    };
  }

  getRandomDirection() {
    // Generate random unit vector
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta)
    };
  }

  weightedRandomSelect(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[0];
  }

  randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  generateId() {
    return 'fly_' + Math.random().toString(36).substr(2, 9);
  }

  getFlies() {
    return this.flies.map(fly => ({
      id: fly.id,
      type: fly.type,
      position: fly.position,
      points: fly.points,
      color: fly.color,
      size: fly.size
    }));
  }

  getFlyCount() {
    return this.flies.length;
  }

  clearAllFlies() {
    this.flies = [];
  }

  setMaxFlies(count) {
    this.maxFlies = count;
  }
}

module.exports = FlySystem;
