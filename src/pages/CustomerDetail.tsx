import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  FileText, 
  Check, 
  Copy,
  AlertCircle,
  Clock,
  Trash2,
  Share2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCustomerLedger } from '../store/selectors';
import { formatCurrency } from '../utils';

type ReminderTone = 'polite' | 'friendly' | 'strict' | 'short';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, transactions, voidTransaction, inventory } = useStore();
  
  const customer = customers.find(c => c.id === id);
  const ledger = useMemo(() => getCustomerLedger(id || ''), [id, transactions, customers]);

  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [tone, setTone] = useState<ReminderTone>('polite');
  const [copied, setCopied] = useState(false);
  const [transactionToVoid, setTransactionToVoid] = useState<{id: string, isInventoryLinked: boolean} | null>(null);
  const [showStatementOptions, setShowStatementOptions] = useState(false);
  const [voidMessage, setVoidMessage] = useState<string>('');

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-slate-800">Customer not found</h1>
        <button 
          onClick={() => navigate('/udhaar')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getReminderText = () => {
    const amount = formatCurrency(customer.totalPending);
    const shopName = "SmartUdhaar User Shop"; // Default shop name
    
    switch (tone) {
      case 'friendly':
        return `Namaste ${customer.name}, aapka ${amount} udhaar pending hai. Jab samay mile tab payment kar dena. Dhanyawad! - ${shopName}`;
      case 'strict':
        return `Urgent: ${customer.name}, aapka ${amount} ka udhaar pending hai. Aaj payment clear karein warna aage udhaar nahi mil payega. - ${shopName}`;
      case 'short':
        return `Paisa Baki: ${amount}. Jaldi jama karayein. - ${shopName}`;
      default:
        return `Namaste ${customer.name}, reminder for pending amount: ${amount}. Please clear it at the earliest. Thank you! - ${shopName}`;
    }
  };

  const handleReminder = () => {
    const text = encodeURIComponent(getReminderText());
    window.open(`https://wa.me/91${customer.phone}?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getReminderText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoid = () => {
    if (!transactionToVoid) return;
    
    const tx = ledger.find(t => t.id === transactionToVoid.id);
    if (!tx) return;

    // Call store action to void
    voidTransaction(transactionToVoid.id);
    
    // If inventory linked, show message that stock is returned
    if (transactionToVoid.isInventoryLinked && tx.inventoryItemId) {
      const item = inventory.find(i => i.id === tx.inventoryItemId);
      setVoidMessage(`Stock Returned: ${tx.amount / (tx as any).rate || 1} ${item?.unit || 'pcs'} returned to inventory.`);
      setTimeout(() => setVoidMessage(''), 3000);
    }

    setTransactionToVoid(null);
  };

  const displayLedger = [...ledger].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full px-6 pt-6 pb-8">
      {/* Header */}
      <div className="bg-white pb-4 border-b border-slate-100">
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
           Statement Share
         </button>
         <button 
            type="button"
            onClick={() => navigate(`/documents?customerId=${customer.id}`)}
            className="w-full mt-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
         >
            <FileText className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
            Documents
        </button>
      </div>

      {/* Transactions List */}
      <div className="px-6 py-6 pb-12">
        <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">Ledger History</h3>
        {displayLedger.length === 0 ? (
           <div className="text-center py-12 text-slate-400 flex flex-col items-center">
             <FileText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
             <p className="text-sm">No transactions yet</p>
           </div>
        ) : (
           <div className="space-y-6 relative pl-4 border-l-2 border-slate-100">
             {displayLedger.map((tx) => {
               const isUdhaar = tx.type === 'udhaar' || tx.type === 'sale_credit' || tx.type === 'advance_adjustment';
               const isAdvanceAdj = tx.type === 'advance_adjustment';
               return (
                 <div key={tx.id} className="relative bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all active:shadow-none mb-2">
                   {/* Timeline dot */}
                   <div className={`absolute -left-[23px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${isAdvanceAdj ? 'bg-indigo-400' : (isUdhaar ? 'bg-red-400' : 'bg-emerald-400')}`}></div>

                   <div className="flex justify-between items-start mb-3">
                     <div className="flex-1 pr-3">
                       <p className="font-bold text-slate-900 text-sm leading-tight">
                         {tx.type === 'sale_credit' ? 'Credit Sale / Inventory Udhaar' : 
                          tx.type === 'advance_adjustment' ? 'Advance Adjusted' : 
                          (tx.type === 'udhaar' && tx.inventoryItemId) ? 'Inventory Udhaar' : 
                          (tx.type === 'payment' && tx.linkedUdhaarTransactionId) ? 'Payment Received' : 
                          (tx.type === 'udhaar' || tx.type === 'sale_credit') ? 'Udhaar Given' : 'Payment Received'}
                       </p>
                       <p className="text-[10px] text-slate-500 mt-1.5">{format(tx.createdAt, "dd MMM yyyy, hh:mm a")}</p>
                     </div>
                     <div className={`text-right shrink-0 ${isAdvanceAdj ? 'text-indigo-600' : (isUdhaar && tx.type !== 'advance_adjustment' ? 'text-red-600' : 'text-emerald-600')}`}>
                        <div className="font-bold text-base">
                          {isUdhaar ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                        <div className="mt-1 flex flex-col items-end gap-1">
                          {(tx.type === 'payment' && tx.paymentMode) && (
                            <span className="text-[8px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded leading-none">
                              {tx.paymentMode}
                            </span>
                          )}
                          {isUdhaar && (
                            <span className="text-[8px] uppercase font-bold tracking-widest bg-red-100 text-red-700 px-1.5 py-0.5 rounded leading-none">
                              Udhaar
                            </span>
                          )}
                        </div>
                     </div>
                   </div>
                   
                   {(tx.type === 'payment' && tx.linkedUdhaarTransactionId) && (
                     <div className="mb-3">
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                          Payment Against Udhaar
                        </span>
                     </div>
                   )}

                   {tx.description && (
                     <p className="text-[11px] text-slate-600 mb-3 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                       {tx.description}
                     </p>
                   )}

                   {tx.dueDate && isUdhaar && tx.status === 'active' && (
                     <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 w-max">
                       <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                       <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                         Due: {format(new Date(tx.dueDate), 'dd MMM yyyy')}
                       </p>
                     </div>
                   )}

                   <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 flex-wrap gap-y-3">
                     <div className="flex items-center gap-2">
                       <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                         Pending After Entry:
                       </span>
                       <span className="text-[11px] font-bold text-slate-800">
                          {formatCurrency(Math.abs(tx.runningBalance))} {tx.runningBalance > 0 ? '(Due)' : (tx.runningBalance < 0 ? '(Adv)' : '')}
                       </span>
                     </div>
                     
                     {(() => {
                        const isUdhaarDoc = tx.type === 'udhaar' || tx.type === 'sale_credit';
                        const hasDoc = tx.documentGenerated || !!tx.documentType || !!tx.receiptNumber || !!tx.slipNumber;
                        if (!hasDoc) return null;
                        const docType = isUdhaarDoc ? 'udhaar_slip' : 'payment_receipt';
                        const btnLabel = isUdhaarDoc ? 'View Udhaar Slip' : 'View Receipt';
                        return (
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/${docType}/${tx.id}`)}
                            className="text-[9px] uppercase font-bold text-indigo-650 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all border border-indigo-100 active:scale-95 mr-1"
                          >
                            {btnLabel}
                          </button>
                        );
                      })()}
                      {tx.status === 'active' && (
                       <button 
                         onClick={() => setTransactionToVoid({ id: tx.id, isInventoryLinked: Boolean(tx.inventoryItemId && tx.type !== 'payment') })}
                         className="text-[9px] uppercase font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all border border-red-100 active:scale-95"
                       >
                         Void Entry
                       </button>
                     )}
                   </div>
                 </div>
               );
             })}
             {/* Account Setup label */}
             <div className="relative pt-4">
                <div className="absolute -left-[23px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-300"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Created</p>
             </div>
           </div>
        )}
        
        <div className="h-6 shrink-0" aria-hidden="true" />
        
      </div>

      {/* Void Success Notification */}
      {voidMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <Check className="w-3 h-3 text-emerald-400" />
          {voidMessage}
        </div>
      )}

      {/* Statement Options Bottom Sheet */}
      {showStatementOptions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">Statement Nikalein</h2>
             <p className="text-sm text-slate-500 mb-8">Aap pichle len-den ki report share kar sakte hain.</p>
             
             <div className="space-y-3">
               <button 
                 onClick={() => {
                   setShowStatementOptions(false);
                   alert('PDF generating... (Demo)');
                 }}
                 className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                     <FileText className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <p className="font-bold text-slate-900 text-sm">Download PDF Report</p>
                     <p className="text-[10px] text-slate-500">Professional bill jaisa format</p>
                   </div>
                 </div>
                 <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400" />
               </button>

               <button 
                 onClick={() => {
                   setShowStatementOptions(false);
                 }}
                 className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366]">
                     <Share2 className="w-5 h-5" />
                   </div>
                   <div className="text-left">
                     <p className="font-bold text-slate-900 text-sm">WhatsApp Share</p>
                     <p className="text-[10px] text-slate-500">Customer ko direct bhejien</p>
                   </div>
                 </div>
                 <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400" />
               </button>
             </div>

             <button 
               onClick={() => setShowStatementOptions(false)}
               className="w-full mt-6 py-4 text-slate-500 font-bold text-sm"
             >
               Cancel
             </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Voiding */}
      {transactionToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
               <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Entry Void Karein?</h3>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              Kya aap is entry ko cancel karna chahte hain? {transactionToVoid.isInventoryLinked && "Isse stock wapas inventory mein jud jayega."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setTransactionToVoid(null)}
                className="py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm active:bg-slate-200 transition-colors"
              >
                Nahi, Ruko
              </button>
              <button 
                onClick={handleVoid}
                className="py-3 px-4 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 active:scale-95 transition-transform"
              >
                Haan, Void Karo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
