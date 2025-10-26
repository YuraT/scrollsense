/**
 * Main content script entry point
 * Coordinates all modules and tracks YouTube Shorts navigation
 */

// Global instances
let timerOverlay = null;
let scrollLimitModal = null;
let donationBanner = null;
let recommendationBadge = null;
let lastUrl = '';
let scrollObserver = null;
let limitReached = false;

/**
 * Initialize extension when page loads
 */
async function init() {
  console.log('ScrollSense: Initializing...');

  // Check if we're on YouTube
  if (!window.location.hostname.includes('youtube.com')) {
    return;
  }

  // Initialize components
  timerOverlay = new TimerOverlay();
  scrollLimitModal = new ScrollLimitModal();
  donationBanner = new DonationBanner();
  recommendationBadge = new RecommendationBadge();

  // Check if we're on Shorts
  if (isYouTubeShorts()) {
    await activateShortsFeatures();
  }

  // Watch for navigation changes
  observeNavigation();

  // Listen for limit reached event
  window.addEventListener('scrollsense:limitReached', handleLimitReached);

  console.log('ScrollSense: Initialized successfully');
}

/**
 * Activate features when on YouTube Shorts
 */
async function activateShortsFeatures() {
  console.log('ScrollSense: Activating Shorts features');

  // Show timer overlay
  await timerOverlay.init();

  // Check if limit already reached
  const data = await getLocalStorage(['todayWatchtime']);
  const settings = await getSyncStorage(['dailyLimit']);
  const watchtime = data.todayWatchtime || 0;
  const limit = (settings.dailyLimit || 30) * 60;

  if (watchtime >= limit) {
    limitReached = true;
    await showLimitFeatures();
  }

  // Observe scroll events to detect navigation between Shorts
  observeScrollBehavior();
}

/**
 * Deactivate features when leaving Shorts
 */
function deactivateShortsFeatures() {
  console.log('ScrollSense: Deactivating Shorts features');

  if (timerOverlay) {
    timerOverlay.remove();
  }

  if (donationBanner) {
    donationBanner.remove();
  }

  if (recommendationBadge) {
    recommendationBadge.remove();
  }

  if (scrollObserver) {
    scrollObserver.disconnect();
    scrollObserver = null;
  }
}

/**
 * Show features when limit is reached
 */
async function showLimitFeatures() {
  // Show donation banner
  await donationBanner.show();

  // Show recommendation badge
  recommendationBadge.show();

  console.log('ScrollSense: Limit reached, features activated');
}

/**
 * Handle limit reached event
 */
async function handleLimitReached() {
  if (limitReached) return;

  limitReached = true;
  await showLimitFeatures();
}

/**
 * Observe scroll behavior to detect next/previous Short navigation
 */
function observeScrollBehavior() {
  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  let lastScrollTime = Date.now();
  let scrollTimeout = null;

  const handleScroll = async () => {
    const now = Date.now();

    // Detect swipe/scroll (throttle to avoid excessive checks)
    if (now - lastScrollTime < 500) return;
    lastScrollTime = now;

    // Check if limit is reached
    if (limitReached && !scrollLimitModal.isVisible()) {
      // User is trying to scroll to next Short after limit
      console.log('ScrollSense: User scrolling past limit, showing modal');
      await scrollLimitModal.show();
    }
  };

  // Listen to wheel events (desktop) and touch events (mobile)
  window.addEventListener('wheel', handleScroll, { passive: true });
  window.addEventListener('touchstart', handleScroll, { passive: true });

  // Also observe keyboard navigation (up/down arrows)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      handleScroll();
    }
  });

  // Use MutationObserver to detect DOM changes (Short changes)
  scrollObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if a new Short was loaded
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl && isYouTubeShorts()) {
          lastUrl = currentUrl;
          console.log('ScrollSense: New Short detected');

          // If limit reached, show modal
          if (limitReached && !scrollLimitModal.isVisible()) {
            await scrollLimitModal.show();
          }
        }
      }
    }
  });

  // Observe the Shorts container
  const shortsContainer = document.querySelector('ytd-shorts');
  if (shortsContainer) {
    scrollObserver.observe(shortsContainer, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Observe URL changes to detect navigation between pages
 */
function observeNavigation() {
  lastUrl = window.location.href;

  // Use MutationObserver to detect navigation
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('ScrollSense: Navigation detected:', currentUrl);

      // Check if navigating to or from Shorts
      const wasShorts = lastUrl.includes('/shorts/');
      const isShorts = isYouTubeShorts();

      if (isShorts && !wasShorts) {
        // Navigated to Shorts
        activateShortsFeatures();
      } else if (!isShorts && wasShorts) {
        // Navigated away from Shorts
        deactivateShortsFeatures();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen to popstate events
  window.addEventListener('popstate', () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      if (isYouTubeShorts()) {
        activateShortsFeatures();
      } else {
        deactivateShortsFeatures();
      }
    }
  });
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (timerOverlay) {
    timerOverlay.stopTracking();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
