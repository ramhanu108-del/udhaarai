import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, computeSupplierBalance } from '../store/useStore';
import { formatCurrency, cn } from '../utils';
import { Search, Plus, Truck, CreditCard, ShoppingBag } from 'lucide-react';
import { startOfDay } from 'date-fns';

export const Suppliers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { suppliers, supplierTransactions } = useStore();
  const [search, setSearch] = useState('');
  
  const activeFilter = searchParams.get('filter') || 'all';

  const setFilter = (filter: string) => {
    setSearchParams({ filter });
  };

  const now = new Date();
  const todayStart = startOfDay(now).getTime();

  // Statistics for Suppliers
  const totalSupplierPayable = (suppliers || []).reduce((sum, s) => {
    const bal = computeSupplierBalance(supplierTransactions, s.id);
    return sum + (bal > 0 ? bal : 0);
  }, 0);
  const todaysSupplierPaid = (supplierTransactions || []).filter(tx => tx.type === 'supplier_payment' && tx.status === 'active' && tx.createdAt >= todayStart).reduce((s, tx) => s + tx.amountPaise, 0) / 100;
  const todaysPurchaseCredit = (supplierTransactions || []).filter(tx => tx.type === 'purchase_credit' && tx.status === 'active' && tx.createdAt >= todayStart).reduce((s, tx) => s + tx.amountPaise, 0) / 100;

  const filteredSuppliers = (suppliers || [])
    .map(s => ({
      ...s,
      balance: computeSupplierBalance(supplierTransactions, s.id)
    }))
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone && s.phone.includes(search));
      if (!matchSearch) return false;

      if (activeFilter === 'payable') return s.balance > 0;
      if (activeFilter === 'advance') return s.balance < 0;
      if (activeFilter === 'settled') return s.balance === 0;
      return true;
    })
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100/50 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Suppliers
          </h1>
          <button 
            onClick={() => navigate('/suppliers/new')}
            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-col gap-3 mb-6">
           <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
              <p className="text-[9px] uppercase font-bold text-amber-600 mb-1">Total Supplier Payable</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalSupplierPayable)}</p>
            </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <p className="text-[9px] uppercase font-bold text-emerald-600 mb-1">Paid (Today)</p>
              <p className="text-base font-bold text-emerald-900">{formatCurrency(todaysSupplierPaid)}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <p className="text-[9px] uppercase font-bold text-slate-600 mb-1">Credit (Today)</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(todaysPurchaseCredit)}</p>
            </div>
          </div>
        </div>
        
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors"
            placeholder="Search supplier by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip active={activeFilter === 'all'} label="All" onClick={() => setFilter('all')} />
          <FilterChip active={activeFilter === 'payable'} label="Payable" onClick={() => setFilter('payable')} />
          <FilterChip active={activeFilter === 'advance'} label="Advance" onClick={() => setFilter('advance')} />
          <FilterChip active={activeFilter === 'settled'} label="Settled" onClick={() => setFilter('settled')} />
        </div>
      </div>

      <div className="flex-1 px-6 py-4 space-y-3 pb-24 h-full">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
          Supplier ko dena wala paisa yahan manage karein.
        </p>

        {filteredSuppliers.length === 0 ? (
          <EmptyState icon={Truck} message="No suppliers found" subMessage="Try changing filters or search" />
        ) : (
          filteredSuppliers.map((supplier) => (
            <div 
              key={supplier.id} 
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 active:bg-slate-50 cursor-pointer transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                     {supplier.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900 text-sm">{supplier.name}</h3>
                     <p className="text-[10px] text-slate-500">{supplier.phone || 'No phone'}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className={`text-sm font-bold ${supplier.balance > 0 ? 'text-amber-600' : (supplier.balance < 0 ? 'text-emerald-600' : 'text-slate-900')}`}>
                     {formatCurrency(Math.abs(supplier.balance))}
                   </p>
                   <p className={`text-[8px] uppercase font-bold tracking-wider ${supplier.balance > 0 ? 'text-amber-500' : (supplier.balance < 0 ? 'text-emerald-500' : 'text-slate-400')}`}>
                     {supplier.balance > 0 ? 'Payable' : (supplier.balance < 0 ? 'Advance' : 'Settled')}
                   </p>
                 </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/suppliers/${supplier.id}`);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold",
                    supplier.balance > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Supplier
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/suppliers/${supplier.id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Purchase Credit
                </button>
              </div>
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
