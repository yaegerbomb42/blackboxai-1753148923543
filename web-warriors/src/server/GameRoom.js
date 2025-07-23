class GameRoom {
  constructor(id, name, maxPlayers = 8) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.createdAt = Date.now();
    this.gameMode = 'cooperative';
    this.isActive = true;
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      return false; // Room is full
    }

    this.players.set(player.id, player);
    player.setRoom(this);

    console.log(`Player ${player.name} joined room ${this.name}`);

    // Notify other players in the room
    this.broadcastToOthers(player.id, 'playerJoinedRoom', {
      playerId: player.id,
      playerName: player.name,
      roomId: this.id,
    });

    return true;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      player.setRoom(null);

      console.log(`Player ${player.name} left room ${this.name}`);

      // Notify other players
      this.broadcastToOthers(playerId, 'playerLeftRoom', {
        playerId: playerId,
        roomId: this.id,
      });

      return true;
    }

    return false;
  }

  update(deltaTime) {
    // Update all players in the room
    this.players.forEach((player) => {
      player.update(deltaTime);
    });

    // Check for player interactions, collisions, etc.
    this.checkPlayerInteractions();
  }

  checkPlayerInteractions() {
    const playerArray = Array.from(this.players.values());

    // Check for player-player interactions
    for (let i = 0; i < playerArray.length; i++) {
      for (let j = i + 1; j < playerArray.length; j++) {
        const player1 = playerArray[i];
        const player2 = playerArray[j];

        const distance = this.calculateDistance(
          player1.position,
          player2.position
        );

        // Players can help each other if close enough
        if (distance < 2) {
          this.handlePlayerProximity(player1, player2);
        }
      }
    }
  }

  handlePlayerProximity(player1, player2) {
    // Cooperative healing
    if (player1.health < 50 && player2.health > 50) {
      player1.heal(5);
      player2.takeDamage(2);
    } else if (player2.health < 50 && player1.health > 50) {
      player2.heal(5);
      player1.takeDamage(2);
    }
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  handleWebShoot(player, webData) {
    // Process web shooting for the player
    const currentTime = Date.now();

    if (currentTime - player.lastWebShot < 1000) {
      return; // Cooldown not met
    }

    player.shootWeb();

    // Broadcast web shot to other players in room
    this.broadcastToOthers(player.id, 'playerShotWeb', {
      playerId: player.id,
      startPosition: player.position,
      targetPosition: player.webTarget,
      timestamp: currentTime,
    });
  }

  broadcastMessage(message) {
    this.players.forEach((player) => {
      player.socket.emit('roomMessage', message);
    });
  }

  broadcastToOthers(excludePlayerId, event, data) {
    this.players.forEach((player, id) => {
      if (id !== excludePlayerId) {
        player.socket.emit(event, data);
      }
    });
  }

  broadcastToAll(event, data) {
    this.players.forEach((player) => {
      player.socket.emit(event, data);
    });
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerCount() {
    return this.players.size;
  }

  isFull() {
    return this.players.size >= this.maxPlayers;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  getRoomInfo() {
    return {
      id: this.id,
      name: this.name,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
      gameMode: this.gameMode,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }

  setGameMode(mode) {
    this.gameMode = mode;
    this.broadcastToAll('gameModeChanged', { gameMode: mode });
  }

  close() {
    this.isActive = false;

    // Notify all players
    this.broadcastToAll('roomClosed', { roomId: this.id });

    // Remove all players
    this.players.forEach((player) => {
      this.removePlayer(player.id);
    });
  }
}

module.exports = GameRoom;
