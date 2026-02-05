/**
 * Maps vehicle types from EPA data to estimated weights in pounds.
 * These are average curb weights for each category based on real vehicle data.
 */
export const WEIGHT_CLASS_MAP = {
  // Two Seaters - Sports cars and small roadsters
  "Two Seaters": 2900,
  
  // Cars - Minicompact through Large
  "Minicompact Cars": 2400,
  "Subcompact Cars": 2700,
  "Compact Cars": 3100,
  "Midsize Cars": 3500,
  "Large Cars": 4100,
  
  // Station Wagons
  "Small Station Wagons": 3300,
  "Midsize Station Wagons": 3700,
  "Midsize-Large Station Wagons": 4000,
  
  // Pickup Trucks - Small (Tacoma, Colorado, Ranger)
  "Small Pickup Trucks": 3600,
  "Small Pickup Trucks 2WD": 3500,
  "Small Pickup Trucks 4WD": 3700,
  
  // Pickup Trucks - Standard (F-150, Silverado, Ram)
  "Standard Pickup Trucks": 4800,
  "Standard Pickup Trucks 2WD": 4600,
  "Standard Pickup Trucks 4WD": 5000,
  "Standard Pickup Trucks/2wd": 4600,
  
  // Vans
  "Vans": 4800,
  "Vans Passenger": 5000,
  "Vans, Passenger Type": 5000,
  "Vans, Cargo Type": 4600,
  
  // Minivans (Odyssey, Sienna, Pacifica)
  "Minivan - 2WD": 4200,
  "Minivan - 4WD": 4400,
  
  // Sport Utility Vehicles - Small (CR-V, RAV4, Rogue)
  "Small Sport Utility Vehicle 2WD": 3600,
  "Small Sport Utility Vehicle 4WD": 3800,
  
  // Sport Utility Vehicles - Standard (Explorer, Grand Cherokee, Highlander)
  "Sport Utility Vehicle - 2WD": 4300,
  "Sport Utility Vehicle - 4WD": 4500,
  "Standard Sport Utility Vehicle 2WD": 4300,
  "Standard Sport Utility Vehicle 4WD": 4500,
  
  // Special Purpose Vehicles (Heavy duty trucks, large SUVs)
  "Special Purpose Vehicle": 5200,
  "Special Purpose Vehicle 2WD": 5000,
  "Special Purpose Vehicle 4WD": 5400,
  "Special Purpose Vehicles": 5200,
  "Special Purpose Vehicles/2wd": 5000,
  "Special Purpose Vehicles/4wd": 5400
};

/**
 * Maps vehicle types to metal composition percentages.
 * These values represent the approximate percentage of each metal by weight.
 */
export const METAL_COMPOSITION_MAP = {
  // Two Seaters - Often aluminum-intensive sports cars
  "Two Seaters": { steel: 0.50, aluminum: 0.15, copper: 0.02 },
  
  // Cars - Mostly steel construction
  "Minicompact Cars": { steel: 0.55, aluminum: 0.08, copper: 0.02 },
  "Subcompact Cars": { steel: 0.55, aluminum: 0.10, copper: 0.02 },
  "Compact Cars": { steel: 0.55, aluminum: 0.10, copper: 0.02 },
  "Midsize Cars": { steel: 0.55, aluminum: 0.10, copper: 0.02 },
  "Large Cars": { steel: 0.57, aluminum: 0.10, copper: 0.02 },
  
  // Station Wagons
  "Small Station Wagons": { steel: 0.55, aluminum: 0.10, copper: 0.02 },
  "Midsize Station Wagons": { steel: 0.55, aluminum: 0.10, copper: 0.02 },
  "Midsize-Large Station Wagons": { steel: 0.57, aluminum: 0.10, copper: 0.02 },
  
  // Pickup Trucks - Higher steel content, some aluminum
  "Small Pickup Trucks": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Small Pickup Trucks 2WD": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Small Pickup Trucks 4WD": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Standard Pickup Trucks": { steel: 0.60, aluminum: 0.10, copper: 0.03 },
  "Standard Pickup Trucks 2WD": { steel: 0.60, aluminum: 0.10, copper: 0.03 },
  "Standard Pickup Trucks 4WD": { steel: 0.60, aluminum: 0.10, copper: 0.03 },
  "Standard Pickup Trucks/2wd": { steel: 0.60, aluminum: 0.10, copper: 0.03 },
  
  // Vans - Heavy steel construction
  "Vans": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Vans Passenger": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Vans, Passenger Type": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  "Vans, Cargo Type": { steel: 0.60, aluminum: 0.08, copper: 0.03 },
  
  // Minivans
  "Minivan - 2WD": { steel: 0.58, aluminum: 0.10, copper: 0.03 },
  "Minivan - 4WD": { steel: 0.58, aluminum: 0.10, copper: 0.03 },
  
  // SUVs - Mixed construction
  "Small Sport Utility Vehicle 2WD": { steel: 0.55, aluminum: 0.12, copper: 0.03 },
  "Small Sport Utility Vehicle 4WD": { steel: 0.55, aluminum: 0.12, copper: 0.03 },
  "Sport Utility Vehicle - 2WD": { steel: 0.58, aluminum: 0.12, copper: 0.03 },
  "Sport Utility Vehicle - 4WD": { steel: 0.58, aluminum: 0.12, copper: 0.03 },
  "Standard Sport Utility Vehicle 2WD": { steel: 0.58, aluminum: 0.12, copper: 0.03 },
  "Standard Sport Utility Vehicle 4WD": { steel: 0.58, aluminum: 0.12, copper: 0.03 },
  
  // Special Purpose Vehicles - Heavy duty construction
  "Special Purpose Vehicle": { steel: 0.62, aluminum: 0.08, copper: 0.03 },
  "Special Purpose Vehicle 2WD": { steel: 0.62, aluminum: 0.08, copper: 0.03 },
  "Special Purpose Vehicle 4WD": { steel: 0.62, aluminum: 0.08, copper: 0.03 },
  "Special Purpose Vehicles": { steel: 0.62, aluminum: 0.08, copper: 0.03 },
  "Special Purpose Vehicles/2wd": { steel: 0.62, aluminum: 0.08, copper: 0.03 },
  "Special Purpose Vehicles/4wd": { steel: 0.62, aluminum: 0.08, copper: 0.03 }
};