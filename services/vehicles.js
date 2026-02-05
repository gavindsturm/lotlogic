import { WEIGHT_CLASS_MAP, METAL_COMPOSITION_MAP } from "./weightClassMap.js";

let vehicleData = null;

/**
 * Loads the vehicle database from the JSON file
 */
async function loadVehicleData() {
  if (vehicleData) return vehicleData;

  try {
    const response = await fetch(chrome.runtime.getURL("data/vehicles.json"));
    vehicleData = await response.json();
    return vehicleData;
  } catch (err) {
    console.error("Failed to load vehicle data:", err);
    vehicleData = {};
    return vehicleData;
  }
}

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Removing special characters (hyphens, spaces, etc)
 * - Trimming whitespace
 */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[-\s]/g, "") // Remove hyphens and spaces
    .trim();
}

/**
 * Checks if a model name matches the search term.
 * Handles variations like:
 * - "F150" matches "F150 Pickup 2WD", "F150 Raptor", etc.
 * - "F-150" matches "F150"
 * - "Taurus SHO" matches "Taurus"
 */
function modelMatches(dbModel, searchModel) {
  const normalizedDb = normalize(dbModel);
  const normalizedSearch = normalize(searchModel);
  
  // Exact match after normalization
  if (normalizedDb === normalizedSearch) return true;
  
  // Check if the database model starts with the search term
  // (e.g., "F150 Pickup 2WD" starts with "F150")
  if (normalizedDb.startsWith(normalizedSearch)) return true;
  
  // Check if the search term is a significant part of the model name
  // (e.g., searching "Taurus" should match "Taurus SHO")
  if (normalizedSearch.length >= 3 && normalizedDb.includes(normalizedSearch)) {
    // Make sure it's at a word boundary (not in the middle of a word)
    const words = dbModel.toLowerCase().split(/[\s-]+/);
    if (words.some(word => normalize(word) === normalizedSearch)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Finds the closest matching year if exact year doesn't exist.
 * Returns the nearest year within ±3 years.
 */
function findClosestYear(availableYears, targetYear) {
  const target = parseInt(targetYear);
  const years = Object.keys(availableYears).map(y => parseInt(y));
  
  // Exact match
  if (years.includes(target)) return String(target);
  
  // Find closest year within ±3 years
  const sorted = years.sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
  const closest = sorted[0];
  
  if (Math.abs(closest - target) <= 3) {
    return String(closest);
  }
  
  return null;
}

/**
 * Main function to get vehicle weight and type.
 * Implements fuzzy matching for make, model, and year.
 * 
 * @param {string} year - Vehicle year (e.g., "2018")
 * @param {string} make - Vehicle make (e.g., "Ford", "FORD", "ford")
 * @param {string} model - Vehicle model (e.g., "F150", "F-150", "F150 SUPERCREW")
 * @returns {Promise<{vehicleType: string, estimatedWeight: number, metalComposition: object}>}
 */
export async function getEstimatedWeight(year, make, model) {
  console.log('🔍 getEstimatedWeight called with:', { year, make, model });
  
  // Normalize inputs
  year = String(year).trim();
  make = String(make).trim();
  model = String(model).trim();

  console.log('📋 Normalized:', { year, make, model });

  const data = await loadVehicleData();
  console.log('📦 Vehicle data loaded:', !!data, 'Keys:', Object.keys(data).length);

  // Find make (case-insensitive)
  const makeKey = Object.keys(data).find(
    k => normalize(k) === normalize(make)
  );
  
  console.log('🏭 Make search:', make, '→', makeKey);
  
  if (!makeKey) {
    console.warn(`❌ Make not found: ${make}`);
    return getFallback();
  }

  // Find model using fuzzy matching
  const modelsInMake = data[makeKey];
  let matchedModel = null;
  
  // Extract base model name (remove common trim levels and variants)
  const trimLevels = /\s+(SXT|GT|SE|LE|LX|EX|LTD|LIMITED|SPORT|PREMIUM|PLUS|BASE|TOURING|AWD|4WD|2WD|FWD|RWD)(\s|$)/i;
  const baseModel = model.replace(trimLevels, '').split(/\s+/)[0]; // Get first word after removing trims
  
  console.log(`🔎 Model search: "${model}" → base: "${baseModel}"`);
  
  // First try: exact match
  matchedModel = Object.keys(modelsInMake).find(
    dbModel => normalize(dbModel) === normalize(model)
  );
  
  // Second try: match with trim level removed
  if (!matchedModel) {
    const modelWithoutTrim = model.replace(trimLevels, '').trim();
    matchedModel = Object.keys(modelsInMake).find(
      dbModel => normalize(dbModel) === normalize(modelWithoutTrim)
    );
    if (matchedModel) {
      console.log(`✓ Matched after removing trim: "${modelWithoutTrim}" → "${matchedModel}"`);
    }
  }
  
  // Third try: base model match (first word)
  if (!matchedModel) {
    matchedModel = Object.keys(modelsInMake).find(
      dbModel => normalize(dbModel.split(/\s+/)[0]) === normalize(baseModel)
    );
    if (matchedModel) {
      console.log(`✓ Matched base model: "${baseModel}" → "${matchedModel}"`);
    }
  }
  
  // Fourth try: fuzzy match using existing modelMatches function
  if (!matchedModel) {
    matchedModel = Object.keys(modelsInMake).find(
      dbModel => modelMatches(dbModel, model)
    );
    if (matchedModel) {
      console.log(`✓ Fuzzy matched: "${model}" → "${matchedModel}"`);
    }
  }
  
  if (!matchedModel) {
    console.warn(`Model not found: ${make} ${model} (tried base: ${baseModel})`);
    return getFallback();
  }
  
  console.log(`Matched model: "${model}" -> "${matchedModel}"`);

  // Find year (with fallback to nearby years)
  const yearsData = modelsInMake[matchedModel];
  const matchedYear = findClosestYear(yearsData, year);
  
  if (!matchedYear) {
    console.warn(`Year not found: ${year} ${make} ${matchedModel}`);
    // Still return the vehicle type from any available year
    const anyYear = Object.keys(yearsData)[0];
    if (anyYear && yearsData[anyYear].vehicleType) {
      const vehicleData = yearsData[anyYear];
      const vehicleType = vehicleData.vehicleType;
      const estimatedWeight = vehicleData.weight || WEIGHT_CLASS_MAP[vehicleType] || WEIGHT_CLASS_MAP["Midsize Cars"];
      const metalComposition = METAL_COMPOSITION_MAP[vehicleType] || METAL_COMPOSITION_MAP["Midsize Cars"];
      
      console.log(`✓ Using vehicle type from ${anyYear}: ${vehicleType} (${estimatedWeight} lbs)${vehicleData.weight ? ' [DB]' : ' [MAP]'}`);
      
      return {
        vehicleType,
        estimatedWeight,
        metalComposition
      };
    }
    return getFallback();
  }

  // Get vehicle type and weight from database
  const vehicleData = yearsData[matchedYear];
  const vehicleType = vehicleData.vehicleType;
  
  // Get weight from hardcoded database (preferred) or fallback to weight class map
  const estimatedWeight = vehicleData.weight || WEIGHT_CLASS_MAP[vehicleType] || WEIGHT_CLASS_MAP["Midsize Cars"];
  
  // Get metal composition
  const metalComposition = METAL_COMPOSITION_MAP[vehicleType] || METAL_COMPOSITION_MAP["Midsize Cars"];

  console.log(`✓ Matched: ${year} ${makeKey} ${matchedModel} → ${vehicleType} (${estimatedWeight} lbs)${vehicleData.weight ? ' [DB]' : ' [MAP]'}`);

  return {
    vehicleType,
    estimatedWeight,
    metalComposition
  };
}

/**
 * Returns fallback values when vehicle is not found
 */
function getFallback() {
  const fallbackType = "Midsize Cars";
  return {
    vehicleType: fallbackType,
    estimatedWeight: WEIGHT_CLASS_MAP[fallbackType],
    metalComposition: METAL_COMPOSITION_MAP[fallbackType]
  };
}