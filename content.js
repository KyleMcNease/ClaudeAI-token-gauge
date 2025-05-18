// Token Gauge - Content Script
// Tracks token usage in Claude AI chats

// Configuration
let config = {
  isEnabled: true,
  showPercentage: true,
  position: 'bottom-right',
  tokenLimit: 200000,
  safeThreshold: 100000,
  cautionThreshold: 140000
};

// Color palette
const PALETTE = {
  safe: "#A9D5DF",     // muted aqua
  caution: "#F8D79B",  // soft peach
  danger: "#F47A6E",   // gentle coral
  needle: "#384048",   // dark gray
  text: "#384048"      // dark gray
};

// Initialize variables
let gaugeElement = null;
let countInterval = null;
let previousTextLength = 0;

// Wait for page to load before initializing
window.addEventListener('load', () => {
  console.log("Token Gauge: Page loaded, initializing...");
  
  // Load saved settings
  chrome.storage.sync.get([
    'isEnabled', 
    'showPercentage', 
    'position', 
    'tokenLimit',
    'safeThreshold',
    'cautionThreshold'
  ], (result) => {
    if (result) {
      config = { ...config, ...result };
    }
    
    console.log("Token Gauge: Settings loaded", config);
    
    if (config.isEnabled) {
      initializeGauge();
    }
  });
});

// Listen for config changes
chrome.storage.onChanged.addListener((changes) => {
  for (let key in changes) {
    config[key] = changes[key].newValue;
  }
  
  if (changes.isEnabled) {
    if (config.isEnabled) {
      initializeGauge();
    } else {
      removeGauge();
    }
  } else if (config.isEnabled && gaugeElement) {
    repositionGauge();
    countTokens();
  }
});

function initializeGauge() {
  console.log("Token Gauge: Initializing gauge");
  createGauge();
  startCounting();
}

function createGauge() {
  // Remove existing gauge if present
  removeGauge();
  
  // Create new gauge element
  gaugeElement = document.createElement('div');
  gaugeElement.className = 'token-gauge';
  
  // Use a fixed-size SVG with explicit arc paths - updated with more height for text
  gaugeElement.innerHTML = `
    <svg width="180" height="120" viewBox="0 0 180 120">
      <!-- Background semicircle -->
      <path d="M10,90 A80,80 0 0,1 170,90" fill="none" stroke="#f5f5f5" stroke-width="1" />
      
      <!-- Safe zone (blue) - 180° to 120° -->
      <path id="safe-arc" d="M10,90 A80,80 0 0,1 50,24.64" fill="none" stroke="${PALETTE.safe}" stroke-width="16" stroke-linecap="round" />
      
      <!-- Caution zone (yellow) - 120° to 60° -->
      <path id="caution-arc" d="M50,24.64 A80,80 0 0,1 130,24.64" fill="none" stroke="${PALETTE.caution}" stroke-width="16" stroke-linecap="round" />
      
      <!-- Danger zone (red) - 60° to 0° -->
      <path id="danger-arc" d="M130,24.64 A80,80 0 0,1 170,90" fill="none" stroke="${PALETTE.danger}" stroke-width="16" stroke-linecap="round" />
      
      <!-- Needle -->
      <line id="gauge-needle" x1="90" y1="90" x2="90" y2="20" stroke="${PALETTE.needle}" stroke-width="3" stroke-linecap="round" />
      
      <!-- Center circle -->
      <circle cx="90" cy="90" r="6" fill="${PALETTE.needle}" />
      
      <!-- Token text - moved up from 115 to 112 -->
      <text id="token-text" x="90" y="112" text-anchor="middle" font-size="14" font-weight="bold" fill="${PALETTE.text}">0 / 200K (0%)</text>
    </svg>
  `;
  
  // Position the gauge
  repositionGauge();
  
  // Add to DOM
  document.body.appendChild(gaugeElement);
  console.log("Token Gauge: Gauge created and added to DOM");
}

function repositionGauge() {
  if (!gaugeElement) return;
  
  // Remove all position classes
  gaugeElement.classList.remove('bottom-right', 'bottom-left', 'top-right', 'top-left');
  
  // Add current position class
  gaugeElement.classList.add(config.position || 'bottom-right');
}

function removeGauge() {
  if (gaugeElement && gaugeElement.parentNode) {
    gaugeElement.parentNode.removeChild(gaugeElement);
    gaugeElement = null;
    console.log("Token Gauge: Gauge removed from DOM");
  }
  
  if (countInterval) {
    clearInterval(countInterval);
    countInterval = null;
    console.log("Token Gauge: Token counting stopped");
  }
}

function startCounting() {
  if (countInterval) {
    clearInterval(countInterval);
  }
  
  // Count immediately
  countTokens();
  
  // Then set up interval for regular counting
  countInterval = setInterval(countTokens, 3000);
  console.log("Token Gauge: Token counting started with 3-second intervals");
}

function countTokens() {
  console.log("Token Gauge: Counting tokens...");
  
  // Brute force method - get all text from the page's main area
  const mainContent = document.querySelector('main') || document.body;
  
  // Get full text of the conversation
  let chatText = '';
  
  // Construct a selector for all possible message elements
  const possibleMessageSelectors = [
    '.prose',                              // Claude web app
    '.chat-message-text',                  // Generic chat class
    '.human-message, .claude-message',     // Direct message classes
    '[data-message-author-role]',          // Attribute-based selection
    'main div div div div div p'           // Deep nested structure
  ];
  
  // Join all selectors with commas
  const combinedSelector = possibleMessageSelectors.join(', ');
  
  // Try to find messages
  const messageElements = mainContent.querySelectorAll(combinedSelector);
  
  console.log(`Token Gauge: Found ${messageElements.length} message elements`);
  
  if (messageElements.length > 0) {
    // Extract text from message elements
    messageElements.forEach(el => {
      chatText += el.textContent + ' ';
    });
  } else {
    // Fallback to getting text from the main element
    chatText = mainContent.textContent;
  }
  
  // Check if content has changed
  const currentTextLength = chatText.length;
  
  if (currentTextLength === previousTextLength) {
    console.log("Token Gauge: No change in text content, skipping update");
    return;
  }
  
  previousTextLength = currentTextLength;
  
  console.log(`Token Gauge: Text length is ${currentTextLength} characters`);
  
  // Estimate tokens (heuristic method)
  const estimatedTokens = Math.round(currentTextLength / 4);
  console.log(`Token Gauge: Estimated ${estimatedTokens} tokens`);
  
  // Update gauge
  updateGauge(estimatedTokens);
}

function updateGauge(tokenCount) {
  if (!gaugeElement) {
    console.log("Token Gauge: No gauge element to update");
    return;
  }
  
  console.log(`Token Gauge: Updating gauge to ${tokenCount} tokens`);
  
  const tokenLimit = config.tokenLimit;
  const percentage = Math.min(100, Math.round((tokenCount / tokenLimit) * 100));
  
  // Update needle position based on percentage
  // Map 0-100% to 180-0 degrees
  const angle = 180 - (percentage * 1.8);
  
  // Calculate the position on the arc
  // Center point is at (90, 90)
  const radians = angle * Math.PI / 180;
  const needleLength = 70; // Length of needle 
  const x = 90 + needleLength * Math.cos(radians);
  const y = 90 - needleLength * Math.sin(radians);
  
  // Update the needle
  const needle = gaugeElement.querySelector('#gauge-needle');
  needle.setAttribute('x1', 90);
  needle.setAttribute('y1', 90);
  needle.setAttribute('x2', x);
  needle.setAttribute('y2', y);
  
  // Format token count
  const formattedCount = tokenCount >= 1000 
    ? `${Math.round(tokenCount / 1000)}K` 
    : tokenCount;
  
  const formattedLimit = tokenLimit >= 1000 
    ? `${Math.round(tokenLimit / 1000)}K` 
    : tokenLimit;
  
  // Update text
  let displayText = `${formattedCount} / ${formattedLimit}`;
  
  // Add percentage if enabled
  if (config.showPercentage) {
    displayText += ` (${percentage}%)`;
  }
  
  const tokenText = gaugeElement.querySelector('#token-text');
  tokenText.textContent = displayText;
  
  // Set text color based on percentage
  let textColor = PALETTE.text;
  if (percentage >= 70) {
    textColor = PALETTE.danger;
  } else if (percentage >= 50) {
    textColor = PALETTE.caution;
  }
  
  tokenText.setAttribute('fill', textColor);
}