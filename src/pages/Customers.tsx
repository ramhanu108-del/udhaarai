import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils';
import { Search, Plus, User, ArrowRight } from 'lucide-react';

export const Customers = () => {
  const navigate = useNavigate();
  const { customers } = useStore();
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  ).sort((a,b) => b.totalPending - a.totalPending);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100/50 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <button 
            onClick={() => navigate('/customers/new')}
            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
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
      </div>

      <div className="flex-1 px-6 py-4 space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
             <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-sm font-medium text-slate-700">Abhi koi customer nahi hai</p>
             <p className="text-xs text-slate-500 mt-1">Upar '+' dabakar pehla customer add karein</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between active:bg-slate-100 cursor-pointer transition-colors"
            >
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                   {customer.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                   <p className="text-[10px] text-slate-500">{customer.phone}</p>
                 </div>
               </div>
               <div className="text-right flex items-center space-x-3">
                 <div>
                   <p className={`text-sm font-bold ${customer.totalPending > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                     {formatCurrency(Math.abs(customer.totalPending))}
                   </p>
                   <p className={`text-[8px] uppercase font-bold tracking-wider ${customer.totalPending > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                     {customer.totalPending > 0 ? 'Due' : (customer.totalPending < 0 ? 'Advance' : 'Settled')}
                   </p>
                 </div>
                 <ArrowRight className="w-4 h-4 text-slate-300" />
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
