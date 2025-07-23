import { jest } from '@jest/globals';

// Make jest available globally
global.jest = jest;

// Mock WebGL context
global.WebGLRenderingContext = function () {};
global.WebGL2RenderingContext = function () {};

// Mock Canvas and 2D context
global.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Array(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Array(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    };
  }
  return {
    canvas: { width: 0, height: 0 },
    drawingBufferWidth: 0,
    drawingBufferHeight: 0,
    getParameter: () => '',
    getExtension: () => null,
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    clear: () => {},
    clearColor: () => {},
    enable: () => {},
    disable: () => {},
    depthFunc: () => {},
    viewport: () => {},
    drawArrays: () => {},
    drawElements: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    generateMipmap: () => {},
    deleteTexture: () => {},
    createFramebuffer: () => ({}),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    deleteFramebuffer: () => {},
    createRenderbuffer: () => ({}),
    bindRenderbuffer: () => {},
    renderbufferStorage: () => {},
    framebufferRenderbuffer: () => {},
    deleteRenderbuffer: () => {},
    checkFramebufferStatus: () => 36053, // FRAMEBUFFER_COMPLETE
  };
};

// Mock window and document APIs
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
});

// Mock DOM elements
document.body.innerHTML = `
  <div id="gameContainer">
    <div id="loadingScreen"></div>
    <div id="hud">
      <div id="healthBar"><span id="healthValue">100</span></div>
      <div id="staminaBar"><span id="staminaValue">100</span></div>
      <div id="scoreDisplay"><span id="scoreValue">0</span></div>
    </div>
    <div id="minimap">
      <canvas id="minimapCanvas" width="196" height="196"></canvas>
    </div>
    <div id="crosshair"></div>
  </div>
`;

// Mock resize observer
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock pointer lock API
document.pointerLockElement = null;
document.exitPointerLock = () => {};
HTMLElement.prototype.requestPointerLock = () => {};

// Mock audio context
global.AudioContext = function () {
  return {
    createGain: () => ({ gain: { value: 1 }, connect: () => {} }),
    createOscillator: () => ({
      frequency: { value: 440 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }),
    destination: {},
  };
};
