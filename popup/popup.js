/**
 * Popup UI Logic
 * Handles display of stats, analytics, and settings
 */

// Initialize popup when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadSettings();
  await renderWeeklyChart();
  setupEventListeners();
});

/**
 * Load and display current stats
 */
async function loadStats() {
  // Get data from storage
  const localData = await chrome.storage.local.get(['todayWatchtime', 'todayDonations']);
  const syncData = await chrome.storage.sync.get(['selectedCharity']);

  const watchtime = localData.todayWatchtime || 0;
  const donations = localData.todayDonations || 0;
  const charity = syncData.selectedCharity || 'Khan Academy';


  // Update watchtime display
  const watchtimeEl = document.getElementById('today-watchtime');
  if (watchtimeEl) {
    watchtimeEl.textContent = formatTimeForPopup(watchtime);
  }

  // Update donations display
  const donationsEl = document.getElementById('today-donations');
  if (donationsEl) {
    donationsEl.textContent = formatDonation(donations);
  }

  // Update impact section
  updateImpactSection(donations, charity);
}

/**
 * Update impact section with charity info and progress
 */
function updateImpactSection(cents, charity) {
  const charityInfo = getCharityInfo(charity);
  const impact = calculateImpact(cents, charity);
  const progress = getDonationProgress(cents);

  // Update charity name and icon
  const charityEl = document.getElementById('impact-charity');
  const iconEl = document.getElementById('impact-icon');
  const descEl = document.getElementById('impact-description');

  if (charityEl) charityEl.textContent = charityInfo.name;
  if (iconEl) iconEl.textContent = charityInfo.icon;
  if (descEl) descEl.textContent = charityInfo.description;

  // Update impact stats
  const valueEl = document.getElementById('impact-value');
  const detailEl = document.getElementById('impact-detail');

  if (valueEl) valueEl.textContent = impact.formatted;
  if (detailEl) detailEl.textContent = impact.description;

  // Update progress bar
  const fillEl = document.getElementById('progress-fill');
  const currentEl = document.getElementById('progress-current');
  const nextEl = document.getElementById('progress-next');

  if (fillEl) {
    fillEl.style.width = `${progress.progress}%`;
  }

  if (currentEl) {
    currentEl.textContent = progress.currentTier;
  }

  if (nextEl && progress.nextGoal) {
    nextEl.textContent = `Next: ${progress.nextGoal.label} ($${(progress.nextGoal.amount / 100).toFixed(2)})`;
  } else if (nextEl) {
    nextEl.textContent = 'Max tier reached!';
  }
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  const data = await chrome.storage.sync.get(['dailyLimit', 'selectedCharity', 'waitTime', 'donationAmount']);

  const dailyLimit = data.dailyLimit || 30;
  const selectedCharity = data.selectedCharity || 'Khan Academy';
  const waitTime = data.waitTime || 5;
  const donationAmount = data.donationAmount || 10;


  // Set form values
  const dailyLimitEl = document.getElementById('daily-limit');
  const charityEl = document.getElementById('charity-select');
  const waitTimeEl = document.getElementById('wait-time');
  const donationAmountEl = document.getElementById('donation-amount');


  if (dailyLimitEl) dailyLimitEl.value = dailyLimit;
  if (charityEl) charityEl.value = selectedCharity;
  if (waitTimeEl) waitTimeEl.value = waitTime;
  if (donationAmountEl) donationAmountEl.value = donationAmount;

}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const saveBtn = document.getElementById('save-settings');
  const donateBtn = document.getElementById('donate-now-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }
  
  if (donateBtn) {
    donateBtn.addEventListener('click', handleDonateNow);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  const dailyLimitEl = document.getElementById('daily-limit');
  const charityEl = document.getElementById('charity-select');
  const waitTimeEl = document.getElementById('wait-time');
  const messageEl = document.getElementById('save-message');
  const donationAmountEl = document.getElementById('donation-amount');

  const dailyLimit = parseInt(dailyLimitEl.value) || 30;
  const selectedCharity = charityEl.value;
  const waitTime = parseInt(waitTimeEl.value) || 5;
  const donationAmount = parseInt(donationAmountEl.value) || 100;

  // Validate inputs
  if (dailyLimit < 1 || dailyLimit > 180) {
    alert('Daily limit must be between 1 and 180 minutes');
    return;
  }

  if (waitTime < 1 || waitTime > 30) {
    alert('Wait time must be between 1 and 30 seconds');
    return;
  }

  if (donationAmount < 1 || donationAmount > 100) {
    alert('Donation amount must be between 1 and 100 cents');
    return;
  }

  // Save to storage
  await chrome.storage.sync.set({
    dailyLimit,
    selectedCharity,
    waitTime,
    donationAmount
  });

  // Show success message
  if (messageEl) {
    messageEl.classList.remove('hidden');

    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }

  // Reload stats to reflect new charity
  await loadStats();
}

/**
 * Render weekly analytics chart (SVG bar chart)
 */
async function renderWeeklyChart() {
  const data = await chrome.storage.local.get(['weeklyData', 'todayWatchtime', 'todayDonations']);
  const weeklyData = data.weeklyData || [];

  // Add today's data
  const today = new Date().toISOString().split('T')[0];
  const chartData = [
    ...weeklyData,
    {
      date: today,
      watchtime: data.todayWatchtime || 0,
      donations: data.todayDonations || 0
    }
  ];

  // Get last 7 days
  const last7Days = chartData.slice(-7);

  // Create chart
  const svg = document.getElementById('weekly-chart');
  if (!svg) return;

  // Clear existing content
  svg.innerHTML = '';

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate max values
  const maxWatchtime = Math.max(...last7Days.map(d => d.watchtime / 60), 1); // Convert to minutes
  const maxDonations = Math.max(...last7Days.map(d => d.donations / 100), 0.1); // Convert to dollars

  // Create grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;

    const line = createSVGElement('line', {
      x1: padding.left,
      y1: y,
      x2: width - padding.right,
      y2: y,
      class: 'chart-grid'
    });

    svg.appendChild(line);
  }

  // Bar width and spacing
  const barGroupWidth = chartWidth / last7Days.length;
  const barWidth = barGroupWidth / 3;
  const barSpacing = barWidth / 2;

  // Draw bars for each day
  last7Days.forEach((day, index) => {
    const x = padding.left + index * barGroupWidth;

    // Watchtime bar (blue)
    const watchtimeMinutes = day.watchtime / 60;
    const watchtimeHeight = (watchtimeMinutes / maxWatchtime) * chartHeight;
    const watchtimeY = padding.top + chartHeight - watchtimeHeight;

    const watchtimeBar = createSVGElement('rect', {
      x: x + barSpacing,
      y: watchtimeY,
      width: barWidth,
      height: watchtimeHeight,
      fill: '#6366f1',
      class: 'chart-bar',
      rx: 2
    });

    svg.appendChild(watchtimeBar);

    // Donations bar (green)
    const donationsDollars = day.donations / 100;
    const donationsHeight = (donationsDollars / maxDonations) * chartHeight;
    const donationsY = padding.top + chartHeight - donationsHeight;

    const donationsBar = createSVGElement('rect', {
      x: x + barSpacing + barWidth,
      y: donationsY,
      width: barWidth,
      height: donationsHeight,
      fill: '#10b981',
      class: 'chart-bar',
      rx: 2
    });

    svg.appendChild(donationsBar);

    // Day label
    const dayLabel = getDayLabel(day.date, index === last7Days.length - 1);
    const labelX = x + barGroupWidth / 2;
    const labelY = height - padding.bottom + 20;

    const label = createSVGElement('text', {
      x: labelX,
      y: labelY,
      'text-anchor': 'middle',
      class: 'chart-label'
    });
    label.textContent = dayLabel;

    svg.appendChild(label);
  });
}

/**
 * Create SVG element with attributes
 */
function createSVGElement(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

/**
 * Get day label for chart
 */
function getDayLabel(dateString, isToday) {
  if (isToday) return 'Today';

  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return days[date.getDay()];
}

/**
 * Format time for popup display
 */
function formatTimeForPopup(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} min`;
  }
}

/**
 * Format donation amount
 */
function formatDonation(cents) {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Get charity information
 */
function getCharityInfo(charityName) {
  const charities = {
    'Khan Academy': {
      name: 'Khan Academy',
      description: 'Free education for anyone, anywhere',
      icon: '📚'
    },
    'St. Jude': {
      name: 'St. Jude Children\'s Research Hospital',
      description: 'Leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.',
      icon: '🏥'
    },
    'Doctors Without Borders': {
      name: 'Doctors Without Borders',
      description: 'Medical humanitarian organization',
      icon: '🏥'
    }
  };

  return charities[charityName] || charities['Khan Academy'];
}

/**
 * Calculate impact based on donation
 */
function calculateImpact(cents, charity) {
  const dollars = cents / 100;

  const impacts = {
    'Khan Academy': {
      unit: 'students',
      calculate: (amount) => Math.floor(amount),
      description: 'can access free lessons',
      icon: '📚'
    },
    'St. Jude': {
      unit: 'minutes',
      calculate: (amount) => (amount * 6.3).toFixed(2),
      description: 'minutes of research funded',
      icon: '🏥'
    },
    'Doctors Without Borders': {
      unit: 'vaccines',
      calculate: (amount) => (amount * 0.35).toFixed(2),
      description: 'provided',
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
    formatted: `${value} ${impact.unit}`
  };
}

/**
 * Get donation progress towards goals
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
    cents
  };
}

/**
 * Get donation URL for charity with pre-filled amount
 * @param {string} charity - Charity name
 * @param {number} cents - Amount in cents
 * @returns {string} Donation URL
 */
function getDonationUrl(charity, cents) {
  const dollars = (cents / 100).toFixed(2);
  
  const urls = {
    'Khan Academy': `https://donate.khanacademy.org/checkout?cid=580662&oid=83430&amount=${dollars}&frequency=one-time&currency=USD&step=0`,
    'St. Jude': `https://www.stjude.org/donate/donate-to-st-jude.html?express=0&sc_icid=charitablegifts-donate-bttn-df&amount=${dollars}&frequency_selected=0`,
    'Doctors Without Borders': `https://give.doctorswithoutborders.org/checkout?cid=687007&oid=86396&amount=${dollars}&frequency=one-time&currency=USD&step=0`
  };
  
  return urls[charity] || urls['Khan Academy'];
}

/**
 * Handle donate now button click
 */
async function handleDonateNow() {
  const localData = await chrome.storage.local.get(['todayDonations']);
  const syncData = await chrome.storage.sync.get(['selectedCharity']);
  
  const donations = localData.todayDonations || 0;
  const charity = syncData.selectedCharity || 'Khan Academy';
  
  if (donations === 0) {
    alert('No donations to pay yet! Continue scrolling past your limit to accumulate donations.');
    return;
  }
  
  // Open charity donation page with pre-filled amount
  const donationUrl = getDonationUrl(charity, donations);
  chrome.tabs.create({ url: donationUrl });
  
  // Reset donation amount to 0 after opening donation page
  await chrome.storage.local.set({ todayDonations: 0 });
  
  // Reload stats to reflect reset
  await loadStats();
}
