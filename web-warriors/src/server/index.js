const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameServer = require('./GameServer');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.gameServer = new GameServer(this.io);
    this.port = process.env.PORT || 3001;
  }

  init() {
    console.log('Initializing server...');
    
    // Serve static files
    this.app.use(express.static(path.join(__dirname, '../../build')));
    this.app.use('/assets', express.static(path.join(__dirname, '../../assets')));
    
    // API routes
    this.setupRoutes();
    
    // Socket.IO connection handling
    this.setupSocketHandlers();
    
    // Initialize game server
    this.gameServer.init();
    
    console.log('Server initialized');
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        players: this.gameServer.getPlayerCount()
      });
    });

    // Game stats endpoint
    this.app.get('/api/stats', (req, res) => {
      res.json(this.gameServer.getStats());
    });

    // Serve game client
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../build/index.html'));
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
      
      // Handle player join
      socket.on('joinGame', (playerData) => {
        this.gameServer.addPlayer(socket.id, playerData, socket);
      });
      
      // Handle player input
      socket.on('playerInput', (inputData) => {
        this.gameServer.handlePlayerInput(socket.id, inputData);
      });
      
      // Handle player disconnect
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        this.gameServer.removePlayer(socket.id);
      });
      
      // Handle chat messages
      socket.on('chatMessage', (message) => {
        this.gameServer.handleChatMessage(socket.id, message);
      });
      
      // Handle web shooting
      socket.on('shootWeb', (webData) => {
        this.gameServer.handleWebShoot(socket.id, webData);
      });
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🕷️  Web Warriors server running on port ${this.port}`);
      console.log(`🌐 Game client: http://localhost:${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.init();
  server.start();
}

module.exports = Server;
