export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.loadingText = document.getElementById('loadingText');
    this.loadingProgress = document.getElementById('loadingProgress');
  }

  show() {
    this.loadingScreen.classList.remove('hidden');
  }

  hide() {
    this.loadingScreen.classList.add('hidden');
  }

  updateProgress(percentage, text = '') {
    this.loadingProgress.style.width = `${percentage}%`;
    if (text) {
      this.loadingText.textContent = text;
    }
  }
}
