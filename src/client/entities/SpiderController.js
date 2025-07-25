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
    
    // Animation state
    this.legAnimationTime = 0;
    this.isEating = false;
    this.eatingAnimationTime = 0;
    this.eatingDuration = 1.0; // seconds
    this.legGroups = [];
    this.originalLegRotations = [];
    this.walkSoundTimer = 0;
    
    // References for raycasting
    this.scene = null;
    this.camera = null;
    this.audioManager = null;
  }

  async init(scene, camera, audioManager = null) {
    console.log('Initializing spider...');
    
    this.scene = scene;
    this.camera = camera;
    this.audioManager = audioManager;
    
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
    legGroup.name = 'legGroup';
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    this.legGroups = []; // Reset leg groups array
    this.originalLegRotations = []; // Reset original rotations
    
    for (let i = 0; i < 8; i++) {
      const leg = this.createLeg(legMaterial);
      const angle = (i / 8) * Math.PI * 2;
      const sideOffset = (i < 4) ? 1 : -1;
      
      leg.position.set(
        Math.cos(angle) * 0.4,
        -0.1,
        Math.sin(angle) * 0.4
      );
      leg.rotation.y = angle;
      leg.name = `leg_${i}`;
      
      // Store reference for animation
      this.legGroups.push(leg);
      this.originalLegRotations.push({
        x: leg.rotation.x,
        y: leg.rotation.y,
        z: leg.rotation.z
      });
      
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
    const other = event.target === this.body ? event.contact.bi : event.contact.bj;
    
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
      
      // Update animations
      this.updateLegAnimation(deltaTime);
      this.updateEatingAnimation(deltaTime);
      
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

    // Calculate movement direction based on camera orientation
    if (!this.camera) {
      console.warn('Camera not set in SpiderController');
      return;
    }

    const forwardVector = new THREE.Vector3();
    this.camera.getWorldDirection(forwardVector);
    forwardVector.y = 0; // Ignore vertical component
    forwardVector.normalize();

    const rightVector = new THREE.Vector3();
    rightVector.crossVectors(new THREE.Vector3(0, 1, 0), forwardVector).normalize();

    // Convert to Cannon vectors
    const forward = new CANNON.Vec3(forwardVector.x, forwardVector.y, forwardVector.z);
    const right = new CANNON.Vec3(rightVector.x, rightVector.y, rightVector.z);

    // Check if moving for walk sound
    const isMoving = inputState.forward || inputState.backward || inputState.left || inputState.right;

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

    // Wall climbing
    if (inputState.climb && this.canClimb && this.climbSurface && this.stamina > 0) {
      const climbForce = new CANNON.Vec3(
        this.climbSurface.x * GAME_CONFIG.physics.wallClimbForce,
        GAME_CONFIG.physics.climbSpeed,
        this.climbSurface.z * GAME_CONFIG.physics.wallClimbForce
      );
      this.body.applyForce(climbForce, this.body.position);
      this.stamina -= GAME_CONFIG.gameplay.climbStaminaCost * deltaTime;
      this.isClimbing = true;

      // Play climb sound
      if (this.audioManager) {
        this.audioManager.playSound('climb');
      }
    } else {
      this.isClimbing = false;
    }

    // Apply movement force
    if (moveForce.length() > 0) {
      this.body.applyForce(moveForce, this.body.position);

      // Play walk sound occasionally
      if (isMoving && this.isGrounded) {
        this.walkSoundTimer -= deltaTime;
        if (this.walkSoundTimer <= 0) {
          if (this.audioManager) {
            this.audioManager.playSound('walk');
          }
          this.walkSoundTimer = 0.3; // Play every 0.3 seconds
        }
      }
    }

    // Enhanced jumping
    if (inputState.jump && (this.isGrounded || this.canClimb) && this.stamina >= GAME_CONFIG.gameplay.jumpStaminaCost) {
      this.body.velocity.y = this.jumpForce;
      this.stamina -= GAME_CONFIG.gameplay.jumpStaminaCost;

      // Play jump sound
      if (this.audioManager) {
        this.audioManager.playSound('jump');
      }
    }

    // Apply air resistance
    velocity.scale(GAME_CONFIG.physics.airResistance, velocity);
  }

  updateWeb(deltaTime, inputState) {
    const currentTime = Date.now();
    
    // Web shooting
    if (inputState.shoot && 
        currentTime - this.lastWebShot > GAME_CONFIG.gameplay.webCooldown &&
        this.stamina > 20) {
      
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
      
      // Get direction from camera with slight offset from spider position
      this.camera.getWorldDirection(direction);
      const startPosition = this.mesh.position.clone();
      startPosition.add(direction.clone().multiplyScalar(0.5)); // Start slightly in front
      
      raycaster.set(startPosition, direction);
      
      // Find intersections with scene objects
      const intersections = raycaster.intersectObjects(this.scene.children, true);
      
      // Filter out the spider itself and find valid attachment points
      const validIntersections = intersections.filter(intersection => {
        return intersection.object !== this.mesh && 
               intersection.distance <= GAME_CONFIG.gameplay.webRange &&
               intersection.object.userData.webAttachable !== false;
      });
      
      if (validIntersections.length > 0) {
        const target = validIntersections[0];
        this.createWebAttachment(target.point);
        
        // Play web shot sound
        if (this.audioManager) {
          this.audioManager.playSound('webShot');
        }
        
        console.log('Web attached to:', target.object.name || 'object', 'at distance:', target.distance.toFixed(2));
      } else {
        console.log('No valid web attachment point found within range');
        
        // Play failed web shot sound (could be a different sound)
        if (this.audioManager) {
          this.audioManager.playSound('webShot'); // Same sound for now
        }
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
        stiffness: GAME_CONFIG.physics.webStiffness || 0.8
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
      const position = new CANNON.Vec3(this.body.position.x, this.body.position.y, this.body.position.z);
      const target = new CANNON.Vec3(this.webTarget.x, this.webTarget.y, this.webTarget.z);
      
      // Calculate spring force
      const displacement = target.vsub(position);
      const currentLength = displacement.length();
      const restLength = this.webConstraint.restLength;
      
      // Spring force: F = -k * (current_length - rest_length) * direction
      const springMagnitude = this.webConstraint.stiffness * (currentLength - restLength);
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
      const points = [
        this.mesh.position.clone(),
        targetPosition.clone()
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
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
        const points = [
          this.mesh.position.clone(),
          this.webTarget.clone()
        ];
        
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

  // New animation methods
  updateLegAnimation(deltaTime) {
    if (!this.legGroups || this.legGroups.length === 0) return;
    
    try {
      // Get movement speed for animation
      const speed = this.body.velocity.length();
      const isMoving = speed > 0.1;
      
      if (isMoving && !this.isEating) {
        // Animate legs during movement
        this.legAnimationTime += deltaTime * speed * 3;
        
        this.legGroups.forEach((leg, index) => {
          if (leg && leg.children) {
            const phase = (index % 2) * Math.PI; // Alternate legs
            const legOffset = Math.sin(this.legAnimationTime + phase) * 0.3;
            
            // Animate upper leg segment
            if (leg.children[0]) {
              leg.children[0].rotation.z = this.originalLegRotations[index].z + legOffset;
            }
            
            // Animate lower leg segment
            if (leg.children[1]) {
              leg.children[1].rotation.z = this.originalLegRotations[index].z - legOffset * 0.5;
            }
          }
        });
      } else if (!this.isEating) {
        // Return legs to original position when not moving
        this.legGroups.forEach((leg, index) => {
          if (leg && leg.children && this.originalLegRotations[index]) {
            if (leg.children[0]) {
              leg.children[0].rotation.z = this.originalLegRotations[index].z;
            }
            if (leg.children[1]) {
              leg.children[1].rotation.z = this.originalLegRotations[index].z;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error in leg animation:', error);
    }
  }

  updateEatingAnimation(deltaTime) {
    if (!this.isEating) return;
    
    try {
      this.eatingAnimationTime += deltaTime;
      
      if (this.eatingAnimationTime < this.eatingDuration) {
        // Vicious eating animation - make legs move aggressively
        const eatPhase = this.eatingAnimationTime * 8; // Fast animation
        
        this.legGroups.forEach((leg, index) => {
          if (leg && leg.children) {
            const aggressiveOffset = Math.sin(eatPhase + index) * 0.8;
            
            // Make legs move more dramatically during eating
            if (leg.children[0]) {
              leg.children[0].rotation.z = this.originalLegRotations[index].z + aggressiveOffset;
            }
            if (leg.children[1]) {
              leg.children[1].rotation.z = this.originalLegRotations[index].z - aggressiveOffset * 0.7;
            }
          }
        });
        
        // Tilt the spider body slightly during eating
        if (this.mesh) {
          this.mesh.rotation.x = Math.sin(eatPhase) * 0.1;
          this.mesh.rotation.z = Math.cos(eatPhase * 0.7) * 0.05;
        }
      } else {
        // End eating animation
        this.isEating = false;
        this.eatingAnimationTime = 0;
        
        // Reset spider body rotation
        if (this.mesh) {
          this.mesh.rotation.x = 0;
          this.mesh.rotation.z = 0;
        }
        
        // Reset legs to original positions
        this.legGroups.forEach((leg, index) => {
          if (leg && leg.children && this.originalLegRotations[index]) {
            if (leg.children[0]) {
              leg.children[0].rotation.z = this.originalLegRotations[index].z;
            }
            if (leg.children[1]) {
              leg.children[1].rotation.z = this.originalLegRotations[index].z;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error in eating animation:', error);
    }
  }

  playEatingAnimation() {
    if (this.isEating) return; // Already eating
    
    try {
      this.isEating = true;
      this.eatingAnimationTime = 0;
      
      // Play eating sound
      if (this.audioManager) {
        this.audioManager.playSound('eat');
      }
      
      console.log('Spider is eating - playing vicious animation!');
    } catch (error) {
      console.error('Error starting eating animation:', error);
    }
  }

  // Method to be called when spider catches an insect
  catchInsect(insect) {
    try {
      this.playEatingAnimation();
      
      // Heal slightly when eating
      this.heal(5);
      
      // Restore some stamina
      this.stamina = Math.min(this.stamina + 10, GAME_CONFIG.gameplay.maxStamina);
      
      // Show eating indicator in UI if available
      if (window.game && window.game.engine && window.game.engine.uiManager) {
        window.game.engine.uiManager.showEatingIndicator();
      }
      
      console.log('Spider caught and is eating an insect!');
    } catch (error) {
      console.error('Error in catchInsect:', error);
    }
  }
}
