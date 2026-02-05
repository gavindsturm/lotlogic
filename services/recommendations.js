/**
 * Returns the recommendation text and meter details based on profit.
 * @param {number} profit - Estimated profit in dollars
 * @returns {object} { recommendation, meterPercent, meterColor }
 */
export function getBuyRecommendation(profit) {
  let recommendation = "Break-even";
  let meterPercent = 50; // neutral
  let meterColor = "#facc15"; // yellow

  if (profit < 0) {
    meterPercent = Math.max(0, 50 + (profit / 1000) * 50); // scale negative
    meterColor = "#dc2626"; // red
    recommendation = "Bad Buy";
  } else if (profit > 0) {
    meterPercent = Math.min(100, 50 + (profit / 1000) * 50); // scale positive
    meterColor = "#16a34a"; // green
    recommendation = "Good Buy";
  }

  return { recommendation, meterPercent, meterColor };
}

/**
 * Calculate optimal bidding range
 * @param {number} scrapValue - Total scrap value
 * @param {number} fees - Copart fees
 * @param {number} transport - Transport cost
 * @param {number} targetProfit - Desired minimum profit (default: $500)
 * @returns {object} Bidding guidance
 */
export function getBiddingGuidance(scrapValue, fees, transport, targetProfit = 500) {
  // Calculate costs
  const totalCosts = fees + transport;
  
  // Calculate maximum bid for different profit targets
  const maxBidBreakEven = scrapValue - totalCosts;
  const maxBidMinProfit = scrapValue - totalCosts - targetProfit;
  const maxBidGoodProfit = scrapValue - totalCosts - (targetProfit * 2);
  
  // Check if lot is unprofitable
  if (maxBidBreakEven <= 0) {
    return {
      unprofitable: true,
      scrapValue,
      totalCosts,
      deficit: Math.abs(maxBidBreakEven),
      message: `This lot cannot be profitable. Scrap value ($${scrapValue}) is less than costs ($${totalCosts}).`,
      maxBidBreakEven: 0,
      maxBidMinProfit: 0,
      maxBidGoodProfit: 0,
      targetProfit
    };
  }
  
  // Check if target profit is unrealistic for this vehicle
  const maxPossibleProfit = maxBidBreakEven; // profit at $0 bid
  const targetTooHigh = targetProfit > maxPossibleProfit;
  
  if (targetTooHigh) {
    // Adjust to realistic targets based on actual value
    const realisticTarget = Math.floor(maxPossibleProfit * 0.5); // 50% of max
    const conservativeTarget = Math.floor(maxPossibleProfit * 0.25); // 25% of max
    
    return {
      targetTooHigh: true,
      requestedProfit: targetProfit,
      maxPossibleProfit,
      scrapValue,
      totalCosts,
      message: `Your target profit ($${targetProfit}) exceeds what this vehicle can generate. Maximum possible profit is $${maxPossibleProfit} (at $0 bid).`,
      suggestion: `For this vehicle, realistic targets are $${conservativeTarget}-$${realisticTarget}.`,
      // Use realistic values for guidance
      maxBidBreakEven: Math.round(maxBidBreakEven),
      maxBidMinProfit: Math.max(0, Math.round(scrapValue - totalCosts - realisticTarget)),
      maxBidGoodProfit: Math.max(0, Math.round(scrapValue - totalCosts - (realisticTarget * 1.5))),
      targetProfit: realisticTarget,
      adjustedTarget: true
    };
  }
  
  // Normal case - target is achievable
  // Determine bidding zones
  const zones = {
    // Excellent zone: High profit potential
    excellent: {
      max: Math.max(0, maxBidGoodProfit),
      profit: targetProfit * 2,
      description: "Excellent deal",
      color: "#16a34a" // green
    },
    
    // Good zone: Decent profit
    good: {
      min: Math.max(0, maxBidGoodProfit),
      max: Math.max(0, maxBidMinProfit),
      profit: targetProfit,
      description: "Good deal",
      color: "#16a34a" // green
    },
    
    // Acceptable zone: Minimal profit
    acceptable: {
      min: Math.max(0, maxBidMinProfit),
      max: Math.max(0, maxBidBreakEven - 100), // Leave $100 buffer
      profit: 100,
      description: "Marginal",
      color: "#facc15" // yellow
    },
    
    // Caution zone: Very low or no profit
    caution: {
      min: Math.max(0, maxBidBreakEven - 100),
      max: Math.max(0, maxBidBreakEven),
      profit: 0,
      description: "Break-even risk",
      color: "#f97316" // orange
    },
    
    // Avoid zone: Loss
    avoid: {
      min: Math.max(0, maxBidBreakEven),
      description: "Likely loss",
      color: "#dc2626" // red
    }
  };
  
  return {
    maxBidBreakEven: Math.round(maxBidBreakEven),
    maxBidMinProfit: Math.round(maxBidMinProfit),
    maxBidGoodProfit: Math.round(maxBidGoodProfit),
    zones,
    targetProfit
  };
}

/**
 * Get current bid status and recommendation
 * @param {number} currentBid - Current bid amount
 * @param {object} guidance - Bidding guidance from getBiddingGuidance
 * @returns {object} Current status
 */
export function getCurrentBidStatus(currentBid, guidance) {
  const { zones } = guidance;
  
  let status = "Unknown";
  let statusColor = "#6b7280";
  let shouldBid = false;
  let message = "";
  
  // Handle cases where guidance values are negative/unrealistic
  const maxRecommended = Math.max(0, guidance.maxBidMinProfit > 0 ? guidance.maxBidMinProfit : Math.round(guidance.maxBidBreakEven * 0.6));
  
  if (currentBid === 0) {
    if (guidance.maxBidBreakEven > 0) {
      status = "No Bids Yet";
      statusColor = "#16a34a";
      shouldBid = true;
      message = `Good opportunity to bid on this lot.`;
    } else {
      status = "Not Profitable";
      statusColor = "#dc2626";
      shouldBid = false;
      message = `This lot cannot be profitable at any bid amount.`;
    }
  } else if (currentBid <= zones.excellent.max && zones.excellent.max > 0) {
    status = "Excellent Zone";
    statusColor = zones.excellent.color;
    shouldBid = true;
    message = `Strong buy! Current bid is in excellent range.`;
  } else if (currentBid <= zones.good.max && zones.good.max > 0) {
    status = "Good Zone";
    statusColor = zones.good.color;
    shouldBid = true;
    message = `Good opportunity. Stay below $${maxRecommended} for target profit.`;
  } else if (currentBid <= zones.acceptable.max) {
    status = "Marginal Zone";
    statusColor = zones.acceptable.color;
    shouldBid = true;
    message = `Low profit margin. Consider stopping at $${Math.round(guidance.maxBidBreakEven * 0.8)}.`;
  } else if (currentBid < guidance.maxBidBreakEven) {
    status = "Caution Zone";
    statusColor = "#f97316";
    shouldBid = false;
    message = `High risk! Approaching break-even at $${guidance.maxBidBreakEven}. Not recommended.`;
  } else {
    status = "Avoid Zone";
    statusColor = zones.avoid.color;
    shouldBid = false;
    message = `DO NOT BID. Current bid exceeds break-even. You will lose money.`;
  }
  
  return {
    status,
    statusColor,
    shouldBid,
    message
  };
}