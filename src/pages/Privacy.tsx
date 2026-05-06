import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Database, HardDrive, Cpu, CloudOff } from 'lucide-react';

export const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Privacy & Safety</h1>
            <p className="text-xs text-slate-500 font-medium">Aapka data, aapka control</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={28} strokeWidth={2} />
           </div>
           <h2 className="text-sm font-bold text-slate-900 mb-2">100% Privacy</h2>
           <p className="text-xs text-slate-600 leading-relaxed mb-4">
             Yeh app ek "Offline-First" app hai. Iska matlab aapka koi bhi customer data, account ya hisaab hamare server par nahi jata.
           </p>

           <ul className="space-y-3">
              <li className="flex gap-3 text-xs text-slate-700">
                <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong className="text-slate-900">Local Storage:</strong> Aapka pura data aapke mobile phone ki memory mein hi store hota hai.</span>
              </li>
              <li className="flex gap-3 text-xs text-slate-700">
                <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong className="text-slate-900">No Cloud Upload:</strong> Koi cloud sync chalaki se aapka private data internet pe nahi bhejta. Future mein cloud backup aayega, lekin woh sirf aapki choice se on hoga.</span>
              </li>
              <li className="flex gap-3 text-xs text-slate-700">
                <Database className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong className="text-slate-900">Backup Control:</strong> Backup file .json format mein generate hoti hai, jise aap safely apne Google Drive ya Email mein khud save kar sakte hain.</span>
              </li>
              <li className="flex gap-3 text-xs text-slate-700">
                <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                <span><strong className="text-slate-900">AI Logic:</strong> Jo AI Assistant app mein hai, woh aapke phone par ek local engine se chalta hai. Tumhara private business data kisi 3rd party AI server (jaise OpenAI ya Gemini) ko nahi bheja jaata. All AI API keys are hidden and not exposed in the frontend.</span>
              </li>
           </ul>
        </div>

        <div className="bg-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
           <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-700/50 rounded-full blur-2xl"></div>
           <h2 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-widest relative z-10">Disclaimer</h2>
           <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1 relative z-10">
             Ye app hisaab rakhne (record keeping) aur business summary generate karne ke liye ek smart tool matra hai. Ye app koi official tax, legal ya accounting advice nahi deta. Kisi bhi bhed bhav ya legal decision lene se pehle apne CA ya financial advisor se salaah karein.
           </p>
        </div>

      </div>
    </div>
  );
};
