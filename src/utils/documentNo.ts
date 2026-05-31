import { Sale, Transaction } from '../types';

/**
 * Generates a sequential document number based on the document type and current date.
 * Formats:
 * - Sale Invoice: SALE-YYYYMMDD-001
 * - Udhaar Slip: UDH-YYYYMMDD-001
 * - Payment Receipt: PAY-YYYYMMDD-001
 */
export const generateDocumentNumber = (
  type: 'sale_invoice' | 'udhaar_slip' | 'payment_receipt',
  sales: Sale[],
  transactions: Transaction[]
): string => {
  const dateObj = new Date();
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const prefixInput = `${yyyy}${mm}${dd}`;

  let prefix = '';
  if (type === 'sale_invoice') {
    prefix = `SALE-${prefixInput}-`;
  } else if (type === 'udhaar_slip') {
    prefix = `UDH-${prefixInput}-`;
  } else if (type === 'payment_receipt') {
    prefix = `PAY-${prefixInput}-`;
  }

  // Collect already of-record numbers from existing state to guarantee uniqueness
  const usedNumbers = new Set<string>();
  
  if (sales) {
    sales.forEach(s => {
      if (s.invoiceNumber && s.invoiceNumber.startsWith(prefix)) {
        usedNumbers.add(s.invoiceNumber);
      }
    });
  }
  
  if (transactions) {
    transactions.forEach(t => {
      if (t.slipNumber && t.slipNumber.startsWith(prefix)) {
        usedNumbers.add(t.slipNumber);
      }
      if (t.receiptNumber && t.receiptNumber.startsWith(prefix)) {
        usedNumbers.add(t.receiptNumber);
      }
    });
  }

  // Load persistent session counters
  let counters: Record<string, number> = {};
  try {
    const item = localStorage.getItem('smartudhaar_doc_counters');
    if (item) {
      counters = JSON.parse(item);
    }
  } catch (e) {
    // Ignore fail
  }

  const key = `${type}_${prefixInput}`;
  let currentCounter = counters[key] || 0;

  let nextVal = currentCounter + 1;
  let formatted = `${prefix}${String(nextVal).padStart(3, '0')}`;

  // Loop if already used (e.g. state has newer numbers or reset occurred)
  while (usedNumbers.has(formatted)) {
    nextVal++;
    formatted = `${prefix}${String(nextVal).padStart(3, '0')}`;
  }

  // Save updated counter
  counters[key] = nextVal;
  try {
    localStorage.setItem('smartudhaar_doc_counters', JSON.stringify(counters));
  } catch (e) {
    // Ignore fail
  }

  return formatted;
};
