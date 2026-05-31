import React from "react";
import { useStore } from "../store/useStore";
import { Sparkles, Megaphone } from "lucide-react";

interface AdSlotProps {
  placement: "home_bottom" | "more_page" | "reports" | "document_success";
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement }) => {
  const store = useStore();
  const showAds = store.shouldShowAds();

  // If subscription level says no ads, rendering nothing.
  if (!showAds) {
    return null;
  }

  // Define some interesting mockup texts based on placement to make it look realistic and fun!
  const mockAds = {
    home_bottom: {
      title: "SmartUdhaar Inventory Plus",
      desc: "Track unlimited supplier records, bulk upload items, and print barcode receipts."
    },
    more_page: {
      title: "Business Growth Loans",
      desc: "Get easy collateral-free business loans tailored for small retail shops up to ₹5 Lakhs."
    },
    reports: {
      title: "Premium PDF Billing Reports",
      desc: "Generate professional WhatsApp sharing summaries with custom business logos directly."
    },
    document_success: {
      title: "Speedy Delivery Partner",
      desc: "Connect your store with local shipping agents and get 30% discount on first 5 deliveries."
    }
  };

  const adContent = mockAds[placement] || {
    title: "Advertise Your Brand Here",
    desc: "Reach thousands of small businesses and merchants everyday!"
  };

  return (
    <div className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl p-4 my-4 flex flex-col items-stretch relative overflow-hidden transition-all text-left">
      {/* Background ambient details to feel like an ad */}
      <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-4 translate-y-4">
        <Megaphone className="w-32 h-32" />
      </div>

      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[8px] uppercase tracking-widest font-black text-slate-400 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
          Sponsored
        </span>
        <span className="text-[8px] tracking-wide text-slate-400 font-extrabold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          Ad space
        </span>
      </div>

      <div className="flex items-start gap-3 mt-1.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-slate-800 text-xs truncate">
            {adContent.title}
          </h4>
          <p className="text-slate-500 text-[11px] mt-0.5 font-medium leading-relaxed">
            {adContent.desc}
          </p>
        </div>
      </div>
    </div>
  );
};
