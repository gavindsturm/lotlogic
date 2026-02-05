export async function generateProfessionalPDF(lotData, scrapData, metals, settings) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library not loaded. Please try again.');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = 7;
  
  let y = margin;
  
  const addLine = (spaces = 1) => {
    y += lineHeight * spaces;
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };
  
  // HEADER
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text('LOTLOGIC', pageWidth / 2, y, { align: 'center' });
  addLine(1.5);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Vehicle Scrap Value Analysis Report', pageWidth / 2, y, { align: 'center' });
  addLine(2);
  
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, y, pageWidth - margin, y);
  addLine(2);
  
  // VEHICLE INFORMATION
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text('Vehicle Information', margin, y);
  addLine(1.5);
  
  pdf.setFontSize(10);
  
  const vehicleInfo = [
    ['Vehicle', lotData.title || `${lotData.year} ${lotData.make} ${lotData.model}`],
    ['Year', lotData.year || 'N/A'],
    ['Make', lotData.make || 'N/A'],
    ['Model', lotData.model || 'N/A'],
    ['Weight', `${lotData.weight || 3500} lbs`],
    ['Type', lotData.vehicleType || 'Midsize Cars'],
    ['Odometer', lotData.odometer || 'N/A'],
    ['Damage', lotData.damage || 'N/A'],
    ['Bid', lotData.currentBid || '$0']
  ];
  
  vehicleInfo.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 114, 128);
    pdf.text(label + ':', margin + 5, y);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(17, 24, 39);
    pdf.text(String(value).substring(0, 60), margin + 45, y);
    addLine();
  });
  
  addLine(1);
  
  // SCRAP VALUE BREAKDOWN
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Scrap Value Breakdown', margin, y);
  addLine(1.5);
  
  pdf.setFontSize(12);
  pdf.text('Base Metals', margin + 5, y);
  addLine(1);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const baseMetals = [
    ['Steel', scrapData.breakdown.steel],
    ['Aluminum', scrapData.breakdown.aluminum],
    ['Copper', scrapData.breakdown.copper],
    ['Stainless Steel', scrapData.breakdown.stainlessSteel],
    ['Brass', scrapData.breakdown.brass],
    ['Lead (Battery)', scrapData.breakdown.lead]
  ];
  
  baseMetals.forEach(([metal, value]) => {
    pdf.text(metal, margin + 10, y);
    pdf.text(`$${value}`, pageWidth - margin - 10, y, { align: 'right' });
    addLine();
  });
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Base Total', margin + 10, y);
  pdf.text(`$${scrapData.baseMetalsTotal}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine(2);
  
  // Precious Metals
  pdf.setFillColor(254, 243, 199);
  pdf.rect(margin, y - 3, contentWidth, 35, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(146, 64, 14);
  pdf.text('Precious Metals (Catalytic Converter)', margin + 5, y);
  addLine(1);
  
  pdf.setFontSize(10);
  pdf.setTextColor(17, 24, 39);
  
  const preciousMetals = [
    ['Platinum', scrapData.breakdown.platinum],
    ['Palladium', scrapData.breakdown.palladium],
    ['Rhodium', scrapData.breakdown.rhodium]
  ];
  
  preciousMetals.forEach(([metal, value]) => {
    pdf.text(metal, margin + 10, y);
    pdf.text(`$${value}`, pageWidth - margin - 10, y, { align: 'right' });
    addLine();
  });
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(146, 64, 14);
  pdf.text('Precious Total', margin + 10, y);
  pdf.text(`$${scrapData.preciousMetalsTotal}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine(2);
  
  // TOTAL
  pdf.setFillColor(17, 24, 39);
  pdf.rect(margin, y - 3, contentWidth, 10, 'F');
  
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL SCRAP VALUE', margin + 5, y + 3);
  pdf.text(`$${scrapData.grandTotal}`, pageWidth - margin - 5, y + 3, { align: 'right' });
  addLine(3);
  
  // PROFIT ANALYSIS
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text('Profit Analysis', margin, y);
  addLine(1.5);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const fees = settings?.fees || 180;
  const transport = settings?.transportCost || 100;
  const currentBid = parseInt(String(lotData.currentBid || "0").replace(/[^0-9]/g, "")) || 0;
  const profit = scrapData.grandTotal - fees - transport - currentBid;
  
  pdf.text('Scrap Value', margin + 10, y);
  pdf.text(`$${scrapData.grandTotal}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine();
  
  pdf.text('Copart Fees', margin + 10, y);
  pdf.text(`-$${fees}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine();
  
  pdf.text('Transport', margin + 10, y);
  pdf.text(`-$${transport}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine();
  
  pdf.text('Current Bid', margin + 10, y);
  pdf.text(`-$${currentBid}`, pageWidth - margin - 10, y, { align: 'right' });
  addLine(0.5);
  
  pdf.setDrawColor(17, 24, 39);
  pdf.line(margin + 10, y, pageWidth - margin - 10, y);
  addLine(1);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  if (profit >= 0) {
    pdf.setTextColor(22, 163, 74);
    pdf.text('PROFIT', margin + 10, y);
    pdf.text(`$${profit}`, pageWidth - margin - 10, y, { align: 'right' });
  } else {
    pdf.setTextColor(220, 38, 38);
    pdf.text('LOSS', margin + 10, y);
    pdf.text(`-$${Math.abs(profit)}`, pageWidth - margin - 10, y, { align: 'right' });
  }
  addLine(2);
  
  // METAL PRICES
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text('Current Metal Prices', margin, y);
  addLine(1);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  
  const prices = [
    `Steel: $${metals.steel}/lb`,
    `Aluminum: $${metals.aluminum}/lb`,
    `Copper: $${metals.copper}/lb`,
    `Stainless: $${metals.stainlessSteel}/lb`,
    `Brass: $${metals.brass}/lb`,
    `Lead: $${metals.lead}/lb`,
    `Platinum: $${metals.platinum}/oz`,
    `Palladium: $${metals.palladium}/oz`,
    `Rhodium: $${metals.rhodium}/oz`
  ];
  
  prices.forEach((price, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    pdf.text(price, margin + 5 + (col * 60), y + (row * 5));
  });
  
  addLine(3);
  
  if (metals.lastUpdated) {
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Updated: ${new Date(metals.lastUpdated).toLocaleString()}`, margin + 5, y);
  }
  
  // FOOTER
  pdf.setFontSize(9);
  pdf.setTextColor(156, 163, 175);
  pdf.text(`Generated by LOTLOGIC  •  ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // SAVE
  const filename = `LOTLOGIC_${lotData.year}_${lotData.make}_${lotData.model}.pdf`;
  pdf.save(filename);
}