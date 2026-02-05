export function calculateScrapValue(weight, composition, metals) {
  const steelVal = Math.round(weight * composition.steel * metals.steel);
  const aluminumVal = Math.round(weight * composition.aluminum * metals.aluminum);
  const copperVal = Math.round(weight * composition.copper * metals.copper);
  return steelVal + aluminumVal + copperVal;
}

export function calculateProfit(scrapValue, fees, transport, currentBid) {
  return scrapValue - fees - transport - currentBid;
}
