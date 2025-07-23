import { SpiderController } from '../client/entities/SpiderController.js';
import * as THREE from 'three';

describe('SpiderController', () => {
  let spider;

  beforeEach(async () => {
    spider = new SpiderController();
    // Mock scene and camera for init
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    await spider.init(scene, camera);
  });

  test('should initialize with default health and stamina', () => {
    expect(spider.health).toBe(100);
    expect(spider.stamina).toBe(100);
  });

  test('should create mesh and physics body', () => {
    expect(spider.mesh).toBeDefined();
    expect(spider.body).toBeDefined();
  });

  test('should shoot web and create web attachment', () => {
    // Mock createWebAttachment to track calls
    spider.createWebAttachment = jest.fn();
    spider.camera.getWorldDirection = jest.fn(
      () => new THREE.Vector3(0, 0, -1)
    );
    spider.mesh.position.set(0, 0, 0);

    spider.shootWeb();

    expect(spider.createWebAttachment).toHaveBeenCalled();
  });

  test('should update stamina correctly', () => {
    spider.stamina = 50;
    spider.isSwinging = false;
    spider.updateStamina(1);
    expect(spider.stamina).toBeGreaterThan(50);
  });

  test('should die and set isDead flag', () => {
    spider.die();
    expect(spider.isDead).toBe(true);
    expect(spider.health).toBe(0);
  });

  test('should respawn and reset health and stamina', () => {
    spider.die();
    spider.respawn(new THREE.Vector3(1, 2, 3));
    expect(spider.isDead).toBe(false);
    expect(spider.health).toBe(100);
    expect(spider.stamina).toBe(100);
    expect(spider.mesh.position.x).toBe(1);
    expect(spider.mesh.position.y).toBe(2);
    expect(spider.mesh.position.z).toBe(3);
  });
});
