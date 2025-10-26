/**
 * Scroll limit modal card
 * Shows modal when user scrolls past limit, pauses video, and requires wait time
 */

class ScrollLimitModal {
  constructor() {
    this.modalElement = null;
    this.isShowing = false;
    this.countdownInterval = null;
    this.pauseInterval = null;
    this.remainingSeconds = 0;
    this.videoElement = null;
    this.wasPlaying = false;
  }

  /**
   * Show the modal with countdown
   */
  async show() {
    if (this.isShowing) return;

    // Get settings
    const settings = await getSyncStorage(['waitTime', 'selectedCharity', 'donationAmount']);
    const waitTime = settings.waitTime || 5;
    const charity = settings.selectedCharity || 'Khan Academy';
    const donationAmount = settings.donationAmount || 100;
    const formattedDonationAmount = formatDonation(donationAmount);

    this.remainingSeconds = waitTime;
    this.isShowing = true;

    // Pause video aggressively
    this.videoElement = getVideoElement();
    if (this.videoElement) {
      this.wasPlaying = !this.videoElement.paused;
      this.pauseVideo();
      
      // Keep pausing if video tries to auto-resume
      this.pauseInterval = setInterval(() => {
        if (this.videoElement && !this.videoElement.paused) {
          this.videoElement.pause();
        }
      }, 100);
    }

    // Create and show modal
    this.createModal(charity, formattedDonationAmount);
    this.attachToPage();
    this.startCountdown();
  }

  /**
   * Pause video with multiple methods
   */
  pauseVideo() {
    if (!this.videoElement) return;
    
    try {
      this.videoElement.pause();
      // Also try to stop it from auto-playing
      this.videoElement.setAttribute('data-scrollsense-paused', 'true');
    } catch (err) {
      console.log('Error pausing video:', err);
    }
  }

  /**
   * Create modal element
   */
  createModal(charity, formattedDonationAmount) {
    const charityInfo = getCharityInfo(charity);
    const recommendations = getRecommendations();

    const modal = createElement('div', {
      id: 'scrollsense-modal',
      classes: 'scrollsense-modal'
    });

    const overlay = createElement('div', {
      classes: 'modal-overlay'
    });

    const card = createElement('div', {
      classes: 'modal-card'
    });

    card.innerHTML = `
      <div class="modal-header">
        <h2>⏸️ Take a Mindful Moment</h2>
      </div>

      <div class="modal-body">
        <p class="modal-message">
          You've reached your daily Shorts limit.
          Continuing will increase your donation to <strong>${charityInfo.name}</strong> ${charityInfo.icon}
        </p>

        <div class="countdown-section">
          <div class="countdown-circle">
            <svg class="countdown-svg" width="120" height="120">
              <circle class="countdown-bg" cx="60" cy="60" r="54"></circle>
              <circle class="countdown-progress" cx="60" cy="60" r="54"></circle>
            </svg>
            <div class="countdown-text">
              <span class="countdown-number">${this.remainingSeconds}</span>
              <span class="countdown-label">seconds</span>
            </div>
          </div>
        </div>

        <div class="recommendations-section">
          <h3>📚 Watch This Next!</h3>
          <p class="recommendations-subtitle">Try these educational long-form videos instead:</p>
          <div class="recommendations-list">
            ${recommendations.slice(0, 3).map(rec => `
              <a href="${rec.url}" class="recommendation-item" target="_blank">
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-content">
                  <div class="rec-title">${rec.title}</div>
                  <div class="rec-impact">${rec.impact}</div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>

        <div class="impact-section">
          <p class="impact-text">
            ${charityInfo.impact}
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button id="scrollsense-continue-btn" class="continue-btn" disabled>
          <span class="btn-text">Continue for </span><span class="btn-amount" id="scrollsense-amount-text">${formattedDonationAmount}</span>
        </button>
      </div>
    `;

    modal.appendChild(overlay);
    modal.appendChild(card);
    this.modalElement = modal;

    // Add event listener to continue button
    const continueBtn = card.querySelector('#scrollsense-continue-btn');
    continueBtn.addEventListener('click', () => this.handleContinue());
  }

  /**
   * Attach modal to page
   */
  attachToPage() {
    if (!document.body.contains(this.modalElement)) {
      document.body.appendChild(this.modalElement);
    }
  }

  /**
   * Start countdown timer
   */
  startCountdown() {
    const circumference = 2 * Math.PI * 54;
    const progressCircle = this.modalElement.querySelector('.countdown-progress');
    const countdownNumber = this.modalElement.querySelector('.countdown-number');
    const continueBtn = this.modalElement.querySelector('#scrollsense-continue-btn');

    this.countdownInterval = setInterval(() => {
      this.remainingSeconds--;

      // Update countdown display
      if (countdownNumber) {
        countdownNumber.textContent = this.remainingSeconds;
      }

      // Update progress circle
      if (progressCircle) {
        const settings = getSyncStorage(['waitTime']).then(s => {
          const waitTime = s.waitTime || 5;
          const progress = this.remainingSeconds / waitTime;
          const offset = circumference * (1 - progress);
          progressCircle.style.strokeDashoffset = offset;
        });
      }

      // Enable button when countdown reaches 1
      if (this.remainingSeconds <= 0) {
        clearInterval(this.countdownInterval);
        if (continueBtn) {
          continueBtn.disabled = false;
          continueBtn.classList.add('enabled');
        }
      }
    }, 1000);
  }

  /**
   * Handle continue button click
   */
  async handleContinue() {
    // Increment donation counter
    await incrementDonation();

    // Close modal and resume video
    this.close();
  }

  /**
   * Close modal and resume video
   */
  close() {
    if (!this.isShowing) return;

    // Clear pause interval
    if (this.pauseInterval) {
      clearInterval(this.pauseInterval);
      this.pauseInterval = null;
    }

    // Resume video if it was playing
    if (this.videoElement && this.wasPlaying) {
      this.videoElement.removeAttribute('data-scrollsense-paused');
      this.videoElement.play().catch(err => {
        console.log('Could not resume video:', err);
      });
    }

    // Remove modal
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement);
    }

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.isShowing = false;
    this.modalElement = null;
  }

  /**
   * Check if modal is currently showing
   */
  isVisible() {
    return this.isShowing;
  }
}
