import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from '../../shared/config.js';

export class PhysicsManager {
  constructor() {
    this.world = null;
    this.bodies = [];
    this.groundBody = null;
  }

  init() {
    console.log('Initializing physics world...');

    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, GAME_CONFIG.physics.gravity, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // Create materials
    this.createMaterials();

    // Create ground
    this.createGround();

    // Create room boundaries
    this.createRoomBoundaries();

    console.log('Physics world initialized');
  }

  createMaterials() {
    // Default material
    this.defaultMaterial = new CANNON.Material('default');

    // Ground material
    this.groundMaterial = new CANNON.Material('ground');

    // Spider material
    this.spiderMaterial = new CANNON.Material('spider');

    // Web material
    this.webMaterial = new CANNON.Material('web');

    // Contact materials
    const groundSpiderContact = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.spiderMaterial,
      {
        friction: GAME_CONFIG.physics.groundFriction,
        restitution: 0.1,
      }
    );

    this.world.addContactMaterial(groundSpiderContact);
  }

  createGround() {
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0,
      material: this.groundMaterial,
    });
    this.groundBody.addShape(groundShape);
    this.groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.world.addBody(this.groundBody);
  }

  createRoomBoundaries() {
    const wallMaterial = new CANNON.Material('wall');

    // Create invisible walls at room boundaries
    const wallThickness = 1;
    const roomSize = 40;
    const wallHeight = 12;

    // North wall
    const northWallShape = new CANNON.Box(
      new CANNON.Vec3(roomSize / 2, wallHeight / 2, wallThickness / 2)
    );
    const northWallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    northWallBody.addShape(northWallShape);
    northWallBody.position.set(0, wallHeight / 2, -roomSize / 2);
    this.world.addBody(northWallBody);

    // South wall
    const southWallShape = new CANNON.Box(
      new CANNON.Vec3(roomSize / 2, wallHeight / 2, wallThickness / 2)
    );
    const southWallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    southWallBody.addShape(southWallShape);
    southWallBody.position.set(0, wallHeight / 2, roomSize / 2);
    this.world.addBody(southWallBody);

    // East wall
    const eastWallShape = new CANNON.Box(
      new CANNON.Vec3(wallThickness / 2, wallHeight / 2, roomSize / 2)
    );
    const eastWallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    eastWallBody.addShape(eastWallShape);
    eastWallBody.position.set(roomSize / 2, wallHeight / 2, 0);
    this.world.addBody(eastWallBody);

    // West wall
    const westWallShape = new CANNON.Box(
      new CANNON.Vec3(wallThickness / 2, wallHeight / 2, roomSize / 2)
    );
    const westWallBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    westWallBody.addShape(westWallShape);
    westWallBody.position.set(-roomSize / 2, wallHeight / 2, 0);
    this.world.addBody(westWallBody);

    // Ceiling
    const ceilingShape = new CANNON.Plane();
    const ceilingBody = new CANNON.Body({ mass: 0, material: wallMaterial });
    ceilingBody.addShape(ceilingShape);
    ceilingBody.position.set(0, wallHeight, 0);
    ceilingBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI / 2
    );
    this.world.addBody(ceilingBody);
  }

  addBody(body) {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
    }
  }

  update(deltaTime) {
    // Step the physics world
    this.world.step(1 / 60, deltaTime, 3);
  }

  raycast(from, to) {
    const result = new CANNON.RaycastResult();
    this.world.raycastClosest(from, to, {}, result);
    return result;
  }

  sphereCast(from, to, radius) {
    // Simple sphere cast implementation
    const direction = to.clone().sub(from).normalize();
    const distance = from.distanceTo(to);

    for (let i = 0; i <= distance; i += radius) {
      const testPoint = from.clone().add(direction.clone().multiplyScalar(i));

      // Check for collision at this point
      for (const body of this.bodies) {
        const bodyPos = new CANNON.Vec3(
          body.position.x,
          body.position.y,
          body.position.z
        );
        const dist = testPoint.distanceTo(bodyPos);
        if (dist < radius) {
          return { hit: true, point: testPoint, body: body };
        }
      }
    }

    return { hit: false };
  }
}
