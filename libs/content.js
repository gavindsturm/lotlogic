/**
 * UNIFIED CONTENT SCRAPER
 * Works on both Copart and IAAI
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== "GET_LOT_DATA") return;

  (async () => {
    try {
      const url = window.location.href;
      console.log('🔍 Scraping:', url);
      
      // Detect which site we're on
      let result;
      if (url.includes('copart.com')) {
        result = await scrapeCopart();
      } else if (url.includes('iaai.com')) {
        result = await scrapeIAAI();
      } else {
        console.error('❌ Unsupported site');
        sendResponse(null);
        return;
      }
      
      result.url = url;
      console.log('✅ Scrape result:', result);
      sendResponse(result);
      
    } catch (err) {
      console.error('❌ Scraper error:', err);
      sendResponse(null);
    }
  })();

  return true; // Keep channel open for async
});

// =============================
// COPART SCRAPER
// =============================
async function scrapeCopart() {
  console.log('📋 Scraping Copart...');
  
  // Title - try multiple selectors
  let title = document.querySelector("h1.lot-title, h1")?.innerText?.trim();
  
  if (!title) {
    // Try finding by looking for year pattern at start
    const allH1 = document.querySelectorAll('h1');
    for (const h1 of allH1) {
      const text = h1.innerText?.trim();
      if (text && /^\d{4}\s+[A-Z]/.test(text)) {
        title = text;
        break;
      }
    }
  }
  
  if (!title) {
    title = "Unknown Vehicle";
    console.warn('⚠️ Could not find vehicle title');
  }
  
  console.log('Found title:', title);
  
  const parts = title.split(" ");
  const year = parts[0] || "Unknown";
  const make = parts[1] || "Unknown";
  const model = parts.slice(2).join(" ") || "Unknown";

  console.log('Vehicle:', { year, make, model });

  // Base Weight - scrape from technical specifications
  let baseWeight = null;
  const baseWeightLabel = await findLabelValue("Base Weight");
  if (baseWeightLabel && baseWeightLabel !== "Not available") {
    // Extract number from "3124 lbs" format
    const weightMatch = baseWeightLabel.match(/(\d+)\s*lbs/);
    if (weightMatch) {
      baseWeight = parseInt(weightMatch[1]);
      console.log(`✓ Found base weight from Copart: ${baseWeight} lbs`);
    }
  }

  // Odometer - try multiple methods
  let odometer = await findLabelValue("Odometer");
  if (!odometer || odometer === "Not available" || odometer.trim() === "") {
    // Try alternate labels
    odometer = await findLabelValue("Actual");
    if (!odometer || odometer === "Not available" || odometer.trim() === "") {
      // Try direct selector
      const odomEl = document.querySelector('[data-uname*="odometer"], [class*="odometer"]');
      odometer = odomEl?.innerText?.trim() || "N/A";
    }
  }
  
  // Clean up odometer value
  if (odometer && odometer !== "N/A" && odometer !== "Not available") {
    odometer = odometer.replace(/[^0-9,\s]/g, '').trim();
    if (odometer) odometer = odometer + " mi";
  } else {
    odometer = "N/A";
  }

  console.log('Odometer:', odometer);

  // Damage - try multiple methods
  let damage = await findLabelValue("Primary Damage");
  if (!damage || damage === "Not available" || damage.trim() === "") {
    damage = await findLabelValue("Damage Type");
    if (!damage || damage === "Not available" || damage.trim() === "") {
      damage = await findLabelValue("Damage");
      if (!damage || damage === "Not available" || damage.trim() === "") {
        // Try direct selector
        const damageEl = document.querySelector('[data-uname*="damage"], [class*="damage"]');
        damage = damageEl?.innerText?.trim() || "Unknown";
      }
    }
  }

  // Clean up damage
  if (damage === "Not available" || damage.trim() === "") {
    damage = "Unknown";
  }

  console.log('Damage:', damage);

  // Bids
  const currentBid = await scrapeCopartBid();
  const buyItNow = await scrapeCopartBuyNow();

  console.log('Current Bid:', currentBid);
  console.log('Buy Now:', buyItNow);

  // Lot number
  const lotNumber = await findLabelValue("Lot") || 
                    window.location.pathname.split('/').pop() || 
                    'Unknown';

  return {
    title,
    year,
    make,
    model,
    odometer,
    damage,
    currentBid,
    buyItNow,
    lotNumber,
    baseWeight,  // From Copart technical specs
    source: 'Copart'
  };
}

async function scrapeCopartBid() {
  console.log('🔍 Scraping Copart bid...');
  
  // Wait up to 3 seconds for bid to appear
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Method 1: Try specific data attributes
    const selectors = [
      '[data-uname="lotdetailCurrentbidvalue"]',
      '.lot-details-value[data-uname="lotdetailCurrentbidvalue"]'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText?.trim();
        if (text && text.includes('$')) {
          console.log(`✓ Found bid: ${text} (selector: ${sel})`);
          return text;
        }
      }
    }
    
    // Method 2: Find "Current bid" text, then get next sibling with dollar sign
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim().toLowerCase();
      if (text === 'current bid' || text === 'currentbid') {
        console.log('Found "Current bid" label');
        
        // Check parent's next sibling
        let sibling = node.parentElement?.nextElementSibling;
        let attempts = 0;
        while (sibling && attempts < 5) {
          const siblingText = sibling.innerText?.trim();
          console.log(`Checking sibling ${attempts}: "${siblingText}"`);
          
          if (siblingText && siblingText.includes('$') && siblingText.length < 15) {
            console.log(`✓ Found bid near label: ${siblingText}`);
            return siblingText;
          }
          
          // Also check children
          const child = sibling.querySelector('*');
          if (child) {
            const childText = child.innerText?.trim();
            if (childText && childText.includes('$') && childText.length < 15) {
              console.log(`✓ Found bid in child: ${childText}`);
              return childText;
            }
          }
          
          sibling = sibling.nextElementSibling;
          attempts++;
        }
        
        // Also check parent's parent's siblings (sometimes nested deeper)
        let parentSibling = node.parentElement?.parentElement?.nextElementSibling;
        attempts = 0;
        while (parentSibling && attempts < 3) {
          const text = parentSibling.innerText?.trim();
          if (text && text.includes('$') && text.length < 15 && !text.toLowerCase().includes('bid')) {
            console.log(`✓ Found bid in parent sibling: ${text}`);
            return text;
          }
          parentSibling = parentSibling.nextElementSibling;
          attempts++;
        }
      }
    }
    
    // Wait 100ms and try again
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('⚠️ No bid found, defaulting to $0');
  return "$0";
}

async function scrapeCopartBuyNow() {
  console.log('🔍 Scraping Copart Buy Now...');
  
  const selectors = [
    '[data-uname="lotdetailBuynowtag"]',
    '.lot-details-value[data-uname="lotdetailBuynowtag"]',
    '.buy-now-price',
    '.buy-now-value',
    '[class*="buynow" i]',
    '[class*="buy-now" i]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText?.trim();
      if (text && text !== '-' && text !== '' && text.includes('$')) {
        console.log(`✓ Found Buy Now: ${text}`);
        return text;
      }
    }
  }

  const buyByLabel = await findLabelValue("Buy It Now");
  if (buyByLabel && buyByLabel !== "Not available" && buyByLabel.includes('$')) {
    console.log(`✓ Found Buy Now by label: ${buyByLabel}`);
    return buyByLabel;
  }

  console.log('⚠️ No Buy Now price found');
  return "";
}

// =============================
// IAAI SCRAPER
// =============================
async function scrapeIAAI() {
  console.log('📋 Scraping IAAI...');
  
  // Title - IAAI uses different structure
  let title, year, make, model;
  
  // Try stock card title
  const titleEl = document.querySelector('.stock-card-title, .vehicle-name, h1');
  if (titleEl) {
    title = titleEl.innerText?.trim() || "Unknown Vehicle";
    const parts = title.split(" ");
    year = parts[0] || "Unknown";
    make = parts[1] || "Unknown";
    model = parts.slice(2).join(" ") || "Unknown";
  } else {
    // Try individual fields
    year = await findLabelValue("Year") || "Unknown";
    make = await findLabelValue("Make") || "Unknown";
    model = await findLabelValue("Model") || "Unknown";
    title = `${year} ${make} ${model}`;
  }

  // Odometer - try multiple methods
  let odometer = await findLabelValue("Odometer");
  if (!odometer || odometer === "Not available" || odometer.trim() === "") {
    odometer = await findLabelValue("Mileage");
    if (!odometer || odometer === "Not available" || odometer.trim() === "") {
      const odomEl = document.querySelector('[data-uname*="odometer"], [class*="mileage"], [class*="odometer"]');
      odometer = odomEl?.innerText?.trim() || "N/A";
    }
  }
  
  // Clean up odometer
  if (odometer && odometer !== "N/A" && odometer !== "Not available") {
    odometer = odometer.replace(/[^0-9,\s]/g, '').trim();
    if (odometer) odometer = odometer + " mi";
  } else {
    odometer = "N/A";
  }

  console.log('Odometer:', odometer);

  // Damage - try multiple methods
  let damage = await findLabelValue("Primary Damage");
  if (!damage || damage === "Not available" || damage.trim() === "") {
    damage = await findLabelValue("Loss Type");
    if (!damage || damage === "Not available" || damage.trim() === "") {
      damage = await findLabelValue("Damage");
      if (!damage || damage === "Not available" || damage.trim() === "") {
        const damageEl = document.querySelector('[class*="damage"], [class*="loss-type"]');
        damage = damageEl?.innerText?.trim() || "Unknown";
      }
    }
  }
  
  // Clean up damage
  if (damage === "Not available" || damage.trim() === "") {
    damage = "Unknown";
  }

  console.log('Damage:', damage);

  // Bids
  const currentBid = await scrapeIAAIBid();
  const buyItNow = await scrapeIAAIBuyNow();

  // Lot number - IAAI uses stock number
  const lotNumber = await findLabelValue("Stock") || 
                    await findLabelValue("Stock Number") ||
                    window.location.pathname.split('/').pop() || 
                    'Unknown';

  return {
    title,
    year,
    make,
    model,
    odometer,
    damage,
    currentBid,
    buyItNow,
    lotNumber,
    source: 'IAAI'
  };
}

async function scrapeIAAIBid() {
  // IAAI bid selectors
  const selectors = [
    '.current-bid-amount',
    '.bid-amount',
    '[class*="currentBid"]',
    '[class*="bid-price"]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText?.trim();
      if (text && text.includes('$')) return text;
    }
  }

  const bidText = await findLabelValue("Current Bid");
  if (bidText && bidText !== "Not available") {
    return bidText;
  }

  return "$0";
}

async function scrapeIAAIBuyNow() {
  const selectors = [
    '.buy-now-price',
    '.buynow-amount',
    '[class*="buyNow"]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText?.trim();
      if (text && text.includes('$')) return text;
    }
  }

  const buyText = await findLabelValue("Buy Now");
  if (buyText && buyText !== "Not available") {
    return buyText;
  }

  return "";
}

// =============================
// SHARED HELPER
// =============================
async function findLabelValue(label, timeout = 8000) {
  const normalize = s => s?.replace(/\s+/g, " ").trim().toLowerCase();
  const start = Date.now();

  const poll = async () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    
    while (node = walker.nextNode()) {
      if (normalize(node.nodeValue).startsWith(normalize(label))) {
        // Try same text node - remove label and clean up
        let val = node.nodeValue.trim().replace(new RegExp(label + "\\s*:?\\s*", "i"), "").trim();
        // Remove any remaining colons at the start
        val = val.replace(/^:\s*/, "").trim();
        if (val && val !== ":" && val.length > 0) return val;

        // Try next siblings
        let sibling = node.parentElement?.nextElementSibling;
        while (sibling) {
          const text = sibling.innerText?.trim();
          // Clean up text - remove colons
          const cleanText = text?.replace(/^:\s*/, "").trim();
          if (cleanText && cleanText !== ":" && cleanText.length > 0 && !cleanText.match(/^[:\s]*$/)) {
            return cleanText;
          }
          
          const nested = sibling.querySelector("*")?.innerText?.trim();
          const cleanNested = nested?.replace(/^:\s*/, "").trim();
          if (cleanNested && cleanNested !== ":" && cleanNested.length > 0) {
            return cleanNested;
          }
          
          sibling = sibling.nextElementSibling;
        }
      }
    }

    if (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, 100));
      return poll();
    }
    
    return "Not available";
  };

  return poll();
}