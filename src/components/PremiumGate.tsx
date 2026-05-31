import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Crown, Sparkles, Lock } from "lucide-react";
import { SHOW_PREMIUM_FEATURES } from "../utils";

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  featureName = "Premium feature"
}) => {
  const navigate = useNavigate();
  const store = useStore();
  const isPremiumUser = store.isPremium();

  if (isPremiumUser && SHOW_PREMIUM_FEATURES) {
    return <>{children}</>;
  }

  if (!SHOW_PREMIUM_FEATURES) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl text-center self-stretch my-4">
        <div className="relative mb-4">
          <div className="p-4 bg-amber-50 rounded-full border border-amber-100 flex items-center justify-center text-amber-500">
            <Lock className="w-8 h-8 stroke-[1.5]" />
          </div>
        </div>

        <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-2">
          {featureName} Coming Soon
        </span>

        <h3 className="text-lg font-extrabold text-slate-900 mt-1">
          Feature Coming Soon
        </h3>

        <p className="text-slate-600 text-sm max-w-sm mt-2 font-medium leading-relaxed">
          Abhi app offline/local mode mein stable banaya ja raha hai. Yeh feature aane wale updates mein ready ho jayega.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="w-full max-w-xs mt-6 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white py-3 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }


  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl text-center self-stretch my-4">
      <div className="relative mb-4">
        <div className="p-4 bg-amber-50 rounded-full border border-amber-100 flex items-center justify-center text-amber-500 animate-pulse">
          <Crown className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-500 text-white rounded-full border border-white">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-2">
        {featureName}
      </span>

      <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center justify-center gap-1.5">
        <Lock className="w-4 h-4 text-slate-400 stroke-[2.5]" />
        Premium Feature Locked
      </h3>

      <p className="text-slate-600 text-sm max-w-sm mt-2 font-medium leading-relaxed">
        Cloud sync, AI assistant aur no ads ke liye Premium unlock karein.
      </p>

      <button
        onClick={() => navigate("/premium")}
        className="w-full max-w-xs mt-6 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white py-3 px-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer"
      >
        <Crown className="w-4 h-4 fill-white shrink-0" />
        View Premium
      </button>
    </div>
  );
};
