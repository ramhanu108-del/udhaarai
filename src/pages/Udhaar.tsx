import React from 'react';
import { useStore } from '../store/useStore';
import { getCustomerBalance, getOverdueCustomers } from '../store/selectors';
import { formatCurrency, generateWhatsAppLink, generateReminderMessage } from '../utils';
import { startOfDay, endOfDay } from 'date-fns';
import { MessageCircle, Plus, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Udhaar = () => {
  const { customers, transactions, user } = useStore();
  const navigate = useNavigate();
  
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  
  // Calculate today's collection
  const todaysPayments = transactions.filter(t => 
    t.status === 'active' && 
    (t.type === 'payment' || t.type === 'adjustment') &&
    t.createdAt >= todayStart && t.createdAt <= todayEnd
  );
  
  const collectedToday = todaysPayments.reduce((sum, t) => sum + t.amount, 0);

  // High Pending customers
  const highPendingCustomers = customers.filter(c => getCustomerBalance(c.id) > 100000); // 1000 Rs
  
  // Overdue customers
  const overdueCustomers = getOverdueCustomers();
  
  // Actually, we need to show Due Today, Overdue, and High Pending. 
  // Let's create categories.
  
  // Filter out any overlap so they only appear once
  const overdueIds = overdueCustomers.map(c => c.id);
  const highPendingIds = highPendingCustomers.map(c => c.id);
  
  // For MVP, expected collection is overdue + due today + high pending. Let's just sum all pending above 0 for total expected.
  // Realistically, "Remaining expected" = Total Overdue balances
  const remainingExpected = overdueCustomers.reduce((sum, c) => sum + getCustomerBalance(c.id), 0);

  // We want to combine them into a list
  const collectionList = Array.from(new Set([...overdueCustomers, ...highPendingCustomers]));

  const sendReminder = (customer: any) => {
    if(!user) return;
    const msg = generateReminderMessage(customer.name, getCustomerBalance(customer.id), user.businessName, user.language, 'short');
    const link = generateWhatsAppLink(customer.phone, msg);
    window.open(link, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-6 border-b border-slate-100/50 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">Daily Khata</h1>
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">Collection & Reminders</p>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
             <p className="text-[9px] uppercase font-bold text-emerald-600 mb-1">Collected Today</p>
             <p className="text-xl font-bold text-emerald-900">{formatCurrency(collectedToday)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
             <p className="text-[9px] uppercase font-bold text-red-600 mb-1">Pending Overdue</p>
             <p className="text-xl font-bold text-red-900">{formatCurrency(remainingExpected)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Need Attention
        </h3>
        
        {collectionList.length === 0 ? (
           <div className="text-center py-12 text-slate-400 flex flex-col items-center">
             <FileText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
             <p className="text-sm">Great! No high pending or overdue.</p>
           </div>
        ) : (
           <div className="space-y-3">
             {collectionList.map(customer => {
               const bal = getCustomerBalance(customer.id);
               if (bal <= 0) return null; // Defensive check
               return (
                 <div key={customer.id} className="bg-white rounded-xl p-3 border border-slate-200">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                       </div>
                       <div onClick={() => navigate(`/customers/${customer.id}`)} className="cursor-pointer">
                         <p className="font-bold text-slate-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{customer.name}</p>
                         <p className="text-[10px] text-slate-500">{customer.phone}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-red-600 text-sm">{formatCurrency(bal)}</p>
                       {overdueIds.includes(customer.id) ? (
                         <span className="text-[8px] uppercase font-bold tracking-wider bg-red-100 text-red-600 px-1 py-0.5 rounded">Overdue</span>
                       ) : (
                         <span className="text-[8px] uppercase font-bold tracking-wider bg-orange-100 text-orange-600 px-1 py-0.5 rounded">High Bal</span>
                       )}
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                     <button 
                       onClick={() => sendReminder(customer)}
                       className="flex-1 flex gap-1.5 items-center justify-center py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] font-bold text-xs active:bg-[#25D366]/20 transition-colors"
                     >
                       <MessageCircle className="w-3.5 h-3.5" /> Reminder
                     </button>
                     <button 
                       onClick={() => navigate(`/add-transaction/${customer.id}?type=payment`)}
                       className="flex-1 flex gap-1.5 items-center justify-center py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs active:bg-emerald-200 transition-colors"
                     >
                       <Plus className="w-3.5 h-3.5" /> Payment
                     </button>
                   </div>
                 </div>
               );
             })}
           </div>
        )}
      </div>
    </div>
  );
};
