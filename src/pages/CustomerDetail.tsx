import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCustomerLedger, getCustomerBalance } from '../store/selectors';
import { formatCurrency, generateReminderMessage, generateWhatsAppLink, ReminderTone } from '../utils';
import { ArrowLeft, MessageCircle, Phone, FileText, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, user } = useStore();
  const [tone, setTone] = useState<ReminderTone>('polite');
  const [copied, setCopied] = useState(false);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  
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

  const generatedMessage = user ? generateReminderMessage(customer.name, customer.totalPending, user.businessName, user.language, tone) : '';

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
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
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
                         {tx.type === 'sale_credit' ? 'Credit Sale' : isUdhaar ? 'Udhaar Given' : 'Payment Received'}
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

                   <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                     <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                       Balance After
                     </span>
                     <span className="text-[10px] font-bold text-slate-700">
                       {formatCurrency(Math.abs(tx.runningBalance))} {tx.runningBalance > 0 ? '(Due)' : (tx.runningBalance < 0 ? '(Adv)' : '')}
                     </span>
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
    </div>
  );
};
