export const GAME_CONFIG = {
  physics: {
    gravity: -9.81,
    webStrength: 50,
    webStiffness: 0.8,
    climbSpeed: 2,
    jumpForce: 8,
    airResistance: 0.98,
    groundFriction: 0.8,
  },
  gameplay: {
    maxHealth: 100,
    maxStamina: 100,
    webCooldown: 1000, // ms
    webRange: 15, // maximum web shooting distance
    flyRespawnTime: 5000, // ms
    flyCount: 10,
    staminaRegenRate: 20, // per second
    webSwingStaminaCost: 2, // per second
  },
  graphics: {
    renderDistance: 100,
    shadowQuality: 'medium',
    particleCount: 50,
    cameraDistance: 8,
    cameraHeight: 4,
  },
  controls: {
    mouseSensitivity: 0.002,
    keyboardSensitivity: 1.0,
    gamepadDeadzone: 0.1,
  },
  network: {
    tickRate: 60,
    maxLatency: 200,
    interpolationBuffer: 100,
  },
};

export const FLY_CONFIGS = {
  common: {
    speed: 2,
    points: 10,
    color: 0x666666,
    size: 0.1,
  },
  fast: {
    speed: 4,
    points: 25,
    color: 0x00ff00,
    size: 0.08,
  },
  rare: {
    speed: 1.5,
    points: 50,
    color: 0x0066ff,
    size: 0.12,
  },
  golden: {
    speed: 3,
    points: 100,
    color: 0xffaa00,
    size: 0.15,
  },
};
