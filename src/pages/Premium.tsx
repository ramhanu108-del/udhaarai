import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Crown, Check, X, ArrowLeft, Sparkles, Shield, Cloud, Bot, BarChart3, Radio } from "lucide-react";
import { SHOW_PREMIUM_FEATURES } from "../utils";

export const Premium = () => {
  const navigate = useNavigate();
  const store = useStore();
  const subscription = store.subscription;
  const isPremiumUser = store.isPremium();

  if (!SHOW_PREMIUM_FEATURES) {
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">SmartUdhaar Premium</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Plan & Subscription Management</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
          <div className="p-4 bg-amber-50 rounded-full border border-amber-100 text-amber-500 animate-pulse">
            <Crown className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Premium Coming Soon</h2>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Abhi app offline/local mode mein stable banaya ja raha hai.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }


  const handleEnablePremiumTest = () => {
    store.setSubscription({
      plan: "premium",
      status: "active",
      source: "manual_test"
    });
  };

  const handleDisablePremiumTest = () => {
    store.setSubscription({
      plan: "free",
      status: "active",
      source: "manual_test"
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">SmartUdhaar Premium</h1>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Plan & Subscription Management</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Current Subscription Status Badge */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Aapka Current Plan</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5">
                {isPremiumUser ? (
                  <>
                    <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Premium Plan Pro
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 text-indigo-500" />
                    Free Mode (Ads Supported)
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {isPremiumUser
                  ? `Active via ${subscription.source === "manual_test" ? "Developer Test Mode" : "Paid Subscription"}`
                  : "Basic single-device offline recording"}
              </p>
            </div>
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              isPremiumUser 
                ? "bg-amber-50 text-amber-700 border border-amber-200" 
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}>
              {isPremiumUser ? "ACTIVE" : "FREE TIER"}
            </span>
          </div>
        </div>

        {/* Feature Comparison Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase pl-1">Feature Comparison</h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Free Plan Card */}
            <div className={`bg-white border rounded-3xl p-5 shadow-sm transition-all relative ${
              !isPremiumUser ? "ring-2 ring-indigo-505 border-indigo-200" : "border-slate-100"
            }`}>
              {!isPremiumUser && (
                <span className="absolute right-4 top-4 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Current
                </span>
              )}
              <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                Free Plan
              </h4>
              <p className="text-xs text-slate-500 mt-1">Core offline accounting tool.</p>

              <div className="mt-5 space-y-3">
                <ComparisonRow text="Core offline app works" status={true} />
                <ComparisonRow text="Basic business reports" status={true} />
                <ComparisonRow text="Ads visible on Home & More panels" status={true} highlightRed={false} />
                <ComparisonRow text="Cloud backup & Sync" status={false} />
                <ComparisonRow text="AI Business Assistant" status={false} />
                <ComparisonRow text="Advanced transactional audits" status={false} />
              </div>
            </div>

            {/* Premium Plan Card */}
            <div className={`bg-white border rounded-3xl p-5 shadow-sm transition-all relative overflow-hidden ${
              isPremiumUser ? "ring-2 ring-amber-500 border-amber-200" : "border-slate-100 hover:shadow-md"
            }`}>
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              {isPremiumUser && (
                <span className="absolute right-4 top-4 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 fill-amber-600" /> Current
                </span>
              )}
              <h4 className="text-lg font-black text-amber-600 flex items-center gap-1.5">
                Premium Plan Pro
              </h4>
              <p className="text-xs text-slate-500 mt-1">Full-scale cloud-backable business workspace.</p>

              <div className="mt-5 space-y-3">
                <ComparisonRow text="100% Ad-Free interface" status={true} isPremium />
                <ComparisonRow text="Real-time Cloud Sync" status={true} isPremium />
                <ComparisonRow text="Intelligent AI Business Assistant" status={true} isPremium />
                <ComparisonRow text="Advanced reports & downloadables" status={true} isPremium />
                <ComparisonRow text="Priority Cloud Backups" status={true} isPremium />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits details block */}
        <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <Sparkles className="w-40 h-40" />
          </div>
          <h3 className="text-base font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            AI Pro Features Unlock
          </h3>
          <p className="text-indigo-200 text-xs mt-1.5 leading-relaxed font-medium">
            SmartUdhaar Premium enables persistent backup to secure your ledgers. Run detailed cashflow audits, ask the Smart AI to help optimize outstanding limits, and get absolute clean page viewing with zero sponsorship space.
          </p>
        </div>

        {/* QA Testing Sandbox Controls */}
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Shield className="w-5 h-5 text-slate-500 stroke-[2]" />
            <h4 className="text-sm font-black uppercase tracking-wider">QA Verification Suite</h4>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed font-bold">
            Use these buttons to instantly toggle user level state for testing PremiumGate overlays and AdSlot placement hiding!
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={handleEnablePremiumTest}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                isPremiumUser
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 active:scale-95"
              }`}
            >
              <Crown className="w-4 h-4 fill-current" />
              Enable Premium
            </button>

            <button
              onClick={handleDisablePremiumTest}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                !isPremiumUser
                  ? "bg-slate-800 text-white border-slate-900 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 active:scale-95"
              }`}
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              Disable Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ComparisonRowProps {
  text: string;
  status: boolean;
  highlightRed?: boolean;
  isPremium?: boolean;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ 
  text, 
  status, 
  highlightRed = true, 
  isPremium = false 
}) => {
  return (
    <div className="flex items-start gap-2.5 text-xs text-left">
      {status ? (
        <span className={`p-0.5 rounded-full ${isPremium ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-700"} flex-shrink-0 mt-0.5`}>
          <Check className="w-3 h-3 stroke-[3]" />
        </span>
      ) : (
        <span className={`p-0.5 rounded-full ${highlightRed ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"} flex-shrink-0 mt-0.5`}>
          <X className="w-3 h-3 stroke-[3]" />
        </span>
      )}
      <span className={`font-bold mt-0.5 ${
        status 
          ? "text-slate-800" 
          : "text-slate-400 line-through"
      }`}>
        {text}
      </span>
    </div>
  );
};
