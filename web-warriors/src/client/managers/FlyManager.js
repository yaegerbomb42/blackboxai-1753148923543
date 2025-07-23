import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { FLY_CONFIGS } from '../../shared/config.js';
import { MathUtils } from '../../utils/helpers.js';

export class FlyManager {
  constructor() {
    this.flies = [];
    this.scene = null;
    this.physicsWorld = null;
    this.flyCount = 0;
    this.maxFlies = 10;
  }

  init(sceneManager, physicsManager) {
    this.scene = sceneManager;
    this.physicsWorld = physicsManager;
    console.log('Fly manager initialized');
  }

  spawnFlies(count) {
    for (let i = 0; i < count; i++) {
      this.spawnFly();
    }
  }

  spawnFly(type = null) {
    if (this.flies.length >= this.maxFlies) return;

    // Random fly type if not specified
    if (!type) {
      const types = Object.keys(FLY_CONFIGS);
      const weights = [60, 25, 12, 3]; // Common, Fast, Rare, Golden
      type = this.weightedRandomSelect(types, weights);
    }

    const fly = this.createFly(type);
    this.flies.push(fly);
    this.scene.add(fly.mesh);
    this.physicsWorld.addBody(fly.body);
  }

  createFly(type) {
    const config = FLY_CONFIGS[type];

    // Create fly mesh
    const geometry = new THREE.SphereGeometry(config.size, 8, 6);
    const material = new THREE.MeshLambertMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    // Add wings
    const wingGroup = this.createWings(config);
    mesh.add(wingGroup);

    // Random position in room
    const position = this.getRandomFlyPosition();
    mesh.position.copy(position);

    // Create physics body
    const shape = new CANNON.Sphere(config.size);
    const body = new CANNON.Body({ mass: 0.01 }); // Very light
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    // Random initial velocity
    const velocity = MathUtils.randomVector3(config.speed);
    body.velocity.set(velocity.x, velocity.y, velocity.z);

    return {
      mesh,
      body,
      type,
      points: config.points,
      speed: config.speed,
      direction: new THREE.Vector3().randomDirection(),
      changeDirectionTimer: 0,
      wingAnimation: 0,
    };
  }

  createWings(config) {
    const wingGroup = new THREE.Group();
    const wingGeometry = new THREE.PlaneGeometry(
      config.size * 1.5,
      config.size * 0.5
    );
    const wingMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-config.size * 0.7, 0, 0);
    leftWing.rotation.y = Math.PI / 4;
    wingGroup.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(config.size * 0.7, 0, 0);
    rightWing.rotation.y = -Math.PI / 4;
    wingGroup.add(rightWing);

    return wingGroup;
  }

  getRandomFlyPosition() {
    // Spawn flies in air, avoiding ground and walls
    return new THREE.Vector3(
      MathUtils.randomInRange(-15, 15),
      MathUtils.randomInRange(3, 8),
      MathUtils.randomInRange(-15, 15)
    );
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

    return items[0]; // Fallback
  }

  update(deltaTime) {
    this.flies.forEach((fly, index) => {
      this.updateFly(fly, deltaTime);
      this.keepFlyInBounds(fly);
    });
  }

  updateFly(fly, deltaTime) {
    // Update wing animation
    fly.wingAnimation += deltaTime * 20; // Fast wing beat
    const wingGroup = fly.mesh.children[0];
    if (wingGroup) {
      const wingOffset = Math.sin(fly.wingAnimation) * 0.2;
      wingGroup.children.forEach((wing, index) => {
        wing.rotation.z = wingOffset * (index === 0 ? 1 : -1);
      });
    }

    // Update AI behavior
    fly.changeDirectionTimer -= deltaTime;
    if (fly.changeDirectionTimer <= 0) {
      // Change direction randomly
      fly.direction = new THREE.Vector3().randomDirection();
      fly.changeDirectionTimer = MathUtils.randomInRange(1, 3);
    }

    // Apply movement
    const force = fly.direction.clone().multiplyScalar(fly.speed * 0.1);
    fly.body.applyForce(
      new CANNON.Vec3(force.x, force.y, force.z),
      fly.body.position
    );

    // Apply some air resistance
    fly.body.velocity.scale(0.95, fly.body.velocity);

    // Sync mesh with physics
    fly.mesh.position.copy(fly.body.position);
    fly.mesh.quaternion.copy(fly.body.quaternion);

    // Add some random bobbing motion
    fly.mesh.position.y += Math.sin(fly.wingAnimation * 0.5) * 0.05;
  }

  keepFlyInBounds(fly) {
    const bounds = 18; // Room boundaries
    const position = fly.body.position;

    // Bounce off walls by reversing direction
    if (Math.abs(position.x) > bounds) {
      fly.direction.x *= -1;
      fly.body.velocity.x *= -0.5;
    }
    if (position.y > 10 || position.y < 1) {
      fly.direction.y *= -1;
      fly.body.velocity.y *= -0.5;
    }
    if (Math.abs(position.z) > bounds) {
      fly.direction.z *= -1;
      fly.body.velocity.z *= -0.5;
    }

    // Clamp position
    position.x = MathUtils.clamp(position.x, -bounds, bounds);
    position.y = MathUtils.clamp(position.y, 1, 10);
    position.z = MathUtils.clamp(position.z, -bounds, bounds);
  }

  removeFly(index) {
    if (index >= 0 && index < this.flies.length) {
      const fly = this.flies[index];

      // Remove from scene and physics
      this.scene.remove(fly.mesh);
      this.physicsWorld.removeBody(fly.body);

      // Remove from array
      this.flies.splice(index, 1);
    }
  }

  getFlyAt(position, radius = 0.5) {
    for (let i = 0; i < this.flies.length; i++) {
      const fly = this.flies[i];
      const distance = position.distanceTo(fly.mesh.position);
      if (distance < radius) {
        return i;
      }
    }
    return -1;
  }

  getFlies() {
    return this.flies;
  }

  clearAllFlies() {
    while (this.flies.length > 0) {
      this.removeFly(0);
    }
  }
}
