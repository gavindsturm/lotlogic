// Settings page - saves directly to chrome.storage.sync

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Settings page loaded');
  // Load current settings
  await loadSettings();
  
  // Set up event listeners
  document.getElementById('useManualPrices').addEventListener('change', toggleManualPrices);
  document.getElementById('saveSettings').addEventListener('click', handleSaveSettings);
  document.getElementById('resetSettings').addEventListener('click', handleResetSettings);
  document.getElementById('clearCache').addEventListener('click', handleClearCache);
});

/**
 * Load settings into form
 */
async function loadSettings() {
  console.log('Loading settings...');
  
  // Get settings from chrome.storage
  const result = await chrome.storage.sync.get('userSettings');
  const settings = result.userSettings || {
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
  
  console.log('Loaded settings:', settings);
  
  // Bidding preferences
  document.getElementById('targetProfit').value = settings.targetProfit;
  document.getElementById('fees').value = settings.fees;
  document.getElementById('transportCost').value = settings.transportCost;
  
  // Notifications
  document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled;
  document.getElementById('notifyBeforeAuction').value = settings.notifyBeforeAuction;
  document.getElementById('notifyOnPriceChange').checked = settings.notifyOnPriceChange;
  document.getElementById('notifyOnPriceDrop').value = settings.notifyOnPriceDrop;
  
  // Display
  document.getElementById('showDetailedBreakdown').checked = settings.showDetailedBreakdown;
  document.getElementById('showBiddingGuidance').checked = settings.showBiddingGuidance;
  
  // Metal prices
  document.getElementById('useManualPrices').checked = settings.useManualPrices;
  
  if (settings.manualPrices) {
    document.getElementById('priceSteel').value = settings.manualPrices.steel;
    document.getElementById('priceAluminum').value = settings.manualPrices.aluminum;
    document.getElementById('priceCopper').value = settings.manualPrices.copper;
    document.getElementById('priceStainless').value = settings.manualPrices.stainlessSteel;
    document.getElementById('priceBrass').value = settings.manualPrices.brass;
    document.getElementById('priceLead').value = settings.manualPrices.lead;
    document.getElementById('pricePlatinum').value = settings.manualPrices.platinum;
    document.getElementById('pricePalladium').value = settings.manualPrices.palladium;
    document.getElementById('priceRhodium').value = settings.manualPrices.rhodium;
  }
  
  toggleManualPrices();
}

/**
 * Toggle manual prices section
 */
function toggleManualPrices() {
  const useManual = document.getElementById('useManualPrices').checked;
  const section = document.getElementById('manualPricesSection');
  section.style.display = useManual ? 'block' : 'none';
}

/**
 * Save settings
 */
async function handleSaveSettings() {
  console.log('Save button clicked');
  
  const settings = {
    // Bidding
    targetProfit: parseInt(document.getElementById('targetProfit').value),
    fees: parseInt(document.getElementById('fees').value),
    transportCost: parseInt(document.getElementById('transportCost').value),
    
    // Notifications
    notificationsEnabled: document.getElementById('notificationsEnabled').checked,
    notifyBeforeAuction: parseInt(document.getElementById('notifyBeforeAuction').value),
    notifyOnPriceChange: document.getElementById('notifyOnPriceChange').checked,
    notifyOnPriceDrop: parseInt(document.getElementById('notifyOnPriceDrop').value),
    
    // Display
    showDetailedBreakdown: document.getElementById('showDetailedBreakdown').checked,
    showBiddingGuidance: document.getElementById('showBiddingGuidance').checked,
    
    // Metal prices
    useManualPrices: document.getElementById('useManualPrices').checked,
    manualPrices: null
  };
  
  if (settings.useManualPrices) {
    const manualPrices = {
      steel: parseFloat(document.getElementById('priceSteel').value) || 0.12,
      aluminum: parseFloat(document.getElementById('priceAluminum').value) || 0.85,
      copper: parseFloat(document.getElementById('priceCopper').value) || 3.50,
      stainlessSteel: parseFloat(document.getElementById('priceStainless').value) || 0.45,
      brass: parseFloat(document.getElementById('priceBrass').value) || 2.20,
      lead: parseFloat(document.getElementById('priceLead').value) || 0.95,
      platinum: parseFloat(document.getElementById('pricePlatinum').value) || 950,
      palladium: parseFloat(document.getElementById('pricePalladium').value) || 950,
      rhodium: parseFloat(document.getElementById('priceRhodium').value) || 4500
    };
    
    console.log('Manual prices:', manualPrices);
    
    // Validate all prices are numbers
    const allValid = Object.values(manualPrices).every(val => !isNaN(val) && val > 0);
    if (!allValid) {
      showStatus('Error: All prices must be valid positive numbers', 'error');
      return;
    }
    
    settings.manualPrices = manualPrices;
  }
  
  console.log('Saving settings:', settings);
  
  try {
    // Save directly to chrome.storage.sync
    await chrome.storage.sync.set({ userSettings: settings });
    console.log('Settings saved successfully');
    showStatus('Settings saved successfully!', 'success');
  } catch (err) {
    console.error('Error saving settings:', err);
    showStatus('Error saving settings: ' + err.message, 'error');
  }
}

/**
 * Reset to defaults
 */
async function handleResetSettings() {
  console.log('Reset button clicked');
  if (confirm('Reset all settings to defaults?')) {
    const defaults = {
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
    
    await chrome.storage.sync.set({ userSettings: defaults });
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  }
}

/**
 * Clear metal price cache
 */
async function handleClearCache() {
  try {
    await chrome.storage.local.remove(['metalPrices', 'metalPricesTimestamp']);
    showStatus('Metal price cache cleared', 'success');
  } catch (err) {
    showStatus('Error clearing cache', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status-message';
    statusEl.textContent = '';
  }, 3000);
}