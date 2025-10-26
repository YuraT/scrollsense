/**
 * Donation tracking and impact display
 * Manages donation counter and calculates impact
 */

/**
 * Increment donation counter when user continues past limit
 */
async function incrementDonation() {
  const syncData = await getSyncStorage(['donationAmount']);
  const donationAmount = syncData.donationAmount || 100; // Default $0.10 in cents
  
  const data = await getLocalStorage(['todayDonations']);
  const currentDonations = data.todayDonations || 0;

  await setLocalStorage({
    todayDonations: currentDonations + donationAmount
  });

  console.log('Donation incremented:', currentDonations + donationAmount);

  // Dispatch event for other components to update
  window.dispatchEvent(new CustomEvent('scrollsense:donationUpdated', {
    detail: { totalDonations: currentDonations + donationAmount }
  }));
}

/**
 * Get current donation total
 */
async function getDonationTotal() {
  const data = await getLocalStorage(['todayDonations']);
  return data.todayDonations || 0;
}

/**
 * Format donation amount for display
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted amount
 */
function formatDonation(cents) {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculate impact based on donation amount and charity
 * @param {number} cents - Amount in cents
 * @param {string} charity - Charity name
 * @returns {object} Impact information
 */
function calculateImpact(cents, charity) {
  const dollars = cents / 100;

  const impacts = {
    'Khan Academy': {
      unit: 'students',
      calculate: (amount) => amount,
      description: 'students can access free lessons',
      icon: '📚'
    },
    'WWF': {
      unit: 'acres',
      calculate: (amount) => (amount * 0.3).toFixed(2),
      description: 'acres of habitat protected',
      icon: '🌲'
    },
    'Doctors Without Borders': {
      unit: 'vaccines',
      calculate: (amount) => (amount * 0.35).toFixed(2),
      description: 'vaccines provided',
      icon: '💉'
    }
  };

  const impact = impacts[charity] || impacts['Khan Academy'];
  const value = impact.calculate(dollars);

  return {
    value,
    unit: impact.unit,
    description: impact.description,
    icon: impact.icon,
    formatted: `${value} ${impact.unit}`,
  };
}

/**
 * Get donation progress towards goals
 * @param {number} cents - Current donation amount in cents
 * @returns {object} Progress information
 */
function getDonationProgress(cents) {
  const goals = [
    { amount: 50, label: 'Bronze' },
    { amount: 100, label: 'Silver' },
    { amount: 250, label: 'Gold' },
    { amount: 500, label: 'Platinum' }
  ];

  let currentTier = 'Starter';
  let nextGoal = goals[0];
  let progress = 0;

  for (let i = 0; i < goals.length; i++) {
    if (cents >= goals[i].amount) {
      currentTier = goals[i].label;
      if (i < goals.length - 1) {
        nextGoal = goals[i + 1];
      } else {
        nextGoal = null;
      }
    } else {
      nextGoal = goals[i];
      break;
    }
  }

  if (nextGoal) {
    progress = (cents / nextGoal.amount) * 100;
  } else {
    progress = 100;
  }

  return {
    currentTier,
    nextGoal,
    progress: Math.min(progress, 100),
    cents,
  };
}

/**
 * Create donation impact banner to show below Shorts player
 */
class DonationBanner {
  constructor() {
    this.bannerElement = null;
    this.isShowing = false;

    // Listen for donation updates
    window.addEventListener("scrollsense:donationUpdated", async (event) => {
      if (this.isShowing) {
        await this.updateContent();
      }
    });
  }

  /**
   * Show the banner
   */
  async show() {
    if (this.isShowing) return;

    await this.createBanner();
    this.attachToPage();
    this.isShowing = true;
  }

  /**
   * Create banner element
   */
  async createBanner() {
    const data = await getLocalStorage(['todayDonations', 'todayWatchtime']);
    const settings = await getSyncStorage(['selectedCharity']);
    const charity = settings.selectedCharity || 'Khan Academy';

    const donationAmount = data.todayDonations || 0;
    const impact = calculateImpact(donationAmount, charity);

    const banner = document.createElement('div');
    banner.id = 'scrollsense-banner';
    banner.className = 'scrollsense-banner';

    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">🎯</div>
        <div class="banner-text">
          <div class="banner-title">Daily limit reached!</div>
          <div class="banner-subtitle">
            You've donated <strong>${formatDonation(donationAmount)}</strong> to ${charity} today
            <span class="banner-impact">${impact.icon} ${impact.formatted} ${impact.description}</span>
          </div>
        </div>
      </div>
    `;

    this.bannerElement = banner;
  }

  /**
   * Attach banner to page (below Shorts player)
   */
  attachToPage() {
    // Try to find Shorts container
    const shortsContainer = document.querySelector('ytd-shorts');

    if (shortsContainer && !document.body.contains(this.bannerElement)) {
      shortsContainer.appendChild(this.bannerElement);
    } else if (!document.body.contains(this.bannerElement)) {
      // Fallback: append to body
      document.body.appendChild(this.bannerElement);
    }
  }

  /**
   * Remove banner
   */
  remove() {
    if (this.bannerElement && this.bannerElement.parentNode) {
      this.bannerElement.parentNode.removeChild(this.bannerElement);
    }
    this.isShowing = false;
  }

  /**
   * Update banner content dynamically without recreating the entire banner
   */
  async updateContent() {
    if (!this.bannerElement) return;

    const data = await getLocalStorage(['todayDonations']);
    const settings = await getSyncStorage(['selectedCharity']);
    const charity = settings.selectedCharity || 'Khan Academy';

    const donationAmount = data.todayDonations || 0;
    const impact = calculateImpact(donationAmount, charity);

    // Update the donation amount and impact text
    const subtitleElement =
      this.bannerElement.querySelector('.banner-subtitle');
    if (subtitleElement) {
      subtitleElement.innerHTML = `
        You've donated <strong>${formatDonation(donationAmount)}</strong> to ${charity} today
        <span class="banner-impact">${impact.icon} ${impact.formatted} ${impact.description}</span>
      `;
    }
  }

  /**
   * Update banner content (legacy method - recreates banner)
   */
  async update() {
    if (this.isShowing) {
      this.remove();
      await this.show();
    }
  }
}
