import { getFees } from "./services/fees.js";
import { getCachedMetalPrices, calculateDetailedScrapValue } from "./services/metalPricing.js";
import { calculateProfit } from "./services/pricing.js";
import { getBuyRecommendation, getBiddingGuidance, getCurrentBidStatus } from "./services/recommendations.js";
import { getEstimatedWeight } from "./services/vehicles.js";
import { getSettings } from "./services/settings.js";
import { generateProfessionalPDF } from "./services/pdfGenerator.js";
import { checkTermsAcceptance, showTermsModal, createTermsStyles } from "./services/terms.js";

// Check if user has accepted terms
(async () => {
  const accepted = await checkTermsAcceptance();
  if (!accepted) {
    createTermsStyles();
    showTermsModal(() => {
      // Terms accepted, continue normally
      console.log('Terms accepted');
    });
  }
})();

/**
 * Abbreviates long vehicle type names for better display
 */
function abbreviateVehicleType(type) {
  const abbreviations = {
    "Standard Pickup Trucks 2WD": "Std Pickup 2WD",
    "Standard Pickup Trucks 4WD": "Std Pickup 4WD",
    "Standard Pickup Trucks": "Std Pickup",
    "Standard Pickup Trucks/2wd": "Std Pickup 2WD",
    "Small Pickup Trucks 2WD": "Small Pickup 2WD",
    "Small Pickup Trucks 4WD": "Small Pickup 4WD",
    "Small Pickup Trucks": "Small Pickup",
    "Standard Sport Utility Vehicle 2WD": "Std SUV 2WD",
    "Standard Sport Utility Vehicle 4WD": "Std SUV 4WD",
    "Small Sport Utility Vehicle 2WD": "Small SUV 2WD",
    "Small Sport Utility Vehicle 4WD": "Small SUV 4WD",
    "Sport Utility Vehicle - 2WD": "SUV 2WD",
    "Sport Utility Vehicle - 4WD": "SUV 4WD",
    "Special Purpose Vehicle 2WD": "Special 2WD",
    "Special Purpose Vehicle 4WD": "Special 4WD",
    "Special Purpose Vehicles": "Special Purpose",
    "Special Purpose Vehicles/2wd": "Special 2WD",
    "Special Purpose Vehicles/4wd": "Special 4WD",
    "Midsize-Large Station Wagons": "Mid-Large Wagon",
    "Midsize Station Wagons": "Midsize Wagon",
    "Small Station Wagons": "Small Wagon",
    "Vans, Passenger Type": "Passenger Van",
    "Vans, Cargo Type": "Cargo Van",
    "Vans Passenger": "Passenger Van",
    "Minivan - 2WD": "Minivan 2WD",
    "Minivan - 4WD": "Minivan 4WD"
  };
  
  return abbreviations[type] || type;
}

/**
 * Format currency values
 */
function formatCurrency(value) {
  return value >= 0 ? `$${value}` : `-$${Math.abs(value)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyze");
  const downloadBtn = document.getElementById("download");
  const saveLotBtn = document.getElementById("saveLot");
  const viewSavedBtn = document.getElementById("viewSaved");
  const openSettingsBtn = document.getElementById("openSettings");
  const output = document.getElementById("output");

  if (!analyzeBtn || !output) {
    console.error("Popup DOM elements missing");
    return;
  }

  // Settings button handler
  if (openSettingsBtn) {
    openSettingsBtn.onclick = () => {
      chrome.runtime.openOptionsPage();
    };
  }

  // Saved Lots button handler
  if (viewSavedBtn) {
    viewSavedBtn.onclick = () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('savedLots.html') });
    };
  }

  analyzeBtn.onclick = async () => {
    output.innerHTML = `<div class="placeholder">Analyzing lot...</div>`;
    
    // Hide action buttons while analyzing
    const actionRow = document.querySelector('.action-row');
    if (actionRow) actionRow.style.display = "none";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || (!tab.url.includes("copart.com") && !tab.url.includes("iaai.com"))) {
      output.innerHTML = `
        <div class="placeholder">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Open an auction lot page first</h3>
          <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">LOTLOGIC works on:</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #6b7280; font-size: 13px;">
            <li><strong>Copart:</strong> copart.com/lot/*</li>
            <li><strong>IAAI:</strong> iaai.com/vehicle/*</li>
          </ul>
          <p style="margin-top: 10px; color: #9ca3af; font-size: 12px;">Navigate to a vehicle lot, then click "Analyze Lot"</p>
        </div>
      `;
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "GET_LOT_DATA" }, async (data) => {
      if (chrome.runtime.lastError || !data) {
        output.innerHTML = `<div class="placeholder">Failed to read lot data. Refresh the page.</div>`;
        return;
      }

      let vehicleType = "Midsize Cars";
      let weight = 3500;
      let weightSource = "Default estimate";
      
      console.log('Looking up vehicle:', data.year, data.make, data.model);
      
      // First priority: Use base weight from Copart if available
      if (data.baseWeight && data.baseWeight > 0) {
        weight = data.baseWeight;
        weightSource = "Copart Technical Specs";
        console.log(`✓ Using Copart base weight: ${weight} lbs`);
      }
      
      // Get vehicle type from database
      try {
        const result = await getEstimatedWeight(data.year, data.make, data.model);
        console.log('Database lookup result:', result);
        
        if (result) {
          vehicleType = result.vehicleType;
          
          // Only lookup weight if we don't have it from Copart
          if (!data.baseWeight) {
            const { getCachedAccurateWeight } = await import('./services/accurateWeight.js');
            const accurateResult = await getCachedAccurateWeight(
              data.year, 
              data.make, 
              data.model, 
              vehicleType
            );
            
            weight = accurateResult.weight;
            weightSource = accurateResult.source;
            
            console.log(`✓ Weight: ${weight} lbs from ${weightSource} (${accurateResult.confidence} confidence)`);
          }
        } else {
          console.log('✗ No result returned from lookup');
        }
      } catch (err) {
        console.error("Vehicle lookup failed:", err);
      }

      const metals = await getCachedMetalPrices();
      const scrapData = calculateDetailedScrapValue(weight, vehicleType, metals);
      
      // Load user settings
      const settings = await getSettings();
      const fees = settings.fees || getFees();
      const transport = settings.transportCost || 100;
      const targetProfit = settings.targetProfit || 500;
      
      const currentBid = parseInt(String(data.currentBid || "").replace(/[^0-9]/g, "")) || 0;
      const buyItNow = parseInt(String(data.buyItNow || "").replace(/[^0-9]/g, "")) || 0;

      const profit = calculateProfit(scrapData.grandTotal, fees, transport, currentBid);
      const { recommendation, meterPercent, meterColor } = getBuyRecommendation(profit);
      
      const biddingGuidance = getBiddingGuidance(scrapData.grandTotal, fees, transport, targetProfit);
      const currentStatus = getCurrentBidStatus(currentBid, biddingGuidance);

      // Store current lot data for saving
      window.currentLotData = {
        ...data,
        scrapValue: scrapData.grandTotal,
        profit,
        url: tab.url,
        weight,
        vehicleType
      };

      const displayType = abbreviateVehicleType(vehicleType);
      
      output.innerHTML = `
        <div class="lot-card" id="lot-card">
          <h2>${data.title}</h2>
          <div class="vehicle-info">
            <span><strong>Year:</strong> ${data.year}</span>
            <span><strong>Make:</strong> ${data.make}</span>
            <span><strong>Model:</strong> ${data.model}</span>
            <span><strong>Weight:</strong> ${weight} lbs</span>
            <span><strong>Type:</strong> ${displayType}</span>
            <span><strong>Odometer:</strong> ${data.odometer}</span>
            <span><strong>Bid:</strong> ${data.currentBid}</span>
          </div>
          ${weightSource !== 'Default estimate' ? `<div style="font-size: 10px; color: #6b7280; margin-top: 6px; text-align: center;">Weight source: ${weightSource}</div>` : ''}

          <div class="recommendation-meter">
            <div class="meter-bar" style="width:${meterPercent}%; background-color:${meterColor};"></div>
          </div>
          <div class="recommendation-label">${recommendation}</div>

          <div class="scrap-card">
            <h3>Scrap Value Breakdown</h3>
            
            <div class="metal-section">
              <h4>Base Metals</h4>
              <table>
                <tr><td>Steel</td><td>${formatCurrency(scrapData.breakdown.steel)}</td></tr>
                <tr><td>Aluminum</td><td>${formatCurrency(scrapData.breakdown.aluminum)}</td></tr>
                <tr><td>Copper</td><td>${formatCurrency(scrapData.breakdown.copper)}</td></tr>
                <tr><td>Stainless Steel</td><td>${formatCurrency(scrapData.breakdown.stainlessSteel)}</td></tr>
                <tr><td>Brass</td><td>${formatCurrency(scrapData.breakdown.brass)}</td></tr>
                <tr><td>Lead (Battery)</td><td>${formatCurrency(scrapData.breakdown.lead)}</td></tr>
                <tr class="subtotal"><td><strong>Base Total</strong></td><td><strong>${formatCurrency(scrapData.baseMetalsTotal)}</strong></td></tr>
              </table>
            </div>

            <div class="metal-section precious">
              <h4>Precious Metals (Catalytic Converter)</h4>
              <table>
                <tr><td>Platinum</td><td>${formatCurrency(scrapData.breakdown.platinum)}</td></tr>
                <tr><td>Palladium</td><td>${formatCurrency(scrapData.breakdown.palladium)}</td></tr>
                <tr><td>Rhodium</td><td>${formatCurrency(scrapData.breakdown.rhodium)}</td></tr>
                <tr class="subtotal"><td><strong>Cat Total</strong></td><td><strong>${formatCurrency(scrapData.preciousMetalsTotal)}</strong></td></tr>
              </table>
            </div>

            <div class="total-section">
              <table>
                <tr class="total"><td><strong>Total Scrap Value</strong></td><td><strong>${formatCurrency(scrapData.grandTotal)}</strong></td></tr>
              </table>
            </div>

            <div class="fees">Fees: ${formatCurrency(fees)} | Transport: ${formatCurrency(transport)}</div>
            <div class="profit ${profit < 0 ? "negative" : ""}">Estimated Profit: ${formatCurrency(profit)}</div>
          </div>

          <div class="bidding-guidance">
            <h3>Bidding Guidance</h3>
            
            ${biddingGuidance.unprofitable ? `
              <div class="current-status" style="background-color: #fee2e222; border-left: 4px solid #dc2626;">
                <div class="status-label" style="color: #dc2626;">
                  ⚠️ NOT PROFITABLE
                </div>
                <div class="status-message">${biddingGuidance.message}</div>
              </div>
              <div style="padding: 10px; background: #fef2f2; border-radius: 6px; margin-top: 10px; font-size: 11px; color: #7f1d1d;">
                <strong>Why this doesn't work:</strong><br>
                • Scrap Value: $${biddingGuidance.scrapValue}<br>
                • Costs (Fees + Transport): $${biddingGuidance.totalCosts}<br>
                • Deficit: -$${biddingGuidance.deficit}<br><br>
                Even at $0 bid, you would lose money on this vehicle.
              </div>
            ` : biddingGuidance.targetTooHigh ? `
              <div class="current-status" style="background-color: #fef3c722; border-left: 4px solid #f59e0b;">
                <div class="status-label" style="color: #f59e0b;">
                  ⚠️ TARGET PROFIT TOO HIGH
                </div>
                <div class="status-message">${biddingGuidance.message}</div>
              </div>
              <div style="padding: 10px; background: #fffbeb; border-radius: 6px; margin-top: 10px; font-size: 11px; color: #78350f;">
                <strong>Adjusted Guidance:</strong><br>
                • Your Target: $${biddingGuidance.requestedProfit}<br>
                • Max Possible: $${biddingGuidance.maxPossibleProfit} (at $0 bid)<br>
                • ${biddingGuidance.suggestion}<br><br>
                Showing realistic zones below based on this vehicle's actual value:
              </div>
              
              <div style="margin-top: 12px;">
                <div class="current-status" style="background-color: ${currentStatus.statusColor}22; border-left: 4px solid ${currentStatus.statusColor};">
                  <div class="status-label" style="color: ${currentStatus.statusColor};">
                    ${currentBid > 0 ? `Current Bid: $${currentBid}` : 'No bids yet'}
                    ${buyItNow > 0 ? ` | Buy Now: $${buyItNow}` : ''}
                  </div>
                  <div class="status-message">${currentStatus.message}</div>
                </div>
              </div>

              <div class="bid-zones">
                ${biddingGuidance.maxBidGoodProfit > 0 ? `
                <div class="zone-row excellent">
                  <span class="zone-label">Best Value</span>
                  <span class="zone-range">$0 - $${biddingGuidance.maxBidGoodProfit}</span>
                  <span class="zone-profit">Maximum profit</span>
                </div>
                ` : ''}
                ${biddingGuidance.maxBidMinProfit > 0 ? `
                <div class="zone-row good">
                  <span class="zone-label">Good Deal</span>
                  <span class="zone-range">$${Math.max(0, biddingGuidance.maxBidGoodProfit)} - $${biddingGuidance.maxBidMinProfit}</span>
                  <span class="zone-profit">~$${biddingGuidance.targetProfit} profit</span>
                </div>
                ` : ''}
                <div class="zone-row marginal">
                  <span class="zone-label">Acceptable</span>
                  <span class="zone-range">$${Math.max(0, biddingGuidance.maxBidMinProfit)} - $${biddingGuidance.maxBidBreakEven - 50}</span>
                  <span class="zone-profit">Small profit</span>
                </div>
                <div class="zone-row danger">
                  <span class="zone-label">Avoid</span>
                  <span class="zone-range">Above $${biddingGuidance.maxBidBreakEven}</span>
                  <span class="zone-profit">Loss</span>
                </div>
              </div>

              <div class="max-bid-summary">
                <strong>Recommended Maximum: $${Math.max(0, biddingGuidance.maxBidMinProfit > 0 ? biddingGuidance.maxBidMinProfit : Math.round(biddingGuidance.maxBidBreakEven * 0.6))}</strong>
                <div class="break-even-note">Break-even is $${biddingGuidance.maxBidBreakEven} • Don't go over or you'll lose money</div>
              </div>
            ` : `
            <div class="current-status" style="background-color: ${currentStatus.statusColor}22; border-left: 4px solid ${currentStatus.statusColor};">
              <div class="status-label" style="color: ${currentStatus.statusColor};">
                ${currentBid > 0 ? `Current Bid: $${currentBid}` : 'No bids yet'}
                ${buyItNow > 0 ? ` | Buy Now: $${buyItNow}` : ''}
              </div>
              <div class="status-message">${currentStatus.message}</div>
            </div>

            <div class="bid-zones">
              ${biddingGuidance.maxBidGoodProfit > 0 ? `
              <div class="zone-row excellent">
                <span class="zone-label">Best Value</span>
                <span class="zone-range">$0 - $${biddingGuidance.maxBidGoodProfit}</span>
                <span class="zone-profit">~$${biddingGuidance.targetProfit * 2} profit</span>
              </div>
              ` : ''}
              ${biddingGuidance.maxBidMinProfit > 0 ? `
              <div class="zone-row good">
                <span class="zone-label">Good Deal</span>
                <span class="zone-range">$${Math.max(0, biddingGuidance.maxBidGoodProfit)} - $${biddingGuidance.maxBidMinProfit}</span>
                <span class="zone-profit">~$${biddingGuidance.targetProfit} profit</span>
              </div>
              ` : ''}
              <div class="zone-row marginal">
                <span class="zone-label">Acceptable</span>
                <span class="zone-range">$${Math.max(0, biddingGuidance.maxBidMinProfit)} - $${biddingGuidance.maxBidBreakEven - 50}</span>
                <span class="zone-profit">Small profit</span>
              </div>
              <div class="zone-row danger">
                <span class="zone-label">Avoid</span>
                <span class="zone-range">Above $${biddingGuidance.maxBidBreakEven}</span>
                <span class="zone-profit">Loss</span>
              </div>
            </div>

            <div class="max-bid-summary">
              <strong>Recommended Maximum: $${Math.max(0, biddingGuidance.maxBidMinProfit > 0 ? biddingGuidance.maxBidMinProfit : Math.round(biddingGuidance.maxBidBreakEven * 0.6))}</strong>
              <div class="break-even-note">Break-even is $${biddingGuidance.maxBidBreakEven} • Don't go over or you'll lose money</div>
            </div>
            `}
          </div>

          <div class="metal-prices">
            <em>Current Prices:</em>
            <span>Steel: $${metals.steel}/lb</span>
            <span>Al: $${metals.aluminum}/lb</span>
            <span>Cu: $${metals.copper}/lb</span>
            <span>Pt: $${metals.platinum}/oz</span>
            <span>Pd: $${metals.palladium}/oz</span>
            <span>Rh: $${metals.rhodium}/oz</span>
          </div>
          ${metals.lastUpdated ? `<div class="last-updated">Prices updated: ${new Date(metals.lastUpdated).toLocaleDateString()}</div>` : ''}
        </div>
      `;

      if (actionRow) actionRow.style.display = "grid";

      if (downloadBtn) {
        downloadBtn.onclick = async () => {
          await generateProfessionalPDF(
            window.currentLotData,
            scrapData,
            metals,
            settings
          );
        };
      }
    });
  };

  if (saveLotBtn) {
    saveLotBtn.onclick = async () => {
      try {
        const { saveLot } = await import('./services/savedLots.js');
        if (window.currentLotData) {
          await saveLot(window.currentLotData);
          saveLotBtn.textContent = 'Saved!';
          saveLotBtn.style.background = '#d1fae5';
          saveLotBtn.style.color = '#065f46';
          saveLotBtn.style.borderColor = '#6ee7b7';
          setTimeout(() => {
            saveLotBtn.textContent = 'Save Lot';
            saveLotBtn.style.background = '';
            saveLotBtn.style.color = '';
            saveLotBtn.style.borderColor = '';
          }, 2000);
        } else {
          alert('Please analyze a lot first');
        }
      } catch (err) {
        console.error('Error saving lot:', err);
        alert('Error saving lot. Make sure all files are properly loaded.');
      }
    };
  }
});