import { Transaction } from '../types';
import { formatDateTime, formatCurrency } from '../utils/pricing';
import { getPaymentMethodDisplayName } from '../utils/razorpay';
import jsPDF from 'jspdf';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  if (!transaction) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text('ParkDesk', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Parking Receipt', 105, 30, { align: 'center' });
    
    // Add divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    // Add transaction details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    let yPos = 45;
    const leftMargin = 30;
    const rightMargin = 120;
    
    // Transaction ID
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction ID:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.id, rightMargin, yPos);
    yPos += 10;
    
    // Vehicle Number
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Number:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.plate, rightMargin, yPos);
    yPos += 10;
    
    // Spot
    doc.setFont('helvetica', 'bold');
    doc.text('Parking Spot:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.spotId, rightMargin, yPos);
    yPos += 10;
    
    // Spot Type
    doc.setFont('helvetica', 'bold');
    doc.text('Spot Type:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.spotType.toUpperCase(), rightMargin, yPos);
    yPos += 10;
    
    // Check-in Time
    doc.setFont('helvetica', 'bold');
    doc.text('Check-in Time:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTime(transaction.checkInTime), rightMargin, yPos);
    yPos += 10;
    
    // Check-out Time
    doc.setFont('helvetica', 'bold');
    doc.text('Check-out Time:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateTime(transaction.checkOutTime), rightMargin, yPos);
    yPos += 10;
    
    // Duration
    doc.setFont('helvetica', 'bold');
    doc.text('Duration:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${transaction.durationHours} hour${transaction.durationHours !== 1 ? 's' : ''}`, rightMargin, yPos);
    yPos += 15;
    
    // Add divider
    doc.line(20, yPos - 5, 190, yPos - 5);
    
    // Payment Information
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', leftMargin, yPos);
    yPos += 10;
    
    // Payment Method
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(
      transaction.paymentMethod ? getPaymentMethodDisplayName(transaction.paymentMethod) : 'N/A',
      rightMargin,
      yPos
    );
    yPos += 10;
    
    // Payment ID
    if (transaction.paymentId) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment ID:', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(transaction.paymentId, rightMargin, yPos);
      yPos += 10;
    }
    
    // Payment Status
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status:', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 197, 94); // Green color
    doc.text(transaction.paymentStatus?.toUpperCase() || 'SUCCESS', rightMargin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
    
    // Payment Timestamp
    if (transaction.paymentTimestamp) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Time:', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDateTime(transaction.paymentTimestamp), rightMargin, yPos);
      yPos += 15;
    }
    
    // Add divider
    doc.line(20, yPos - 5, 190, yPos - 5);
    
    // Total Amount
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', leftMargin, yPos);
    doc.setTextColor(34, 197, 94); // Green color
    doc.text(formatCurrency(transaction.fee), rightMargin, yPos);
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for parking with ParkDesk!', 105, 270, { align: 'center' });
    doc.text(`Generated on: ${formatDateTime(new Date())}`, 105, 275, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${transaction.id}.pdf`);
  };

  const handlePrint = () => {
    // Create a printable receipt
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parking Receipt - ${transaction.id}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 400px;
            margin: 20px auto;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .label {
            color: #666;
          }
          .value {
            font-weight: 600;
            color: #333;
          }
          .divider {
            border-top: 1px dashed #ccc;
            margin: 15px 0;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            color: #22C55E;
            text-align: right;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #999;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ParkDesk</h1>
          <p>Parking Receipt</p>
        </div>
        
        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="row">
            <span class="label">Transaction ID:</span>
            <span class="value">${transaction.id}</span>
          </div>
          <div class="row">
            <span class="label">Vehicle Number:</span>
            <span class="value">${transaction.plate}</span>
          </div>
          <div class="row">
            <span class="label">Parking Spot:</span>
            <span class="value">${transaction.spotId}</span>
          </div>
          <div class="row">
            <span class="label">Spot Type:</span>
            <span class="value">${transaction.spotType.toUpperCase()}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="section-title">Parking Duration</div>
          <div class="row">
            <span class="label">Check-in:</span>
            <span class="value">${formatDateTime(transaction.checkInTime)}</span>
          </div>
          <div class="row">
            <span class="label">Check-out:</span>
            <span class="value">${formatDateTime(transaction.checkOutTime)}</span>
          </div>
          <div class="row">
            <span class="label">Duration:</span>
            <span class="value">${transaction.durationHours} hour${transaction.durationHours !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${transaction.paymentMethod ? getPaymentMethodDisplayName(transaction.paymentMethod) : 'N/A'}</span>
          </div>
          ${transaction.paymentId ? `
          <div class="row">
            <span class="label">Payment ID:</span>
            <span class="value">${transaction.paymentId}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">Status:</span>
            <span class="value" style="color: #22C55E;">${transaction.paymentStatus?.toUpperCase() || 'SUCCESS'}</span>
          </div>
          ${transaction.paymentTimestamp ? `
          <div class="row">
            <span class="label">Payment Time:</span>
            <span class="value">${formatDateTime(transaction.paymentTimestamp)}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="total">
          Total: ${formatCurrency(transaction.fee)}
        </div>
        
        <div class="footer">
          <p>Thank you for parking with ParkDesk!</p>
          <p>Generated on: ${formatDateTime(new Date())}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-indigo-100 mt-1">Your parking receipt is ready</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          {/* Transaction Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">📋</span>
              Transaction Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono font-semibold text-gray-900">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle Number:</span>
                <span className="font-mono font-bold text-gray-900">{transaction.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parking Spot:</span>
                <span className="font-semibold text-gray-900">{transaction.spotId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spot Type:</span>
                <span className="font-semibold text-gray-900">{transaction.spotType.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Parking Duration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">⏱️</span>
              Parking Duration
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-semibold text-gray-900">{formatDateTime(transaction.checkInTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-semibold text-gray-900">{formatDateTime(transaction.checkOutTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">
                  {transaction.durationHours} hour{transaction.durationHours !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">💳</span>
              Payment Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-gray-900">
                  {transaction.paymentMethod ? getPaymentMethodDisplayName(transaction.paymentMethod) : 'N/A'}
                </span>
              </div>
              {transaction.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-sm text-gray-900">{transaction.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">
                  {transaction.paymentStatus?.toUpperCase() || 'SUCCESS'}
                </span>
              </div>
              {transaction.paymentTimestamp && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Time:</span>
                  <span className="font-semibold text-gray-900">{formatDateTime(transaction.paymentTimestamp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t-2 border-indigo-200 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-800">Total Amount:</span>
              <span className="text-3xl font-bold text-green-600">{formatCurrency(transaction.fee)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-3 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
