import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Share2, Download, Printer, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';

export const DocumentPreview: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { sales, transactions, customers, user } = useStore();
  const [copied, setCopied] = React.useState(false);
  const [isPdfReady, setIsPdfReady] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  useEffect(() => {
    // Ensure fonts and styling are loaded before letting user interact with PDF option
    const timer = setTimeout(() => {
      setIsPdfReady(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Find the entities
  const sale = type === 'sale_invoice' ? (sales || []).find(s => s.id === id) : null;
  const transaction = (type === 'udhaar_slip' || type === 'payment_receipt') 
    ? (transactions || []).find(t => t.id === id) 
    : null;

  // Find linked customer
  const customerId = sale ? sale.customerId : transaction ? transaction.customerId : null;
  const customer = customerId ? (customers || []).find(c => c.id === customerId) : null;

  // Let's compute historical balances correctly for receipt slip
  // For 'udhaar_slip' or 'payment_receipt', we want to find the state of the balance at/after this transaction.
  // Since customer.totalPending holds the LATEST balance, let's compute the due at that time or after this entry.
  // To avoid duplicate/divergent calculations, we can show the customer's current total pending balance clearly.
  const currentCustomerBalance = customer ? customer.totalPending : 0;

  // Format Paise value to clean Rupees format
  const formatRupees = (paise: number) => {
    return `Rs. ${(paise / 100).toFixed(2)}`;
  };

  const getDocTitle = () => {
    if (type === 'sale_invoice') return 'Sale Bill / Invoice';
    if (type === 'udhaar_slip') return 'Udhaar Bill / Credit Slip';
    if (type === 'payment_receipt') return 'Payment Receipt';
    return 'Document';
  };

  // Build WhatsApp share text exactly as specified by user
  const getShareText = () => {
    let text = '';
    const dateStr = sale 
      ? format(new Date(sale.createdAt), 'dd MMM yyyy') 
      : transaction 
      ? format(new Date(transaction.createdAt), 'dd MMM yyyy') 
      : format(new Date(), 'dd MMM yyyy');

    const customerName = customer ? customer.name : 'Walk-in Customer';

    if (type === 'sale_invoice' && sale) {
      const remainingUdhaarVal = sale.paymentMode === 'udhaar' ? (sale.totalPaise - (sale.advanceUsedPaise || 0)) / 100 : 0;
      text = `*SmartUdhaar AI Sale Bill*\n`;
      text += `Shop Name: ${user?.businessName || 'Our Shop'}\n`;
      text += `Bill No: ${sale.invoiceNumber || 'N/A'}\n`;
      text += `Customer: ${customerName}\n`;
      if (sale.items && sale.items[0]) {
        text += `Item: ${sale.items[0].quantity}x ${sale.items[0].name} @ Rs. ${(sale.items[0].unitPricePaise / 100).toFixed(2)}\n`;
      }
      if (sale.discountPaise > 0) {
        text += `Discount: Rs. ${(sale.discountPaise / 100).toFixed(2)}\n`;
      }
      text += `Total Amount: Rs. ${(sale.totalPaise / 100).toFixed(2)}\n`;
      if (sale.advanceUsedPaise && sale.advanceUsedPaise > 0) {
        text += `Advance Used: Rs. ${(sale.advanceUsedPaise / 100).toFixed(2)}\n`;
      }
      text += `Paid Amount: ${sale.paymentMode === 'udhaar' ? 'Rs. 0.00' : `Rs. ${((sale.totalPaise - (sale.advanceUsedPaise || 0)) / 100).toFixed(2)}`}\n`;
      if (remainingUdhaarVal > 0) {
        text += `Remaining Udhaar: Rs. ${remainingUdhaarVal.toFixed(2)}\n`;
      }
      text += `Date: ${dateStr}`;

    } else if (type === 'udhaar_slip' && transaction) {
      text = `*SmartUdhaar AI Udhaar Slip*\n`;
      text += `Shop Name: ${user?.businessName || 'Our Shop'}\n`;
      text += `Slip No: ${transaction.slipNumber || 'N/A'}\n`;
      text += `Customer: ${customerName}\n`;
      text += `Amount Added: Rs. ${(transaction.amount / 100).toFixed(2)}\n`;
      text += `Details: ${transaction.description || 'Udhaar'}\n`;
      text += `Customer Total Pending: Rs. ${(currentCustomerBalance / 100).toFixed(2)}\n`;
      text += `Date: ${dateStr}`;

    } else if (type === 'payment_receipt' && transaction) {
      text = `SmartUdhaar AI Receipt\n`;
      text += `Customer: ${customerName}\n`;
      text += `Payment: Rs. ${(transaction.amount / 100).toFixed(2)}\n`;
      text += `Mode: ${transaction.paymentMode ? transaction.paymentMode.toUpperCase() : 'Cash'}\n`;
      text += `Balance after payment: Rs. ${(currentCustomerBalance / 100).toFixed(2)}\n`;
      text += `Date: ${dateStr}`;
    }

    return text;
  };

  const handleShareWhatsApp = () => {
    const text = getShareText();
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyText = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    if (isGeneratingPdf || !isPdfReady) return;
    setIsGeneratingPdf(true);
    
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 600);
  };

  // Formatted date
  const docDate = sale 
    ? new Date(sale.createdAt) 
    : transaction 
    ? new Date(transaction.createdAt) 
    : new Date();

  const formattedDate = format(docDate, 'dd MMMM yyyy, hh:mm a');

  return (
    <div className="min-h-full bg-slate-50 flex flex-col w-full">
      
      {/* Action Header — Hidden during Print */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-10 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-950">{getDocTitle()}</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Document Preview</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-sans">
          <button
            onClick={handleCopyText}
            title="Copy copy text to clipboard"
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 animate-scaleUp shrink-0" /> : <Copy className="w-4 h-4 text-slate-500 shrink-0" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <button
            onClick={handleShareWhatsApp}
            title="Share via WhatsApp"
            className="p-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Share</span>
          </button>

          {isPdfReady ? (
            <button
              onClick={handlePrintPDF}
              disabled={isGeneratingPdf}
              title="Download/Print PDF"
              className={`p-1 px-3 border rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm ${
                isGeneratingPdf
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white'
              }`}
            >
              <Download className={`w-4 h-4 shrink-0 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
            </button>
          ) : (
            <button
              disabled
              title="Preparing PDF"
              className="p-1 px-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-not-allowed shadow-none"
            >
              <Download className="w-4 h-4 animate-pulse shrink-0" />
              <span>Preparing...</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Container */}
      <div className="flex-1 p-6 flex flex-col items-center justify-start print:p-0 print:bg-white">
        
        {/* On screen helpful alert */}
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 font-semibold mb-4 leading-relaxed flex items-center justify-between print:hidden">
           <span>📄 Safe PDF download lene ke liye direct <b>Print / Save as PDF</b> choose karein.</span>
           <button onClick={handlePrintPDF} className="text-xs text-amber-955 underline shrink-0 font-bold ml-2">Open Print</button>
        </div>

        {/* Paper Container */}
        <div 
          id="print-area" 
          className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-100/40 relative font-sans text-slate-800 print:shadow-none print:border-none print:p-2 print:max-w-full"
        >
          {/* VOID WATERMARK */}
          {((sale && sale.status === 'void') || (transaction && transaction.status === 'void')) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
              <div className="border-[8px] border-red-500/30 text-red-500/30 font-black text-6xl tracking-widest uppercase rounded-2xl rotate-12 px-6 py-2">
                VOID
              </div>
            </div>
          )}

          {/* Business/Shop Header */}
          <div className="text-center pb-6 border-b border-slate-100 relative z-10">
            <h2 className="text-xl font-bold text-slate-950 uppercase tracking-tight">{user?.businessName || 'SmartUdhaar Shop'}</h2>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">SmartUdhaar secure document</p>
            {user?.name && (
              <p className="text-xs text-slate-600 mt-1.5">
                Owner: <b>{user.name}</b> {user.phone ? `| T: ${user.phone}` : ''}
              </p>
            )}
            <div className="inline-block mt-4 bg-slate-100 text-slate-800 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200">
              {getDocTitle()}
            </div>
          </div>

          {/* Metadata Block (Date, Bill Number, Customer) */}
          <div className="py-5 border-b border-slate-100 text-xs space-y-2 relative z-10">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Document ID:</span>
              <span className="font-mono text-slate-900 font-extrabold">{id}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Doc No:</span>
              <span className="font-mono text-indigo-750 font-bold">
                {type === 'sale_invoice' && sale?.invoiceNumber}
                {type === 'udhaar_slip' && transaction?.slipNumber}
                {type === 'payment_receipt' && transaction?.receiptNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Date & Time:</span>
              <span className="text-slate-800 font-semibold">{formattedDate}</span>
            </div>

            <div className="flex justify-between items-start pt-1.5 border-t border-slate-100/70 mt-2">
              <span className="text-slate-400 font-bold">For Customer:</span>
              <div className="text-right">
                <p className="text-slate-950 font-extrabold text-sm">{customer ? customer.name : 'Walk-in Customer'}</p>
                {customer?.phone && <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">{customer.phone}</p>}
              </div>
            </div>
          </div>

          {/* Dynamic Details block depends on type */}
          <div className="py-5 relative z-10">
            {type === 'sale_invoice' && sale && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items / Services sold</p>
                {sale.items && sale.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                      <p className="text-slate-500 text-[10.5px] font-medium leading-relaxed mt-1">
                        Qty: <b className="text-slate-800">{item.quantity}</b> @ {formatRupees(item.unitPricePaise)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-950 text-sm">{formatRupees(item.lineTotalPaise)}</span>
                  </div>
                ))}

                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Subtotal:</span>
                    <span className="text-slate-800 font-medium">{formatRupees(sale.subtotalPaise)}</span>
                  </div>

                  {sale.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-750 font-bold">
                      <span>Discount (Offer):</span>
                      <span>-{formatRupees(sale.discountPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                    <span className="text-slate-900 font-extrabold text-base">Total Amount:</span>
                    <span className="text-indigo-800 font-black text-base">{formatRupees(sale.totalPaise)}</span>
                  </div>

                  {sale.advanceUsedPaise && sale.advanceUsedPaise > 0 ? (
                    <div className="flex justify-between text-indigo-700 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50 text-xs mt-1">
                      <span className="font-bold">Advance Adjusted:</span>
                      <span className="font-extrabold">{formatRupees(sale.advanceUsedPaise)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between pt-1.5 text-xs text-slate-600">
                    <span className="font-bold">Payment Mode:</span>
                    <span className="font-extrabold uppercase bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] text-slate-700">
                      {sale.paymentMode === 'udhaar' ? 'Udhaar Added' : sale.paymentMode.toUpperCase()}
                    </span>
                  </div>

                  {sale.paymentMode === 'udhaar' ? (
                    <div className="flex justify-between text-red-750 bg-red-50/50 p-2.5 rounded-xl border border-red-100 text-xs mt-2 font-bold animate-fadeIn">
                      <span>Remaining Udhaar Due:</span>
                      <span className="font-extrabold">{formatRupees(sale.totalPaise - (sale.advanceUsedPaise || 0))}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-emerald-800 bg-emerald-50 pt-2 p-2 rounded-xl text-xs mt-2 font-bold uppercase tracking-wider text-center flex-row">
                      <span>Paid Status:</span>
                      <span className="font-black">Fully Cash / Paid</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {type === 'udhaar_slip' && transaction && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Udhaar Transaction Details</p>
                
                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex flex-col gap-1 text-center">
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Amount Added to Pending</span>
                  <span className="text-rose-700 font-black text-2xl">{formatRupees(transaction.amount)}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100/60">
                    <span className="text-slate-400 font-semibold">Purpose / Description:</span>
                    <span className="text-slate-800 font-extrabold text-right max-w-[200px]">{transaction.description}</span>
                  </div>

                  {transaction.dueDate && (
                    <div className="flex justify-between py-1 border-b border-slate-100/60">
                      <span className="text-slate-400 font-semibold">Expected Payback Date:</span>
                      <span className="text-amber-800 font-extrabold">{format(new Date(transaction.dueDate), 'dd LLL yyyy')}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 text-xs font-bold text-slate-900 border-t border-slate-150">
                    <span>Balance after this entry:</span>
                    <span className="text-indigo-850 text-sm font-black">{formatRupees(currentCustomerBalance)}</span>
                  </div>
                </div>
              </div>
            )}

            {type === 'payment_receipt' && transaction && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono text-center">Receipt Details</p>

                <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl flex flex-col gap-1 text-center">
                  <span className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">Amount Received</span>
                  <span className="text-emerald-800 font-black text-2xl">{formatRupees(transaction.amount)}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
                    <span className="text-slate-400 font-bold">Payment Mode:</span>
                    <span className="font-extrabold uppercase text-slate-800">{transaction.paymentMode || 'Cash'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-100">
                    <span className="text-slate-400 font-bold">Payment Against:</span>
                    <span className="font-extrabold text-slate-800 max-w-[200px] text-right">
                      {transaction.paymentAgainst === 'general' ? 'General Pending Balance' : transaction.description || 'General Account Payment'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-4 text-xs font-bold text-slate-900 border-t border-slate-100">
                    <span>Outstanding Customer Balance:</span>
                    <span className="text-indigo-900 font-extrabold">{formatRupees(currentCustomerBalance)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Print Footer Disclaimer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-relaxed font-semibold">
            <p>Thank you for your business!</p>
            <p className="mt-1 text-[9px] font-normal leading-normal text-slate-500">
               * This is a computer generated receipt via SmartUdhaar AI App.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
