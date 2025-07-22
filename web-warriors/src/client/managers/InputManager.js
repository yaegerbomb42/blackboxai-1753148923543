import { GAME_CONFIG } from '../../shared/config.js';

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: {}
    };
    this.gamepad = null;
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shoot: false,
      mouseX: 0,
      mouseY: 0
    };
    
    this.isPointerLocked = false;
    this.canvas = null;
  }

  init() {
    console.log('Initializing input manager...');
    
    this.canvas = document.querySelector('canvas');
    if (!this.canvas) {
      // If canvas doesn't exist yet, we'll bind to the renderer canvas later
      this.canvas = document.body;
    }
    
    this.bindKeyboardEvents();
    this.bindMouseEvents();
    this.bindGamepadEvents();
    this.bindPointerLockEvents();
    
    console.log('Input manager initialized');
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
      
      // Prevent default for game keys
      if (this.isGameKey(event.code)) {
        event.preventDefault();
      }
      
      // Handle special keys
      if (event.code === 'Escape') {
        this.exitPointerLock();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
  }

  bindMouseEvents() {
    this.canvas.addEventListener('click', () => {
      this.requestPointerLock();
    });

    document.addEventListener('mousemove', (event) => {
      if (this.isPointerLocked) {
        this.mouse.deltaX = event.movementX * GAME_CONFIG.controls.mouseSensitivity;
        this.mouse.deltaY = event.movementY * GAME_CONFIG.controls.mouseSensitivity;
      }
    });

    document.addEventListener('mousedown', (event) => {
      this.mouse.buttons[event.button] = true;
      
      if (this.isPointerLocked) {
        event.preventDefault();
      }
    });

    document.addEventListener('mouseup', (event) => {
      this.mouse.buttons[event.button] = false;
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (event) => {
      if (this.isPointerLocked) {
        event.preventDefault();
      }
    });
  }

  bindGamepadEvents() {
    window.addEventListener('gamepadconnected', (event) => {
      console.log('Gamepad connected:', event.gamepad.id);
      this.gamepad = event.gamepad;
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      console.log('Gamepad disconnected:', event.gamepad.id);
      this.gamepad = null;
    });
  }

  bindPointerLockEvents() {
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
      
      if (this.isPointerLocked) {
        console.log('Pointer locked');
      } else {
        console.log('Pointer unlocked');
      }
    });

    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
    });
  }

  requestPointerLock() {
    if (this.canvas && this.canvas.requestPointerLock) {
      this.canvas.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isGameKey(code) {
    const gameKeys = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD', // Movement
      'Space', // Jump
      'ShiftLeft', 'ShiftRight', // Run/Crouch
      'ControlLeft', 'ControlRight' // Special actions
    ];
    return gameKeys.includes(code);
  }

  updateGamepadInput() {
    if (!this.gamepad) {
      // Try to get gamepad
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad) {
          this.gamepad = gamepad;
          break;
        }
      }
      return;
    }

    // Update gamepad state
    const gamepad = navigator.getGamepads()[this.gamepad.index];
    if (!gamepad) return;

    // Left stick movement
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    
    if (Math.abs(leftStickX) > GAME_CONFIG.controls.gamepadDeadzone) {
      this.inputState.left = leftStickX < 0;
      this.inputState.right = leftStickX > 0;
    }
    
    if (Math.abs(leftStickY) > GAME_CONFIG.controls.gamepadDeadzone) {
      this.inputState.forward = leftStickY < 0;
      this.inputState.backward = leftStickY > 0;
    }

    // Right stick camera
    const rightStickX = gamepad.axes[2];
    const rightStickY = gamepad.axes[3];
    
    if (Math.abs(rightStickX) > GAME_CONFIG.controls.gamepadDeadzone) {
      this.mouse.deltaX = rightStickX * GAME_CONFIG.controls.mouseSensitivity * 10;
    }
    
    if (Math.abs(rightStickY) > GAME_CONFIG.controls.gamepadDeadzone) {
      this.mouse.deltaY = rightStickY * GAME_CONFIG.controls.mouseSensitivity * 10;
    }

    // Buttons
    this.inputState.jump = gamepad.buttons[0].pressed; // A button
    this.inputState.shoot = gamepad.buttons[7].pressed; // Right trigger
  }

  update() {
    // Reset mouse delta
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    
    // Update keyboard input state
    this.inputState.forward = this.keys['KeyW'] || false;
    this.inputState.backward = this.keys['KeyS'] || false;
    this.inputState.left = this.keys['KeyA'] || false;
    this.inputState.right = this.keys['KeyD'] || false;
    this.inputState.jump = this.keys['Space'] || false;
    this.inputState.shoot = this.mouse.buttons[0] || false; // Left mouse button
    
    // Update gamepad input
    this.updateGamepadInput();
    
    // Update mouse position for camera
    this.inputState.mouseX = this.mouse.deltaX;
    this.inputState.mouseY = this.mouse.deltaY;
  }

  getInputState() {
    return { ...this.inputState };
  }

  isKeyPressed(keyCode) {
    return this.keys[keyCode] || false;
  }

  isMouseButtonPressed(button) {
    return this.mouse.buttons[button] || false;
  }
}
