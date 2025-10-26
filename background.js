/**
 * Background Service Worker
 * Handles session tracking and daily data resets
 */

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ScrollSense extension installed');

  // Set default sync settings if not already set
  const syncData = await chrome.storage.sync.get(['dailyLimit', 'selectedCharity', 'waitTime']);

  if (!syncData.dailyLimit) {
    await chrome.storage.sync.set({
      dailyLimit: 30, // 30 minutes default
      selectedCharity: 'Khan Academy',
      waitTime: 5 // 5 seconds wait time
    });
  }

  // Initialize local storage
  const today = getToday();
  await chrome.storage.local.set({
    lastResetDate: today,
    todayWatchtime: 0, // in seconds
    todayDonations: 0,
    weeklyData: []
  });
});

// Check for daily reset every time extension starts
chrome.runtime.onStartup.addListener(async () => {
  await checkAndResetDaily();
});

// Listen for tab updates to detect YouTube Shorts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/shorts')) {
    // Notify content script if needed
    console.log('YouTube Shorts detected');
  }
});

// Periodic check for daily reset (every hour)
chrome.alarms.create('dailyResetCheck', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyResetCheck') {
    await checkAndResetDaily();
  }
});

/**
 * Check if we need to reset daily data
 */
async function checkAndResetDaily() {
  const data = await chrome.storage.local.get(['lastResetDate', 'todayWatchtime', 'todayDonations', 'weeklyData']);
  const today = getToday();

  if (data.lastResetDate !== today) {
    console.log('Resetting daily data for new day');

    // Save yesterday's data to weekly analytics
    const weeklyData = data.weeklyData || [];
    weeklyData.push({
      date: data.lastResetDate,
      watchtime: data.todayWatchtime || 0,
      donations: data.todayDonations || 0
    });

    // Keep only last 7 days
    const recentWeekly = weeklyData.slice(-7);

    // Reset daily counters
    await chrome.storage.local.set({
      lastResetDate: today,
      todayWatchtime: 0,
      todayDonations: 0,
      weeklyData: recentWeekly
    });
  }
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Message handler for content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'checkReset') {
    checkAndResetDaily().then(() => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});
