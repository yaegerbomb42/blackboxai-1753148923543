import * as THREE from 'three';
import { GAME_CONFIG } from '../../shared/config.js';

export class CameraManager {
  constructor() {
    this.camera = null;
    this.target = null;
    this.cameraOffset = new THREE.Vector3(
      0,
      GAME_CONFIG.graphics.cameraHeight,
      GAME_CONFIG.graphics.cameraDistance
    );
    this.currentOffset = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.maxPitch = Math.PI / 3; // 60 degrees
    this.minPitch = -Math.PI / 6; // -30 degrees
  }

  init(renderer) {
    console.log('Initializing camera...');

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    // Set initial camera position
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(0, 0, 0);

    console.log('Camera initialized');
  }

  setTarget(target) {
    this.target = target;
  }

  update(deltaTime, inputState = null) {
    if (!this.target) return;

    // Update camera rotation based on mouse input
    if (inputState) {
      this.yaw -= inputState.mouseX;
      this.pitch -= inputState.mouseY;

      // Clamp pitch
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    }

    // Calculate camera position based on target and rotation
    const targetPosition = this.target.position.clone();

    // Apply yaw and pitch to camera offset
    const rotatedOffset = this.cameraOffset.clone();

    // Rotate around Y axis (yaw)
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    // Apply pitch by rotating around the right vector
    const rightVector = new THREE.Vector3(1, 0, 0);
    rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    rotatedOffset.applyAxisAngle(rightVector, this.pitch);

    // Smooth camera movement
    const desiredPosition = targetPosition.clone().add(rotatedOffset);
    this.camera.position.lerp(desiredPosition, deltaTime * 5);

    // Look at target with slight offset
    const lookAtTarget = targetPosition.clone();
    lookAtTarget.y += 1; // Look slightly above the spider
    this.camera.lookAt(lookAtTarget);

    // Handle camera collisions with walls
    this.handleCameraCollisions(targetPosition, desiredPosition);
  }

  handleCameraCollisions(targetPosition, desiredPosition) {
    // Simple collision detection - keep camera inside room bounds
    const roomBounds = 18; // Room is 40x40, so boundaries at ±20, but keep camera a bit inside
    const minHeight = 1;
    const maxHeight = 10;

    // Clamp camera position to room bounds
    this.camera.position.x = Math.max(
      -roomBounds,
      Math.min(roomBounds, this.camera.position.x)
    );
    this.camera.position.z = Math.max(
      -roomBounds,
      Math.min(roomBounds, this.camera.position.z)
    );
    this.camera.position.y = Math.max(
      minHeight,
      Math.min(maxHeight, this.camera.position.y)
    );
  }

  handleResize() {
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  getCamera() {
    return this.camera;
  }

  getYaw() {
    return this.yaw;
  }

  getPitch() {
    return this.pitch;
  }

  setYaw(yaw) {
    this.yaw = yaw;
  }

  setPitch(pitch) {
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
  }

  reset() {
    this.yaw = 0;
    this.pitch = 0;
    this.camera.position.copy(this.cameraOffset);
  }
}
