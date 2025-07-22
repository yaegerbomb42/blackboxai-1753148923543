# Web Warriors - 3D Multiplayer Spider Game

A fully functional **3D multiplayer spider game** featuring third-person perspective gameplay where players control spiders in a realistic household environment. Catch flies, swing from webs, and compete with other players in an immersive 3D world.

## 🎮 Game Features

### Core Gameplay
- **3D Spider Movement**: Walk, climb, and jump in a fully 3D environment
- **Web Physics**: Realistic web-shooting mechanics with physics-based swinging
- **Fly Catching**: Hunt flies with different behaviors and point values
- **Third-Person Camera**: Dynamic camera positioned behind and above the spider

### Multiplayer
- **Real-time Multiplayer**: Synchronized 3D player positions and actions
- **Game Modes**: Co-op and competitive multiplayer modes
- **Matchmaking**: Lobby system with player matchmaking
- **Anti-cheat**: Server authority and lag compensation

### 3D Environment
- **Household Setting**: Detailed rooms with furniture and interactive objects
- **Dynamic Lighting**: Day/night cycle with realistic shadows
- **Physics Interactions**: Knock over objects and interact with the environment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser with WebGL support

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both the client (port 3000) and server (port 3001)

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🛠️ Technology Stack

- **Frontend**: Three.js, WebGL, Vite
- **Backend**: Node.js, Socket.IO, Express
- **Physics**: Cannon.js for 3D physics simulation
- **Networking**: Socket.IO for real-time multiplayer

## 🎮 Controls

### Keyboard
- **WASD**: Move spider
- **Space**: Jump
- **Mouse**: Look around (camera control)
- **Left Click**: Shoot web
- **Escape**: Pause game / Release pointer lock

## 🕷️ Gameplay Mechanics

### Spider Movement
- **Walking**: Move across surfaces with realistic physics
- **Jumping**: Leap between surfaces
- **Web Swinging**: Use webs to traverse the environment

### Web System
- **Web Shooting**: Aim and shoot webs at surfaces
- **Physics-Based Swinging**: Realistic pendulum physics
- **Stamina System**: Web actions consume stamina

### Fly Types
- **Common Flies** (10 points): Slow-moving, easy targets
- **Fast Flies** (25 points): Quick and agile
- **Rare Flies** (50 points): Uncommon but valuable
- **Golden Flies** (100 points): Rare, high-value targets

## 🎮 Have Fun!

Web Warriors is designed to be an engaging multiplayer experience. Whether you're playing solo or with friends, enjoy swinging through the 3D environment and catching those flies!

Happy web-slinging! 🕷️🕸️