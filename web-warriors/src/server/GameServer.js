const { GAME_CONFIG } = require('../shared/config');
const Player = require('./entities/Player');
const GameRoom = require('./GameRoom');
const FlySystem = require('./systems/FlySystem');

class GameServer {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.rooms = new Map();
    this.defaultRoom = null;
    this.flySystem = new FlySystem();

    // Game loop
    this.gameLoop = null;
    this.tickRate = GAME_CONFIG.network.tickRate;
    this.lastUpdate = Date.now();
  }

  init() {
    console.log('Initializing game server...');

    // Create default room
    this.defaultRoom = new GameRoom('default', 'Default Room');
    this.rooms.set('default', this.defaultRoom);

    // Initialize fly system
    this.flySystem.init();

    // Start game loop
    this.startGameLoop();

    console.log('Game server initialized');
  }

  startGameLoop() {
    const targetFrameTime = 1000 / this.tickRate;

    this.gameLoop = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdate) / 1000;
      this.lastUpdate = now;

      this.update(deltaTime);
    }, targetFrameTime);
  }

  update(deltaTime) {
    // Update all rooms
    this.rooms.forEach((room) => {
      room.update(deltaTime);
    });

    // Update fly system
    this.flySystem.update(deltaTime);

    // Send game state to all players
    this.broadcastGameState();
  }

  addPlayer(socketId, playerData, socket) {
    console.log(`Adding player: ${socketId}`);

    const player = new Player(socketId, playerData, socket);
    this.players.set(socketId, player);

    // Add player to default room
    this.defaultRoom.addPlayer(player);

    // Send initial game state to player
    socket.emit('gameState', this.getGameState());
    socket.emit('playerJoined', { playerId: socketId, ...playerData });

    // Notify other players
    socket.broadcast.emit('playerJoined', {
      playerId: socketId,
      ...playerData,
    });
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      // Remove from room
      if (player.room) {
        player.room.removePlayer(socketId);
      }

      // Remove from players map
      this.players.delete(socketId);

      // Notify other players
      this.io.emit('playerLeft', { playerId: socketId });
    }
  }

  handlePlayerInput(socketId, inputData) {
    const player = this.players.get(socketId);
    if (player) {
      player.updateInput(inputData);
    }
  }

  handleChatMessage(socketId, message) {
    const player = this.players.get(socketId);
    if (player && player.room) {
      player.room.broadcastMessage({
        type: 'chat',
        playerId: socketId,
        playerName: player.name,
        message: message,
        timestamp: Date.now(),
      });
    }
  }

  handleWebShoot(socketId, webData) {
    const player = this.players.get(socketId);
    if (player && player.room) {
      player.room.handleWebShoot(player, webData);
    }
  }

  broadcastGameState() {
    const gameState = this.getGameState();

    // Send to all connected players
    this.io.emit('gameState', gameState);
  }

  getGameState() {
    const players = {};
    this.players.forEach((player, id) => {
      players[id] = {
        id: id,
        position: player.position,
        rotation: player.rotation,
        health: player.health,
        stamina: player.stamina,
        score: player.score,
        isClimbing: player.isClimbing,
        isSwinging: player.isSwinging,
      };
    });

    return {
      players: players,
      flies: this.flySystem.getFlies(),
      gameTime: Date.now(),
      gameMode: 'cooperative', // TODO: Make this configurable
    };
  }

  getPlayerCount() {
    return this.players.size;
  }

  getStats() {
    return {
      playerCount: this.players.size,
      roomCount: this.rooms.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      tickRate: this.tickRate,
      flyCount: this.flySystem.getFlyCount(),
    };
  }

  // Room management
  createRoom(roomId, roomName, maxPlayers = 8) {
    if (this.rooms.has(roomId)) {
      return null; // Room already exists
    }

    const room = new GameRoom(roomId, roomName, maxPlayers);
    this.rooms.set(roomId, room);
    return room;
  }

  removeRoom(roomId) {
    if (roomId === 'default') {
      return false; // Cannot remove default room
    }

    const room = this.rooms.get(roomId);
    if (room) {
      // Move all players to default room
      room.getPlayers().forEach((player) => {
        this.defaultRoom.addPlayer(player);
      });

      this.rooms.delete(roomId);
      return true;
    }

    return false;
  }

  shutdown() {
    console.log('Shutting down game server...');

    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    // Disconnect all players
    this.players.forEach((player) => {
      player.socket.disconnect();
    });

    console.log('Game server shut down');
  }
}

module.exports = GameServer;
