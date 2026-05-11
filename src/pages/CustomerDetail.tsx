import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCustomerLedger, getCustomerBalance } from '../store/selectors';
import { formatCurrency, generateReminderMessage, generateWhatsAppLink, ReminderTone } from '../utils';
import { ArrowLeft, MessageCircle, Phone, FileText, Copy, Check, Download } from 'lucide-react';
import { format } from 'date-fns';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, user, voidTransaction } = useStore();
  const [tone, setTone] = useState<ReminderTone>('polite');
  const [copied, setCopied] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [transactionToVoid, setTransactionToVoid] = useState<{id: string, isInventoryLinked: boolean} | null>(null);
  const [voidMessage, setVoidMessage] = useState('');
  const [showStatementOptions, setShowStatementOptions] = useState(false);
  const [copiedStatement, setCopiedStatement] = useState(false);

  
  const customer = customers.find(c => c.id === id);
  const ledger = id ? getCustomerLedger(id) : [];
  // Reverse for display so newest is on top
  const displayLedger = [...ledger].reverse();

  if (!customer) {
    return (
      <div className="flex h-full items-center justify-center bg-white flex-col">
         <p className="text-slate-500 mb-4">Customer not found</p>
         <button onClick={() => navigate('/customers')} className="text-indigo-600 font-bold">Go back</button>
      </div>
    );
  }

  let oldestDueDate: string | undefined = undefined;
  if (customer.totalPending > 0) {
    const udhaarsWithDue = ledger.filter(t => (t.type === 'udhaar' || t.type === 'sale_credit') && t.dueDate && t.status === 'active');
    if (udhaarsWithDue.length > 0) {
       const earliest = udhaarsWithDue.reduce((prev, curr) => {
          const prevTime = new Date(prev.dueDate!).getTime();
          const currTime = new Date(curr.dueDate!).getTime();
          return currTime < prevTime ? curr : prev;
       });
       oldestDueDate = format(new Date(earliest.dueDate!), 'dd MMM yyyy');
    }
  }

  const generatedMessage = user ? generateReminderMessage(customer.name, customer.totalPending, user.businessName, user.language, tone, oldestDueDate) : '';

  const handleReminder = () => {
    if(!user) return;
    const link = generateWhatsAppLink(customer.phone, generatedMessage);
    window.open(link, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmVoid = () => {
    if (transactionToVoid) {
      const res = voidTransaction(transactionToVoid.id);
      setVoidMessage(res.message);
      setTimeout(() => {
        setVoidMessage('');
        setTransactionToVoid(null);
      }, 2000);
    }
  };

  const generateStatementText = () => {
    let totalUdhaar = 0;
    let totalPayment = 0;
    const activeLedger = ledger.filter(t => t.status === 'active');
    
    activeLedger.forEach(t => {
      if (t.type === 'udhaar' || t.type === 'sale_credit') totalUdhaar += t.amount;
      if (t.type === 'payment' || t.type === 'refund') totalPayment += t.amount;
    });

    const balStr = customer.totalPending > 0 ? `pending balance ₹${formatCurrency(customer.totalPending)}` : 
                   customer.totalPending < 0 ? `advance balance ₹${formatCurrency(Math.abs(customer.totalPending))}` : 
                   `balance ₹0`;

    let text = `Namaste ${customer.name} ji, aapka current ${balStr} hai.\n\n`;

    text += `*--- Khata Statement ---*\n`;
    text += `Shop: ${user?.businessName || 'SmartUdhaar AI'}\n`;
    text += `Customer: ${customer.name}\n`;
    if (customer.phone) text += `Phone: ${customer.phone}\n`;
    text += `Date: ${format(new Date(), 'dd MMM yyyy')}\n\n`;
    
    text += `Total Udhaar: ₹${formatCurrency(totalUdhaar)}\n`;
    text += `Total Payment: ₹${formatCurrency(totalPayment)}\n`;
    text += `Balance: ₹${formatCurrency(Math.abs(customer.totalPending))} ${customer.totalPending > 0 ? '(Due)' : customer.totalPending < 0 ? '(Adv)' : ''}\n\n`;
    text += `*--- Last 10 Transactions ---*\n`;
    
    const last10 = [...activeLedger].reverse().slice(0, 10);
    last10.forEach(t => {
      const isUdhaar = t.type === 'udhaar' || t.type === 'sale_credit';
      const sign = isUdhaar ? '+' : '-';
      text += `${format(t.createdAt, 'dd/MM/yy')}: ${sign}₹${formatCurrency(t.amount)}`;
      if (t.description) {
        text += ` (${t.description.substring(0, 20)})`;
      }
      text += `\n`;
    });

    if (customer.totalPending > 0) {
      text += `\nKripya pending amount clear karein.\n`;
    }
    return text;
  };

  const handleShareStatementWA = () => {
    const text = generateStatementText();
    const link = generateWhatsAppLink(customer.phone, text);
    window.open(link, '_blank');
  };

  const handleCopyStatement = () => {
    const text = generateStatementText();
    navigator.clipboard.writeText(text);
    setCopiedStatement(true);
    setTimeout(() => setCopiedStatement(false), 2000);
  };

  const handleDownloadStatement = () => {
    const text = generateStatementText();
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Statement_${customer.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMMyyyy')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
             <h1 className="text-lg font-bold text-slate-900 leading-tight">{customer.name}</h1>
             <p className="text-[10px] text-slate-500">{customer.phone}</p>
          </div>
          <a href={`tel:${customer.phone}`} className="w-10 h-10 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
             <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Balance Card */}
        <div className={`p-4 rounded-xl relative overflow-hidden ${customer.totalPending > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
           <p className={`text-[10px] items-center gap-1 font-bold uppercase tracking-wider mb-1 ${customer.totalPending > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
             {customer.totalPending > 0 ? 'Paisa LENA Hai (Pending)' : (customer.totalPending < 0 ? 'Paisa DENA Hai (Advance)' : 'All Settled')}
             {customer.totalPending > 0 && <span className="ml-2 w-2 h-2 inline-block bg-red-500 rounded-full animate-pulse"></span>}
           </p>
           <h2 className={`text-3xl font-bold tracking-tight ${customer.totalPending > 0 ? 'text-red-900' : 'text-emerald-900'}`}>
             {formatCurrency(Math.abs(customer.totalPending))}
           </h2>

           {customer.totalPending > 0 && (
             <div className="mt-4">
               {!showReminderOptions ? (
                 <button 
                    onClick={() => setShowReminderOptions(true)}
                    className="flex w-full items-center gap-2 justify-center bg-[#25D366] text-white py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform"
                 >
                   <MessageCircle className="w-4 h-4" />
                   <span>Send WhatsApp</span>
                 </button>
               ) : (
                 <div className="bg-white/60 p-3 rounded-lg border border-[#25D366]/20 mt-2">
                   <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                      {(['polite', 'friendly', 'strict', 'short'] as ReminderTone[]).map(t => (
                        <button 
                          key={t}
                          onClick={() => setTone(t)}
                          className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${tone === t ? 'bg-[#25D366] text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                        >
                          {t}
                        </button>
                      ))}
                   </div>
                   <div className="flex gap-2">
                     <button 
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-200 active:bg-slate-50 transition-colors"
                     >
                       {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                       {copied ? 'Copied' : 'Copy Text'}
                     </button>
                     <button 
                        onClick={handleReminder}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform"
                     >
                       <MessageCircle className="w-3 h-3" />
                       Open WA
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
           <button 
             onClick={() => navigate(`/add-transaction/${customer.id}?type=payment`)}
             className="bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
           >
             Add Payment
           </button>
           <button 
             onClick={() => navigate(`/add-transaction/${customer.id}?type=udhaar`)}
             className="bg-red-50 text-red-700 border border-red-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
           >
             Give Udhaar
           </button>
        </div>
        <button 
           onClick={() => setShowStatementOptions(true)}
           className="w-full mt-2 bg-indigo-50 text-indigo-700 border border-indigo-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
        >
           <FileText className="w-4 h-4 mr-2" />
           Statement Share Karo
        </button>
      </div>

      {/* Transactions List */}
      <div className="flex-1 px-6 py-4 pb-24">
        <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Ledger History</h3>
        {displayLedger.length === 0 ? (
           <div className="text-center py-12 text-slate-400 flex flex-col items-center">
             <FileText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
             <p className="text-sm">No transactions yet</p>
           </div>
        ) : (
           <div className="space-y-3 relative pl-4 border-l-2 border-slate-100">
             {displayLedger.map((tx, idx) => {
               const isUdhaar = tx.type === 'udhaar' || tx.type === 'sale_credit';
               return (
                 <div key={tx.id} className="relative bg-slate-50 rounded-xl p-3 border border-slate-100">
                   {/* Timeline dot */}
                   <div className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white ${isUdhaar ? 'bg-red-400' : 'bg-emerald-400'}`}></div>

                   <div className="flex justify-between items-start mb-1">
                     <div>
                       <p className="font-bold text-slate-900 text-sm">
                         {tx.type === 'sale_credit' ? 'Credit Sale' : (tx.type === 'udhaar' && tx.inventoryItemId) ? 'Inventory Udhaar' : (tx.type === 'payment' && tx.linkedUdhaarTransactionId) ? 'Payment Against Udhaar' : isUdhaar ? 'Udhaar Given' : 'Payment Received'}
                       </p>
                       <p className="text-[10px] text-slate-500 mt-0.5">{format(tx.createdAt, "dd MMM yyyy, hh:mm a")}</p>
                     </div>
                     <div className={`text-right ${isUdhaar ? 'text-red-600' : 'text-emerald-600'}`}>
                        <div className="font-bold text-sm">
                          {isUdhaar ? '+' : '-'} {formatCurrency(tx.amount)}
                        </div>
                     </div>
                   </div>
                   
                   {tx.description && (
                     <p className="text-[11px] text-slate-600 mb-2 mt-1">{tx.description}</p>
                   )}

                   {tx.dueDate && isUdhaar && (
                     <p className="text-[10px] font-bold text-amber-600 mb-2 mt-1">
                       Due: {format(new Date(tx.dueDate), 'dd MMM yyyy')}
                     </p>
                   )}

                   <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                     <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                       Balance After
                     </span>
                     <div className="flex items-center gap-3">
                       {tx.status === 'active' && (
                         <button 
                           onClick={() => setTransactionToVoid({ id: tx.id, isInventoryLinked: Boolean(tx.inventoryItemId && tx.type !== 'payment') })}
                           className="text-[9px] uppercase font-bold text-red-500 hover:text-red-600 transition-colors"
                         >
                           Void
                         </button>
                       )}
                       <span className="text-[10px] font-bold text-slate-700">
                         {formatCurrency(Math.abs(tx.runningBalance))} {tx.runningBalance > 0 ? '(Due)' : (tx.runningBalance < 0 ? '(Adv)' : '')}
                       </span>
                     </div>
                   </div>

                 </div>
               )
             })}
             {/* Account Setup label */}
             <div className="relative pt-4">
                <div className="absolute -left-[23px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-300"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Created</p>
             </div>
           </div>
        )}
      </div>
      {/* Void Confirmation Modal */}
      {transactionToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Void Transaction</h3>
            <p className="text-sm text-slate-600 mb-6">
              Is entry ko void karna hai? {transactionToVoid.isInventoryLinked && <span className="font-bold text-indigo-600 block mt-1">Agar inventory linked hai to stock restore hoga.</span>}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTransactionToVoid(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmVoid}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Customer Statement</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleShareStatementWA}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-transform"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Share
              </button>
              <button 
                onClick={handleCopyStatement}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                {copiedStatement ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                {copiedStatement ? 'Copied' : 'Copy Statement'}
              </button>
              <button 
                onClick={handleDownloadStatement}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold active:scale-95 transition-transform"
              >
                <Download className="w-5 h-5" />
                Download TXT
              </button>
              <button 
                onClick={() => setShowStatementOptions(false)}
                className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {voidMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-max bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-bottom-5 z-50 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {voidMessage}
        </div>
      )}
    </div>
  );
};
