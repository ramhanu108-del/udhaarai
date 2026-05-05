import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency, generateInvoiceWhatsAppMessage, generateWhatsAppLink } from '../utils';
import { format } from 'date-fns';
import { ArrowLeft, Share2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, customers, user, markInvoicePaid, voidInvoice } = useStore();
  
  const invoice = invoices?.find(i => i.id === id);
  const customer = invoice?.customerId ? customers?.find(c => c.id === invoice.customerId) : null;

  if (!invoice) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-slate-50">
        <p className="text-slate-500 mb-4">Invoice not found</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  const handleShare = () => {
    const msg = generateInvoiceWhatsAppMessage(
      invoice.invoiceNumber,
      invoice.paymentStatus.toUpperCase(),
      invoice.totalPaise,
      user?.businessName || 'SmartUdhaar Store',
      customer?.name
    );

    if (customer?.phone) {
      window.open(generateWhatsAppLink(customer.phone, msg), '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      alert('Invoice message copied to clipboard!');
    }
  };

  const handleMarkPaid = () => {
    if (window.confirm('Mark this invoice as Paid? Note: This only changes the invoice status. It does not automatically create a payment receipt in ledger.')) {
      markInvoicePaid(invoice.id);
    }
  };

  const handleVoid = () => {
    if (window.confirm('Void this invoice? (If there is a linked sale, the sale will NOT be automatically voided to protect accounting.)')) {
      voidInvoice(invoice.id);
      navigate('/invoices');
    }
  };

  const isPaid = invoice.paymentStatus === 'paid';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800">Bill Details</span>
        </div>
        <button onClick={handleShare} className="text-indigo-600 p-2 rounded-full hover:bg-indigo-50">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* The Invoice Document */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
           
           {isPaid && (
             <div className="absolute top-10 right-6 opacity-10 rotate-12 transform pointer-events-none">
                <p className="text-6xl font-black text-emerald-600 uppercase tracking-widest border-8 border-emerald-600 px-4 py-2 rounded-xl">PAID</p>
             </div>
           )}

           <div className="text-center mb-6 pb-6 border-b border-dashed border-slate-200">
             <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
               {user?.businessName || 'INVOICE'}
             </h2>
             <p className="text-xs font-medium text-slate-500 mt-1">Tax Invoice / Bill of Supply</p>
           </div>

           <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
                <p className="font-bold text-slate-800 text-sm">{customer?.name || 'Walk-in Customer'}</p>
                {customer?.phone && <p className="text-xs text-slate-600 mt-0.5">+91 {customer.phone}</p>}
                {customer?.address && <p className="text-xs text-slate-500 mt-0.5 w-32 truncate">{customer.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Info</p>
                <p className="font-bold text-slate-800 text-xs">{invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-600 mt-0.5">{format(invoice.createdAt, "dd MMM yyyy")}</p>
                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                  {invoice.paymentMode}
                </p>
              </div>
           </div>

           {/* Items */}
           <div className="mb-6">
              <div className="flex justify-between border-b border-slate-200 pb-2 mb-3">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Description</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</span>
              </div>
              
              {invoice.items.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} x {formatCurrency(item.unitPricePaise)}</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{formatCurrency(item.lineTotalPaise)}</p>
                </div>
              ))}
           </div>

           {/* Totals */}
           <div className="col-span-full border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-xs font-bold text-slate-500">Subtotal</span>
                 <span className="text-sm font-bold text-slate-700">{formatCurrency(invoice.subtotalPaise)}</span>
              </div>
              {invoice.discountPaise > 0 && (
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500">Discount</span>
                   <span className="text-sm font-bold text-emerald-600">-{formatCurrency(invoice.discountPaise)}</span>
                </div>
              )}
              {invoice.taxPaise && invoice.taxPaise > 0 ? (
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs font-bold text-slate-500">Tax</span>
                   <span className="text-sm font-bold text-slate-700">+{formatCurrency(invoice.taxPaise)}</span>
                </div>
              ) : null}
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                 <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                 <span className="text-xl font-black text-slate-900">{formatCurrency(invoice.totalPaise)}</span>
              </div>
           </div>

           <div className="mt-8 text-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for your business!</p>
             {invoice.note && <p className="text-xs italic text-slate-500 mt-2">"{invoice.note}"</p>}
             {invoice.linkedSaleId && <p className="text-[10px] text-indigo-400 mt-2 font-medium">Auto-Synced with Ledger</p>}
           </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {!isPaid && (
            <Button onClick={handleMarkPaid} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs">
               Mark as Paid
            </Button>
          )}
          <Button onClick={handleShare} variant="outline" className="w-full h-12 border-slate-300 text-slate-700 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
             <Share2 className="w-4 h-4" /> Share Bill via WhatsApp
          </Button>
          <button onClick={handleVoid} className="w-full py-4 text-xs font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider">
             Void Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
