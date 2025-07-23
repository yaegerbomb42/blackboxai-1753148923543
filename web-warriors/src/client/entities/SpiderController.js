import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from '../../shared/config.js';

export class SpiderController {
  constructor() {
    this.mesh = null;
    this.body = null;
    this.health = GAME_CONFIG.gameplay.maxHealth;
    this.stamina = GAME_CONFIG.gameplay.maxStamina;
    this.isClimbing = false;
    this.isSwinging = false;
    this.webTarget = null;
    this.webConstraint = null;
    this.webLine = null;
    this.lastWebShot = 0;
    this.isDead = false;

    // Movement state
    this.moveSpeed = 5;
    this.jumpForce = GAME_CONFIG.physics.jumpForce;
    this.isGrounded = false;
    this.canClimb = false;
    this.climbSurface = null;

    // References for raycasting
    this.scene = null;
    this.camera = null;
  }

  async init(scene, camera) {
    console.log('Initializing spider...');

    this.scene = scene;
    this.camera = camera;

    this.createMesh();
    this.createPhysicsBody();

    console.log('Spider initialized');
  }

  createMesh() {
    // Create spider body (main sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 12);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;

    // Create spider legs
    const legGroup = new THREE.Group();
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (let i = 0; i < 8; i++) {
      const leg = this.createLeg(legMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const sideOffset = i < 4 ? 1 : -1;

      leg.position.set(Math.cos(angle) * 0.4, -0.1, Math.sin(angle) * 0.4);
      leg.rotation.y = angle;

      legGroup.add(leg);
    }

    this.mesh.add(legGroup);

    // Set initial position
    this.mesh.position.set(0, 2, 0);
  }

  createLeg(material) {
    const legGroup = new THREE.Group();

    // Upper leg segment
    const upperLegGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.4);
    const upperLeg = new THREE.Mesh(upperLegGeometry, material);
    upperLeg.position.set(0.3, -0.1, 0);
    upperLeg.rotation.z = Math.PI / 4;
    legGroup.add(upperLeg);

    // Lower leg segment
    const lowerLegGeometry = new THREE.CylinderGeometry(0.01, 0.02, 0.3);
    const lowerLeg = new THREE.Mesh(lowerLegGeometry, material);
    lowerLeg.position.set(0.5, -0.3, 0);
    lowerLeg.rotation.z = -Math.PI / 3;
    legGroup.add(lowerLeg);

    return legGroup;
  }

  createPhysicsBody() {
    const shape = new CANNON.Sphere(0.3);
    this.body = new CANNON.Body({ mass: 1 });
    this.body.addShape(shape);
    this.body.position.set(0, 2, 0);
    this.body.material = new CANNON.Material('spider');

    // Add collision event listeners
    this.body.addEventListener('collide', (event) => {
      this.handleCollision(event);
    });
  }

  handleCollision(event) {
    const contact = event.contact;
    const other =
      event.target === this.body ? event.contact.bi : event.contact.bj;

    // Check if we hit the ground
    if (contact.bi === this.body || contact.bj === this.body) {
      const normal = contact.ni;

      // Check if surface is ground-like (normal pointing up)
      if (normal.y > 0.7) {
        this.isGrounded = true;
      }

      // Check if surface is climbable (vertical wall)
      if (Math.abs(normal.y) < 0.3) {
        this.canClimb = true;
        this.climbSurface = normal;
      }
    }
  }

  update(deltaTime, inputState) {
    if (this.isDead) return;

    try {
      // Reset movement flags
      this.isGrounded = false;
      this.canClimb = false;

      // Update movement
      this.updateMovement(deltaTime, inputState);

      // Update web mechanics
      this.updateWeb(deltaTime, inputState);

      // Update stamina
      this.updateStamina(deltaTime);

      // Update web line visual
      if (this.isSwinging) {
        this.updateWebLine();
      }

      // Sync mesh with physics body
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);

      // Check for death conditions (fall out of world, etc.)
      if (this.mesh.position.y < -50) {
        this.die();
      }
    } catch (error) {
      console.error('Error in spider update:', error);
    }
  }

  updateMovement(deltaTime, inputState) {
    const velocity = this.body.velocity;
    const moveForce = new CANNON.Vec3();

    // Calculate movement direction based on camera
    const forward = new CANNON.Vec3(0, 0, -1);
    const right = new CANNON.Vec3(1, 0, 0);

    // Apply input forces
    if (inputState.forward) {
      moveForce.vadd(forward.scale(this.moveSpeed), moveForce);
    }
    if (inputState.backward) {
      moveForce.vadd(forward.scale(-this.moveSpeed), moveForce);
    }
    if (inputState.left) {
      moveForce.vadd(right.scale(-this.moveSpeed), moveForce);
    }
    if (inputState.right) {
      moveForce.vadd(right.scale(this.moveSpeed), moveForce);
    }

    // Apply movement force
    if (moveForce.length() > 0) {
      this.body.applyForce(moveForce, this.body.position);
    }

    // Jumping
    if (inputState.jump && (this.isGrounded || this.canClimb)) {
      const jumpVector = new CANNON.Vec3(0, this.jumpForce, 0);
      this.body.velocity.vadd(jumpVector, this.body.velocity);
      this.stamina -= 10; // Jumping costs stamina
    }

    // Apply air resistance
    velocity.scale(GAME_CONFIG.physics.airResistance, velocity);
  }

  updateWeb(deltaTime, inputState) {
    const currentTime = Date.now();

    // Web shooting
    if (
      inputState.shoot &&
      currentTime - this.lastWebShot > GAME_CONFIG.gameplay.webCooldown &&
      this.stamina > 20
    ) {
      this.shootWeb();
      this.lastWebShot = currentTime;
      this.stamina -= 20;
    }

    // Update web swinging
    if (this.isSwinging && this.webConstraint) {
      // Apply swinging forces
      const swingForce = this.calculateSwingForce();
      this.body.applyForce(swingForce, this.body.position);

      // Drain stamina while swinging
      this.stamina -= GAME_CONFIG.gameplay.webSwingStaminaCost * deltaTime;

      // Break web if stamina depleted
      if (this.stamina <= 0) {
        this.breakWeb();
      }
    }
  }

  shootWeb() {
    if (!this.scene || !this.camera) {
      console.warn('Scene or camera not available for web shooting');
      return;
    }

    try {
      // Create raycaster from camera direction
      const raycaster = new THREE.Raycaster();
      const direction = new THREE.Vector3();

      // Get direction from camera
      this.camera.getWorldDirection(direction);
      raycaster.set(this.mesh.position, direction);

      // Find intersections with scene objects
      const intersections = raycaster.intersectObjects(
        this.scene.children,
        true
      );

      // Filter out the spider itself and find valid attachment points
      const validIntersections = intersections.filter((intersection) => {
        return (
          intersection.object !== this.mesh &&
          intersection.distance <= GAME_CONFIG.gameplay.webRange &&
          intersection.object.userData.webAttachable !== false
        );
      });

      if (validIntersections.length > 0) {
        const target = validIntersections[0];
        this.createWebAttachment(target.point);
        console.log(
          'Web attached to:',
          target.object.name || 'object',
          'at distance:',
          target.distance.toFixed(2)
        );
      } else {
        console.log('No valid web attachment point found within range');
        // Could add a visual/audio feedback for failed web shot
      }
    } catch (error) {
      console.error('Error during web shooting:', error);
    }
  }

  createWebAttachment(targetPosition) {
    try {
      // Break existing web first
      if (this.isSwinging) {
        this.breakWeb();
      }

      // Create physics constraint for web
      this.webTarget = targetPosition.clone();
      this.isSwinging = true;

      // Create visual web line
      this.createWebLine(targetPosition);

      // Create physics constraint (simplified spring constraint)
      const distance = this.mesh.position.distanceTo(targetPosition);
      this.webConstraint = {
        target: targetPosition,
        restLength: distance,
        stiffness: GAME_CONFIG.physics.webStiffness || 0.8,
      };

      console.log('Web attached to:', targetPosition);
    } catch (error) {
      console.error('Error creating web attachment:', error);
    }
  }

  breakWeb() {
    try {
      if (this.webConstraint) {
        // Remove physics constraint
        this.webConstraint = null;
      }

      // Remove visual web line
      if (this.webLine && this.scene) {
        this.scene.remove(this.webLine);
        this.webLine = null;
      }

      this.isSwinging = false;
      this.webTarget = null;

      console.log('Web broken');
    } catch (error) {
      console.error('Error breaking web:', error);
    }
  }

  calculateSwingForce() {
    if (!this.webTarget || !this.webConstraint) return new CANNON.Vec3();

    try {
      // Get current position and target
      const position = new CANNON.Vec3(
        this.body.position.x,
        this.body.position.y,
        this.body.position.z
      );
      const target = new CANNON.Vec3(
        this.webTarget.x,
        this.webTarget.y,
        this.webTarget.z
      );

      // Calculate spring force
      const displacement = target.vsub(position);
      const currentLength = displacement.length();
      const restLength = this.webConstraint.restLength;

      // Spring force: F = -k * (current_length - rest_length) * direction
      const springMagnitude =
        this.webConstraint.stiffness * (currentLength - restLength);
      const springForce = displacement.unit().scale(springMagnitude);

      // Add some damping to prevent oscillation
      const dampingForce = this.body.velocity.scale(-0.1);

      return springForce.vadd(dampingForce);
    } catch (error) {
      console.error('Error calculating swing force:', error);
      return new CANNON.Vec3();
    }
  }

  updateStamina(deltaTime) {
    // Regenerate stamina when not using it
    if (!this.isSwinging && this.stamina < GAME_CONFIG.gameplay.maxStamina) {
      this.stamina += GAME_CONFIG.gameplay.staminaRegenRate * deltaTime;
      this.stamina = Math.min(this.stamina, GAME_CONFIG.gameplay.maxStamina);
    }

    // Clamp stamina
    this.stamina = Math.max(0, this.stamina);
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

  createWebLine(targetPosition) {
    try {
      // Remove existing web line
      if (this.webLine && this.scene) {
        this.scene.remove(this.webLine);
      }

      // Create line geometry
      const points = [this.mesh.position.clone(), targetPosition.clone()];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      });

      this.webLine = new THREE.Line(geometry, material);
      this.scene.add(this.webLine);
    } catch (error) {
      console.error('Error creating web line:', error);
    }
  }

  updateWebLine() {
    if (this.webLine && this.webTarget) {
      try {
        const points = [this.mesh.position.clone(), this.webTarget.clone()];

        this.webLine.geometry.setFromPoints(points);
        this.webLine.geometry.attributes.position.needsUpdate = true;
      } catch (error) {
        console.error('Error updating web line:', error);
      }
    }
  }

  die() {
    if (this.isDead) return;

    this.isDead = true;
    this.health = 0;

    // Break any active web
    this.breakWeb();

    // Stop movement
    if (this.body) {
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }

    console.log('Spider died!');

    // Trigger death event (can be caught by GameEngine)
    if (this.onDeath) {
      this.onDeath();
    }
  }

  respawn(position = new THREE.Vector3(0, 2, 0)) {
    this.isDead = false;
    this.health = GAME_CONFIG.gameplay.maxHealth;
    this.stamina = GAME_CONFIG.gameplay.maxStamina;

    // Reset position
    this.mesh.position.copy(position);
    if (this.body) {
      this.body.position.set(position.x, position.y, position.z);
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }

    console.log('Spider respawned at:', position);
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  getHealth() {
    return this.health;
  }

  getStamina() {
    return this.stamina;
  }
}
