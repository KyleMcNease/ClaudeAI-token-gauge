// Background script - mostly for future extensibility
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.sync.set({
    isEnabled: true,
    showPercentage: true,
    position: 'bottom-right',
    tokenLimit: 200000, // Claude's approximate token limit
    safeThreshold: 100000,
    cautionThreshold: 140000
  });
});