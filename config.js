/**
 * CONFIGURATION FILE
 * Store your MetalPriceAPI key here
 */

export const CONFIG = {
  // Your MetalPriceAPI key
  // Sign up at: https://metalpriceapi.com/
  METAL_PRICE_API_KEY: "385f859320b8f924868d85781dfc2844",
  
  // Cache duration (24 hours in milliseconds)
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  
  // Enable/disable API calls (set to false to use fallback prices only)
  USE_API: true,
  
  // Debug mode (shows console logs)
  DEBUG: true
};