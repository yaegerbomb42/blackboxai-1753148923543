import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = null;
    this.lights = [];
  }

  async init() {
    console.log('Initializing scene...');
    
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    this.setupLighting();
    this.createEnvironment();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
    
    // Point lights for indoor areas
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 30);
    pointLight1.position.set(10, 8, 10);
    pointLight1.castShadow = true;
    this.scene.add(pointLight1);
    this.lights.push(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 30);
    pointLight2.position.set(-10, 8, -10);
    pointLight2.castShadow = true;
    this.scene.add(pointLight2);
    this.lights.push(pointLight2);
  }

  createEnvironment() {
    // Create a detailed room environment with spider vibes
    this.createRoom();
    this.createFurniture();
    this.createFloor();
    this.createWalls();
    this.createCobwebs();
    this.createSpiderVibeElements();
  }

  createRoom() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      map: this.createWoodTexture()
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  createFurniture() {
    // Table
    const tableGeometry = new THREE.BoxGeometry(6, 0.2, 3);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 2, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    this.scene.add(table);
    
    // Table legs
    for (let x = -2.5; x <= 2.5; x += 5) {
      for (let z = -1; z <= 1; z += 2) {
        const legGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.position.set(x, 1, z);
        leg.castShadow = true;
        this.scene.add(leg);
      }
    }
    
    // Chairs
    for (let i = 0; i < 4; i++) {
      const chair = this.createChair();
      const angle = (i / 4) * Math.PI * 2;
      chair.position.set(
        Math.cos(angle) * 5,
        0,
        Math.sin(angle) * 5
      );
      chair.rotation.y = angle + Math.PI;
      this.scene.add(chair);
    }
    
    // Bookshelf
    const shelfGeometry = new THREE.BoxGeometry(0.5, 8, 4);
    const shelfMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const bookshelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    bookshelf.position.set(-15, 4, 0);
    bookshelf.castShadow = true;
    this.scene.add(bookshelf);
  }

  createChair() {
    const chairGroup = new THREE.Group();
    
    // Seat
    const seatGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.position.y = 1;
    seat.castShadow = true;
    chairGroup.add(seat);
    
    // Back
    const backGeometry = new THREE.BoxGeometry(1, 1.5, 0.1);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.position.set(0, 1.75, -0.45);
    back.castShadow = true;
    chairGroup.add(back);
    
    // Legs
    for (let x = -0.4; x <= 0.4; x += 0.8) {
      for (let z = -0.4; z <= 0.4; z += 0.8) {
        const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        const leg = new THREE.Mesh(legGeometry, chairMaterial);
        leg.position.set(x, 0.5, z);
        leg.castShadow = true;
        chairGroup.add(leg);
      }
    }
    
    return chairGroup;
  }

  createFloor() {
    // Additional floor details can be added here
  }

  createWalls() {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    
    // North wall
    const northWallGeometry = new THREE.PlaneGeometry(40, 12);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 6, -20);
    northWall.receiveShadow = true;
    this.scene.add(northWall);
    
    // South wall
    const southWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    southWall.position.set(0, 6, 20);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    this.scene.add(southWall);
    
    // East wall
    const eastWallGeometry = new THREE.PlaneGeometry(40, 12);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(20, 6, 0);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);
    
    // West wall
    const westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    westWall.position.set(-20, 6, 0);
    westWall.rotation.y = Math.PI / 2;
    westWall.receiveShadow = true;
    this.scene.add(westWall);
  }

  createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create wood-like pattern
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, 256, 256);
    
    context.fillStyle = '#A0522D';
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      context.fillRect(0, y, 256, 2 + Math.random() * 4);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }

  createCobwebs() {
    try {
      // Create cobwebs in corners and between furniture
      const cobwebPositions = [
        { start: [-19, 11, -19], end: [-17, 9, -17] }, // Top corner
        { start: [19, 11, 19], end: [17, 9, 17] },     // Opposite corner
        { start: [-19, 11, 19], end: [-17, 9, 17] },   // Another corner
        { start: [19, 11, -19], end: [17, 9, -17] },   // Fourth corner
        { start: [0, 8, -19], end: [2, 6, -17] },      // Wall cobweb
        { start: [-15, 6, 0], end: [-13, 4, 2] },      // Near bookshelf
      ];

      cobwebPositions.forEach((pos, index) => {
        const cobweb = this.createSingleCobweb(pos.start, pos.end);
        if (cobweb) {
          this.scene.add(cobweb);
        }
      });
    } catch (error) {
      console.error('Error creating cobwebs:', error);
    }
  }

  createSingleCobweb(startPos, endPos) {
    try {
      const points = [];
      const start = new THREE.Vector3(...startPos);
      const end = new THREE.Vector3(...endPos);
      
      // Create a web-like pattern with multiple strands
      const segments = 8;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = start.clone().lerp(end, t);
        
        // Add some randomness to make it look more natural
        point.x += (Math.random() - 0.5) * 0.5;
        point.y += (Math.random() - 0.5) * 0.3;
        point.z += (Math.random() - 0.5) * 0.5;
        
        points.push(point);
      }
      
      // Create the main strand
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xcccccc,
        transparent: true,
        opacity: 0.4,
        linewidth: 1
      });
      
      const cobwebLine = new THREE.Line(geometry, material);
      
      // Add cross strands for web effect
      const webGroup = new THREE.Group();
      webGroup.add(cobwebLine);
      
      // Add a few cross strands
      for (let i = 2; i < segments - 1; i += 2) {
        const crossPoints = [
          points[i].clone().add(new THREE.Vector3(-0.3, 0, 0)),
          points[i].clone().add(new THREE.Vector3(0.3, 0, 0))
        ];
        
        const crossGeometry = new THREE.BufferGeometry().setFromPoints(crossPoints);
        const crossLine = new THREE.Line(crossGeometry, material);
        webGroup.add(crossLine);
      }
      
      return webGroup;
    } catch (error) {
      console.error('Error creating single cobweb:', error);
      return null;
    }
  }

  createSpiderVibeElements() {
    try {
      // Add dark, mysterious elements
      this.createDarkCorners();
      this.createOldCrates();
      this.createDustyBooks();
    } catch (error) {
      console.error('Error creating spider vibe elements:', error);
    }
  }

  createDarkCorners() {
    // Add dark shadowy areas in corners
    const cornerPositions = [
      [-18, 1, -18],
      [18, 1, 18],
      [-18, 1, 18],
      [18, 1, -18]
    ];

    cornerPositions.forEach(pos => {
      // Create a dark patch on the floor
      const shadowGeometry = new THREE.PlaneGeometry(3, 3);
      const shadowMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x222222,
        transparent: true,
        opacity: 0.6
      });
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(pos[0], 0.01, pos[2]);
      this.scene.add(shadow);
    });
  }

  createOldCrates() {
    // Add some old wooden crates for atmosphere
    const cratePositions = [
      [12, 1, -15],
      [-10, 1, 12],
      [8, 1, 16]
    ];

    cratePositions.forEach(pos => {
      const crateGeometry = new THREE.BoxGeometry(2, 2, 2);
      const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      
      // Rotate slightly for natural look
      crate.rotation.y = Math.random() * 0.3;
      
      this.scene.add(crate);
    });
  }

  createDustyBooks() {
    // Add some scattered books near the bookshelf
    for (let i = 0; i < 5; i++) {
      const bookGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.2);
      const bookMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(Math.random() * 0.1, 0.3, 0.2) // Dark colors
      });
      const book = new THREE.Mesh(bookGeometry, bookMaterial);
      
      book.position.set(
        -14 + Math.random() * 2,
        0.1 + i * 0.06,
        -2 + Math.random() * 4
      );
      book.rotation.y = Math.random() * Math.PI;
      book.castShadow = true;
      
      this.scene.add(book);
    }
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }
}
