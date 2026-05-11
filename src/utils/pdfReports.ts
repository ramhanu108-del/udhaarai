import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { AppState } from '../store/useStore';

export const formatPdfCurrency = (amountInPaise: number): string => {
  if (amountInPaise == null || isNaN(amountInPaise) || !isFinite(amountInPaise)) return "Rs. 0";
  const rupees = amountInPaise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `Rs. ${formatted}`;
};

export const buildMonthlyReportData = (monthStart: Date, monthEnd: Date, state: AppState) => {
  const { user, sales, invoices, customers, inventory, transactions } = state;

  const monthSales = sales.filter(s => 
    s.status === 'active' && 
    isWithinInterval(new Date(s.createdAt), { start: monthStart, end: monthEnd })
  );

  const monthTransactions = transactions.filter(t => 
    t.status === 'active' && 
    isWithinInterval(new Date(t.createdAt), { start: monthStart, end: monthEnd })
  );

  const monthInvoices = invoices.filter(i => 
    i.status !== 'void' && 
    isWithinInterval(new Date(i.createdAt), { start: monthStart, end: monthEnd })
  );

  let totalSales = 0;
  let cashSales = 0;
  let upiSales = 0;
  let cardSales = 0;
  let creditSales = 0; // udhaar
  let profitEstimate = 0;

  monthSales.forEach(s => {
    totalSales += s.totalPaise;
    if (s.paymentMode === 'cash') cashSales += s.totalPaise;
    if (s.paymentMode === 'upi') upiSales += s.totalPaise;
    if (s.paymentMode === 'card') cardSales += s.totalPaise;
    if (s.paymentMode === 'udhaar') creditSales += s.totalPaise;
    
    if (s.profitPaise) profitEstimate += s.profitPaise;
  });

  let udhaarGiven = 0;
  let paymentReceived = 0;

  monthTransactions.forEach(t => {
    if (t.type === 'udhaar' || t.type === 'sale_credit') udhaarGiven += t.amount;
    if (t.type === 'payment' || t.type === 'refund') paymentReceived += t.amount;
  });

  // Calculate customer pending balances
  const customerBalances: Record<string, number> = {};
  const activeTxs = transactions.filter(t => t.status === 'active');
  
  activeTxs.forEach(t => {
    if (!customerBalances[t.customerId]) customerBalances[t.customerId] = 0;
    if (t.type === 'udhaar' || t.type === 'sale_credit') customerBalances[t.customerId] += t.amount;
    if (t.type === 'payment' || t.type === 'refund' || t.type === 'adjustment') customerBalances[t.customerId] -= t.amount;
  });

  let totalPendingUdhaar = 0;
  const customersWithBalance = customers.map(c => {
    const bal = customerBalances[c.id] || 0;
    if (bal > 0) totalPendingUdhaar += bal;
    
    const cTxs = activeTxs.filter(t => t.customerId === c.id);
    const lastPayment = cTxs.filter(t => t.type === 'payment' || t.type === 'refund').sort((a,b) => b.createdAt - a.createdAt)[0];
    
    return {
      ...c,
      pendingAmount: bal,
      lastPaymentDate: lastPayment ? lastPayment.createdAt : null
    };
  }).filter(c => c.pendingAmount > 0).sort((a, b) => b.pendingAmount - a.pendingAmount);

  const top10Customers = customersWithBalance.slice(0, 10);
  
  const lowStockItems = inventory.filter(i => i.stockQty <= i.lowStockAlertQty);
  const unpaidInvoices = monthInvoices.filter(i => i.paymentStatus !== 'paid');

  return {
    shopName: user?.businessName || 'SmartUdhaar AI',
    ownerName: user?.name || '',
    monthStr: format(monthStart, 'MMMM yyyy'),
    generatedDate: format(new Date(), 'dd MMM yyyy, hh:mm a'),
    
    totalSales,
    cashSales,
    upiSales,
    cardSales,
    creditSales,
    profitEstimate,
    paymentReceived,
    
    totalInvoices: monthInvoices.length,
    unpaidInvoicesCount: unpaidInvoices.length,
    lowStockCount: lowStockItems.length,

    udhaarGiven,
    totalPendingUdhaar,

    top10Customers,
    monthSales,
    lowStockItems,
    unpaidInvoices,
    customers
  };
};

export const generateMonthlyPdfReport = (monthStart: Date, appData: AppState) => {
  const monthEnd = endOfMonth(monthStart);
  const data = buildMonthlyReportData(monthStart, monthEnd, appData);

  const doc = new jsPDF('p', 'pt', 'a4');
  let yPos = 40;

  // --- HEADER ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartUdhaar AI', 40, yPos);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  yPos += 20;
  doc.text(data.shopName, 40, yPos);
  
  if (data.ownerName) {
    yPos += 16;
    doc.text(`Owner: ${data.ownerName}`, 40, yPos);
  }

  yPos += 24;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Monthly Report - ${data.monthStr}`, 40, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${data.generatedDate}`, 400, yPos);
  
  yPos += 30;

  // --- SUMMARY SECTION ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Summary', 40, yPos);
  yPos += 15;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    body: [
      ['Total Sales', formatPdfCurrency(data.totalSales)],
      ['Cash Sales', formatPdfCurrency(data.cashSales)],
      ['UPI Sales', formatPdfCurrency(data.upiSales)],
      ['Card Sales', formatPdfCurrency(data.cardSales)],
      ['Credit/Udhaar Sales', formatPdfCurrency(data.creditSales)],
      ['Payments Received', formatPdfCurrency(data.paymentReceived)],
      ['Total Udhaar Given', formatPdfCurrency(data.udhaarGiven)],
      ['Total Pending Udhaar (Overall)', formatPdfCurrency(data.totalPendingUdhaar)],
      ['Estimated Profit', formatPdfCurrency(data.profitEstimate)],
      ['Total Invoices', String(data.totalInvoices)],
      ['Unpaid Invoices', String(data.unpaidInvoicesCount)],
      ['Low Stock Items', String(data.lowStockCount)]
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 200 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 30;

  // --- TOP 10 UDHAAR CUSTOMERS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Pending Customers', 40, yPos);
  yPos += 15;

  if (data.top10Customers.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'striped',
      head: [['Customer', 'Phone', 'Pending Amount', 'Last Payment', 'Status']],
      body: data.top10Customers.map(c => [
        c.name || 'N/A',
        c.phone || 'N/A',
        formatPdfCurrency(c.pendingAmount),
        c.lastPaymentDate ? format(new Date(c.lastPaymentDate), 'dd MMM yyyy') : 'No Payments',
        c.riskStatus || 'N/A'
      ])
    });
    yPos = (doc as any).lastAutoTable.finalY + 30;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No pending customers.', 40, yPos);
    yPos += 30;
  }

  // --- LOW STOCK ITEMS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Low Stock Inventory', 40, yPos);
  yPos += 15;

  if (data.lowStockItems.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'striped',
      head: [['Item Name', 'Current Stock', 'Unit', 'Alert Qty', 'Selling Price']],
      body: data.lowStockItems.map(i => [
        i.name || 'N/A',
        String(i.stockQty),
        i.unit || 'N/A',
        String(i.lowStockAlertQty),
        formatPdfCurrency(i.sellingPricePaise)
      ])
    });
    yPos = (doc as any).lastAutoTable.finalY + 30;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('All stock levels are optimal.', 40, yPos);
    yPos += 30;
  }

  // --- UNPAID INVOICES ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Unpaid Invoices', 40, yPos);
  yPos += 15;

  if (data.unpaidInvoices.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'striped',
      head: [['Invoice #', 'Customer', 'Date', 'Total', 'Status']],
      body: data.unpaidInvoices.map(i => {
        const cust = data.customers.find(c => c.id === i.customerId);
        return [
          i.invoiceNumber || 'N/A',
          cust ? cust.name : 'Walk-in',
          format(new Date(i.createdAt), 'dd MMM yyyy'),
          formatPdfCurrency(i.totalPaise),
          i.status || 'N/A'
        ];
      })
    });
    yPos = (doc as any).lastAutoTable.finalY + 30;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No unpaid invoices for this month.', 40, yPos);
    yPos += 30;
  }

  // --- MONTH SALES LOG ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Sales Log (This Month)', 40, yPos);
  yPos += 15;

  if (data.monthSales.length > 0) {
    autoTable(doc, {
      startY: yPos,
      theme: 'striped',
      head: [['Date', 'Items', 'Customer', 'Mode', 'Amount', 'Profit']],
      body: data.monthSales.slice(0, 100).map(s => { // Limit to 100 for brevity in PDF without making it 50 pages unnecessarily, or full
        const cust = s.customerId ? data.customers.find(c => c.id === s.customerId) : null;
        let itemsStr = s.items.map(i => `${i.quantity} ${i.name}`).join(', ');
        if (itemsStr.length > 30) itemsStr = itemsStr.substring(0, 27) + '...';
        
        return [
          format(new Date(s.createdAt), 'dd MMM'),
          itemsStr || 'N/A',
          cust ? cust.name : 'Walk-in',
          s.paymentMode || 'N/A',
          formatPdfCurrency(s.totalPaise),
          s.profitPaise ? formatPdfCurrency(s.profitPaise) : 'N/A'
        ];
      })
    });
    yPos = (doc as any).lastAutoTable.finalY + 30;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No sales recorded this month.', 40, yPos);
    yPos += 30;
  }

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Ye report SmartUdhaar AI app ke local data se generate hui hai.', 40, doc.internal.pageSize.getHeight() - 20);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
  }

  const fileName = `smartudhaar-monthly-report-${format(monthStart, 'yyyy-MM')}.pdf`;
  doc.save(fileName);
};
