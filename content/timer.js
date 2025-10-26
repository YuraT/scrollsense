/**
 * Timer overlay badge for YouTube Shorts
 * Displays watchtime and updates color based on limit progress
 */

class TimerOverlay {
  constructor() {
    this.timerElement = null;
    this.startTime = null;
    this.intervalId = null;
    this.isActive = false;
    this.limitReached = false;
  }

  /**
   * Initialize the timer overlay
   */
  async init() {
    this.createTimerElement();
    this.attachToPage();
    await this.updateDisplay();
    this.startTracking();
  }

  /**
   * Create the timer badge element
   */
  createTimerElement() {
    const container = document.createElement('div');
    container.id = 'scrollsense-timer';
    container.className = 'scrollsense-timer';

    container.innerHTML = `
      <div class="timer-badge">
        <div class="timer-icon">⏱️</div>
        <div class="timer-text">
          <div class="timer-value">0:00</div>
          <div class="timer-label">today</div>
        </div>
      </div>
    `;

    this.timerElement = container;
  }

  /**
   * Attach timer to the page
   */
  attachToPage() {
    if (!document.body.contains(this.timerElement)) {
      document.body.appendChild(this.timerElement);
    }
  }

  /**
   * Remove timer from page
   */
  remove() {
    if (this.timerElement && this.timerElement.parentNode) {
      this.timerElement.parentNode.removeChild(this.timerElement);
    }
    this.stopTracking();
  }

  /**
   * Start tracking watchtime
   */
  startTracking() {
    if (this.isActive) return;

    this.isActive = true;
    this.startTime = Date.now();

    // Update display every second
    this.intervalId = setInterval(async () => {
      await this.updateWatchtime();
      await this.updateDisplay();
    }, 1000);
  }

  /**
   * Stop tracking watchtime
   */
  stopTracking() {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Save final watchtime
    this.updateWatchtime();
  }

  /**
   * Update watchtime in storage
   */
  async updateWatchtime() {
    if (!this.startTime) return;

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const data = await getLocalStorage(['todayWatchtime']);
    const currentWatchtime = data.todayWatchtime || 0;

    await setLocalStorage({
      todayWatchtime: currentWatchtime + elapsed
    });

    // Reset start time for next interval
    this.startTime = Date.now();
  }

  /**
   * Update timer display with current watchtime and color
   */
  async updateDisplay() {
    const data = await getLocalStorage(['todayWatchtime']);
    const settings = await getSyncStorage(['dailyLimit']);

    const watchtime = data.todayWatchtime || 0;
    const limit = (settings.dailyLimit || 30) * 60; // Convert minutes to seconds

    const percentage = (watchtime / limit) * 100;
    const color = getTimerColor(percentage);

    // Update timer text
    const timerValue = this.timerElement.querySelector('.timer-value');
    if (timerValue) {
      timerValue.textContent = formatTime(watchtime);
    }

    // Update badge color
    const timerBadge = this.timerElement.querySelector('.timer-badge');
    if (timerBadge) {
      timerBadge.style.backgroundColor = color;
      timerBadge.style.borderColor = color;
    }

    // Check if limit reached
    if (watchtime >= limit && !this.limitReached) {
      this.limitReached = true;
      this.showLimitReachedNotification();
    }
  }

  /**
   * Show notification that limit has been reached
   */
  showLimitReachedNotification() {
    // Add a pulse animation to the timer
    const timerBadge = this.timerElement.querySelector('.timer-badge');
    if (timerBadge) {
      timerBadge.classList.add('timer-pulse');
    }

    // Dispatch custom event that modal can listen to
    window.dispatchEvent(new CustomEvent('scrollsense:limitReached'));
  }

  /**
   * Reset limit reached flag (for testing or daily reset)
   */
  resetLimitFlag() {
    this.limitReached = false;
    const timerBadge = this.timerElement.querySelector('.timer-badge');
    if (timerBadge) {
      timerBadge.classList.remove('timer-pulse');
    }
  }

  /**
   * Show/hide timer based on page
   */
  toggleVisibility(visible) {
    if (this.timerElement) {
      this.timerElement.style.display = visible ? 'block' : 'none';
    }

    if (visible && !this.isActive) {
      this.startTracking();
    } else if (!visible && this.isActive) {
      this.stopTracking();
    }
  }
}
