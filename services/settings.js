/**
 * Settings service module
 */

const DEFAULT_SETTINGS = {
  targetProfit: 500,
  fees: 180,
  transportCost: 100,
  notificationsEnabled: true,
  notifyBeforeAuction: 24,
  notifyOnPriceChange: true,
  notifyOnPriceDrop: 100,
  showDetailedBreakdown: true,
  showBiddingGuidance: true,
  useManualPrices: false,
  manualPrices: null
};

export async function getSettings() {
  try {
    const result = await chrome.storage.sync.get('userSettings');
    return { ...DEFAULT_SETTINGS, ...result.userSettings };
  } catch (err) {
    console.error('Error loading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set({ userSettings: settings });
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

export async function resetSettings() {
  return await saveSettings(DEFAULT_SETTINGS);
}