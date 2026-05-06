import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, TrendingUp, IndianRupee, PackageOpen, Users, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export const Reports = () => {
  const navigate = useNavigate();
  const { sales, invoices, customers, inventory, transactions } = useStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Quick stats
  const totalPendingUdhaar = customers.reduce((sum, c) => sum + (c.totalPending || 0), 0);
  
  const todaysSales = sales.filter(s => s.createdAt >= today.getTime());
  const todaysSalesTotal = todaysSales.reduce((sum, s) => sum + s.totalPaise, 0);

  const todaysPayments = transactions.filter(t => t.type === 'payment' && t.createdAt >= today.getTime());
  const todaysCollection = todaysPayments.reduce((sum, t) => sum + t.amount, 0);

  const lowStockItems = inventory.filter(i => i.stockQty <= i.lowStockAlertQty);
  
  const unpaidInvoices = invoices.filter(i => i.paymentStatus !== 'paid' && i.status !== 'void');

  const topUdhaarCustomers = [...customers]
    .sort((a, b) => (b.totalPending || 0) - (a.totalPending || 0))
    .filter(c => (c.totalPending || 0) > 0)
    .slice(0, 5);

  const pendingAmountStr = `₹${(totalPendingUdhaar / 100).toFixed(0)}`;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Reports</h1>
            <p className="text-xs text-slate-500 font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
        
        {/* Today's Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
             <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Aaj ki Sale</p>
             <p className="text-lg font-black text-slate-900">₹{(todaysSalesTotal / 100).toFixed(0)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
             <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                <IndianRupee className="w-4 h-4" />
             </div>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Aaj Collection</p>
             <p className="text-lg font-black text-slate-900">₹{(todaysCollection / 100).toFixed(0)}</p>
          </div>
        </div>

        {/* Overall Pending */}
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-orange-900 mb-1 flex items-center gap-2">
                   <Users className="w-4 h-4" /> Total Pending Udhaar
                </p>
                <p className="text-3xl font-black text-orange-700">{pendingAmountStr}</p>
             </div>
          </div>
        </div>

        {/* Operational Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
           <div className="p-4 flex items-center justify-between hover:bg-slate-50" onClick={() => navigate('/inventory')}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <PackageOpen className="w-4 h-4 text-red-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900">Low Stock Items</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Restock needed</p>
                 </div>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                 {lowStockItems.length}
              </div>
           </div>

           <div className="p-4 flex items-center justify-between hover:bg-slate-50" onClick={() => navigate('/invoices')}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900">Unpaid Bills</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Pending invoices</p>
                 </div>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                 {unpaidInvoices.length}
              </div>
           </div>
        </div>

        {/* Top Pending Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
           <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
             <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Wapas Lene Wala Paisa</h3>
           </div>
           {topUdhaarCustomers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Koi udhaar baki nahi hai.</div>
           ) : (
             <div className="divide-y divide-slate-100">
               {topUdhaarCustomers.map(c => (
                 <div key={c.id} className="p-4 flex items-center justify-between" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div>
                       <p className="text-sm font-bold text-slate-900">{c.name}</p>
                       <p className="text-xs text-slate-500">{c.phone}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">₹{(c.totalPending / 100).toFixed(0)}</p>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
