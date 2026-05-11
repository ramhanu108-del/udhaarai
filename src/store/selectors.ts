import { useStore } from './useStore';
import { Transaction, Customer, Sale, Invoice, InventoryItem, StockMovement } from '../types';

export const getTransactions = (state: any = useStore.getState()) => {
  return state.transactions.filter((tx: Transaction) => tx.status === 'active');
};

export const getSales = (state: any = useStore.getState()) => {
  return (state.sales || []).filter((sale: Sale) => sale.status === 'active');
};

export const getSalesByDateRange = (start: number, end: number, state: any = useStore.getState()) => {
  return getSales(state).filter((s: Sale) => s.createdAt >= start && s.createdAt <= end);
};

export const getSalesSummary = (sales: Sale[]) => {
  let totalSalesPaise = 0;
  let cashPaise = 0;
  let upiPaise = 0;
  let cardPaise = 0;
  let udhaarPaise = 0;
  let profitPaise = 0;

  for (const sale of sales) {
    totalSalesPaise += sale.totalPaise;
    if (sale.paymentMode === 'cash') cashPaise += sale.totalPaise;
    if (sale.paymentMode === 'upi') upiPaise += sale.totalPaise;
    if (sale.paymentMode === 'card') cardPaise += sale.totalPaise;
    if (sale.paymentMode === 'udhaar') udhaarPaise += sale.totalPaise;
    if (sale.profitPaise) profitPaise += sale.profitPaise;
  }

  return {
    totalSalesPaise,
    cashPaise,
    upiPaise,
    cardPaise,
    udhaarPaise,
    profitPaise,
    saleCount: sales.length,
  };
};

export const getTodaySalesSummary = (state: any = useStore.getState()) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = now.getTime();
  now.setHours(23, 59, 59, 999);
  const end = now.getTime();

  const todaySales = getSalesByDateRange(start, end, state);
  return getSalesSummary(todaySales);
};

export const getCustomerBalance = (customerId: string, state: any = useStore.getState()) => {
  const txs = getTransactions(state).filter((tx: Transaction) => tx.customerId === customerId);
  return txs.reduce((sum: number, tx: Transaction) => {
    if (tx.type === 'udhaar' || tx.type === 'sale_credit') {
      return sum + tx.amount;
    } else if (tx.type === 'payment' || tx.type === 'refund' || tx.type === 'adjustment') {
      return sum - tx.amount;
    }
    return sum;
  }, 0);
};

export const getTotalPending = (state: any = useStore.getState()) => {
  const activeTxs = getTransactions(state);
  // Total pending is the sum of all positive balances. Let's group by customer.
  const balances: Record<string, number> = {};
  for (const tx of activeTxs) {
    if (!balances[tx.customerId]) balances[tx.customerId] = 0;
    if (tx.type === 'udhaar' || tx.type === 'sale_credit') balances[tx.customerId] += tx.amount;
    else if (tx.type === 'payment' || tx.type === 'refund' || tx.type === 'adjustment') balances[tx.customerId] -= tx.amount;
  }
  
  let total = 0;
  for (const bal of Object.values(balances)) {
    if (bal > 0) total += bal;
  }
  return total;
};

export const getCustomerLedger = (customerId: string, state: any = useStore.getState()) => {
  const txs = getTransactions(state)
    .filter((tx: Transaction) => tx.customerId === customerId)
    .sort((a: Transaction, b: Transaction) => a.createdAt - b.createdAt);
    
  let runningBalance = 0;
  return txs.map((tx: Transaction) => {
    if (tx.type === 'udhaar' || tx.type === 'sale_credit') runningBalance += tx.amount;
    else if (tx.type === 'payment' || tx.type === 'refund' || tx.type === 'adjustment') runningBalance -= tx.amount;
    
    return {
      ...tx,
      runningBalance
    };
  });
};

export const getOverdueCustomers = (state: any = useStore.getState()) => {
  const now = Date.now();
  const txs = getTransactions(state).filter((tx: Transaction) => {
    if ((tx.type === 'udhaar' || tx.type === 'sale_credit') && tx.dueDate) {
      const dueTime = typeof tx.dueDate === 'number' ? tx.dueDate : new Date(tx.dueDate).setHours(23, 59, 59, 999);
      return dueTime < now;
    }
    return false;
  });
  
  // Actually, overdue applies to the balance. A simpler way: anyone with a balance > 0 and has an udhaar past due date that hasn't been completely covered by payments.
  // For MVP: if they have a positive balance and ANY udhaar transaction overdue
  
  // Group positive balances
  const balances: Record<string, number> = {};
  const hasOverdueTx: Record<string, boolean> = {};
  
  for (const tx of getTransactions(state)) {
    if (!balances[tx.customerId]) balances[tx.customerId] = 0;
    if (tx.type === 'udhaar' || tx.type === 'sale_credit') {
      balances[tx.customerId] += tx.amount;
      if (tx.dueDate) {
        const dueTime = typeof tx.dueDate === 'number' ? tx.dueDate : new Date(tx.dueDate).setHours(23, 59, 59, 999);
        if (dueTime < now) hasOverdueTx[tx.customerId] = true;
      }
    }
    else if (tx.type === 'payment' || tx.type === 'refund' || tx.type === 'adjustment') {
      balances[tx.customerId] -= tx.amount;
    }
  }
  
  const overdueCustomerIds = Object.keys(balances).filter(id => balances[id] > 0 && hasOverdueTx[id]);
  return state.customers.filter((c: Customer) => overdueCustomerIds.includes(c.id));
};

export const getInvoices = (state: any = useStore.getState()) => {
  return (state.invoices || []).filter((inv: Invoice) => inv.status === 'active');
};

export const getInvoicesByDateRange = (start: number, end: number, state: any = useStore.getState()) => {
  return getInvoices(state).filter((i: Invoice) => i.createdAt >= start && i.createdAt <= end);
};

export const getInvoicesSummary = (invoices: Invoice[]) => {
  let totalValuePaise = 0;
  let paidValuePaise = 0;
  let unpaidValuePaise = 0;
  
  for (const inv of invoices) {
    totalValuePaise += inv.totalPaise;
    if (inv.paymentStatus === 'paid') {
      paidValuePaise += inv.totalPaise;
    } else if (inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partial') {
      unpaidValuePaise += inv.totalPaise;
    }
  }

  return {
    count: invoices.length,
    totalValuePaise,
    paidValuePaise,
    unpaidValuePaise
  };
};

export const generateInvoiceNumber = (state: any = useStore.getState()) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const prefix = `SU-${year}${month}${day}-`;
  
  const allInvoices = state.invoices || [];
  const todayInvoices = allInvoices.filter((i: Invoice) => i.invoiceNumber && i.invoiceNumber.startsWith(prefix));
  
  const nextNum = todayInvoices.length + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

export const getInventoryItems = (state: any = useStore.getState()) => {
  return (state.inventory || []).filter((item: InventoryItem) => item.status === 'active');
};

export const getLowStockItems = (state: any = useStore.getState()) => {
  return getInventoryItems(state).filter((item: InventoryItem) => item.stockQty <= item.lowStockAlertQty);
};

export const getInventorySummary = (state: any = useStore.getState()) => {
  const inventory = state.inventory || [];
  let activeItemCount = 0;
  let archivedItemCount = 0;
  let lowStockCount = 0;
  let totalPurchaseValuePaise = 0;
  let totalSellingValuePaise = 0;
  let potentialProfitPaise = 0;

  for (const item of inventory) {
    if (item.status === 'archived') {
      archivedItemCount++;
      continue;
    }
    
    activeItemCount++;
    if (item.stockQty <= item.lowStockAlertQty) lowStockCount++;
    
    if (item.stockQty > 0) {
      totalPurchaseValuePaise += item.purchasePricePaise * item.stockQty;
      totalSellingValuePaise += item.sellingPricePaise * item.stockQty;
    }
  }

  potentialProfitPaise = totalSellingValuePaise - totalPurchaseValuePaise;

  return {
    activeItemCount,
    archivedItemCount,
    lowStockCount,
    totalPurchaseValuePaise,
    totalSellingValuePaise,
    potentialProfitPaise
  };
};

export const getStockMovementsByItem = (itemId: string, state: any = useStore.getState()) => {
  return (state.stockMovements || [])
    .filter((m: StockMovement) => m.inventoryItemId === itemId)
    .sort((a: StockMovement, b: StockMovement) => b.createdAt - a.createdAt);
};
