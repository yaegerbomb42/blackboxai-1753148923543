// Type definitions for JavaScript (for documentation purposes)

export const FlyType = {
  COMMON: 'common',
  FAST: 'fast',
  RARE: 'rare',
  GOLDEN: 'golden',
};

export const GameMode = {
  SINGLE_PLAYER: 'singleplayer',
  COOPERATIVE: 'cooperative',
  COMPETITIVE: 'competitive',
};

// Example objects for reference
export const exampleVector3 = {
  x: 0,
  y: 0,
  z: 0,
};

export const examplePlayerState = {
  id: '',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  health: 100,
  stamina: 100,
  score: 0,
  isClimbing: false,
  isSwinging: false,
  webTarget: null,
};

export const exampleFlyState = {
  id: '',
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  type: FlyType.COMMON,
  points: 10,
};

export const exampleInputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  shoot: false,
  mouseX: 0,
  mouseY: 0,
};

export const exampleNetworkMessage = {
  type: '',
  data: null,
  timestamp: 0,
};
