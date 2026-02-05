import { getSavedLots, getSortedLots, removeLot } from './services/savedLots.js';

let currentLots = [];

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Saved Lots page loaded');
  await loadLots();
  
  // Set up event listeners
  document.getElementById('sortBy').addEventListener('change', handleSort);
  document.getElementById('refreshLots').addEventListener('click', handleRefresh);
  document.getElementById('checkNow').addEventListener('click', handleCheckNow);
});

/**
 * Load and display saved lots
 */
async function loadLots(sortBy = 'savedAt') {
  currentLots = await getSortedLots(sortBy);
  console.log('Loaded lots:', currentLots.length);
  
  const lotsGrid = document.getElementById('lotsGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (currentLots.length === 0) {
    lotsGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  lotsGrid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  lotsGrid.innerHTML = currentLots.map(lot => createLotCard(lot)).join('');
  
  // Add event listeners AFTER HTML is inserted
  setTimeout(() => {
    currentLots.forEach(lot => {
      console.log('Attaching events for lot:', lot.id);
      
      // View button
      const viewBtn = document.getElementById(`view-${lot.id}`);
      if (viewBtn) {
        viewBtn.addEventListener('click', () => viewLot(lot));
      }
      
      // Menu button (toggle dropdown)
      const menuBtn = document.getElementById(`menu-${lot.id}`);
      const dropdown = document.getElementById(`dropdown-${lot.id}`);
      
      if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Menu clicked for:', lot.id);
          
          // Close all other dropdowns
          document.querySelectorAll('.lot-dropdown').forEach(dd => {
            if (dd.id !== `dropdown-${lot.id}`) {
              dd.style.display = 'none';
            }
          });
          
          // Toggle this dropdown
          const isVisible = dropdown.style.display === 'block';
          dropdown.style.display = isVisible ? 'none' : 'block';
          console.log('Dropdown now:', dropdown.style.display);
        });
      }
      
      // Download button in dropdown
      const downloadBtn = document.getElementById(`download-${lot.id}`);
      if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          console.log('Download clicked for:', lot.id);
          dropdown.style.display = 'none';
          await downloadLotPDF(lot);
        });
      }
      
      // Delete button in dropdown
      const deleteBtn = document.getElementById(`delete-${lot.id}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          console.log('Delete clicked for:', lot.id);
          if (dropdown) dropdown.style.display = 'none';
          await deleteLot(lot.id);
        });
      } else {
        console.error('Delete button not found for:', lot.id);
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lot-menu-container')) {
        document.querySelectorAll('.lot-dropdown').forEach(dd => {
          dd.style.display = 'none';
        });
      }
    });
  }, 100);
}

/**
 * Create HTML for a lot card
 */
function createLotCard(lot) {
  const currentBid = parseInt(String(lot.currentBid).replace(/[^0-9]/g, "")) || 0;
  const profit = lot.profit || 0;
  const profitClass = profit >= 0 ? 'profit' : 'profit negative';
  
  // Calculate price trend
  let priceTrend = 'stable';
  let trendText = 'No change';
  
  if (lot.priceHistory && lot.priceHistory.length > 1) {
    const firstPrice = lot.priceHistory[0].price;
    const lastPrice = lot.priceHistory[lot.priceHistory.length - 1].price;
    
    if (lastPrice > firstPrice) {
      priceTrend = 'up';
      trendText = `+$${lastPrice - firstPrice}`;
    } else if (lastPrice < firstPrice) {
      priceTrend = 'down';
      trendText = `-$${firstPrice - lastPrice}`;
    }
  }
  
  // Format timestamps
  const savedDate = new Date(lot.savedAt).toLocaleDateString();
  const savedTime = new Date(lot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `
    <div class="lot-card">
      <div class="lot-header">
        <h3 class="lot-title">${lot.title || `${lot.year} ${lot.make} ${lot.model}`}</h3>
        <div class="lot-menu-container">
          <button class="lot-menu" id="menu-${lot.id}">⋮</button>
          <div class="lot-dropdown" id="dropdown-${lot.id}" style="display: none;">
            <button class="dropdown-item" id="download-${lot.id}">Download PDF</button>
            <button class="dropdown-item danger" id="delete-${lot.id}">Delete</button>
          </div>
        </div>
      </div>
      
      <div class="lot-details">
        <div class="detail-item">
          <span class="detail-label">Year</span>
          <span class="detail-value">${lot.year}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Make</span>
          <span class="detail-value">${lot.make}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Model</span>
          <span class="detail-value">${lot.model}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Odometer</span>
          <span class="detail-value">${lot.odometer || 'N/A'}</span>
        </div>
      </div>
      
      <div class="lot-metrics">
        <div class="metric">
          <div class="metric-label">Current Bid</div>
          <div class="metric-value">
            $${currentBid.toLocaleString()}
            <span class="price-trend ${priceTrend}">${trendText}</span>
          </div>
        </div>
        <div class="metric">
          <div class="metric-label">Est. Profit</div>
          <div class="metric-value ${profitClass}">
            ${profit >= 0 ? '$' : '-$'}${Math.abs(profit).toLocaleString()}
          </div>
        </div>
      </div>
      
      ${lot.priceHistory && lot.priceHistory.length > 1 ? `
        <div class="price-history">
          <div class="price-history-header">Price History</div>
          ${lot.priceHistory.slice(-3).map((entry) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
              <div class="price-change">
                <span>${date} ${time}</span>
                <strong>$${entry.price}</strong>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      <div class="lot-actions">
        <button id="view-${lot.id}" class="lot-action-btn primary">View on ${lot.source || 'Copart'}</button>
      </div>
      
      <div class="lot-timestamp">
        Saved: ${savedDate} at ${savedTime}
      </div>
    </div>
  `;
}

/**
 * Handle sort change
 */
async function handleSort(event) {
  const sortBy = event.target.value;
  await loadLots(sortBy);
}

/**
 * Refresh all lots
 */
async function handleRefresh() {
  console.log('Refresh clicked');
  const button = document.getElementById('refreshLots');
  const originalText = button.textContent;
  button.textContent = 'Refreshing...';
  button.disabled = true;
  
  try {
    await loadLots(document.getElementById('sortBy').value);
  } catch (err) {
    console.error('Refresh error:', err);
  }
  
  button.textContent = originalText;
  button.disabled = false;
}

/**
 * Check for lot updates now
 */
async function handleCheckNow() {
  console.log('Check Now clicked');
  const button = document.getElementById('checkNow');
  const originalText = button.textContent;
  button.textContent = 'Checking...';
  button.disabled = true;
  
  try {
    // For now, just refresh the display
    // In future, could trigger background worker to check prices
    await loadLots(document.getElementById('sortBy').value);
    alert('Checked all saved lots!');
  } catch (err) {
    console.error('Check error:', err);
    alert('Error checking lots');
  }
  
  button.textContent = originalText;
  button.disabled = false;
}

/**
 * View lot on Copart
 */
function viewLot(lot) {
  console.log('Opening lot:', lot.url);
  if (lot.url) {
    window.open(lot.url, '_blank');
  } else {
    alert('No URL saved for this lot');
  }
}

/**
 * Delete a lot
 */
async function deleteLot(lotId) {
  console.log('Deleting lot:', lotId);
  if (confirm('Remove this lot from your saved list?')) {
    await removeLot(lotId);
    await loadLots(document.getElementById('sortBy').value);
  }
}

/**
 * Download lot as PDF
 */
async function downloadLotPDF(lot) {
  console.log('Generating PDF for lot:', lot);
  try {
    // Import PDF generator and necessary modules
    const { generateProfessionalPDF } = await import('./services/pdfGenerator.js');
    const { getCachedMetalPrices, calculateDetailedScrapValue } = await import('./services/metalPricing.js');
    const { getSettings } = await import('./services/settings.js');
    
    // Get current metal prices
    const metals = await getCachedMetalPrices();
    console.log('Got metal prices:', metals);
    
    // Recalculate scrap data with current prices
    const scrapData = calculateDetailedScrapValue(lot.weight || 3500, lot.vehicleType || 'Midsize Cars', metals);
    console.log('Calculated scrap data:', scrapData);
    
    // Get user settings
    const settings = await getSettings();
    console.log('Got settings:', settings);
    
    // Generate PDF
    console.log('Generating PDF...');
    await generateProfessionalPDF(lot, scrapData, metals, settings);
    console.log('PDF generated successfully');
    
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert(`Error generating PDF: ${err.message}`);
  }
}