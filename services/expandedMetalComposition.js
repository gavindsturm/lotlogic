/**
 * COMPREHENSIVE VEHICLE METAL COMPOSITION
 * 
 * Based on industry averages for automotive scrap value.
 * Percentages represent weight composition of each metal in the vehicle.
 * 
 * Metals tracked:
 * - Steel: Frame, body panels, engine block
 * - Aluminum: Engine parts, wheels, body panels (modern cars)
 * - Copper: Wiring, radiators, motors
 * - Stainless Steel: Exhaust systems, trim
 * - Brass: Radiators, fittings
 * - Lead: Batteries (12V battery ~40-60 lbs)
 * - Platinum: Catalytic converters (trace amounts, but high value)
 * - Palladium: Catalytic converters (trace amounts, but high value)
 * - Rhodium: Catalytic converters (trace amounts, extremely high value)
 */

export const EXPANDED_METAL_COMPOSITION = {
  // Two Seaters - Sports cars (more aluminum, high-value cats)
  "Two Seaters": {
    steel: 0.50,
    aluminum: 0.15,
    copper: 0.02,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015, // Battery weight
    platinum: 0.000003, // ~3-7 grams in cat converter
    palladium: 0.000002,
    rhodium: 0.0000005
  },
  
  // Compact/Midsize Cars - Standard composition
  "Minicompact Cars": {
    steel: 0.55,
    aluminum: 0.08,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Subcompact Cars": {
    steel: 0.55,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Compact Cars": {
    steel: 0.55,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Midsize Cars": {
    steel: 0.55,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Large Cars": {
    steel: 0.57,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  // Station Wagons
  "Small Station Wagons": {
    steel: 0.55,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Midsize Station Wagons": {
    steel: 0.55,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Midsize-Large Station Wagons": {
    steel: 0.57,
    aluminum: 0.10,
    copper: 0.02,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  // Pickup Trucks - Higher steel, larger cats
  "Small Pickup Trucks": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Small Pickup Trucks 2WD": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Small Pickup Trucks 4WD": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Standard Pickup Trucks": {
    steel: 0.60,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000004, // Larger cats
    palladium: 0.0000025,
    rhodium: 0.0000005
  },
  
  "Standard Pickup Trucks 2WD": {
    steel: 0.60,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000004,
    palladium: 0.0000025,
    rhodium: 0.0000005
  },
  
  "Standard Pickup Trucks 4WD": {
    steel: 0.60,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000004,
    palladium: 0.0000025,
    rhodium: 0.0000005
  },
  
  "Standard Pickup Trucks/2wd": {
    steel: 0.60,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000004,
    palladium: 0.0000025,
    rhodium: 0.0000005
  },
  
  // Vans - Heavy steel
  "Vans": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Vans Passenger": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Vans, Passenger Type": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Vans, Cargo Type": {
    steel: 0.60,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  // Minivans
  "Minivan - 2WD": {
    steel: 0.58,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Minivan - 4WD": {
    steel: 0.58,
    aluminum: 0.10,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.004,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  // SUVs - Higher cat converter content
  "Small Sport Utility Vehicle 2WD": {
    steel: 0.55,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Small Sport Utility Vehicle 4WD": {
    steel: 0.55,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Sport Utility Vehicle - 2WD": {
    steel: 0.58,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Sport Utility Vehicle - 4WD": {
    steel: 0.58,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Standard Sport Utility Vehicle 2WD": {
    steel: 0.58,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  "Standard Sport Utility Vehicle 4WD": {
    steel: 0.58,
    aluminum: 0.12,
    copper: 0.03,
    stainlessSteel: 0.03,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000003,
    palladium: 0.000002,
    rhodium: 0.0000004
  },
  
  // Special Purpose Vehicles
  "Special Purpose Vehicle": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Special Purpose Vehicle 2WD": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Special Purpose Vehicle 4WD": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Special Purpose Vehicles": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Special Purpose Vehicles/2wd": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  },
  
  "Special Purpose Vehicles/4wd": {
    steel: 0.62,
    aluminum: 0.08,
    copper: 0.03,
    stainlessSteel: 0.025,
    brass: 0.005,
    lead: 0.015,
    platinum: 0.000002,
    palladium: 0.0000015,
    rhodium: 0.0000003
  }
};

/**
 * Get expanded metal composition for a vehicle type
 */
export function getExpandedMetalComposition(vehicleType) {
  return EXPANDED_METAL_COMPOSITION[vehicleType] || EXPANDED_METAL_COMPOSITION["Midsize Cars"];
}