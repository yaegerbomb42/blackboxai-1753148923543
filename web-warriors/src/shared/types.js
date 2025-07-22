export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  rotation: Vector3;
  health: number;
  stamina: number;
  score: number;
  isClimbing: boolean;
  isSwinging: boolean;
  webTarget?: Vector3;
}

export interface GameState {
  players: Map<string, PlayerState>;
  flies: FlyState[];
  gameTime: number;
  gameMode: GameMode;
}

export interface FlyState {
  id: string;
  position: Vector3;
  velocity: Vector3;
  type: FlyType;
  points: number;
}

export enum FlyType {
  COMMON = 'common',
  FAST = 'fast',
  RARE = 'rare',
  GOLDEN = 'golden'
}

export enum GameMode {
  SINGLE_PLAYER = 'singleplayer',
  COOPERATIVE = 'cooperative',
  COMPETITIVE = 'competitive'
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
  mouseX: number;
  mouseY: number;
}

export interface NetworkMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface GameConfig {
  physics: {
    gravity: number;
    webStrength: number;
    climbSpeed: number;
    jumpForce: number;
  };
  gameplay: {
    maxHealth: number;
    maxStamina: number;
    webCooldown: number;
    flyRespawnTime: number;
  };
  graphics: {
    renderDistance: number;
    shadowQuality: 'low' | 'medium' | 'high';
    particleCount: number;
  };
}
