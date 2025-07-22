import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class WebManager {
  constructor() {
    this.webs = [];
    this.scene = null;
    this.physicsWorld = null;
    this.raycaster = new THREE.Raycaster();
  }

  init(sceneManager, physicsManager) {
    this.scene = sceneManager.scene;
    this.physicsWorld = physicsManager.world;
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
    try {
      // Create a distance constraint between spider and anchor point
      const anchorBody = new CANNON.Body({ mass: 0 });
      anchorBody.position.set(end.x, end.y, end.z);
      this.physicsWorld.addBody(anchorBody);

      const distance = start.distanceTo(end);
      const constraint = new CANNON.DistanceConstraint(
        spider.body,
        anchorBody,
        distance
      );

      this.physicsWorld.addConstraint(constraint);

      return { constraint, anchorBody };
    } catch (error) {
      console.error('Error creating web constraint:', error);
      return null;
    }
  }

  removeWeb(webId) {
    const index = this.webs.findIndex(web => web.id === webId);
    if (index !== -1) {
      const web = this.webs[index];
      
      try {
        // Remove visual line
        if (web.line) {
          this.scene.remove(web.line);
          web.line.geometry.dispose();
          web.line.material.dispose();
        }
        
        // Remove physics constraint
        if (web.constraint) {
          this.physicsWorld.removeConstraint(web.constraint.constraint);
          this.physicsWorld.removeBody(web.constraint.anchorBody);
        }
        
        this.webs.splice(index, 1);
      } catch (error) {
        console.error('Error removing web:', error);
      }
    }
  }

  update(deltaTime) {
    // Process webs in reverse order to safely remove them
    for (let i = this.webs.length - 1; i >= 0; i--) {
      const web = this.webs[i];
      
      if (!web.isActive) {
        this.removeWeb(web.id);
        continue;
      }

      try {
        // Update visual line position
        if (web.line && web.spider) {
          const points = [
            web.spider.mesh.position.clone(),
            web.endPosition.clone()
          ];
          
          web.line.geometry.setFromPoints(points);
          web.line.geometry.attributes.position.needsUpdate = true;
        }

        // Check web integrity (distance, obstacles, etc.)
        this.checkWebIntegrity(web);
        
        // Add some visual effects (web sway, etc.)
        this.updateWebVisuals(web, deltaTime);
      } catch (error) {
        console.error('Error updating web:', error);
        web.isActive = false;
      }
    }
  }

  updateWebVisuals(web, deltaTime) {
    if (!web.line) return;
    
    try {
      // Add slight opacity variation for visual interest
      const baseOpacity = 0.8;
      const variation = Math.sin(Date.now() * 0.003) * 0.1;
      web.line.material.opacity = baseOpacity + variation;
      
      // Add slight color variation based on tension
      const spiderPos = web.spider.mesh.position;
      const distance = spiderPos.distanceTo(web.endPosition);
      const maxDistance = 15;
      const tension = Math.min(distance / maxDistance, 1);
      
      // Color shifts from white to yellow as tension increases
      const color = new THREE.Color();
      color.setHSL(0.15 * (1 - tension), 0.3 + tension * 0.7, 0.8);
      web.line.material.color = color;
    } catch (error) {
      console.error('Error updating web visuals:', error);
    }
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

    // Check for obstacles between spider and anchor using raycasting
    try {
      const direction = web.endPosition.clone().sub(spiderPos).normalize();
      this.raycaster.set(spiderPos, direction);
      
      const intersections = this.raycaster.intersectObjects(this.scene.children, true);
      
      // Filter out the spider itself and web lines
      const validIntersections = intersections.filter(intersection => {
        return intersection.object !== web.spider.mesh && 
               intersection.object !== web.line &&
               intersection.distance < distance - 0.5; // Small buffer
      });
      
      // If there's an obstacle in the way, break the web
      if (validIntersections.length > 0) {
        web.isActive = false;
        console.log('Web broken due to obstacle');
      }
    } catch (error) {
      console.error('Error checking web integrity:', error);
    }
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
    try {
      const startPos = spider.mesh.position.clone();
      
      // Use raycasting to find the actual attachment point
      this.raycaster.set(startPos, direction);
      const intersections = this.raycaster.intersectObjects(this.scene.children, true);
      
      // Filter out the spider itself and find valid attachment points
      const validIntersections = intersections.filter(intersection => {
        return intersection.object !== spider.mesh && 
               intersection.distance <= maxDistance &&
               intersection.object.userData.webAttachable !== false;
      });
      
      let endPos;
      if (validIntersections.length > 0) {
        // Use the first valid intersection point
        endPos = validIntersections[0].point.clone();
        console.log('Web attached to surface at distance:', validIntersections[0].distance.toFixed(2));
      } else {
        // No valid attachment point found, use max distance
        endPos = startPos.clone().add(direction.clone().multiplyScalar(maxDistance));
        console.log('No attachment point found, using max distance');
        return null; // Don't create web if no valid attachment
      }
      
      return this.createWeb(startPos, endPos, spider);
    } catch (error) {
      console.error('Error shooting web:', error);
      return null;
    }
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
