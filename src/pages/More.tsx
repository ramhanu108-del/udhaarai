import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, HelpCircle, HardDrive, ShieldCheck, CheckSquare, FileText, Package, Sparkles, Cloud, BarChart3, Crown } from 'lucide-react';
import { InstallPWA } from '../components/InstallPWA';

export const More = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">More Options</h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">Settings, Reports & Tools</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-6">
        
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

        {/* Menu Items */}
        <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden mb-6">
           <button 
             onClick={() => navigate('/upgrade')}
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
           <MenuItem icon={Sparkles} label="AI Business Assistant" onClick={() => navigate('/ai')} />
           <MenuItem icon={BarChart3} label="My Reports" onClick={() => navigate('/reports')} />
           <MenuItem icon={Cloud} label="Account & Sync" onClick={() => navigate('/account-sync')} />
           <MenuItem icon={Package} label="Inventory / Stock" onClick={() => navigate('/inventory')} />
           <MenuItem icon={FileText} label="Invoices / Bills" onClick={() => navigate('/invoices')} />
           <MenuItem icon={CheckSquare} label="System Audit" onClick={() => navigate('/audit')} />
           <MenuItem icon={SettingsIcon} label="Business Settings" onClick={() => navigate('/settings')} />
           <MenuItem icon={HardDrive} label="Backup & Export" onClick={() => navigate('/backup')} />
           <MenuItem icon={ShieldCheck} label="Privacy & Data Safety" onClick={() => navigate('/privacy')} />
           <MenuItem icon={HelpCircle} label="Help & Support" onClick={() => navigate('/help')} />
        </div>
        
        <div className="text-center py-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SmartUdhaar AI v1.0.0</p>
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
