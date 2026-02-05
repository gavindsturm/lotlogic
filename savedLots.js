/**
 * SAVED LOTS STORAGE
 * Manages saved/watched lots
 */

/**
 * Get all saved lots
 */
export async function getSavedLots() {
  try {
    const result = await chrome.storage.local.get('savedLots');
    return result.savedLots || [];
  } catch (err) {
    console.error('Error loading saved lots:', err);
    return [];
  }
}

/**
 * Save a lot
 */
export async function saveLot(lotData) {
  try {
    const savedLots = await getSavedLots();
    
    // Create lot object with metadata
    const lot = {
      id: generateLotId(lotData),
      ...lotData,
      savedAt: Date.now(),
      lastChecked: Date.now(),
      priceHistory: [{
        price: lotData.currentBid,
        timestamp: Date.now()
      }]
    };
    
    // Check if already saved
    const existingIndex = savedLots.findIndex(l => l.id === lot.id);
    if (existingIndex >= 0) {
      // Update existing lot
      savedLots[existingIndex] = {
        ...savedLots[existingIndex],
        ...lot,
        savedAt: savedLots[existingIndex].savedAt // Keep original save time
      };
    } else {
      // Add new lot
      savedLots.push(lot);
    }
    
    await chrome.storage.local.set({ savedLots });
    return lot;
  } catch (err) {
    console.error('Error saving lot:', err);
    return null;
  }
}

/**
 * Remove a saved lot
 */
export async function removeLot(lotId) {
  try {
    const savedLots = await getSavedLots();
    const filtered = savedLots.filter(lot => lot.id !== lotId);
    await chrome.storage.local.set({ savedLots: filtered });
    return true;
  } catch (err) {
    console.error('Error removing lot:', err);
    return false;
  }
}

/**
 * Update lot data (for price tracking)
 */
export async function updateLot(lotId, newData) {
  try {
    const savedLots = await getSavedLots();
    const lotIndex = savedLots.findIndex(l => l.id === lotId);
    
    if (lotIndex === -1) return false;
    
    const lot = savedLots[lotIndex];
    
    // Update price history if price changed
    const lastPrice = lot.priceHistory[lot.priceHistory.length - 1].price;
    const newPrice = parseInt(String(newData.currentBid || "").replace(/[^0-9]/g, "")) || 0;
    
    if (newPrice !== lastPrice) {
      lot.priceHistory.push({
        price: newPrice,
        timestamp: Date.now()
      });
    }
    
    // Update lot data
    savedLots[lotIndex] = {
      ...lot,
      ...newData,
      lastChecked: Date.now()
    };
    
    await chrome.storage.local.set({ savedLots });
    return savedLots[lotIndex];
  } catch (err) {
    console.error('Error updating lot:', err);
    return null;
  }
}

/**
 * Check if lot is saved
 */
export async function isLotSaved(lotData) {
  const savedLots = await getSavedLots();
  const id = generateLotId(lotData);
  return savedLots.some(lot => lot.id === id);
}

/**
 * Generate unique lot ID
 */
function generateLotId(lotData) {
  // Use title or combination of year/make/model + timestamp
  return `${lotData.year}_${lotData.make}_${lotData.model}_${lotData.currentBid}`.replace(/\s+/g, '_');
}

/**
 * Get lots sorted by various criteria
 */
export async function getSortedLots(sortBy = 'savedAt') {
  const lots = await getSavedLots();
  
  switch (sortBy) {
    case 'savedAt':
      return lots.sort((a, b) => b.savedAt - a.savedAt);
    case 'profit':
      return lots.sort((a, b) => (b.profit || 0) - (a.profit || 0));
    case 'price':
      return lots.sort((a, b) => {
        const aPrice = parseInt(String(a.currentBid).replace(/[^0-9]/g, "")) || 0;
        const bPrice = parseInt(String(b.currentBid).replace(/[^0-9]/g, "")) || 0;
        return aPrice - bPrice;
      });
    case 'scrapValue':
      return lots.sort((a, b) => (b.scrapValue || 0) - (a.scrapValue || 0));
    default:
      return lots;
  }
}

/**
 * Add note to lot
 */
export async function addLotNote(lotId, note) {
  try {
    const savedLots = await getSavedLots();
    const lotIndex = savedLots.findIndex(l => l.id === lotId);
    
    if (lotIndex === -1) return false;
    
    if (!savedLots[lotIndex].notes) {
      savedLots[lotIndex].notes = [];
    }
    
    savedLots[lotIndex].notes.push({
      text: note,
      timestamp: Date.now()
    });
    
    await chrome.storage.local.set({ savedLots });
    return true;
  } catch (err) {
    console.error('Error adding note:', err);
    return false;
  }
}