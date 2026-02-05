/**
 * BACKGROUND SERVICE WORKER
 * Handles notifications, alarms, and lot monitoring
 */

// Import saved lots module (will need to update manifest for service worker)
import { getSavedLots, updateLot } from './services/savedLots.js';
import { getSettings } from './services/settings.js';

// Set up alarm for periodic lot checks
chrome.runtime.onInstalled.addListener(() => {
  // Check lots every hour
  chrome.alarms.create('checkLots', { periodInMinutes: 60 });
  
  console.log('LOTLOGIC: Background service installed');
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkLots') {
    await checkSavedLots();
  }
});

/**
 * Check all saved lots for updates
 */
async function checkSavedLots() {
  const settings = await getSettings();
  
  if (!settings.notificationsEnabled) return;
  
  const savedLots = await getSavedLots();
  
  for (const lot of savedLots) {
    try {
      // Get lot URL (you'll need to store this when saving)
      if (!lot.url) continue;
      
      // Fetch current lot data
      const response = await fetch(lot.url);
      const html = await response.text();
      
      // Parse for current bid (simplified - you'd use the same logic as content.js)
      const bidMatch = html.match(/Current bid[^$]*\$\s*(\d{1,3}(?:,\d{3})*)/i);
      const currentBid = bidMatch ? bidMatch[1] : '0';
      
      // Check for price changes
      const oldBid = parseInt(String(lot.currentBid).replace(/[^0-9]/g, "")) || 0;
      const newBid = parseInt(currentBid.replace(/,/g, ""));
      
      if (newBid !== oldBid) {
        // Price changed
        if (settings.notifyOnPriceChange) {
          await createNotification({
            title: 'LOTLOGIC: Price Changed',
            message: `${lot.title}: $${oldBid} → $${newBid}`,
            iconUrl: 'icons/icon128.png',
            lotId: lot.id
          });
        }
        
        // Check for significant price drop
        if (settings.notifyOnPriceDrop && (oldBid - newBid >= settings.notifyOnPriceDrop)) {
          await createNotification({
            title: 'LOTLOGIC: Price Drop Alert! 📉',
            message: `${lot.title} dropped $${oldBid - newBid}! Now: $${newBid}`,
            iconUrl: 'icons/icon128.png',
            requireInteraction: true,
            lotId: lot.id
          });
        }
        
        // Update lot
        await updateLot(lot.id, { currentBid: `$${newBid}` });
      }
      
      // Check auction end time
      if (lot.saleDate && settings.notifyBeforeAuction) {
        const saleTime = new Date(lot.saleDate).getTime();
        const now = Date.now();
        const hoursUntilSale = (saleTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilSale > 0 && hoursUntilSale <= settings.notifyBeforeAuction) {
          await createNotification({
            title: 'LOTLOGIC: Auction Ending Soon! ⏰',
            message: `${lot.title} auction in ${Math.round(hoursUntilSale)} hours`,
            iconUrl: 'icons/icon128.png',
            requireInteraction: true,
            lotId: lot.id
          });
        }
      }
      
    } catch (err) {
      console.error('Error checking lot:', lot.id, err);
    }
  }
}

/**
 * Create notification
 */
async function createNotification({ title, message, iconUrl, requireInteraction, lotId }) {
  try {
    await chrome.notifications.create(lotId || `notification_${Date.now()}`, {
      type: 'basic',
      iconUrl: iconUrl || 'icons/icon128.png',
      title,
      message,
      requireInteraction: requireInteraction || false,
      buttons: [
        { title: 'View Lot' },
        { title: 'Dismiss' }
      ]
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  // Open lot in new tab
  const savedLots = await getSavedLots();
  const lot = savedLots.find(l => l.id === notificationId);
  
  if (lot && lot.url) {
    await chrome.tabs.create({ url: lot.url });
  }
  
  chrome.notifications.clear(notificationId);
});

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // "View Lot" button
    const savedLots = await getSavedLots();
    const lot = savedLots.find(l => l.id === notificationId);
    
    if (lot && lot.url) {
      await chrome.tabs.create({ url: lot.url });
    }
  }
  
  // Dismiss in both cases
  chrome.notifications.clear(notificationId);
});

/**
 * Export function to manually check lots (called from popup)
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_SAVED_LOTS') {
    checkSavedLots().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});