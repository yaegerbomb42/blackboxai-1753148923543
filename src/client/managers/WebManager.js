import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class WebManager {
  constructor() {
    this.webs = [];
    this.scene = null;
    this.physicsWorld = null;
  }

  init(sceneManager, physicsManager) {
    this.scene = sceneManager;
    this.physicsWorld = physicsManager;
    console.log('Web manager initialized');
  }

  createWeb(startPosition, endPosition, spider) {
    const web = {
      id: Math.random().toString(36),
      startPosition: startPosition.clone(),
      endPosition: endPosition.clone(),
      spider: spider,
      line: null,
      constraint: null,
      isActive: true,
      strength: 50
    };

    // Create visual web line
    web.line = this.createWebLine(startPosition, endPosition);
    this.scene.add(web.line);

    // Create physics constraint
    web.constraint = this.createWebConstraint(startPosition, endPosition, spider);

    this.webs.push(web);
    return web;
  }

  createWebLine(start, end) {
    const points = [];
    points.push(start);
    points.push(end);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });

    return new THREE.Line(geometry, material);
  }

  createWebConstraint(start, end, spider) {
    // Create a distance constraint between spider and anchor point
    const anchorBody = new CANNON.Body({ mass: 0 });
    anchorBody.position.set(end.x, end.y, end.z);
    this.physicsWorld.addBody(anchorBody);

    const constraint = new CANNON.DistanceConstraint(
      spider.body,
      anchorBody,
      start.distanceTo(end)
    );

    this.physicsWorld.addConstraint(constraint);

    return { constraint, anchorBody };
  }

  removeWeb(webId) {
    const index = this.webs.findIndex(web => web.id === webId);
    if (index !== -1) {
      const web = this.webs[index];
      
      // Remove visual line
      if (web.line) {
        this.scene.remove(web.line);
      }
      
      // Remove physics constraint
      if (web.constraint) {
        this.physicsWorld.removeConstraint(web.constraint.constraint);
        this.physicsWorld.removeBody(web.constraint.anchorBody);
      }
      
      this.webs.splice(index, 1);
    }
  }

  update(deltaTime) {
    this.webs.forEach((web, index) => {
      if (!web.isActive) {
        this.removeWeb(web.id);
        return;
      }

      // Update visual line position
      if (web.line && web.spider) {
        const positions = web.line.geometry.attributes.position.array;
        const spiderPos = web.spider.mesh.position;
        
        // Update start position (spider)
        positions[0] = spiderPos.x;
        positions[1] = spiderPos.y;
        positions[2] = spiderPos.z;
        
        // End position stays the same (anchor point)
        
        web.line.geometry.attributes.position.needsUpdate = true;
      }

      // Check web integrity (distance, obstacles, etc.)
      this.checkWebIntegrity(web);
    });
  }

  checkWebIntegrity(web) {
    if (!web.spider) {
      web.isActive = false;
      return;
    }

    const spiderPos = web.spider.mesh.position;
    const distance = spiderPos.distanceTo(web.endPosition);
    const maxDistance = 15; // Maximum web length

    // Break web if too far
    if (distance > maxDistance) {
      web.isActive = false;
      return;
    }

    // Check for obstacles between spider and anchor
    // TODO: Implement raycast collision detection
  }

  checkFlyCollisions(flies, onFlyHit) {
    this.webs.forEach(web => {
      if (!web.line || !web.isActive) return;

      const start = web.spider.mesh.position;
      const end = web.endPosition;

      flies.forEach((fly, flyIndex) => {
        const flyPos = fly.mesh.position;
        const distanceToLine = this.distanceToLine(flyPos, start, end);

        if (distanceToLine < 0.3) { // Collision threshold
          onFlyHit(flyIndex);
          
          // Create web particle effect
          this.createWebHitEffect(flyPos);
        }
      });
    });
  }

  distanceToLine(point, lineStart, lineEnd) {
    const line = lineEnd.clone().sub(lineStart);
    const pointToStart = point.clone().sub(lineStart);
    
    const lineLength = line.length();
    if (lineLength === 0) return pointToStart.length();
    
    const t = Math.max(0, Math.min(1, pointToStart.dot(line) / (lineLength * lineLength)));
    const projection = lineStart.clone().add(line.multiplyScalar(t));
    
    return point.distanceTo(projection);
  }

  createWebHitEffect(position) {
    // Create particle effect for web hit
    const particleCount = 10;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 4, 4);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      
      particles.add(particle);
    }

    this.scene.add(particles);

    // Animate particles
    const animateParticles = () => {
      particles.children.forEach(particle => {
        particle.position.add(particle.velocity);
        particle.velocity.multiplyScalar(0.95); // Slow down
        particle.material.opacity *= 0.95; // Fade out
      });

      if (particles.children[0].material.opacity > 0.01) {
        requestAnimationFrame(animateParticles);
      } else {
        this.scene.remove(particles);
      }
    };

    animateParticles();
  }

  shootWeb(spider, direction, maxDistance = 10) {
    const startPos = spider.mesh.position.clone();
    const endPos = startPos.clone().add(direction.multiplyScalar(maxDistance));

    // Raycast to find actual end position
    const raycaster = new THREE.Raycaster(startPos, direction);
    
    // TODO: Implement proper raycasting against scene objects
    // For now, use the max distance position
    
    return this.createWeb(startPos, endPos, spider);
  }

  clearAllWebs() {
    while (this.webs.length > 0) {
      this.removeWeb(this.webs[0].id);
    }
  }

  getActiveWebs() {
    return this.webs.filter(web => web.isActive);
  }
}
