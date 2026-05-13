import { Customer, Transaction, Sale, Invoice, InventoryItem, StockMovement, Supplier, SupplierTransaction } from '../types';
import { formatCurrency } from '.';

// Generic download helper
export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob(type === 'text/csv;charset=utf-8;' ? [new Uint8Array([0xEF, 0xBB, 0xBF]), content] : [content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Full JSON Backup
export function exportFullBackup(state: any) {
  const backup = {
    app: 'SmartUdhaar AI',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      user: state.user,
      customers: state.customers || [],
      transactions: state.transactions || [],
      sales: state.sales || [],
      invoices: state.invoices || [],
      inventory: state.inventory || [],
      stockMovements: state.stockMovements || [],
      suppliers: state.suppliers || [],
      supplierTransactions: state.supplierTransactions || []
    }
  };

  const content = JSON.stringify(backup, null, 2);
  const dateStr = new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').slice(0, 16);
  downloadFile(`smartudhaar-backup-${dateStr}.json`, content, 'application/json');
  return backup;
}

// Backup validation
export function validateBackup(jsonData: any) {
  const result: { valid: boolean; summary: any; errors: string[]; warnings: string[] } = {
    valid: true,
    summary: {},
    errors: [],
    warnings: []
  };

  try {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON format.');
    }

    if (jsonData.app !== 'SmartUdhaar AI' && jsonData.app !== 'SmartUdhaar') {
      result.errors.push('Not a valid SmartUdhaar backup file.');
      result.valid = false;
      return result;
    }

    const data = jsonData.data;
    if (!data || typeof data !== 'object') {
      result.errors.push('Missing "data" object in backup.');
      result.valid = false;
      return result;
    }

    // Extract lists
    const customers: Customer[] = Array.isArray(data.customers) ? data.customers : [];
    const transactions: Transaction[] = Array.isArray(data.transactions) ? data.transactions : [];
    const sales: Sale[] = Array.isArray(data.sales) ? data.sales : [];
    const invoices: Invoice[] = Array.isArray(data.invoices) ? data.invoices : [];
    const inventory: InventoryItem[] = Array.isArray(data.inventory) ? data.inventory : [];
    const stockMovements: StockMovement[] = Array.isArray(data.stockMovements) ? data.stockMovements : [];
    const suppliers: Supplier[] = Array.isArray(data.suppliers) ? data.suppliers : [];
    const supplierTransactions: SupplierTransaction[] = Array.isArray(data.supplierTransactions) ? data.supplierTransactions : [];

    result.summary = {
      customers: customers.length,
      transactions: transactions.length,
      sales: sales.length,
      invoices: invoices.length,
      inventory: inventory.length,
      suppliers: suppliers.length,
      supplierTransactions: supplierTransactions.length,
      exportedAt: jsonData.exportedAt || 'Unknown'
    };

    // ID Uniqueness & Money checks
    const checkUniqueness = (items: any[], type: string) => {
      const ids = new Set();
      for (const item of items) {
        if (!item.id) {
          result.errors.push(`A ${type} is missing an ID.`);
          result.valid = false;
        } else if (ids.has(item.id)) {
          result.errors.push(`Duplicate ID found in ${type}: ${item.id}`);
          result.valid = false;
        }
        ids.add(item.id);
      }
    };

    checkUniqueness(customers, 'customers');
    checkUniqueness(transactions, 'transactions');
    checkUniqueness(sales, 'sales');
    checkUniqueness(invoices, 'invoices');
    checkUniqueness(inventory, 'inventory');
    checkUniqueness(stockMovements, 'stockMovements');
    checkUniqueness(suppliers, 'suppliers');
    checkUniqueness(supplierTransactions, 'supplierTransactions');

    // Inventory checks
    const inventoryIds = new Set(inventory.map((i: any) => i.id));
    for (const item of inventory) {
      if (item.stockQty < 0) {
        result.errors.push(`Item ${item.name} has negative stock.`);
        result.valid = false;
      }
      if (!Number.isInteger(item.purchasePricePaise) || !Number.isInteger(item.sellingPricePaise)) {
        result.errors.push(`Item ${item.name} has non-integer money values.`);
        result.valid = false;
      }
    }

    // Transactions checks
    const customerIds = new Set(customers.map((c: any) => c.id));
    for (const tx of transactions) {
      if (tx.customerId && !customerIds.has(tx.customerId)) {
        result.errors.push(`Transaction ${tx.id} references missing customer ${tx.customerId}.`);
        result.valid = false;
      }
      if (!Number.isInteger(tx.amount)) {
        result.errors.push(`Transaction ${tx.id} amount is not an integer (${tx.amount}).`);
        result.valid = false;
      }
      if (!['udhaar', 'payment', 'sale_credit', 'adjustment', 'refund'].includes(tx.type)) {
        result.errors.push(`Transaction ${tx.id} has invalid type ${tx.type}.`);
        result.valid = false;
      }
      if (!['active', 'archived', 'void'].includes(tx.status)) {
        result.errors.push(`Transaction ${tx.id} has invalid status ${tx.status}.`);
        result.valid = false;
      }
    }

    // Sales checks
    const txIds = new Set(transactions.map((t: any) => t.id));
    for (const sale of sales) {
      if (sale.linkedTransactionId && !txIds.has(sale.linkedTransactionId)) {
        result.errors.push(`Sale ${sale.id} references missing transaction ${sale.linkedTransactionId}.`);
        result.valid = false;
      }
      if (!Number.isInteger(sale.totalPaise) || !Number.isInteger(sale.subtotalPaise)) {
        result.errors.push(`Sale ${sale.id} has non-integer money values.`);
        result.valid = false;
      }
    }

    // Invoices checks
    const saleIds = new Set(sales.map((s: any) => s.id));
    for (const inv of invoices) {
      if (inv.linkedSaleId && !saleIds.has(inv.linkedSaleId)) {
        result.errors.push(`Invoice ${inv.invoiceNumber} references missing sale ${inv.linkedSaleId}.`);
        result.valid = false;
      }
      if (!Number.isInteger(inv.totalPaise) || !Number.isInteger(inv.subtotalPaise)) {
        result.errors.push(`Invoice ${inv.invoiceNumber} has non-integer money values.`);
        result.valid = false;
      }
    }

  } catch (e: any) {
    result.errors.push(`Failed to parse backup: ${e.message}`);
    result.valid = false;
  }

  return result;
}

// CSV Escaping help
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(headers: string[], rows: any[][]): string {
  return [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
}

function getDateStr() {
  return new Date().toISOString().split('T')[0];
}

// Export specific CSVs
export function exportCustomersCSV(customers: Customer[], getBalance: (id: string) => number) {
  const headers = ['Customer Name', 'Phone', 'Address', 'Notes', 'Balance (Paise)', 'Risk Status', 'Created At'];
  const rows = customers.map(c => [
    c.name,
    c.phone || '',
    c.address || '',
    c.notes || '',
    getBalance(c.id),
    c.riskStatus || '',
    new Date(c.createdAt).toLocaleDateString()
  ]);
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-customers-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportLedgerCSV(transactions: Transaction[], customers: Customer[]) {
  const headers = ['Date', 'Customer', 'Type', 'Amount (Paise)', 'Status', 'Due Date', 'Note', 'Linked Sale ID'];
  const rows = transactions.map(tx => {
    const cust = customers.find(c => c.id === tx.customerId);
    return [
       new Date(tx.createdAt).toLocaleDateString(),
       cust ? cust.name : 'Unknown',
       tx.type,
       tx.amount,
       tx.status,
       tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : '',
       tx.description || '',
       tx.linkedSaleId || ''
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-ledger-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportSalesCSV(sales: Sale[], customers: Customer[]) {
  const headers = ['Date', 'Sale ID', 'Customer', 'Items', 'Payment Mode', 'Total (Paise)', 'Profit (Paise)', 'Status', 'Linked Transaction ID'];
  const rows = sales.map(s => {
    const cust = s.customerId ? customers.find(c => c.id === s.customerId) : null;
    const itemsStr = s.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
    return [
       new Date(s.createdAt).toLocaleDateString(),
       s.id,
       cust ? cust.name : 'Walk-in',
       itemsStr,
       s.paymentMode,
       s.totalPaise,
       s.profitPaise || '',
       s.status,
       s.linkedTransactionId || ''
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-sales-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportInvoicesCSV(invoices: Invoice[], customers: Customer[]) {
  const headers = ['Date', 'Invoice Number', 'Customer', 'Total (Paise)', 'Payment Mode', 'Payment Status', 'Status', 'Linked Sale ID'];
  const rows = invoices.map(i => {
    const cust = i.customerId ? customers.find(c => c.id === i.customerId) : null;
    return [
       new Date(i.createdAt).toLocaleDateString(),
       i.invoiceNumber,
       cust ? cust.name : 'Walk-in',
       i.totalPaise,
       i.paymentMode,
       i.paymentStatus,
       i.status,
       i.linkedSaleId || ''
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-invoices-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportInventoryCSV(inventory: InventoryItem[]) {
  const headers = ['Item Name', 'Category', 'SKU', 'Unit', 'Stock Qty', 'Low Stock Alert Qty', 'Purchase Price (Paise)', 'Selling Price (Paise)', 'Margin (%)', 'Supplier', 'Status', 'Created At'];
  const rows = inventory.map(i => {
    const margin = i.sellingPricePaise > 0 ? (((i.sellingPricePaise - i.purchasePricePaise) / i.sellingPricePaise) * 100).toFixed(1) : '0';
    return [
       i.name,
       i.category || '',
       i.sku || '',
       i.unit,
       i.stockQty,
       i.lowStockAlertQty,
       i.purchasePricePaise,
       i.sellingPricePaise,
       margin,
       i.supplierName || '',
       i.status,
       new Date(i.createdAt).toLocaleDateString()
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-inventory-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportStockMovementsCSV(movements: StockMovement[], inventory: InventoryItem[]) {
  const headers = ['Date', 'Item', 'Type', 'Quantity Change', 'Reason', 'Linked Sale ID'];
  const rows = movements.map(m => {
    const item = inventory.find(i => i.id === m.inventoryItemId);
    return [
       new Date(m.createdAt).toLocaleDateString(),
       item ? item.name : 'Unknown',
       m.type,
       m.qtyChange,
       m.reason || '',
       m.linkedSaleId || ''
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-stock-movements-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportSuppliersCSV(suppliers: Supplier[], getBalance: (id: string) => number) {
  const headers = ['Supplier Name', 'Phone', 'Email', 'Address', 'Status', 'Balance (Paise)', 'Created At'];
  const rows = (suppliers || []).map(s => [
    s.name,
    s.phone || '',
    s.email || '',
    s.address || '',
    s.status,
    getBalance(s.id),
    new Date(s.createdAt).toLocaleDateString()
  ]);
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-suppliers-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}

export function exportSupplierLedgerCSV(transactions: SupplierTransaction[], suppliers: Supplier[]) {
  const headers = ['Date', 'Supplier', 'Type', 'Description', 'Quantity', 'Unit', 'Unit Price (Paise)', 'Total Amount (Paise)', 'Status', 'Payment Mode', 'Notes', 'Inventory Linked'];
  const rows = (transactions || []).map(tx => {
    const supplier = suppliers.find(s => s.id === tx.supplierId);
    return [
       new Date(tx.createdAt).toLocaleDateString(),
       supplier ? supplier.name : 'Unknown',
       tx.type,
       tx.purchaseName || '',
       tx.quantity || '',
       tx.unit || '',
       tx.unitPricePaise || '',
       tx.amountPaise,
       tx.status,
       tx.paymentMode || '',
       (tx.notes || '').split(' | ')[0], // Remove the auto-added qty string from notes if we output it separately
       tx.inventoryItemId ? 'Yes' : 'No'
    ];
  });
  
  const content = generateCSV(headers, rows);
  downloadFile(`smartudhaar-supplier-ledger-${getDateStr()}.csv`, content, 'text/csv;charset=utf-8;');
}
