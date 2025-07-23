export const GAME_CONFIG = {
  physics: {
    gravity: -9.81,
    webStrength: 50,
    webStiffness: 0.8,
    climbSpeed: 3,
    jumpForce: 12, // Increased for better responsiveness
    airResistance: 0.98,
    groundFriction: 0.8,
    wallClimbForce: 8 // New: force applied when climbing walls
  },
  gameplay: {
    maxHealth: 100,
    maxStamina: 100,
    webCooldown: 800, // ms - Reduced for better web shooting
    webRange: 18, // maximum web shooting distance - Increased
    flyRespawnTime: 5000, // ms
    flyCount: 10,
    groundInsectCount: 5, // New: number of ground insects
    staminaRegenRate: 25, // per second - Increased
    webSwingStaminaCost: 2, // per second
    jumpStaminaCost: 15, // New: stamina cost for jumping
    climbStaminaCost: 1 // New: stamina cost per second while climbing
  },
  graphics: {
    renderDistance: 100,
    shadowQuality: 'medium',
    particleCount: 50,
    cameraDistance: 5, // Reduced for closer third-person view
    cameraHeight: 3, // Reduced for closer view
    cameraSmoothing: 8 // New: camera follow smoothing factor
  },
  controls: {
    mouseSensitivity: 0.002,
    keyboardSensitivity: 1.0,
    gamepadDeadzone: 0.1
  },
  network: {
    tickRate: 60,
    maxLatency: 200,
    interpolationBuffer: 100
  },
  // Enhanced: Audio configuration
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.4,
    sfxVolume: 0.7,
    ambientVolume: 0.3
  },
  // New: Environment configuration for indoor house
  environment: {
    roomWidth: 25,
    roomLength: 25,
    ceilingHeight: 6,
    wallThickness: 0.5,
    furnitureScale: 1.0,
    numberOfRooms: 4,
    doorWidth: 2,
    windowSize: 1.5
  }
};

export const FLY_CONFIGS = {
  common: {
    speed: 2,
    points: 10,
    color: 0x666666,
    size: 0.1
  },
  fast: {
    speed: 4,
    points: 25,
    color: 0x00ff00,
    size: 0.08
  },
  rare: {
    speed: 1.5,
    points: 50,
    color: 0x0066ff,
    size: 0.12
  },
  golden: {
    speed: 3,
    points: 100,
    color: 0xffaa00,
    size: 0.15
  },
  // New: Ground insects (slower, crawling)
  ground: {
    speed: 0.5,
    points: 20,
    color: 0x8B4513, // Brown color for ground insects
    size: 0.15,
    isGroundBased: true
  }
};
