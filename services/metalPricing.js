/**
 * METAL PRICING SERVICE
 * 
 * Fetches live/daily scrap metal prices from MetalPriceAPI.
 * Includes fallback prices if APIs fail.
 */

import { getExpandedMetalComposition } from "./expandedMetalComposition.js";
import { CONFIG } from "../config.js";

// Fallback prices (updated January 29, 2026)
const FALLBACK_PRICES = {
  // Base metals ($ per lb) - scrap yard rates
  steel: 0.15,          // Updated from market data
  aluminum: 0.90,       // Up 7-10% since Thanksgiving
  copper: 6.10,         // RECORD HIGH - up from $3.50
  stainlessSteel: 0.50, // Stable
  brass: 2.40,          // Up with copper
  lead: 1.00,           // Stable
  
  // Precious metals ($ per troy oz) - spot prices
  platinum: 2785,       // Up 157% year-over-year
  palladium: 1050,      // 5-7% below all-time high
  rhodium: 10000        // Rebounded to $10k/oz
};

/**
 * Fetch prices from MetalPriceAPI
 * Docs: https://metalpriceapi.com/documentation
 */
async function fetchFromMetalPriceAPI(apiKey) {
  try {
    if (CONFIG.DEBUG) console.log("Fetching prices from MetalPriceAPI...");
    
    // MetalPriceAPI uses currency codes for metals
    // XCU = Copper, XAL = Aluminum, XPT = Platinum, XPD = Palladium
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XCU,XAL,XPT,XPD`
    );
    
    if (!response.ok) {
      throw new Error(`MetalPriceAPI HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (CONFIG.DEBUG) {
      console.log("MetalPriceAPI response:", data);
    }
    
    if (!data.success) {
      throw new Error("MetalPriceAPI returned unsuccessful response");
    }
    
    // MetalPriceAPI returns rates as USD per unit
    // For metals, this is typically per troy ounce
    // We need to convert to $ per lb for base metals
    
    const rates = data.rates || {};
    
    // Convert troy oz to pounds (1 troy oz = 0.0685714 lbs)
    // So price per lb = (price per troy oz) / 0.0685714
    const TROY_OZ_TO_LB = 14.5833; // 1 lb = 14.5833 troy oz
    
    return {
      // Base metals - convert from troy oz to lbs
      copper: rates.XCU ? (1 / rates.XCU) * TROY_OZ_TO_LB : FALLBACK_PRICES.copper,
      aluminum: rates.XAL ? (1 / rates.XAL) * TROY_OZ_TO_LB : FALLBACK_PRICES.aluminum,
      
      // Precious metals - keep as troy oz
      platinum: rates.XPT ? (1 / rates.XPT) : FALLBACK_PRICES.platinum,
      palladium: rates.XPD ? (1 / rates.XPD) : FALLBACK_PRICES.palladium,
      
      // Not available from this API, use fallback
      steel: FALLBACK_PRICES.steel,
      stainlessSteel: FALLBACK_PRICES.stainlessSteel,
      brass: FALLBACK_PRICES.brass,
      lead: FALLBACK_PRICES.lead,
      rhodium: FALLBACK_PRICES.rhodium,
      
      // Metadata
      source: "MetalPriceAPI",
      apiSuccess: true
    };
  } catch (err) {
    console.error("MetalPriceAPI error:", err);
    return {
      ...FALLBACK_PRICES,
      source: "Fallback (API Error)",
      apiSuccess: false,
      error: err.message
    };
  }
}

/**
 * Main function to get current metal prices
 * Uses your API key from config
 * 
 * @returns {Promise<object>} - All metal prices
 */
export async function getMetalPrices() {
  let prices = { ...FALLBACK_PRICES };
  
  // Try MetalPriceAPI if enabled and key is available
  if (CONFIG.USE_API && CONFIG.METAL_PRICE_API_KEY) {
    const apiPrices = await fetchFromMetalPriceAPI(CONFIG.METAL_PRICE_API_KEY);
    if (apiPrices) {
      prices = { ...prices, ...apiPrices };
    }
  } else {
    prices.source = "Fallback (API Disabled)";
  }
  
  // Format prices for display and calculation
  return formatPrices(prices);
}

/**
 * Format prices for display and calculation
 */
function formatPrices(prices) {
  return {
    // Base metals ($ per lb)
    steel: Number(prices.steel.toFixed(3)),
    aluminum: Number(prices.aluminum.toFixed(3)),
    copper: Number(prices.copper.toFixed(3)),
    stainlessSteel: Number(prices.stainlessSteel.toFixed(3)),
    brass: Number(prices.brass.toFixed(3)),
    lead: Number(prices.lead.toFixed(3)),
    
    // Precious metals ($ per troy oz)
    platinum: Math.round(prices.platinum),
    palladium: Math.round(prices.palladium),
    rhodium: Math.round(prices.rhodium),
    
    // Metadata
    lastUpdated: new Date().toISOString(),
    source: prices.source || "Unknown",
    apiSuccess: prices.apiSuccess !== undefined ? prices.apiSuccess : true
  };
}

/**
 * Cache prices in Chrome storage to avoid excessive API calls
 * Refresh every 24 hours (or based on CONFIG.CACHE_DURATION)
 */
export async function getCachedMetalPrices() {
  try {
    // Check if user wants manual prices first
    const settingsResult = await chrome.storage.sync.get('userSettings');
    const settings = settingsResult.userSettings;
    
    if (settings?.useManualPrices && settings?.manualPrices) {
      if (CONFIG.DEBUG) {
        console.log('✓ Using manual metal prices from user settings');
      }
      return {
        ...settings.manualPrices,
        lastUpdated: new Date().toISOString(),
        source: "Manual (User Settings)",
        apiSuccess: true
      };
    }
    
    // Try to get from Chrome storage
    const result = await chrome.storage.local.get(['metalPrices', 'metalPricesTimestamp']);
    
    const now = Date.now();
    const cacheAge = now - (result.metalPricesTimestamp || 0);
    
    // If cache is less than configured duration old, use it
    if (result.metalPrices && cacheAge < CONFIG.CACHE_DURATION) {
      if (CONFIG.DEBUG) {
        console.log('✓ Using cached metal prices (age: ' + Math.round(cacheAge / 1000 / 60) + ' minutes)');
      }
      return result.metalPrices;
    }
    
    // Otherwise fetch fresh prices
    if (CONFIG.DEBUG) {
      console.log('⟳ Fetching fresh metal prices from API...');
    }
    const freshPrices = await getMetalPrices();
    
    // Save to cache
    await chrome.storage.local.set({
      metalPrices: freshPrices,
      metalPricesTimestamp: now
    });
    
    if (CONFIG.DEBUG) {
      console.log('✓ Metal prices cached successfully');
      console.log('  Source:', freshPrices.source);
      console.log('  Copper: $' + freshPrices.copper + '/lb');
      console.log('  Aluminum: $' + freshPrices.aluminum + '/lb');
      console.log('  Platinum: $' + freshPrices.platinum + '/oz');
    }
    
    return freshPrices;
    
  } catch (err) {
    console.error('Error with cached prices:', err);
    // Fall back to direct fetch
    return await getMetalPrices();
  }
}

/**
 * Manual price update function (for settings page)
 * Allows users to input current scrap yard prices
 */
export async function setManualPrices(prices) {
  await chrome.storage.local.set({
    metalPrices: { ...FALLBACK_PRICES, ...prices, source: "Manual" },
    metalPricesTimestamp: Date.now()
  });
}

/**
 * Get metal composition for a vehicle type
 * Uses expanded composition with all metals
 */
export function getMetalComposition(vehicleType) {
  return getExpandedMetalComposition(vehicleType);
}

/**
 * Calculate total scrap value with detailed breakdown
 */
export function calculateDetailedScrapValue(weight, vehicleType, prices) {
  const composition = getExpandedMetalComposition(vehicleType);
  
  // Calculate value for each metal
  const breakdown = {
    // Base metals (weight in lbs × composition % × price per lb)
    steel: Math.round(weight * composition.steel * prices.steel),
    aluminum: Math.round(weight * composition.aluminum * prices.aluminum),
    copper: Math.round(weight * composition.copper * prices.copper),
    stainlessSteel: Math.round(weight * composition.stainlessSteel * prices.stainlessSteel),
    brass: Math.round(weight * composition.brass * prices.brass),
    lead: Math.round(weight * composition.lead * prices.lead),
    
    // Precious metals (weight in lbs × composition % × 453.592 g/lb × price per troy oz ÷ 31.1035 g/troy oz)
    platinum: Math.round(weight * composition.platinum * 453.592 * prices.platinum / 31.1035),
    palladium: Math.round(weight * composition.palladium * 453.592 * prices.palladium / 31.1035),
    rhodium: Math.round(weight * composition.rhodium * 453.592 * prices.rhodium / 31.1035)
  };
  
  // Calculate totals
  const baseMetalsTotal = breakdown.steel + breakdown.aluminum + breakdown.copper + 
                          breakdown.stainlessSteel + breakdown.brass + breakdown.lead;
  
  const preciousMetalsTotal = breakdown.platinum + breakdown.palladium + breakdown.rhodium;
  
  const grandTotal = baseMetalsTotal + preciousMetalsTotal;
  
  return {
    breakdown,
    baseMetalsTotal,
    preciousMetalsTotal,
    grandTotal
  };
}