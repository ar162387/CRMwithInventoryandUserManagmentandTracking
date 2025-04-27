/**
 * Format a number as currency
 * @param {number} value - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  // Make sure we're working with a number
  const numValue = Math.round(parseFloat(value || 0));

  // Format with thousand separators
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(numValue);
};

/**
 * Format a date string to a localized date string
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Get payment method display text
 * @param {string} method - The payment method
 * @returns {string} Formatted payment method text
 */
export const getPaymentMethodText = (method) => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'online':
      return 'Online';
    case 'cheque':
      return 'Cheque';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

/**
 * Print invoice in a new window with A5 format
 * @param {Object} invoice - The invoice object to print
 * @param {string} type - The type of invoice: 'customer' or 'vendor'
 */
export const printInvoice = (invoice, type = 'customer') => {
  const isCustomer = type === 'customer';

  // Open a new window or tab with the invoice details for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
            size: A5;
            font-size: 11pt;
          }
          @media print {
            body {
              font-size: 11pt;
            }
            @page {
              size: A5;
              margin: 8mm;
            }
          }
          h1 {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .summary-section {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
          }
          .payment-history {
            flex: 1;
            font-size: 10pt;
          }
          .summary {
            flex: 1;
            border: 1px solid #ddd;
            padding: 8px;
            background-color: #f9f9f9;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #eee;
          }
          .signature-section {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            width: 150px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 4px;
            font-size: 10pt;
          }
          .compact-table th, .compact-table td {
            padding: 4px;
            font-size: 9pt;
          }
          h3 {
            font-size: 12pt;
            margin-bottom: 5px;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <h1>${isCustomer ? 'Customer' : 'Vendor'} Invoice</h1>
            <p>Invoice #: ${invoice.invoiceNumber}</p>
            <p>Date: ${formatDate(invoice.invoiceDate)}</p>
            <p>Due Date: ${formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p><strong>${isCustomer ? 'Customer' : 'Vendor'}:</strong> ${isCustomer ? invoice.customerName : invoice.vendorName}</p>
            ${invoice.brokerName ? `<p><strong>Broker:</strong> ${invoice.brokerName}</p>` : ''}
          </div>
        </div>

        <table class="compact-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Gross Wt</th>
              <th>Net Wt</th>
              <th>Pkg Cost</th>
              <th>Price/kg</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.grossWeight} kg</td>
                <td>${item.netWeight} kg</td>
                <td>${item.packagingCost} PKR</td>
                <td>${isCustomer ? item.sellingPrice : item.purchasePrice} PKR</td>
                <td>${item.totalPrice.toFixed(2)} PKR</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          ${invoice.payments && invoice.payments.length > 0 ? `
            <div class="payment-history">
              <h3>Payment History</h3>
              <table class="compact-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.payments.map(payment => `
                    <tr>
                      <td>${formatDate(payment.paymentDate)}</td>
                      <td>${payment.amount.toFixed(2)} PKR</td>
                      <td>${getPaymentMethodText(payment.paymentMethod)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="summary">
            <h3>Invoice Summary</h3>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${invoice.subtotal?.toFixed(2) || 0} PKR</span>
            </div>
            <div class="summary-row">
              <span>Labour/Transport:</span>
              <span>${invoice.labourTransportCost?.toFixed(2) || 0} PKR</span>
            </div>
            <div class="summary-row">
              <span><strong>Total:</strong></span>
              <span><strong>${invoice.total?.toFixed(2) || 0} PKR</strong></span>
            </div>
            <div class="summary-row">
              <span>Paid Amount:</span>
              <span>${invoice.totalPaidAmount?.toFixed(2) || 0} PKR</span>
            </div>
            <div class="summary-row">
              <span><strong>Remaining Amount:</strong></span>
              <span><strong>${invoice.remainingAmount?.toFixed(2) || 0} PKR</strong></span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature">Authorized Signature</div>
          <div class="signature">Received By</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

/**
 * Print commissioner invoice in a new window with A5 format
 * @param {Object} invoice - The commissioner invoice object to print
 */
export const printCommissionerInvoice = (invoice) => {
  // Open a new window or tab with the invoice details for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  printWindow.document.write(`
    <html>
      <head>
        <title>Commission Sheet ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
            size: A5;
            font-size: 11pt;
          }
          @media print {
            body {
              font-size: 11pt;
            }
            @page {
              size: A5;
              margin: 8mm;
            }
          }
          h1 {
            font-size: 16px;
            margin-bottom: 8px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .summary-section {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
          }
          .summary {
            flex: 1;
            border: 1px solid #ddd;
            padding: 8px;
            background-color: #f9f9f9;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #eee;
          }
          .signature-section {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .signature {
            width: 150px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 4px;
            font-size: 10pt;
          }
          .compact-table th, .compact-table td {
            padding: 4px;
            font-size: 9pt;
          }
          h3 {
            font-size: 12pt;
            margin-bottom: 5px;
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <h1>Commission Sheet</h1>
            <p>Invoice #: ${invoice.invoiceNumber}</p>
            <p>Date: ${formatDate(invoice.invoiceDate)}</p>
          </div>
          <div>
            <p><strong>Commissioner:</strong> ${invoice.commissionerName}</p>
            ${invoice.buyerName ? `<p><strong>Buyer:</strong> ${invoice.buyerName}</p>` : ''}
            ${invoice.customerName ? `<p><strong>Customer:</strong> ${invoice.customerName}</p>` : ''}
          </div>
        </div>

        <table class="compact-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Gross Wt</th>
              <th>Net Wt</th>
              <th>Pkg Cost</th>
              <th>Sale Price/kg</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td>${item.quantity}</td>
                <td>${item.grossWeight} kg</td>
                <td>${item.netWeight} kg</td>
                <td>${item.packagingCost} PKR</td>
                <td>${item.salePrice} PKR</td>
                <td>${item.totalPrice.toFixed(2)} PKR</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary">
            <h3>Commission Summary</h3>
            <div class="summary-row">
              <span>Total Amount:</span>
              <span>${invoice.total.toFixed(2)} PKR</span>
            </div>
            <div class="summary-row">
              <span>Commission Percentage:</span>
              <span>${invoice.commissionerPercentage}%</span>
            </div>
            <div class="summary-row">
              <span><strong>Commission Amount:</strong></span>
              <span><strong>${invoice.commissionerAmount.toFixed(2)} PKR</strong></span>
            </div>
            <div class="summary-row">
              <span>Paid Amount:</span>
              <span>${invoice.paidAmount.toFixed(2)} PKR</span>
            </div>
            <div class="summary-row">
              <span><strong>Remaining Amount:</strong></span>
              <span><strong>${invoice.remainingAmount.toFixed(2)} PKR</strong></span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature">Authorized Signature</div>
          <div class="signature">Commissioner Signature</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}; 