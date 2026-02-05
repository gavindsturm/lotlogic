/**
 * Terms of Service Agreement
 * Shows once on first use, stores acceptance in chrome.storage
 */

export async function checkTermsAcceptance() {
  const result = await chrome.storage.local.get('termsAccepted');
  return result.termsAccepted === true;
}

export async function acceptTerms() {
  await chrome.storage.local.set({ termsAccepted: true, termsAcceptedDate: new Date().toISOString() });
}

export function showTermsModal(onAccept) {
  const modal = document.createElement('div');
  modal.id = 'terms-modal';
  modal.innerHTML = `
    <div class="terms-overlay"></div>
    <div class="terms-container">
      <div class="terms-header">
        <h2>Terms of Use</h2>
      </div>
      
      <div class="terms-content">
        <p class="terms-intro"><strong>IMPORTANT:</strong> LOTLOGIC provides estimates only. Please read carefully.</p>
        
        <div class="terms-section">
          <h4>Estimates Only</h4>
          <p>Scrap values are estimates. Actual values may differ significantly based on market conditions, location, and vehicle condition.</p>
        </div>
        
        <div class="terms-section">
          <h4>No Guarantees</h4>
          <p>We make no guarantees regarding accuracy of calculations, vehicle specifications, metal prices, or profitability.</p>
        </div>
        
        <div class="terms-section">
          <h4>Not Financial Advice</h4>
          <p>This tool does not provide financial or investment advice. All purchasing decisions are made at your own risk.</p>
        </div>
        
        <div class="terms-section">
          <h4>Third-Party Data</h4>
          <p>Vehicle specifications and metal prices are from third-party sources. We are not responsible for data errors or omissions.</p>
        </div>
        
        <div class="terms-section">
          <h4>Your Responsibility</h4>
          <p>You are solely responsible for verifying information, conducting due diligence, and all financial decisions.</p>
        </div>
        
        <div class="terms-section">
          <h4>Limitation of Liability</h4>
          <p>LOTLOGIC shall not be liable for any damages or losses arising from use of this extension.</p>
        </div>
      </div>
      
      <div class="terms-footer">
        <label class="terms-checkbox">
          <input type="checkbox" id="terms-accept-checkbox">
          <span>I understand and agree to these terms</span>
        </label>
        
        <button id="terms-accept-btn" class="terms-button" disabled>
          Accept and Continue
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const checkbox = document.getElementById('terms-accept-checkbox');
  const acceptBtn = document.getElementById('terms-accept-btn');
  
  checkbox.addEventListener('change', () => {
    acceptBtn.disabled = !checkbox.checked;
  });
  
  acceptBtn.addEventListener('click', async () => {
    if (checkbox.checked) {
      await acceptTerms();
      modal.remove();
      if (onAccept) onAccept();
    }
  });
}

export function createTermsStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #terms-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
    }
    
    .terms-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
    }
    
    .terms-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      display: flex;
      flex-direction: column;
    }
    
    .terms-header {
      padding: 16px;
      border-bottom: 2px solid #e5e7eb;
      background: #f9fafb;
    }
    
    .terms-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    
    .terms-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      font-size: 12px;
    }
    
    .terms-intro {
      margin: 0 0 12px 0;
      padding: 10px;
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      font-size: 11px;
      line-height: 1.5;
      color: #92400e;
    }
    
    .terms-section {
      margin-bottom: 12px;
    }
    
    .terms-section h4 {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .terms-section p {
      margin: 0;
      font-size: 11px;
      line-height: 1.5;
      color: #4b5563;
    }
    
    .terms-footer {
      padding: 12px 16px;
      border-top: 2px solid #e5e7eb;
      background: #f9fafb;
    }
    
    .terms-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      cursor: pointer;
      font-size: 11px;
      color: #374151;
    }
    
    .terms-checkbox input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      flex-shrink: 0;
    }
    
    .terms-button {
      width: 100%;
      padding: 10px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .terms-button:hover:not(:disabled) {
      background: #1d4ed8;
    }
    
    .terms-button:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}