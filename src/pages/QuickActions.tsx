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
      title: 'Sales',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: 'Apni dukan ki sales record aur track karein.',
      actions: [
        { 
          label: 'Nayi Sale', 
          icon: ShoppingBag, 
          path: '/sales/new', 
          color: 'text-violet-600', 
          bg: 'bg-violet-100/50', 
          fullWidth: true,
          cardBg: 'bg-violet-50/20',
          cardBorder: 'border-violet-100/70',
          hoverBorder: 'hover:border-violet-300',
          subtitle: 'Store ki nayi cash/credit sale'
        },
      ]
    },
    {
      title: 'Customer Hisab',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Customer se lena-dena yahan manage karein.',
      actions: [
        { 
          label: 'Give Udhaar', 
          icon: ArrowUpRight, 
          path: '/add-transaction/select?type=udhaar', 
          color: 'text-rose-600', 
          bg: 'bg-rose-100/60', 
          cardBg: 'bg-rose-50/40',
          cardBorder: 'border-rose-100',
          hoverBorder: 'hover:border-rose-300',
          subtitle: 'Baki badhega'
        },
        { 
          label: 'Receive Payment', 
          icon: ArrowDownLeft, 
          path: '/add-transaction/select?type=payment', 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-100/60', 
          cardBg: 'bg-emerald-50/40',
          cardBorder: 'border-emerald-100',
          hoverBorder: 'hover:border-emerald-300',
          subtitle: 'Baki kam hoga'
        },
        { 
          label: 'Add Customer', 
          icon: UserPlus, 
          path: '/customers/new', 
          color: 'text-slate-600', 
          bg: 'bg-slate-100/70', 
          fullWidth: true, 
          cardBg: 'bg-slate-50/30',
          cardBorder: 'border-slate-100',
          hoverBorder: 'hover:border-slate-300',
          subtitle: 'Naya customer account kholien'
        },
      ]
    },
    {
      title: 'Supplier Hisab',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Supplier ka lena-dena aur purchases record karein.',
      actions: [
        { 
          label: 'Supplier Purchase', 
          icon: Truck, 
          path: '/suppliers', 
          color: 'text-amber-600', 
          bg: 'bg-amber-100/60', 
          cardBg: 'bg-amber-50/30',
          cardBorder: 'border-amber-100',
          hoverBorder: 'hover:border-amber-300',
          subtitle: 'Maal khareeda'
        },
        { 
          label: 'Pay Supplier', 
          icon: Wallet, 
          path: '/suppliers', 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-100/60', 
          cardBg: 'bg-emerald-50/30',
          cardBorder: 'border-emerald-100',
          hoverBorder: 'hover:border-emerald-300',
          subtitle: 'Paisa diya'
        },
        { 
          label: 'Add Supplier', 
          icon: UserCircle, 
          path: '/suppliers/new', 
          color: 'text-slate-600', 
          bg: 'bg-slate-100/70', 
          fullWidth: true, 
          cardBg: 'bg-slate-50/30',
          cardBorder: 'border-slate-100',
          hoverBorder: 'hover:border-slate-300',
          subtitle: 'Naya supplier account jodein'
        },
      ]
    },
    {
      title: 'Inventory',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Samaan ka stock manage karein.',
      actions: [
        { 
          label: 'Add Item', 
          icon: PackagePlus, 
          path: '/inventory/add', 
          color: 'text-purple-600', 
          bg: 'bg-purple-100/60', 
          cardBg: 'bg-purple-50/30',
          cardBorder: 'border-purple-100',
          hoverBorder: 'hover:border-purple-300',
          subtitle: 'Naya product jodein'
        },
        { 
          label: 'View Inventory', 
          icon: Package, 
          path: '/inventory', 
          color: 'text-slate-600', 
          bg: 'bg-slate-100/70', 
          cardBg: 'bg-slate-50/30',
          cardBorder: 'border-slate-100',
          hoverBorder: 'hover:border-slate-300',
          subtitle: 'Stock aur rate check karein'
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto no-visible-scrollbar pb-32">
      <div className="px-6 pt-10 pb-6 bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Quick Actions</h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">Business ko speed se manage karein</p>
      </div>

      <div className="p-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
             <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center gap-2">
                   <div className={`w-1 h-3 rounded-full ${section.bgColor.replace('50', '500')}`}></div>
                   <h3 className={`text-[10px] font-bold uppercase tracking-widest ${section.color}`}>{section.title}</h3>
                </div>
                {section.description && (
                  <p className="text-slate-400 text-[10px] font-medium leading-normal">{section.description}</p>
                )}
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               {section.actions.map((action) => {
                 const isFull = action.fullWidth;
                 return (
                   <button
                     key={action.label}
                     onClick={() => navigate(action.path)}
                     className={`flex rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group border ${
                       action.cardBg || 'bg-white'
                     } ${action.cardBorder || 'border-slate-100'} ${action.hoverBorder || 'hover:border-indigo-100'} ${
                       isFull 
                         ? 'col-span-2 flex-row items-center justify-start p-4 px-5 text-left' 
                         : 'flex-col items-center justify-center p-4 text-center'
                     }`}
                   >
                      <div className={`w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ${isFull ? 'mr-4' : 'mb-2'}`}>
                         <action.icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      <div className={`flex flex-col ${isFull ? 'text-left' : 'items-center text-center'}`}>
                         <span className={`font-bold text-slate-700 leading-tight ${isFull ? 'text-[12px]' : 'text-[11px]'}`}>{action.label}</span>
                         {action.subtitle && (
                           <span className={`text-slate-400 font-medium ${isFull ? 'text-[10px] mt-0.5' : 'text-[9px] mt-1'}`}>{action.subtitle}</span>
                         )}
                      </div>
                   </button>
                 );
               })}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
