/**
 * Utility functions for storage and DOM manipulation
 * All functions are in global scope for content script usage
 */

/**
 * Get data from chrome.storage.local
 * @param {string|string[]|null} keys - Keys to retrieve
 * @returns {Promise<object>}
 */
async function getLocalStorage(keys = null) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
}

/**
 * Set data in chrome.storage.local
 * @param {object} data - Data to store
 * @returns {Promise<void>}
 */
async function setLocalStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

/**
 * Get data from chrome.storage.sync
 * @param {string|string[]|null} keys - Keys to retrieve
 * @returns {Promise<object>}
 */
async function getSyncStorage(keys = null) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}

/**
 * Set data in chrome.storage.sync
 * @param {object} data - Data to store
 * @returns {Promise<void>}
 */
async function setSyncStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}

/**
 * Format seconds into human-readable time
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format seconds for popup display (minutes/hours)
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
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
 * Check if current page is YouTube Shorts
 * @returns {boolean}
 */
function isYouTubeShorts() {
  return window.location.pathname.includes('/shorts/');
}

/**
 * Get video player element (works for YouTube, TikTok, Instagram)
 * @returns {HTMLVideoElement|null}
 */
function getVideoElement() {
  // Try to find the currently playing video
  const videos = document.querySelectorAll('video');
  
  // Return the first non-paused video, or the first video found
  for (const video of videos) {
    if (!video.paused) {
      return video;
    }
  }
  
  // If all are paused, return the first one
  return videos[0] || null;
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<Element>}
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create element with classes and attributes
 * @param {string} tag - HTML tag name
 * @param {object} options - Element options
 * @returns {HTMLElement}
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.classes) {
    element.className = options.classes;
  }

  if (options.id) {
    element.id = options.id;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options.styles) {
    Object.entries(options.styles).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }

  return element;
}

/**
 * Calculate donation amount based on scrolls
 * @param {number} scrollCount - Number of scrolls past limit
 * @returns {number} Donation amount in cents
 */
function calculateDonation(scrollCount) {
  // $0.10 per scroll past limit
  return scrollCount * 10;
}

/**
 * Get timer color based on progress
 * @param {number} percentage - Progress percentage (0-100)
 * @returns {string} Color hex code
 */
function getTimerColor(percentage) {
  if (percentage < 70) {
    return '#10b981'; // Green
  } else if (percentage < 90) {
    return '#f59e0b'; // Yellow/Orange
  } else {
    return '#ef4444'; // Red
  }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get charity information
 * @param {string} charityName - Name of charity
 * @returns {object} Charity details
 */
function getCharityInfo(charityName) {
  const charities = {
    'Khan Academy': {
      name: 'Khan Academy',
      description: 'Free education for anyone, anywhere',
      impact: 'Provides free educational resources to millions of students worldwide',
      icon: '📚'
    },
    'St. Jude': {
      name: 'St. Jude',
      description: 'Children\'s research hospital',
      impact: 'Helps treat and save children with cancer and other life-threatening diseases',
      icon: '👶'
    },
    'Doctors Without Borders': {
      name: 'Doctors Without Borders',
      description: 'Medical humanitarian organization',
      impact: 'Provides emergency medical care in crisis zones worldwide',
      icon: '🏥'
    }
  };

  return charities[charityName] || charities['Khan Academy'];
}
