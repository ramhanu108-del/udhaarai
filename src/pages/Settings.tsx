import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, User, Store, ShieldAlert, Download, Trash2, PowerOff } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export const Settings = () => {
  const navigate = useNavigate();
  const state = useStore();
  
  const [formData, setFormData] = useState({
    name: state.user?.name || '',
    phone: state.user?.phone || '',
    businessName: state.user?.businessName || '',
    businessType: state.user?.businessType || 'kirana',
    language: state.user?.language || 'hinglish'
  });

  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = () => {
    if (state.user) {
      state.setUser({
        ...state.user,
        ...formData
      });
      alert('Business profile updated successfully!');
    }
  };

  const handleClearDemoData = () => {
    if(window.confirm('Are you sure you want to remove all DEMO data? Active data will not be touched.')){
      state.clearDemoData();
      alert('Demo data removed.');
    }
  };

  const handleResetData = () => {
    if (deleteInput === 'DELETE') {
      state.resetAll();
      alert('Local data cleared forever.');
      navigate('/', { replace: true });
    } else {
      alert('Please type DELETE exactly to confirm.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            <p className="text-xs text-slate-500 font-medium">Business Configuration</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-8">
        
        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Business Profile</h2>
           <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Owner Name</label>
                <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phone Number</label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} className="bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Shop Name</label>
                <Input value={formData.businessName} onChange={e => setFormData(p => ({...p, businessName: e.target.value}))} className="bg-slate-50 border-slate-200 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 block">Business Type</label>
                   <select 
                     value={formData.businessType} 
                     onChange={(e) => setFormData(p => ({...p, businessType: e.target.value as any}))}
                     className="w-full h-10 px-3 border border-slate-200 rounded-md focus:outline-none bg-slate-50 text-sm"
                   >
                     <option value="kirana">Kirana</option>
                     <option value="salon">Salon & Spa</option>
                     <option value="mobile_repair">Mobile Repair</option>
                     <option value="garments">Garments</option>
                     <option value="coaching">Coaching</option>
                     <option value="wholesale">Wholesale</option>
                     <option value="other">Other</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 block">Language</label>
                   <select 
                     value={formData.language} 
                     onChange={(e) => setFormData(p => ({...p, language: e.target.value as any}))}
                     className="w-full h-10 px-3 border border-slate-200 rounded-md focus:outline-none bg-slate-50 text-sm"
                   >
                     <option value="en">English</option>
                     <option value="hinglish">Hinglish</option>
                     <option value="hi">Hindi</option>
                   </select>
                 </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={handleSave} className="flex-1 h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-widest">
                  Save Profile
                </Button>
              </div>
           </div>
        </section>

        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">App Mode & Data Safety</h2>
           <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              <button onClick={() => navigate('/backup')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                       <Download className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-bold text-slate-900">Backup & Restore</p>
                       <p className="text-[10px] text-slate-500 font-medium">Download JSON ya CSV files</p>
                    </div>
                 </div>
              </button>

              <button onClick={handleClearDemoData} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                       <PowerOff className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-bold text-slate-900">Clear Demo Data</p>
                       <p className="text-[10px] text-slate-500 font-medium">Sirf demo accounts delete honge</p>
                    </div>
                 </div>
              </button>
           </div>
        </section>

        <section>
           <h2 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 px-1">Danger Zone</h2>
           <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
              <h3 className="text-sm font-bold text-red-900 mb-1 flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-red-600" /> Factory Reset
              </h3>
              <p className="text-[11px] text-red-700/80 font-medium mb-4">
                 Yeh step aapka saara data permanently delete kar dega. Pehle backup zaroor check karein.
              </p>
              
              {!isDeleting ? (
                 <Button onClick={() => setIsDeleting(true)} className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold uppercase tracking-widest">
                    Clear Local Data
                 </Button>
              ) : (
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Type DELETE to confirm:</p>
                    <Input 
                      value={deleteInput} 
                      onChange={e => setDeleteInput(e.target.value)} 
                      className="bg-white border-red-200 text-red-900 font-mono text-center tracking-widest"
                      placeholder="DELETE"
                    />
                    <div className="flex gap-2">
                       <Button onClick={handleResetData} disabled={deleteInput !== 'DELETE'} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50">
                          Confirm Delete
                       </Button>
                       <Button onClick={() => { setIsDeleting(false); setDeleteInput(''); }} variant="outline" className="flex-1 border-red-200 text-red-700 bg-white hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest">
                          Cancel
                       </Button>
                    </div>
                 </div>
              )}
           </div>
        </section>

      </div>
    </div>
  );
};
