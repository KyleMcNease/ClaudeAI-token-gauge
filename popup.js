// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  // Get form elements
  const isEnabledCheckbox = document.getElementById('isEnabled');
  const showPercentageCheckbox = document.getElementById('showPercentage');
  const positionSelect = document.getElementById('position');
  const tokenLimitInput = document.getElementById('tokenLimit');
  const safeThresholdInput = document.getElementById('safeThreshold');
  const cautionThresholdInput = document.getElementById('cautionThreshold');
  
  // Load saved settings
  chrome.storage.sync.get([
    'isEnabled',
    'showPercentage',
    'position',
    'tokenLimit',
    'safeThreshold',
    'cautionThreshold'
  ], (result) => {
    if (result.isEnabled !== undefined) {
      isEnabledCheckbox.checked = result.isEnabled;
    }
    
    if (result.showPercentage !== undefined) {
      showPercentageCheckbox.checked = result.showPercentage;
    }
    
    if (result.position) {
      positionSelect.value = result.position;
    }
    
    if (result.tokenLimit) {
      tokenLimitInput.value = result.tokenLimit;
    }

    if (result.safeThreshold) {
      safeThresholdInput.value = result.safeThreshold;
    }

    if (result.cautionThreshold) {
      cautionThresholdInput.value = result.cautionThreshold;
    }
  });
  
  // Save settings when changed
  isEnabledCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ isEnabled: isEnabledCheckbox.checked });
  });
  
  showPercentageCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ showPercentage: showPercentageCheckbox.checked });
  });
  
  positionSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ position: positionSelect.value });
  });
  
  tokenLimitInput.addEventListener('change', () => {
    const limit = parseInt(tokenLimitInput.value);
    if (limit >= 1000) {
      chrome.storage.sync.set({ tokenLimit: limit });
    }
  });

  safeThresholdInput.addEventListener('change', () => {
    const threshold = parseInt(safeThresholdInput.value);
    if (threshold >= 1000) {
      chrome.storage.sync.set({ safeThreshold: threshold });
    }
  });

  cautionThresholdInput.addEventListener('change', () => {
    const threshold = parseInt(cautionThresholdInput.value);
    if (threshold >= 1000) {
      chrome.storage.sync.set({ cautionThreshold: threshold });
    }
  });
});