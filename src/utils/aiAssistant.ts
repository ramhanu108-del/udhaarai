import { useStore, computeCustomerBalance } from '../store/useStore';
import { formatCurrency } from './index';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { getOverdueCustomers, getTotalPending, getLowStockItems } from '../store/selectors';
import { Transaction, Sale, Invoice, InventoryItem } from '../types';

export interface AIResponse {
  text: string;
  actions?: { label: string; actionType: string; payload?: any }[];
}

export function getBusinessSummary(state: any = useStore.getState()) {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = endOfMonth(now).getTime();

  const transactions = state.transactions?.filter((tx: Transaction) => tx.status === 'active') || [];
  const sales = state.sales?.filter((s: Sale) => s.status === 'active') || [];
  const invoices = state.invoices?.filter((i: Invoice) => i.status === 'active') || [];
  const customers = state.customers || [];
  const inventory = state.inventory?.filter((i: InventoryItem) => i.status === 'active') || [];

  // Today Sales
  const todaySales = sales.filter((s: Sale) => s.createdAt >= todayStart && s.createdAt <= todayEnd);
  const todaySalesPaise = todaySales.reduce((sum: number, s: Sale) => sum + s.totalPaise, 0);
  
  // Today Collection
  const todayPayments = transactions.filter((tx: Transaction) => tx.type === 'payment' && tx.createdAt >= todayStart && tx.createdAt <= todayEnd);
  const todayCollectionPaise = todayPayments.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  // Pending Udhaar
  const totalPendingUdhaarPaise = getTotalPending(state);

  // Overdue Customers
  const overdueCustomers = getOverdueCustomers(state);
  
  // Low Stock
  const lowStockItems = getLowStockItems(state);

  // Monthly Sales & Profit
  const monthlySales = sales.filter((s: Sale) => s.createdAt >= monthStart && s.createdAt <= monthEnd);
  const monthlySalesPaise = monthlySales.reduce((sum: number, s: Sale) => sum + s.totalPaise, 0);
  const monthlyProfitPaise = monthlySales.reduce((sum: number, s: Sale) => sum + (s.profitPaise || 0), 0);

  // Unpaid Invoices
  const unpaidInvoices = invoices.filter((i: Invoice) => i.paymentStatus !== 'paid');

  // Top Debtors
  const customerBalances = customers.map((c: any) => ({
    customer: c,
    balance: computeCustomerBalance(transactions, c.id)
  })).filter((cb: any) => cb.balance > 0).sort((a: any, b: any) => b.balance - a.balance);

  // Best Selling Items
  const itemSalesCount: Record<string, {name: string, qty: number}> = {};
  monthlySales.forEach((sale: Sale) => {
    sale.items.forEach((item: any) => {
      if (!itemSalesCount[item.name]) itemSalesCount[item.name] = { name: item.name, qty: 0 };
      itemSalesCount[item.name].qty += item.quantity;
    });
  });
  const bestSellingItems = Object.values(itemSalesCount).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return {
    todaySalesPaise,
    todayCollectionPaise,
    totalPendingUdhaarPaise,
    overdueCustomerCount: overdueCustomers.length,
    lowStockCount: lowStockItems.length,
    monthlySalesPaise,
    monthlyProfitPaise,
    unpaidInvoiceCount: unpaidInvoices.length,
    topDebtors: customerBalances.slice(0, 5),
    lowStockItems,
    bestSellingItems,
    overdueCustomers,
    inventoryCount: inventory.length
  };
}

export function getSmartSuggestions(state: any = useStore.getState()): string[] {
  const summary = getBusinessSummary(state);
  const suggestions: string[] = [];

  if (summary.overdueCustomerCount > 0) {
    suggestions.push(`${summary.overdueCustomerCount} customers ke payments overdue hain. Aaj reminder bhejna useful rahega.`);
  }

  if (summary.lowStockCount > 0) {
    suggestions.push(`${summary.lowStockCount} items low stock mein hain. Stock refill plan karein.`);
  }

  if (summary.totalPendingUdhaarPaise > 1000000) {
    suggestions.push(`Aapka udhaar hi kaafi zyada ho gaya hai. Collection par dhyan dein.`);
  }

  if (summary.todaySalesPaise > 0) {
    suggestions.push(`Aaj ka business accha chal raha hai, total sales: ${formatCurrency(summary.todaySalesPaise)}`);
  }

  if (suggestions.length === 0) {
    if (state.customers?.length === 0 && state.sales?.length === 0) {
       if (summary.inventoryCount === 0) {
         suggestions.push("Abhi data enough nahi hai. Pehle inventory, customers ya sales add karein.");
       } else {
         suggestions.push("Start billing by adding your first sale today.");
       }
    } else {
      suggestions.push("Sab kuch properly manage ho raha hai! Keep it up.");
    }
  }

  return suggestions;
}

export function generateAIResponse(query: string, state: any = useStore.getState()): AIResponse {
  const q = query.toLowerCase();
  const summary = getBusinessSummary(state);
  
  if (q.includes('aaj') && q.includes('sale')) {
    return {
      text: `Aaj total sales ${formatCurrency(summary.todaySalesPaise)} hui hai.\nCollection aaya: ${formatCurrency(summary.todayCollectionPaise)}.`
    };
  }

  if ((q.includes('udhaar') || q.includes('pending') || q.includes('baki')) && !q.includes('sabse zyada')) {
    return {
      text: `Market mein total pending udhaar ${formatCurrency(summary.totalPendingUdhaarPaise)} hai.\nOverdue customers: ${summary.overdueCustomerCount}.`
    };
  }

  if (q.includes('sabse zyada') || q.includes('top debtor')) {
    if (summary.topDebtors.length === 0) {
      return { text: "Abhi kisi ka bhi udhaar baki nahi hai." };
    }
    const list = summary.topDebtors.map((d: any, i: number) => `${i+1}. ${d.customer.name} - ${formatCurrency(d.balance)}`).join('\n');
    return { text: `Sabse zyada udhaar in par hai:\n${list}` };
  }

  if (q.includes('reminder') || q.includes('overdue')) {
    if (summary.overdueCustomers.length === 0) {
      return { text: "Koi overdue payments nahi hain abhi." };
    }
    const list = summary.overdueCustomers.map((c: any, i: number) => {
      const bal = computeCustomerBalance(state.transactions || [], c.id);
      return `${i+1}. ${c.name} - ${formatCurrency(bal)} pending`;
    }).join('\n');
    return { 
      text: `Aapko in customers ko reminder bhejna chahiye:\n${list}`,
      actions: [{ label: 'Go to Customers', actionType: 'navigate', payload: '/customers' }]
    };
  }

  if (q.includes('low') && q.includes('stock')) {
    if (summary.lowStockItems.length === 0) {
      return { text: "Koi item low stock mein nahi hai." };
    }
    const list = summary.lowStockItems.map((item: any, i: number) => `${i+1}. ${item.name} - ${item.stockQty} ${item.unit} left`).join('\n');
    return { 
      text: `Ye items low stock mein hain:\n${list}`,
      actions: [{ label: 'Go to Inventory', actionType: 'navigate', payload: '/inventory' }]
    };
  }

  if (q.includes('month') && q.includes('profit')) {
    return {
      text: `Is month ka profit estimate ${formatCurrency(summary.monthlyProfitPaise)} hai.\nTotal Monthly Sales: ${formatCurrency(summary.monthlySalesPaise)}.`
    };
  }

  if (q.includes('zyada') && q.includes('bik')) {
    if (summary.bestSellingItems.length === 0) {
      return { text: "Is mahine ki koi bhi sale record nahi hui hai." };
    }
    const list = summary.bestSellingItems.map((item: any, i: number) => `${i+1}. ${item.name} (${item.qty} bik chuka hai)`).join('\n');
    return { text: `Is month ye items zyada bik rahe hain:\n${list}` };
  }

  if (q.includes('unpaid') && q.includes('invoice')) {
    if (summary.unpaidInvoiceCount === 0) {
      return { text: "Saare invoices paid hain." };
    }
    return { text: `Aapke ${summary.unpaidInvoiceCount} invoices abhi unpaid hain.` };
  }

  if ((q.includes('summary') && q.includes('aaj')) || q.includes('today summary') || q.includes('aaj ka business')) {
    return {
      text: `Aaj ka business summary:\nSales: ${formatCurrency(summary.todaySalesPaise)}\nCollection: ${formatCurrency(summary.todayCollectionPaise)}\nOverdue Reminders: ${summary.overdueCustomerCount}\nLow Stock: ${summary.lowStockCount}`
    };
  }

  return {
    text: "Main aapke business data ke baare mein sawalon ke jawab de sakta hoon. Try puchiye: 'Aaj ki sales kitni hui?', 'Low stock items', ya 'Reminder kisko bheju?'"
  };
}
