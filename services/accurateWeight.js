/**
 * Real-time Vehicle Weight Lookup
 * Uses Auto.dev API (primary) and NHTSA (backup)
 */

import { WEIGHT_CLASS_MAP } from "./weightClassMap.js";

const AUTODEV_API_KEY = 'sk_ad_IjXNxcHBmMxYIVO-GTj7R13X';

/**
 * Lookup using Auto.dev API (PRIMARY)
 * Official specs database with accurate curb weights
 */
async function lookupAutoDev(year, make, model) {
  try {
    console.log(`🔍 Auto.dev lookup: ${year} ${make} ${model}`);
    
    // Auto.dev endpoint
    const url = `https://auto.dev/api/vin?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AUTODEV_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Auto.dev API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Auto.dev response:', data);
    
    // Extract curb weight from response
    if (data && data.curbWeight) {
      const weight = parseInt(data.curbWeight);
      if (weight > 1000 && weight < 10000) {
        console.log(`✓ Auto.dev: Found weight ${weight} lbs`);
        return weight;
      }
    }
    
    // Try alternate field names
    if (data && data.specifications) {
      const specs = data.specifications;
      const weight = specs.curbWeight || specs.weight || specs.vehicleWeight;
      if (weight) {
        const parsed = parseInt(String(weight).replace(/[^0-9]/g, ''));
        if (parsed > 1000 && parsed < 10000) {
          console.log(`✓ Auto.dev: Found weight ${parsed} lbs`);
          return parsed;
        }
      }
    }
    
    console.log('❌ Auto.dev: No weight data found');
    return null;
    
  } catch (err) {
    console.error('Auto.dev API error:', err);
    return null;
  }
}

/**
 * Lookup vehicle weight using NHTSA database (BACKUP)
 */
async function lookupNHTSA(year, make, model) {
  try {
    console.log(`🔍 NHTSA lookup: ${year} ${make} ${model}`);
    
    // NHTSA API endpoint
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.Results || data.Results.length === 0) {
      console.log('❌ NHTSA: No results');
      return null;
    }
    
    // Find matching model
    const baseModel = model.split(' ')[0];
    const modelMatch = data.Results.find(r => 
      r.Model_Name.toLowerCase().includes(baseModel.toLowerCase())
    );
    
    if (!modelMatch) {
      console.log('❌ NHTSA: Model not found');
      return null;
    }
    
    console.log(`✓ NHTSA: Found model ${modelMatch.Model_Name}`);
    return null; // NHTSA doesn't provide weight in basic endpoint
    
  } catch (err) {
    console.error('NHTSA API error:', err);
    return null;
  }
}

/**
 * Main function: Try Auto.dev first, then NHTSA, then fallback to type averages
 */
export async function getAccurateWeight(year, make, model, vehicleType) {
  console.log(`📊 Getting accurate weight for: ${year} ${make} ${model}`);
  
  // Try Auto.dev first (most accurate)
  const autoDevWeight = await lookupAutoDev(year, make, model);
  if (autoDevWeight) {
    return {
      weight: autoDevWeight,
      source: 'Auto.dev Database',
      confidence: 'high'
    };
  }
  
  // Try NHTSA (backup)
  const nhtsaWeight = await lookupNHTSA(year, make, model);
  if (nhtsaWeight) {
    return {
      weight: nhtsaWeight,
      source: 'NHTSA Database',
      confidence: 'high'
    };
  }
  
  // Fallback to vehicle type average
  const typeWeight = WEIGHT_CLASS_MAP[vehicleType] || WEIGHT_CLASS_MAP["Midsize Cars"];
  console.log(`⚠️ Using vehicle type average: ${vehicleType} = ${typeWeight} lbs`);
  
  return {
    weight: typeWeight,
    source: `Estimated (${vehicleType} average)`,
    confidence: 'medium'
  };
}

/**
 * Get weight with caching (24 hour cache)
 */
export async function getCachedAccurateWeight(year, make, model, vehicleType) {
  const cacheKey = `weight_${year}_${make}_${model}`;
  
  try {
    // Check cache
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey] && cached[cacheKey].timestamp) {
      const age = Date.now() - cached[cacheKey].timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age < maxAge) {
        console.log(`✓ Using cached weight: ${cached[cacheKey].weight} lbs (${cached[cacheKey].source})`);
        return cached[cacheKey];
      }
    }
    
    // Get fresh data
    const result = await getAccurateWeight(year, make, model, vehicleType);
    
    // Cache it
    await chrome.storage.local.set({
      [cacheKey]: {
        ...result,
        timestamp: Date.now()
      }
    });
    
    return result;
    
  } catch (err) {
    console.error('Weight lookup error:', err);
    // Final fallback
    return {
      weight: WEIGHT_CLASS_MAP[vehicleType] || 3500,
      source: 'Fallback estimate',
      confidence: 'low'
    };
  }
}