import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';

export const Upgrade = () => {
  const navigate = useNavigate();
  const state = useStore();

  /* 
   * Monetization Developer Notes:
   * - Android subscription later should use Google Play Billing.
   * - iOS subscription later should use Apple In-App Purchase.
   * - Ads later should use AdMob only after native packaging.
   * - PWA ad strategy can be decided later.
   * Currently, these are placeholder UI elements without real payment gateways.
   */

  return (
    <div className="flex flex-col flex-1 bg-slate-50 pb-20">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Upgrade</h1>
          <p className="text-xs text-slate-500 font-medium">Choose your plan</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Free Plan */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Current</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Free Plan</h2>
              <p className="text-sm font-bold text-slate-500">₹0 / month</p>
            </div>
          </div>
          
          <ul className="space-y-3 mt-6">
            {[
              "Udhaar tracking",
              "Sales tracking",
              "Inventory management",
              "Invoice generation",
              "Local data backup",
              "Basic reports",
              "Basic local AI summary"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              <span className="font-bold text-slate-700">Note:</span> Basic app free rahegi. AI Pro optional hoga.
            </p>
          </div>
        </div>

        {/* AI Pro Plan */}
        <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 border border-indigo-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-amber-400 text-amber-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Coming Soon
            </span>
          </div>
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                AI Pro
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-sm font-bold text-indigo-300">₹99 / month</p>
            </div>
          </div>
          
          <p className="text-sm text-indigo-200 font-medium mb-6 relative z-10 leading-relaxed">
            Advanced AI reports aur smart business suggestions ke liye future mein ₹99/month plan aa sakta hai.
          </p>
          
          <ul className="space-y-3 relative z-10">
            {[
              "Advanced AI business report",
              "Customer risk insights",
              "Smart reminder suggestions",
              "Stock reorder suggestions",
              "Profit improvement tips",
              "Daily/weekly AI summary"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium text-indigo-50">{feature}</span>
              </li>
            ))}
          </ul>
          
          <button disabled className="mt-8 w-full h-12 bg-indigo-800 text-indigo-300 font-bold rounded-xl flex items-center justify-center opacity-80 cursor-not-allowed">
            Available Soon
          </button>
        </div>

        {/* Ads Transparency Note */}
        <div className="text-center px-4 pt-2">
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Free version mein future mein limited ads aa sakte hain, lekin udhaar/payment entry ke beech ads nahi dikhaye jayenge.
          </p>
        </div>

      </div>
    </div>
  );
};
