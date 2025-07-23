export class AudioManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.ambientVolume = 0.5;
    this.isInitialized = false;
  }

  async init() {
    console.log('Initializing AudioManager...');
    
    try {
      // Create audio context for better control
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load sound effects using data URLs for basic sounds
      await this.loadBasicSounds();
      
      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.error('AudioManager initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async loadBasicSounds() {
    try {
      // Create basic sound effects using oscillators and noise
      this.createWebShotSound();
      this.createJumpSound();
      this.createClimbSound();
      this.createEatSound();
      this.createAmbientSound();
      this.createWalkSound();
    } catch (error) {
      console.error('Failed to create basic sounds:', error);
    }
  }

  createWebShotSound() {
    // Create a "whoosh" sound for web shooting
    this.sounds.webShot = {
      play: () => this.playTone(800, 0.1, 'sawtooth', 0.3)
    };
  }

  createJumpSound() {
    // Create a quick "boing" sound for jumping
    this.sounds.jump = {
      play: () => this.playTone(400, 0.2, 'sine', 0.4)
    };
  }

  createClimbSound() {
    // Create a subtle scratching sound for climbing
    this.sounds.climb = {
      play: () => this.playNoise(0.1, 0.2)
    };
  }

  createEatSound() {
    // Create a "crunch" sound for eating
    this.sounds.eat = {
      play: () => {
        this.playTone(200, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(150, 0.1, 'square', 0.2), 100);
      }
    };
  }

  createWalkSound() {
    // Create subtle footstep sounds
    this.sounds.walk = {
      play: () => this.playTone(100, 0.05, 'triangle', 0.1)
    };
  }

  createAmbientSound() {
    // Create a low ambient hum
    this.sounds.ambient = {
      play: () => this.playTone(60, 2.0, 'sine', 0.1, true)
    };
  }

  playTone(frequency, duration, waveType = 'sine', volume = 0.3, loop = false) {
    if (!this.isInitialized || this.isMuted) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = waveType;

      const adjustedVolume = volume * this.sfxVolume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing tone:', error);
    }
  }

  playNoise(volume = 0.1, duration = 0.1) {
    if (!this.isInitialized || this.isMuted) return;

    try {
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioContext.createBufferSource();
      whiteNoise.buffer = buffer;

      const gainNode = this.audioContext.createGain();
      const adjustedVolume = volume * this.sfxVolume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);

      whiteNoise.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      whiteNoise.start(this.audioContext.currentTime);
    } catch (error) {
      console.error('Error playing noise:', error);
    }
  }

  playSound(soundName) {
    if (!this.isInitialized || this.isMuted || !this.sounds[soundName]) {
      return;
    }

    try {
      this.sounds[soundName].play();
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  playAmbient() {
    if (!this.isMuted && this.sounds.ambient) {
      this.playSound('ambient');
    }
  }

  stopAmbient() {
    // For basic implementation, ambient sounds are short-lived
    // In a more complex system, we'd track and stop long-running sounds
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    return this.isMuted;
  }

  isMutedState() {
    return this.isMuted;
  }

  // Resume audio context if it's suspended (required by some browsers)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }
}
