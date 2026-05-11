import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { t } from '../utils/i18n';
import { useStore } from '../store/useStore';
import { getTotalPending, getOverdueCustomers, getTodaySalesSummary, getLowStockItems } from '../store/selectors';
import { getSmartSuggestions } from '../utils/aiAssistant';
import { User, Wallet, TrendingUp, AlertCircle, Plus, Users, NotebookText, Sparkles, Package } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

export const Dashboard = () => {
  const navigate = useNavigate();
  const state = useStore();
  const { user, customers, transactions } = state;

  const lang = user?.language || 'hinglish';
  
  // Use robust derived pending
  const totalPending = getTotalPending();
  
  // Calculate today's sales and collection
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  
  const todaySales = getTodaySalesSummary();
  const todaysSales = todaySales.totalSalesPaise;

  const todaysCollection = transactions
    .filter(tx => (tx.type === 'payment' || tx.type === 'adjustment') && tx.createdAt >= todayStart && tx.createdAt <= todayEnd && tx.status === 'active')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const overdueCustomers = getOverdueCustomers();
  const overdueCount = overdueCustomers.length;

  const lowStockItems = getLowStockItems();
  const lowStockCount = lowStockItems.length;

  const suggestions = getSmartSuggestions(useStore.getState());
  const mainSuggestion = suggestions[0];

  const needsBackup = (!state.lastBackupAt || ((now.getTime() - state.lastBackupAt) > 7 * 24 * 60 * 60 * 1000)) && (!state.dismissedBackupReminderAt || ((now.getTime() - state.dismissedBackupReminderAt) > 24 * 60 * 60 * 1000));
    
  return (
    <div className="w-full min-h-full pb-28 bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex justify-between items-start bg-white">
        <div>
          <h2 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{user?.businessName || 'Your Shop'}</h2>
          <h1 className="text-xl font-bold text-slate-900 mb-0.5">{t('welcome_back', lang)} {user?.name ? user.name.split(' ')[0] : 'User'}! 👋</h1>
          <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-full mt-1">
            Small shops ke liye simple udhaar, sales aur stock manager.
          </p>
        </div>
        <button onClick={() => navigate('/more')} className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200 mt-1 shrink-0">
          <span className="text-indigo-600 font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
        </button>
      </div>

      {/* Main Metrics */}
      <div className="px-6 py-2 pb-4">
        {needsBackup && (
           <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4 flex flex-col gap-2 shadow-sm">
             <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-900 font-medium">Backup banaye hue 7 din se zyada ho gaye. Apna hisaab safe rakhne ke liye backup download kar lein.</p>
             </div>
             <div className="flex gap-2 justify-end mt-1">
                <button onClick={() => state.setDismissedBackupReminderAt(Date.now())} className="text-xs font-bold text-orange-600 px-3 py-1.5 hover:bg-orange-100 rounded-md transition-colors">Remind later</button>
                <button onClick={() => navigate('/backup')} className="text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-md transition-colors shadow-sm">Backup Download</button>
             </div>
           </div>
        )}

        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest mb-1">{t('total_pending', lang)}</p>
          <h3 className="text-3xl font-bold mb-4">{formatCurrency(totalPending)}</h3>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded text-[10px]">
              {overdueCount > 0 && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>}
              {overdueCount} {lang === 'en' ? 'Accounts Overdue' : 'Overdue Khata'}
            </div>
            <button onClick={() => navigate('/udhaar')} className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
              {lang === 'en' ? 'Collect Now' : 'Paisa Laao'}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <div onClick={() => navigate('/sales')} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 relative overflow-hidden cursor-pointer active:bg-emerald-100 transition-colors">
          <p className="text-[10px] text-emerald-600 font-bold uppercase">{t('todays_sales', lang)}</p>
          <p className="text-lg font-bold text-emerald-900">{formatCurrency(todaysSales)}</p>
          <p className="text-[9px] text-emerald-600 opacity-80 mt-0.5">{todaySales.saleCount} Items Sold</p>
        </div>
        <div onClick={() => navigate('/udhaar')} className="bg-amber-50 border border-amber-100 rounded-xl p-3 relative overflow-hidden cursor-pointer active:bg-amber-100 transition-colors">
          <p className="text-[10px] text-amber-600 font-bold uppercase">{t('collection', lang)}</p>
          <p className="text-lg font-bold text-amber-900">{formatCurrency(todaysCollection)}</p>
          <p className="text-[9px] text-amber-600 opacity-80 mt-0.5">Received Today</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => navigate('/sales/new')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-md shadow-indigo-200 text-white active:scale-95 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter mt-1">Nayi Sale</span>
          </button>
           <button onClick={() => navigate('/add-transaction/select?type=udhaar')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-sm text-slate-800 active:scale-95 transition-transform">
              <MinusIcon className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Udhaar</span>
          </button>
          <button onClick={() => navigate('/add-transaction/select?type=payment')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-sm text-slate-800 active:scale-95 transition-transform">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Payment</span>
          </button>
          <button onClick={() => navigate('/invoices/new')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-sm text-slate-800 active:scale-95 transition-transform">
              <NotebookText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">Bill Banao</span>
          </button>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="px-6 py-4">
        <div onClick={() => navigate('/ai')} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-indigo-600 p-2 w-8 h-8 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">Smart Suggestion</p>
             <p className="text-sm font-medium text-indigo-950 leading-snug">
               {mainSuggestion}
             </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
         <div className="px-6 pb-4">
           <div className="flex justify-between items-center mb-3">
             <h4 className="text-xs font-bold text-amber-700 uppercase tracking-tighter flex items-center gap-1">
               <AlertCircle className="w-4 h-4" /> LOW STOCK ALERT ({lowStockCount})
             </h4>
             <span onClick={() => navigate('/inventory')} className="text-xs text-indigo-600 font-semibold cursor-pointer">View inventory</span>
           </div>
           <div className="space-y-2">
             {lowStockItems.slice(0, 3).map((item: any, index: number) => (
               <div key={`${item.id}-${index}`} onClick={() => navigate(`/inventory/${item.id}`)} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer">
                 <div>
                   <p className="text-sm font-bold text-amber-900">{item.name}</p>
                   <p className="text-[10px] text-amber-700">Stock left: <span className="font-bold">{item.stockQty} {item.unit}</span></p>
                 </div>
                 <button className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                   Update
                 </button>
               </div>
             ))}
           </div>
         </div>
      )}

      {/* Recent Customers */}
      <div className="px-6 pb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Paisa Pending (Recent)</h4>
          <span onClick={() => navigate('/customers')} className="text-xs text-indigo-600 font-semibold cursor-pointer">View All</span>
        </div>
        <div className="space-y-3">
          {customers.filter(c => c.totalPending !== 0).slice(0, 3).map((c, index) => (
            <div key={`${c.id}-${index}`} onClick={() => navigate(`/customers/${c.id}`)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{c.name.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{c.name}</p>
                  <p className="text-[10px] text-slate-500">{c.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${c.totalPending > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(Math.abs(c.totalPending))}</p>
                <span className={`text-[8px] px-1 rounded uppercase font-bold ${c.totalPending > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {c.totalPending > 0 ? 'Due' : 'Advance'}
                </span>
              </div>
            </div>
          ))}
          {customers.filter(c => c.totalPending !== 0).length === 0 && (
             <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
               No pending customers.
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

// Quick helper component
const MinusIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
  </svg>
)
