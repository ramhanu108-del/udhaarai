import React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Settings, HelpCircle, HardDrive, Share2, LogOut, CheckSquare, FileText, Package, Sparkles, Cloud } from 'lucide-react';
import { InstallPWA } from '../components/InstallPWA';

export const More = () => {
  const { user, resetAll } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    if(window.confirm('Do you want to reset all local data? This cannot be undone.')) {
      resetAll();
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100/50">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">More Options</h1>
        <p className="text-slate-400 text-sm font-bold tracking-wider uppercase text-[10px]">Settings and tools</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center space-x-4">
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
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
           <MenuItem icon={Sparkles} label="AI Business Assistant" onClick={() => navigate('/ai')} />
           <MenuItem icon={Cloud} label="Account & Sync" onClick={() => navigate('/account-sync')} />
           <MenuItem icon={Package} label="Inventory / Stock" onClick={() => navigate('/inventory')} />
           <MenuItem icon={FileText} label="Invoices / Bills" onClick={() => navigate('/invoices')} />
           <MenuItem icon={CheckSquare} label="System Audit" onClick={() => navigate('/audit')} />
           <MenuItem icon={Settings} label="App Settings" />
           <MenuItem icon={HardDrive} label="Backup & Export" onClick={() => navigate('/backup')} />
           <MenuItem icon={Share2} label="Share App" />
           <MenuItem icon={HelpCircle} label="Help & Support" />
           <button 
             onClick={handleLogout}
             className="w-full flex items-center space-x-3 p-4 bg-white hover:bg-slate-50 transition-colors text-red-600 border-t border-slate-100"
           >
             <LogOut className="w-5 h-5" />
             <span className="font-bold text-sm">Reset & Logout</span>
           </button>
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
    className="w-full flex items-center space-x-3 p-4 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
  >
    <Icon className="w-5 h-5 text-slate-500" />
    <span className="font-bold text-slate-700 text-sm">{label}</span>
  </button>
);
