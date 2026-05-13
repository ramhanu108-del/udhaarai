import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownLeft, 
  UserPlus, 
  Truck, 
  Wallet, 
  UserCircle, 
  PackagePlus, 
  Package,
  PlusCircle
} from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Customer Side',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      actions: [
        { label: 'Nayi Sale', icon: ShoppingBag, path: '/sales/new', color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
        { label: 'Give Udhaar', icon: ArrowUpRight, path: '/udhaar/new', color: 'text-red-600', bg: 'bg-red-100/50' },
        { label: 'Receive Payment', icon: ArrowDownLeft, path: '/payment/new', color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
        { label: 'Add Customer', icon: UserPlus, path: '/customers/new', color: 'text-slate-600', bg: 'bg-slate-100/50' },
      ]
    },
    {
      title: 'Supplier Side',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      actions: [
        { label: 'Supplier Purchase', icon: Truck, path: '/suppliers', color: 'text-amber-600', bg: 'bg-amber-100/50' },
        { label: 'Pay Supplier', icon: Wallet, path: '/suppliers', color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
        { label: 'Add Supplier', icon: UserCircle, path: '/suppliers/new', color: 'text-slate-600', bg: 'bg-slate-100/50' },
      ]
    },
    {
      title: 'Inventory',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      actions: [
        { label: 'Add Item', icon: PackagePlus, path: '/inventory/add', color: 'text-purple-600', bg: 'bg-purple-100/50' },
        { label: 'View Inventory', icon: Package, path: '/inventory', color: 'text-slate-600', bg: 'bg-slate-100/50' },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto no-visible-scrollbar pb-24">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Quick Actions</h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">Business ko speed se manage karein</p>
      </div>

      <div className="p-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
             <div className="flex items-center gap-2 px-1">
                <div className={`w-1 h-3 rounded-full ${section.bgColor.replace('50', '500')}`}></div>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${section.color}`}>{section.title}</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               {section.actions.map((action) => (
                 <button
                   key={action.label}
                   onClick={() => navigate(action.path)}
                   className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all active:scale-95 group"
                 >
                    <div className={`w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                       <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{action.label}</span>
                 </button>
               ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
