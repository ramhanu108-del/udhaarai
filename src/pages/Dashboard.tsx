import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { t } from '../utils/i18n';
import { useStore } from '../store/useStore';
import { 
  getTotalPending, 
  getOverdueCustomers, 
  getTodaySalesSummary, 
  getLowStockItems,
  getTotalSupplierPayable,
  getTotalCustomerAdvance,
  getTotalSupplierAdvance 
} from '../store/selectors';
import { getSmartSuggestions } from '../utils/aiAssistant';
import { 
  Wallet, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  Truck, 
  Sparkles, 
  HardDrive
} from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { AdSlot } from '../components/AdSlot';

export const Dashboard = () => {
  const navigate = useNavigate();
  const state = useStore();
  const { user, transactions } = state;

  const lang = user?.language || 'hinglish';
  
  const totalPendingPaise = getTotalPending();
  const customerAdvancePaise = getTotalCustomerAdvance();
  const supplierPayablePaise = getTotalSupplierPayable();
  const supplierAdvancePaise = getTotalSupplierAdvance();
  
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  
  const todaysCollectionPaise = transactions
    .filter(tx => (tx.type === 'payment' || tx.type === 'adjustment') && tx.createdAt >= todayStart && tx.createdAt <= todayEnd && tx.status === 'active')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaySales = getTodaySalesSummary();
  const todaysSalesPaise = todaySales.totalSalesPaise;

  const overdueCustomers = getOverdueCustomers();
  const lowStockItems = getLowStockItems();
  const lowStockCount = lowStockItems.length;

  const suggestions = getSmartSuggestions(useStore.getState());
  const mainSuggestion = suggestions[0];

  // Dynamically calculate backup overdue threshold based on user frequency setting
  const backupFreq = state.backupReminderFrequency || 'weekly';
  let isBackupOverdue = false;
  
  if (backupFreq !== 'disabled') {
    let intervalMs = 7 * 24 * 60 * 60 * 1000; // default weekly
    if (backupFreq === 'daily') {
      intervalMs = 1 * 24 * 60 * 60 * 1000;
    } else if (backupFreq === 'monthly') {
      intervalMs = 30 * 24 * 60 * 60 * 1000;
    }
    const lastBackupTime = state.lastBackupAt || 0;
    isBackupOverdue = (now.getTime() - lastBackupTime) > intervalMs;
  }

  const dismissedInterval = 24 * 60 * 60 * 1000; // 24-hour snooze gap
  const dismissedRecently = state.dismissedBackupReminderAt && (now.getTime() - state.dismissedBackupReminderAt) < dismissedInterval;
  
  const needsBackup = isBackupOverdue && !dismissedRecently;
    
  return (
    <div className="w-full min-h-full pb-28 bg-slate-50 overflow-y-auto no-visible-scrollbar">
      {/* Header / Greeting */}
      <div className="px-6 pt-8 pb-6 bg-white border-b border-slate-100">
        <div className="flex justify-between items-center mb-1">
           <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
             {user?.businessName || 'My Business'}
           </span>
           <button onClick={() => navigate('/more')} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
           </button>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          {t('welcome_back', lang)} {user?.name ? user.name.split(' ')[0] : 'User'}! 👋
        </h1>
        <p className="text-slate-500 text-xs mt-1">Aaj ka business summary dekhein.</p>
      </div>

      {/* Primary Card: Total Pending */}
      <div className="px-4 pt-4">
        <div 
          onClick={() => navigate('/customers?filter=due')}
          className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Kul Baki Udhaar</p>
          <h3 className="text-3xl font-black mb-1">{formatCurrency(totalPendingPaise)}</h3>
          <p className="text-indigo-200 text-[10px] font-medium">Customer se lena baaki hai</p>
          
          <div className="mt-4 pt-4 border-t border-indigo-500/50 flex justify-between items-center">
            <span className="text-[10px] font-bold bg-indigo-500/50 px-2 py-1 rounded-lg">
              {overdueCustomers.length} Overdue Accounts
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
              Paisa Laao &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div 
          onClick={() => navigate('/udhaar')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
        >
           <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aaj Ki Collection</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(todaysCollectionPaise)}</h3>
        </div>

        <div 
          onClick={() => navigate('/sales')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
        >
           <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aaj Ki Sales</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(todaysSalesPaise)}</h3>
        </div>

        <div onClick={() => navigate('/customers?filter=advance')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
           <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Plus className="w-4 h-4 text-blue-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Customer Advance</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(customerAdvancePaise)}</h3>
           <p className="text-[8px] text-slate-400 font-medium mt-1">Extra paisa jama hai</p>
        </div>

        <div onClick={() => navigate('/suppliers?filter=payable')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
           <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Wallet className="w-4 h-4 text-amber-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Supplier Ko Dena Hai</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(supplierPayablePaise)}</h3>
        </div>

        <div onClick={() => navigate('/suppliers?filter=advance')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
           <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center mb-3">
              <Truck className="w-4 h-4 text-sky-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Supplier Advance</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(supplierAdvancePaise)}</h3>
           <p className="text-[8px] text-slate-400 font-medium mt-1">Humein extra diya hai</p>
        </div>

        <div onClick={() => navigate('/inventory')} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform">
           <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <AlertCircle className="w-4 h-4 text-purple-600" />
           </div>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Low Stock Items</p>
           <h3 className="text-lg font-bold text-slate-900 leading-none">{lowStockCount} Items</h3>
        </div>
      </div>

      {/* Quick Actions (Dashboard Subset) */}
      <div className="px-4 py-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
           <QuickAction icon={ShoppingBag} label="Nayi Sale" path="/sales/new" color="bg-indigo-600" textColor="text-white" navigate={navigate} />
           <QuickAction icon={ArrowDownLeft} label="Payment" path="/add-transaction/select?type=payment" color="bg-white" textColor="text-emerald-600" navigate={navigate} border />
           <QuickAction icon={ArrowUpRight} label="Udhaar" path="/add-transaction/select?type=udhaar" color="bg-white" textColor="text-red-600" navigate={navigate} border />
           <QuickAction icon={Truck} label="Purchase" path="/suppliers" color="bg-white" textColor="text-amber-600" navigate={navigate} border />
        </div>
      </div>

      {/* Home Ads */}
      <div className="px-4">
        <AdSlot placement="home_bottom" />
      </div>

      {/* Need Attention Section */}
      <div className="p-4 space-y-4">
        {(overdueCustomers.length > 0 || lowStockCount > 0 || needsBackup) && (
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Need Attention</h3>
        )}

        {needsBackup && (
           <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                 <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-bold text-orange-900 leading-tight">Backup Due!</p>
                 <p className="text-[10px] text-orange-700 mt-0.5">Apna data safe rakhne ke liye download karein.</p>
              </div>
              <button 
                onClick={() => navigate('/backup')}
                className="px-3 py-1.5 bg-orange-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider active:scale-95 transition-transform"
              >
                Now
              </button>
           </div>
        )}

        {overdueCustomers.slice(0, 2).map(customer => (
           <div key={customer.id} onClick={() => navigate(`/customers/${customer.id}`)} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4 items-center cursor-pointer active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600 font-bold">
                 {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                 <p className="text-xs font-bold text-red-900 leading-tight">{customer.name}</p>
                 <p className="text-[10px] text-red-700 mt-0.5">Udhaar date overdue hai.</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-red-600">{formatCurrency(getTotalPending())/* simplified, ideally use per customer balance */}</p>
                <p className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Overdue</p>
              </div>
           </div>
        ))}

        {lowStockItems.slice(0, 2).map(item => (
           <div key={item.id} onClick={() => navigate(`/inventory/${item.id}`)} className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-4 items-center cursor-pointer active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                 <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-bold text-purple-900 leading-tight">{item.name}</p>
                 <p className="text-[10px] text-purple-700 mt-0.5">Stock dangerously low hai.</p>
              </div>
              <button className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                Refill
              </button>
           </div>
        ))}
      </div>

      {/* Smart Suggestion */}
      {mainSuggestion && (
        <div className="px-4 pb-12">
          <div onClick={() => navigate('/ai')} className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-4">
               <Sparkles className="w-5 h-5 text-indigo-200" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Smart Suggestion</span>
            </div>
            <p className="text-lg font-bold leading-snug pr-4">
              {mainSuggestion}
            </p>
            <div className="mt-6 flex items-center gap-2 text-indigo-200 text-xs font-bold">
               <span>Learn more</span>
               <Plus className="w-3 h-3 rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, path, color, textColor, navigate, border }: any) => (
  <button onClick={() => navigate(path)} className="flex flex-col items-center gap-1.5 group">
    <div className={`w-14 h-14 ${color} ${border ? 'border border-slate-100' : ''} rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all group-hover:shadow-md`}>
      <Icon className={`w-6 h-6 ${textColor}`} />
    </div>
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center">{label}</span>
  </button>
);
