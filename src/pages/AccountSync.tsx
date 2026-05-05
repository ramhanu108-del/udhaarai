import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authService } from '../services/authService';
import { cloudSync } from '../services/cloudSync';
import { ArrowLeft, User, Cloud, CloudOff, RefreshCw, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export const AccountSync = () => {
  const navigate = useNavigate();
  const state = useStore();
  const [profile, setProfile] = useState<any>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (!state.authUser) return;
    
    // Fetch profile stub
    setProfile({ email: state.authUser.email });
  }, [state.authUser]);

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/');
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      await cloudSync.pushLocalDataToCloud();
      // Optional: process any specific queues
      await cloudSync.processSyncQueue();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (!window.confirm("Pulling cloud data will overwrite local data. Make sure you don't have unsynced local changes. Continue?")) return;
    setIsPulling(true);
    try {
      await cloudSync.pullCloudData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsPulling(false);
    }
  };

  const handleClearLocal = async () => {
    if (window.confirm("Yeh aapka saara local data delete kar dega. Continue?")) {
      state.resetAll();
      await cloudSync.pullCloudData();
    }
  };

  if (!state.authUser) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 pr-5">Account & Sync</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
           <CloudOff className="w-16 h-16 text-slate-300" />
           <h2 className="text-lg font-bold text-slate-800">Local Mode Only</h2>
           <p className="text-xs font-medium text-slate-500 max-w-[240px]">
             Aapka data sirf is device par save ho raha hai. Cloud sync ke liye login karein.
           </p>
           <Button onClick={() => navigate('/auth')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-full shadow-sm mt-4">
             Login / Setup
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cloud Sync</h1>
            <p className="text-xs text-slate-500 font-medium">Safe & Secure</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-6">
         {/* Profile Card */}
         <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <User className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm font-bold text-slate-900">{profile?.email}</p>
               <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Cloud Connected</p>
               </div>
            </div>
         </div>

         {!state.lastSyncedAt && (
           <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-amber-900">Pehli baar login?</h3>
              <p className="text-xs text-amber-800 font-medium">Aapka local data abhi cloud main nahi gaya hai. Kya aap chahte hain:</p>
              <div className="space-y-2">
                 <Button onClick={handlePush} disabled={isPushing} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 text-xs">
                    Local Data ko Cloud pe Bhejo
                 </Button>
                 <Button onClick={handleClearLocal} disabled={isPulling} variant="outline" className="w-full border-amber-300 text-amber-900 font-bold h-10 text-xs">
                    Clear Local & Pull from Cloud
                 </Button>
              </div>
           </div>
         )}

         {/* Sync Status */}
         <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sync Information</h3>
               </div>
               
               {state.syncStatus === 'synced' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
               {state.syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
               {state.syncStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
            
            <div className="p-5 space-y-4">
               <div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
                 <p className="text-sm font-bold text-slate-800 capitalize">{state.syncStatus}</p>
               </div>
               
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Pending Changes</p>
                  <p className="text-sm font-bold text-slate-800">{state.syncQueue?.length || 0} items</p>
               </div>

               <div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Last Synced</p>
                 <p className="text-sm font-bold text-slate-800">
                   {state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleString() : 'Never'}
                 </p>
               </div>
            </div>
         </div>

         <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Manual Sync Options</h4>
            
            <Button 
               onClick={handlePush} 
               disabled={isPushing}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-[0_4px_10px_rgba(79,70,229,0.2)]"
            >
               {isPushing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
               {isPushing ? 'Pushing Data...' : 'Push Local Data to Cloud'}
            </Button>
            
            <Button 
               onClick={handlePull} 
               disabled={isPulling}
               variant="outline"
               className="w-full border-slate-200 text-slate-700 font-bold h-12"
            >
               {isPulling ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
               {isPulling ? 'Pulling Data...' : 'Pull Latest Cloud Data'}
            </Button>
         </div>

         <button 
           onClick={handleLogout} 
           className="w-full flex items-center justify-center gap-2 mt-8 text-red-600 p-4 border border-red-100 bg-red-50 rounded-2xl font-bold text-sm"
         >
           <LogOut className="w-4 h-4" /> Logout from Cloud
         </button>
      </div>
    </div>
  );
};
