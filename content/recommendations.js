/**
 * Educational video recommendations
 * Provides long-form educational content suggestions
 */

/**
 * Static list of educational video recommendations
 * In a real implementation, these could be fetched from YouTube Data API
 */
const EDUCATIONAL_VIDEOS = [
  {
    title: 'The Science of Learning: How to Study Smarter',
    url: 'https://www.youtube.com/watch?v=VJbKXmujI00',
    impact: 'Improve your learning efficiency',
    icon: '🧠',
    category: 'Education'
  },
  {
    title: 'How The Economic Machine Works',
    url: 'https://www.youtube.com/watch?v=PHe0bXAIuk0',
    impact: 'Understand economics in 30 minutes',
    icon: '💰',
    category: 'Economics'
  },
  {
    title: 'The History of the Entire World, I Guess',
    url: 'https://www.youtube.com/watch?v=xuCn8ux2gbs',
    impact: 'Learn world history in 20 minutes',
    icon: '🌍',
    category: 'History'
  },
  {
    title: 'Introduction to Khan Academy',
    url: 'https://www.khanacademy.org/about',
    impact: 'Access thousands of free lessons',
    icon: '📚',
    category: 'Learning Platform'
  },
  {
    title: 'The Power of Vulnerability - Brené Brown',
    url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o',
    impact: 'Develop emotional intelligence',
    icon: '❤️',
    category: 'Psychology'
  },
  {
    title: 'Climate Change Explained',
    url: 'https://www.youtube.com/watch?v=ipVxxxqwBQw',
    impact: 'Understand environmental science',
    icon: '🌱',
    category: 'Science'
  },
  {
    title: 'Inside the Cell Membrane',
    url: 'https://www.youtube.com/watch?v=moPGOuJRAVU',
    impact: 'Explore biology fundamentals',
    icon: '🔬',
    category: 'Biology'
  },
  {
    title: 'How Computers Work: CPU, Memory, Input & Output',
    url: 'https://www.youtube.com/watch?v=cNN_tTXABUA',
    impact: 'Learn computer science basics',
    icon: '💻',
    category: 'Technology'
  },
  {
    title: 'The Art of Problem Solving',
    url: 'https://www.youtube.com/watch?v=v34NqCbAA1c',
    impact: 'Master critical thinking skills',
    icon: '🧩',
    category: 'Math'
  },
  {
    title: 'Documentary: Our Planet',
    url: 'https://www.youtube.com/watch?v=aETNYyrqNYE',
    impact: 'Discover Earth\'s natural wonders',
    icon: '🦁',
    category: 'Nature'
  },
  {
    title: 'What is Philosophy?: Crash Course Philosophy #1', 
    url: 'https://www.youtube.com/watch?v=1A_CAkYt3GY',
    impact: 'Explore philosophical thinking',
    icon: '🤔',
    category: 'Philosophy'
  },
  {
    title: 'TED: The Power of Introverts',
    url: 'https://www.youtube.com/watch?v=c0KYU2j0TM4',
    impact: 'Understand personality types',
    icon: '🎭',
    category: 'Psychology'
  }
];

/**
 * Get random educational video recommendations
 * @param {number} count - Number of recommendations to return
 * @returns {Array} Array of recommendation objects
 */
function getRecommendations(count = 3) {
  // Shuffle and return random recommendations
  const shuffled = [...EDUCATIONAL_VIDEOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get recommendations by category
 * @param {string} category - Category to filter by
 * @param {number} count - Number of recommendations to return
 * @returns {Array} Array of recommendation objects
 */
function getRecommendationsByCategory(category, count = 3) {
  const filtered = EDUCATIONAL_VIDEOS.filter(video => video.category === category);
  return filtered.slice(0, count);
}

/**
 * Get all available categories
 * @returns {Array} Array of category names
 */
function getCategories() {
  return [...new Set(EDUCATIONAL_VIDEOS.map(video => video.category))];
}

/**
 * Fetch recommendations from YouTube Data API (optional enhancement)
 * This is a placeholder for future implementation
 * @param {string} apiKey - YouTube Data API key
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of video results
 */
async function fetchYouTubeRecommendations(apiKey, query = 'educational documentary') {
  // Note: This requires YouTube Data API key and is optional
  // For now, returning static recommendations
  console.warn('YouTube API fetch not implemented, using static recommendations');
  return getRecommendations();

  /* Commented out API implementation for future use:
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&videoDuration=medium&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from YouTube API');
    }

    const data = await response.json();

    return data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      impact: item.snippet.description.substring(0, 50) + '...',
      icon: '🎥',
      category: 'Educational'
    }));
  } catch (error) {
    console.error('Error fetching YouTube recommendations:', error);
    return getRecommendations();
  }
  */
}

/**
 * Create recommendation badge element for Shorts player
 */
class RecommendationBadge {
  constructor() {
    this.badgeElement = null;
    this.isShowing = false;
  }

  /**
   * Show recommendation badge
   */
  show() {
    if (this.isShowing) return;

    this.createBadge();
    this.attachToPage();
    this.isShowing = true;
  }

  /**
   * Create badge element
   */
  createBadge() {
    const recommendations = getRecommendations(1);
    const rec = recommendations[0];

    const badge = document.createElement('div');
    badge.id = 'scrollsense-rec-badge';
    badge.className = 'scrollsense-rec-badge';

    badge.innerHTML = `
      <a href="${rec.url}" target="_blank" class="rec-badge-link">
        <div class="rec-badge-icon">📚</div>
        <div class="rec-badge-text">
          <div class="rec-badge-title">Watch this next!</div>
          <div class="rec-badge-subtitle">${rec.title}</div>
        </div>
      </a>
    `;

    this.badgeElement = badge;
  }

  /**
   * Attach badge to page
   */
  attachToPage() {
    if (!document.body.contains(this.badgeElement)) {
      document.body.appendChild(this.badgeElement);
    }
  }

  /**
   * Remove badge
   */
  remove() {
    if (this.badgeElement && this.badgeElement.parentNode) {
      this.badgeElement.parentNode.removeChild(this.badgeElement);
    }
    this.isShowing = false;
  }
}
