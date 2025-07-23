import { GameEngine } from '../client/engine/GameEngine.js';

describe('GameEngine', () => {
  let engine;

  beforeEach(async () => {
    engine = new GameEngine();
    await engine.init();
  });

  test('should initialize managers and spider', () => {
    expect(engine.sceneManager).toBeDefined();
    expect(engine.physicsManager).toBeDefined();
    expect(engine.inputManager).toBeDefined();
    expect(engine.cameraManager).toBeDefined();
    expect(engine.flyManager).toBeDefined();
    expect(engine.webManager).toBeDefined();
    expect(engine.uiManager).toBeDefined();
    expect(engine.spider).toBeDefined();
  });

  test('should update game state', () => {
    const initialScore = engine.gameState.score;
    engine.catchFly = jest.fn();
    engine.flyManager.flies = [
      { points: 10, mesh: { position: { distanceTo: () => 0.1 } } },
    ];
    engine.spider = { mesh: { position: { distanceTo: () => 0.1 } } };
    engine.checkCollisions();
    expect(engine.catchFly).toHaveBeenCalled();
  });

  test('should update player and add new remote player', () => {
    const playerData = {
      id: 'player1',
      position: { x: 0, y: 0, z: 0 },
      rotation: { _x: 0, _y: 0, _z: 0, _w: 1 },
      health: 100,
      stamina: 100,
      score: 0,
    };
    engine.updatePlayer(playerData);
    expect(engine.gameState.players.has('player1')).toBe(true);
  });
});
