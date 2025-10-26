# ScrollSense - Mindful YouTube Shorts

A Chrome extension that helps you build mindful viewing habits on YouTube Shorts while supporting charitable causes.

## Features

### Timer Overlay
- Floating timer badge on YouTube Shorts showing your daily watchtime
- Updates in real-time every second
- Color-coded progress indicator:
  - **Green**: Under 70% of daily limit
  - **Yellow**: 70-90% of daily limit
  - **Red**: Over 90% of daily limit

### Scroll Limit Modal
- When you reach your daily limit and try to scroll to the next Short, a modal appears
- **Video automatically pauses** when modal opens
- Countdown timer (default 5 seconds, configurable)
- Shows your selected charity and donation impact
- Displays 3 alternative educational long-form video recommendations
- Continue button enables after countdown
- **Video resumes** when you click Continue
- Each scroll past limit increases your donation counter

### Donation Tracking
- Simulated donation system: $0.10 per scroll past your daily limit
- Support one of three charities:
  - **Khan Academy** 📚 - Free education for everyone
  - **WWF** 🐼 - Wildlife and habitat protection
  - **Doctors Without Borders** 🏥 - Medical humanitarian aid
- Real-time impact calculation showing tangible results
- Progress tiers: Starter → Bronze → Silver → Gold → Platinum

### Extension Popup
- **Today's Stats**: Current watchtime and donation amount
- **Impact Visualization**: See the difference your donations make
- **Weekly Analytics**: SVG bar chart showing 7-day watchtime and donation trends
- **Settings**:
  - Daily Shorts limit (1-180 minutes)
  - Charity selection
  - Modal wait time (1-30 seconds)

### Educational Recommendations
- Curated list of high-quality educational videos
- Alternative suggestions when limit is reached
- Categories: Science, History, Economics, Psychology, Technology, and more

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download or Clone** this repository:
   ```bash
   git clone <repository-url>
   cd scrollsense-5
   ```

2. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `scrollsense-5` directory

5. **Verify Installation**:
   - You should see "ScrollSense - Mindful YouTube Shorts" in your extensions list
   - The extension icon will appear in your Chrome toolbar

### Method 2: Direct Installation

1. Open the extension directory in your file manager
2. Drag the entire `scrollsense-5` folder onto the `chrome://extensions/` page
3. Enable the extension

## Usage

### First Time Setup

1. Click the ScrollSense icon in your Chrome toolbar
2. Configure your preferences:
   - Set your daily Shorts limit (default: 30 minutes)
   - Choose a charity to support
   - Adjust the modal wait time if desired
3. Click "Save Settings"

### Watching YouTube Shorts

1. Navigate to any YouTube Short (`youtube.com/shorts/*`)
2. The timer badge appears on the right side, showing your watchtime
3. Watch Shorts normally until you reach your daily limit
4. When limit is reached:
   - A banner appears below the video
   - The recommendation badge shows alternative content
5. Try to scroll to the next Short:
   - Modal appears with countdown
   - Video pauses automatically
   - After countdown, click "Continue" to proceed
   - Video resumes and donation counter increases

### Viewing Your Impact

1. Click the extension icon to open the popup
2. View today's statistics and donation total
3. See the real-world impact of your donations
4. Check the weekly analytics chart to track trends

## Project Structure

```
scrollsense-5/
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker for daily resets
├── content/
│   ├── index.js              # Main entry point, navigation detection
│   ├── timer.js              # Timer overlay component
│   ├── modal.js              # Scroll limit modal with pause/resume
│   ├── donation.js           # Donation tracking and impact display
│   ├── recommendations.js    # Educational video suggestions
│   ├── utils.js              # Shared utilities and storage helpers
│   └── styles.css            # Content script styles
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic and analytics chart
│   └── popup.css             # Popup styles
├── icons/
│   ├── icon16.png            # Extension icon (16x16)
│   ├── icon48.png            # Extension icon (48x48)
│   └── icon128.png           # Extension icon (128x128)
└── README.md                 # This file
```

## Technical Details

### ES6 Modules
All JavaScript files use ES6 import/export syntax for clean, modular code:
- `import { function } from './module.js'`
- `export function name() { ... }`

### Chrome Storage
- **chrome.storage.local**: Daily watchtime, donations, weekly analytics
- **chrome.storage.sync**: User settings (limit, charity, wait time)
- Automatic daily reset at midnight

### Video Pause/Resume
- Modal uses `document.querySelector('video')` to control playback
- Pauses video on modal open: `video.pause()`
- Resumes on close: `video.play()`

### SVG Charts
- Weekly analytics rendered with pure SVG (no external libraries)
- Bar chart shows watchtime (blue) and donations (green)
- Responsive design with proper scaling

### Navigation Detection
- MutationObserver tracks DOM changes for Shorts navigation
- Handles browser history (back/forward) with popstate listener
- Automatically activates/deactivates features based on URL

## Development

### Key Files to Modify

**Adding new charities:**
- Edit `content/utils.js` → `getCharityInfo()`
- Update `popup/popup.html` → charity dropdown

**Changing donation amounts:**
- Edit `content/utils.js` → `calculateDonation()`
- Edit `content/donation.js` → `incrementDonation()`

**Adding video recommendations:**
- Edit `content/recommendations.js` → `EDUCATIONAL_VIDEOS` array

**Adjusting timer colors:**
- Edit `content/utils.js` → `getTimerColor()`

### Debugging

1. Open Chrome DevTools on YouTube Shorts page
2. Check the Console tab for `ScrollSense:` log messages
3. Use `chrome://extensions/` to view service worker logs
4. Inspect storage: DevTools → Application → Storage

## Limitations

- **No real payment processing** - donation tracking is simulated only
- **Static recommendations** - YouTube Data API integration commented out (requires API key)
- **Chrome only** - uses Chrome Extension APIs (not cross-browser compatible)
- **No offline support** - requires active internet connection
- **Per-device tracking** - watchtime not synced across devices

## Privacy

ScrollSense:
- Does NOT collect personal information
- Does NOT track browsing history outside YouTube
- Does NOT send data to external servers
- Stores all data locally in Chrome storage
- Does NOT require account creation or login

## Future Enhancements

- YouTube Data API integration for personalized recommendations
- Cross-device sync for watchtime tracking
- Export weekly reports as CSV/PDF
- Custom charity additions
- Focus mode with deeper analytics
- Browser notifications at limit milestones
- Integration with actual donation platforms

## License

This is a demonstration project. Use and modify as needed.

## Support

For issues, feature requests, or contributions, please open an issue in the repository.

---

**Make every scroll count!** 💚
