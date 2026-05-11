import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, TrendingUp, IndianRupee, PackageOpen, Users, Receipt, Copy, Check, Share2, ClipboardList, FileDown } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { generateWhatsAppLink } from '../utils';
import { generateMonthlyPdfReport } from '../utils/pdfReports';

export const Reports = () => {
  const navigate = useNavigate();
  const storeState = useStore();
  const { user, sales, invoices, customers, inventory, transactions } = storeState;
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Quick stats
  const totalPendingUdhaar = customers.reduce((sum, c) => sum + (c.totalPending || 0), 0);
  
  const todaysSales = sales.filter(s => s.createdAt >= today.getTime());
  const todaysSalesTotal = todaysSales.reduce((sum, s) => sum + s.totalPaise, 0);

  const todaysPayments = transactions.filter(t => t.type === 'payment' && t.createdAt >= today.getTime());
  const todaysCollection = todaysPayments.reduce((sum, t) => sum + t.amount, 0);

  const cashSalesTotal = todaysSales.filter(s => s.paymentMode === 'cash').reduce((sum, s) => sum + s.totalPaise, 0);
  const upiSalesTotal = todaysSales.filter(s => s.paymentMode === 'upi').reduce((sum, s) => sum + s.totalPaise, 0);
  const cardSalesTotal = todaysSales.filter(s => s.paymentMode === 'card').reduce((sum, s) => sum + s.totalPaise, 0);
  
  const todaysTransactions = transactions.filter(t => t.createdAt >= today.getTime());
  const todaysUdhaarTotal = todaysTransactions.filter(t => t.type === 'udhaar' || t.type === 'sale_credit').reduce((sum, t) => sum + t.amount, 0);
  
  const netCollection = cashSalesTotal + upiSalesTotal + cardSalesTotal + todaysCollection;

  const lowStockItems = inventory.filter(i => i.stockQty <= i.lowStockAlertQty);
  
  const unpaidInvoices = invoices.filter(i => i.paymentStatus !== 'paid' && i.status !== 'void');

  const topUdhaarCustomers = [...customers]
    .sort((a, b) => (b.totalPending || 0) - (a.totalPending || 0))
    .filter(c => (c.totalPending || 0) > 0)
    .slice(0, 5);

  const pendingAmountStr = `₹${(totalPendingUdhaar / 100).toFixed(0)}`;

  const generateSummaryText = () => {
    let text = `*--- Aaj Ka Closing Summary ---*\n`;
    text += `Shop: ${user?.businessName || 'SmartUdhaar AI'}\n`;
    text += `Date: ${format(new Date(), 'dd MMM yyyy')}\n\n`;
    
    text += `*Sales & Collection*\n`;
    text += `Aaj ki Sales: ₹${(todaysSalesTotal / 100).toFixed(0)}\n`;
    text += `Cash Sales: ₹${(cashSalesTotal / 100).toFixed(0)}\n`;
    text += `UPI Sales: ₹${(upiSalesTotal / 100).toFixed(0)}\n`;
    text += `Card Sales: ₹${(cardSalesTotal / 100).toFixed(0)}\n`;
    text += `Aaj Received Payment: ₹${(todaysCollection / 100).toFixed(0)}\n`;
    text += `Net Cash/Collection: ₹${(netCollection / 100).toFixed(0)}\n\n`;
    
    text += `*Udhaar Status*\n`;
    text += `Aaj Diya Gaya Udhaar: ₹${(todaysUdhaarTotal / 100).toFixed(0)}\n`;
    text += `Total Pending Market mein: ₹${(totalPendingUdhaar / 100).toFixed(0)}\n\n`;
    
    text += `*Alerts*\n`;
    text += `Low Stock Items: ${lowStockItems.length}\n`;
    
    if (topUdhaarCustomers.length > 0) {
       text += `\n*Top 3 Pending Customers*\n`;
       topUdhaarCustomers.slice(0,3).forEach((c, i) => {
          text += `${i+1}. ${c.name} - ₹${(c.totalPending / 100).toFixed(0)}\n`;
       });
    }
    
    return text;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleShareSummaryWA = () => {
    const text = generateSummaryText();
    const phone = user?.phone || '';
    const link = generateWhatsAppLink(phone, text);
    window.open(link, '_blank');
  };

  const downloadPdf = async (monthDate: Date) => {
    try {
      setPdfGenerating(true);
      setPdfError('');
      // Small timeout to allow UI to update to loading state
      await new Promise(r => setTimeout(r, 50));
      generateMonthlyPdfReport(monthDate, storeState);
    } catch (err) {
      console.error(err);
      setPdfError('PDF generate nahi ho paya. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const thisMonthStart = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Reports</h1>
            <p className="text-xs text-slate-500 font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 pb-24 space-y-6">
        
        {/* Today's Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
             <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Aaj ki Sale</p>
             <p className="text-lg font-black text-slate-900">₹{(todaysSalesTotal / 100).toFixed(0)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <IndianRupee className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Aaj Collection</p>
             <p className="text-lg font-black text-slate-900">₹{(todaysCollection / 100).toFixed(0)}</p>
          </div>
        </div>

        {/* Closing Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-indigo-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-widest">
              <ClipboardList className="w-4 h-4" /> Aaj Ka Closing Summary
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <p className="text-slate-500">Total Sales:</p>
              <p className="font-bold text-slate-900 text-right">₹{(todaysSalesTotal / 100).toFixed(0)}</p>
              
              <p className="text-slate-500 pl-2">- Cash Sales:</p>
              <p className="font-medium text-slate-700 text-right">₹{(cashSalesTotal / 100).toFixed(0)}</p>
              
              <p className="text-slate-500 pl-2">- UPI Sales:</p>
              <p className="font-medium text-slate-700 text-right">₹{(upiSalesTotal / 100).toFixed(0)}</p>
              
              <p className="text-slate-500 pl-2">- Card Sales:</p>
              <p className="font-medium text-slate-700 text-right">₹{(cardSalesTotal / 100).toFixed(0)}</p>
              
              <div className="col-span-2 border-t border-slate-100 my-1"></div>
              
              <p className="text-slate-500">Udhaar Diya:</p>
              <p className="font-bold text-slate-900 text-right">₹{(todaysUdhaarTotal / 100).toFixed(0)}</p>
              
              <p className="text-slate-500">Payment Aaya:</p>
              <p className="font-bold text-slate-900 text-right">₹{(todaysCollection / 100).toFixed(0)}</p>
              
              <div className="col-span-2 border-t border-slate-100 my-1"></div>
              
              <p className="text-slate-900 font-bold">Net Cash/Collection:</p>
              <p className="font-black text-emerald-600 text-right">₹{(netCollection / 100).toFixed(0)}</p>
            </div>
            
            <div className="pt-3 flex gap-3">
              <button onClick={handleShareSummaryWA} className="flex-1 bg-[#25D366] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                <Share2 className="w-3.5 h-3.5" /> WhatsApp Self
              </button>
              <button onClick={handleCopySummary} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSummary ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Overall Pending */}
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-orange-900 mb-1 flex items-center gap-2">
                   <Users className="w-4 h-4" /> Total Pending Udhaar
                </p>
                <p className="text-3xl font-black text-orange-700">{pendingAmountStr}</p>
             </div>
          </div>
        </div>

        {/* PDF Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-red-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-900 flex items-center gap-2 uppercase tracking-widest">
              <FileDown className="w-4 h-4" /> PDF Reports
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Monthly PDF se aap ek sheet par poore mahine ka hisaab check kar sakte hain. Ye local data se generate hoti hai.
            </p>
            {pdfError && <p className="text-xs text-red-600 mb-2 font-medium">{pdfError}</p>}
            <button 
              onClick={() => downloadPdf(thisMonthStart)} 
              disabled={pdfGenerating}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" /> 
              {pdfGenerating ? 'Generating...' : `Download This Month (${format(thisMonthStart, 'MMMM')})`}
            </button>
            <button 
              onClick={() => downloadPdf(lastMonthStart)} 
              disabled={pdfGenerating}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-slate-400" /> 
              {pdfGenerating ? 'Generating...' : `Download Last Month (${format(lastMonthStart, 'MMMM')})`}
            </button>
          </div>
        </div>

        {/* Operational Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
           <div className="p-4 flex items-center justify-between hover:bg-slate-50" onClick={() => navigate('/inventory')}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <PackageOpen className="w-4 h-4 text-red-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900">Low Stock Items</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Restock needed</p>
                 </div>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                 {lowStockItems.length}
              </div>
           </div>

           <div className="p-4 flex items-center justify-between hover:bg-slate-50" onClick={() => navigate('/invoices')}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900">Unpaid Bills</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Pending invoices</p>
                 </div>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                 {unpaidInvoices.length}
              </div>
           </div>
        </div>

        {/* Top Pending Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
           <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
             <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Wapas Lene Wala Paisa</h3>
           </div>
           {topUdhaarCustomers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Koi udhaar baki nahi hai.</div>
           ) : (
             <div className="divide-y divide-slate-100">
               {topUdhaarCustomers.map((c, index) => (
                 <div key={`${c.id}-${index}`} className="p-4 flex items-center justify-between" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div>
                       <p className="text-sm font-bold text-slate-900">{c.name}</p>
                       <p className="text-xs text-slate-500">{c.phone}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">₹{(c.totalPending / 100).toFixed(0)}</p>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
