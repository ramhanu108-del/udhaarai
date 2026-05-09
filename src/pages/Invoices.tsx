import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getInvoices, getInvoicesByDateRange, getInvoicesSummary } from '../store/selectors';
import { formatCurrency } from '../utils';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Plus, FileText, XCircle } from 'lucide-react';
import { InvoiceStatus } from '../types';

export const Invoices = () => {
  const navigate = useNavigate();
  const { customers, voidInvoice } = useStore();
  const allInvoices = getInvoices();
  
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'month'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus>('all');

  const now = new Date();
  let start = 0;
  let end = Number.MAX_SAFE_INTEGER;

  if (filterPeriod === 'today') {
    start = startOfDay(now).getTime();
    end = endOfDay(now).getTime();
  } else if (filterPeriod === 'month') {
    start = startOfMonth(now).getTime();
    end = endOfMonth(now).getTime();
  }

  const filteredInvoices = allInvoices
    .filter(i => i.createdAt >= start && i.createdAt <= end)
    .filter(i => filterStatus === 'all' || i.paymentStatus === filterStatus)
    .sort((a,b) => b.createdAt - a.createdAt);

  const periodInvoices = allInvoices.filter(i => i.createdAt >= start && i.createdAt <= end);
  const summary = getInvoicesSummary(periodInvoices);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100/50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/more')} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          </div>
          <button 
            onClick={() => navigate('/invoices/new')}
            className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 pb-2">
          {['month', 'today', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filterPeriod === period ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full px-6 py-4 pb-24">
         {/* Summary Cards */}
         <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg mb-5">
           <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">
              Billed Amount ({filterPeriod})
           </p>
           <h3 className="text-3xl font-bold mb-3">{formatCurrency(summary.totalValuePaise)}</h3>
           <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-indigo-500/50">
              <div>
                <p className="text-[9px] text-emerald-200 uppercase font-bold tracking-wider">Paid</p>
                <p className="text-sm font-bold text-emerald-100">{formatCurrency(summary.paidValuePaise)}</p>
              </div>
               <div>
                <p className="text-[9px] text-red-200 uppercase font-bold tracking-wider">Unpaid</p>
                <p className="text-sm font-bold text-white">{formatCurrency(summary.unpaidValuePaise)}</p>
              </div>
           </div>
         </div>

         {/* Mode Filter */}
         <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {['all', 'paid', 'unpaid'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                  filterStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
         </div>

         {/* List */}
         {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
              <FileText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">Abhi koi bill nahi bana</p>
              <p className="text-xs text-slate-500 mt-1">Upar '+' dabakar naya bill banayein</p>
            </div>
         ) : (
            <div className="space-y-3">
              {filteredInvoices.map((inv, index) => {
                const customer = inv.customerId ? customers.find(c => c.id === inv.customerId) : null;
                const isPaid = inv.paymentStatus === 'paid';
                
                return (
                  <div key={`${inv.id}-${index}`} onClick={() => navigate(`/invoices/${inv.id}`)} className="bg-white rounded-xl p-4 border border-slate-200 relative overflow-hidden cursor-pointer hover:border-indigo-200 active:bg-slate-50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                           {customer ? customer.name : 'Walk-in Customer'} • {format(inv.createdAt, "h:mm a, d MMM")}
                        </p>
                        <div className="flex gap-2 items-center mt-2">
                          <span className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                          {inv.linkedSaleId && (
                             <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 border border-slate-200 text-slate-500 rounded">
                               Linked Sale
                             </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(inv.totalPaise)}</p>
                      </div>
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
