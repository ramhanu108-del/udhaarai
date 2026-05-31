import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, HelpCircle, HardDrive, ShieldCheck, CheckSquare, FileText, Package, Sparkles, Cloud, BarChart3, Crown, Truck, Notebook } from 'lucide-react';
import { InstallPWA } from '../components/InstallPWA';
import { AdSlot } from '../components/AdSlot';
import { SHOW_PREMIUM_FEATURES } from '../utils';

export const More = () => {

  const store = useStore();
  const { user } = store;
  const navigate = useNavigate();
  const isPremiumUser = store.isPremium();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">More Options</h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">Settings, Reports & Tools</p>
      </div>

      <div className="flex-1 px-4 py-6 pb-24 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white shadow-sm rounded-2xl p-5 border border-slate-100 flex items-center space-x-4">
           <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xl">
             {user?.name?.charAt(0).toUpperCase() || 'U'}
           </div>
           <div>
             <h3 className="font-bold text-slate-900">{user?.name || 'User'}</h3>
             <p className="text-sm text-slate-500">{user?.businessName || 'Business'}</p>
             <p className="text-[10px] text-indigo-600 mt-1 font-bold bg-indigo-50 inline-block px-2 py-0.5 rounded uppercase tracking-widest">
               {user?.phone}
             </p>
           </div>
        </div>

        <InstallPWA />

        {/* Premium Upgrade Card */}
        {SHOW_PREMIUM_FEATURES && (!isPremiumUser ? (
          <div className="bg-gradient-to-tr from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <Crown className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 fill-white text-amber-100" />
              <span className="text-[10px] bg-white/25 text-white font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">
                SmartUdhaar Premium
              </span>
            </div>

            <h3 className="text-base font-black leading-tight">Apna Business Upgrade Karein</h3>
            <p className="text-amber-100 text-[11px] mt-1 font-bold">Unlocks everything to run smoothly:</p>

            <ul className="mt-3 space-y-1.5 text-xs text-amber-50 font-bold">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                No Ads
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Cloud backup & sync
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                AI Business Assistant
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Advanced reports
              </li>
            </ul>

            <button
               type="button"
              onClick={() => navigate("/premium")}
              className="w-full mt-4 bg-white text-amber-600 hover:bg-slate-50 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl active:scale-95 transition-transform cursor-pointer"
            >
              View Premium
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-tr from-indigo-650 to-indigo-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-15 transform translate-x-4 -translate-y-4">
              <Crown className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 fill-white text-indigo-200 animate-pulse" />
              <span className="text-[10px] bg-white/20 text-white font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
                PREMIUM ACTIVE
              </span>
            </div>

            <h3 className="text-sm font-black leading-tight">SmartUdhaar Premium Active hai!</h3>
            <p className="text-indigo-250 text-[10px] mt-1 font-medium">Aapke sabhi features unlocked hain.</p>
          </div>
        ))}

        <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden mb-6">
           {SHOW_PREMIUM_FEATURES && (
             <button 
               onClick={() => navigate('/premium')}
               className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 transition-colors border-b border-indigo-100"
             >
               <div className="flex items-center gap-3">
                 <Crown className="w-5 h-5 text-indigo-700" />
                 <span className="font-bold text-indigo-900 text-sm">Upgrade to AI Pro</span>
               </div>
               <span className="text-[10px] bg-amber-400 text-amber-950 font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                 New
               </span>
             </button>
           )}
           <MenuItem icon={Package} label="Inventory / Stock" onClick={() => navigate('/inventory')} />
           <MenuItem icon={FileText} label="Sales Tracker (All Sales)" onClick={() => navigate('/sales')} />
           <MenuItem icon={Notebook} label="Daily Summary (Khata)" onClick={() => navigate('/udhaar')} />
           <MenuItem icon={BarChart3} label="Analytical Reports" onClick={() => navigate('/reports')} />
           <MenuItem icon={HardDrive} label="Backup & Export" onClick={() => navigate('/backup')} />
           <MenuItem icon={SettingsIcon} label="Business Settings" onClick={() => navigate('/settings')} />
           <MenuItem icon={ShieldCheck} label="Privacy & Data Safety" onClick={() => navigate('/privacy')} />
           {SHOW_PREMIUM_FEATURES && <MenuItem icon={Sparkles} label="AI Business Assistant" onClick={() => navigate('/ai')} />}
           {SHOW_PREMIUM_FEATURES && <MenuItem icon={Cloud} label="Account & Sync" onClick={() => navigate('/account-sync')} />}
           <MenuItem icon={FileText} label="Invoices / Bills" onClick={() => navigate('/invoices')} />
           <MenuItem icon={CheckSquare} label="System Audit" onClick={() => navigate('/audit')} />
           <MenuItem icon={HelpCircle} label="Help & Support" onClick={() => navigate('/help')} />
        </div>

        {!SHOW_PREMIUM_FEATURES && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col space-y-2 mb-6 shadow-sm">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              Premium Coming Soon
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No ads, cloud backup, AI assistant aur advanced reports future update mein aayenge.
            </p>
          </div>
        )}


        <AdSlot placement="more_page" />
        
        <div className="text-center py-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SmartUdhaar AI Beta v0.1.0</p>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center space-x-3 p-4 bg-white hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
  >
    <Icon className="w-5 h-5 text-slate-500" />
    <span className="font-bold text-slate-700 text-sm">{label}</span>
  </button>
);
