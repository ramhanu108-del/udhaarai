import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCustomerBalance, getOverdueCustomers, getTotalPending, getTransactions } from '../store/selectors';
import { formatCurrency, cn, generateReminderMessage, generateWhatsAppLink } from '../utils';
import { Search, Plus, User, MessageCircle, CreditCard } from 'lucide-react';
import { startOfDay } from 'date-fns';

export const Customers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customers, user } = useStore();
  const [search, setSearch] = useState('');
  
  const activeFilter = searchParams.get('filter') || 'all';

  useEffect(() => {
    if (searchParams.get('tab') === 'suppliers') {
      navigate('/suppliers', { replace: true });
    }
  }, [searchParams, navigate]);

  const setFilter = (filter: string) => {
    setSearchParams({ filter });
  };

  const now = new Date();
  const todayStart = startOfDay(now).getTime();

  // Statistics for Customers
  const totalCustomerPending = getTotalPending();
  const overdueCustomers = getOverdueCustomers();
  const totalOverdueAmount = overdueCustomers.reduce((sum, c) => sum + getCustomerBalance(c.id), 0);
  const todaysCollection = getTransactions().filter(tx => tx.type === 'payment' && tx.createdAt >= todayStart).reduce((s, tx) => s + tx.amount, 0);

  const overdueIds = new Set(overdueCustomers.map(c => c.id));

  const filteredCustomers = customers
    .map(c => ({
      ...c,
      calculatedBalance: getCustomerBalance(c.id)
    }))
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
      if (!matchSearch) return false;

      if (activeFilter === 'due') return c.calculatedBalance > 0;
      if (activeFilter === 'advance') return c.calculatedBalance < 0;
      if (activeFilter === 'settled') return c.calculatedBalance === 0;
      if (activeFilter === 'overdue') return overdueIds.has(c.id) && c.calculatedBalance > 0;
      return true;
    })
    .sort((a,b) => b.calculatedBalance - a.calculatedBalance);

  const sendReminder = (customer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const msg = generateReminderMessage(
      customer.name,
      customer.calculatedBalance,
      user.businessName,
      user.language,
      "short",
    );
    const link = generateWhatsAppLink(customer.phone, msg);
    window.open(link, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100/50 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Customers
          </h1>
          <button 
            onClick={() => navigate('/customers/new')}
            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <p className="text-[9px] uppercase font-bold text-indigo-600 mb-1">Total Pending</p>
              <p className="text-lg font-bold text-indigo-900">{formatCurrency(totalCustomerPending)}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <p className="text-[9px] uppercase font-bold text-emerald-600 mb-1">Aaj ki Collection</p>
              <p className="text-lg font-bold text-emerald-900">{formatCurrency(todaysCollection)}</p>
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-xl border border-red-100">
            <p className="text-[9px] uppercase font-bold text-red-600 mb-1">Overdue Amount</p>
            <p className="text-lg font-bold text-red-900">{formatCurrency(totalOverdueAmount)}</p>
          </div>
        </div>
        
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip active={activeFilter === 'all'} label="All" onClick={() => setFilter('all')} />
          <FilterChip active={activeFilter === 'due'} label="Due" onClick={() => setFilter('due')} />
          <FilterChip active={activeFilter === 'advance'} label="Advance" onClick={() => setFilter('advance')} />
          <FilterChip active={activeFilter === 'settled'} label="Settled" onClick={() => setFilter('settled')} />
          <FilterChip active={activeFilter === 'overdue'} label="Overdue" onClick={() => setFilter('overdue')} />
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-3 pb-24 h-full">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
          Customer se lene wala paisa yahan manage karein.
        </p>

        {filteredCustomers.length === 0 ? (
          <EmptyState icon={User} message="No customers found" subMessage="Try changing filters or search" />
        ) : (
          filteredCustomers.map((customer, index) => (
            <div 
              key={`${customer.id}-${index}`} 
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 active:bg-slate-50 cursor-pointer transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                     {customer.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                     <p className="text-[10px] text-slate-500">{customer.phone}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className={`text-sm font-bold ${customer.calculatedBalance > 0 ? 'text-red-600' : (customer.calculatedBalance < 0 ? 'text-emerald-600' : 'text-slate-900')}`}>
                     {formatCurrency(Math.abs(customer.calculatedBalance))}
                   </p>
                   <p className={`text-[8px] uppercase font-bold tracking-wider ${customer.calculatedBalance > 0 ? 'text-red-500' : (customer.calculatedBalance < 0 ? 'text-emerald-500' : 'text-slate-400')}`}>
                     {customer.calculatedBalance > 0 ? 'Due' : (customer.calculatedBalance < 0 ? 'Advance' : 'Settled')}
                   </p>
                 </div>
              </div>

              {customer.calculatedBalance > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => sendReminder(customer, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#25D366]/10 text-[#128C7E] rounded-lg text-[11px] font-bold active:bg-[#25D366]/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Reminder
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-transaction/${customer.id}?type=payment`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold active:bg-indigo-100"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border",
      active 
        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
        : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
    )}
  >
    {label}
  </button>
);

const EmptyState = ({ icon: Icon, message, subMessage }: any) => (
  <div className="text-center py-12 text-slate-500">
     <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
       <Icon className="w-8 h-8 text-slate-300" />
     </div>
     <p className="text-sm font-medium text-slate-700">{message}</p>
     <p className="text-xs text-slate-500 mt-1">{subMessage}</p>
  </div>
);

