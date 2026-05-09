import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';

const helpSections = [
  { title: "Customer kaise add karein?", content: "More menu > Customers mein jayen ya Udhaar tab pe '+' icon dabayein. Name aur phone number enter karke save karein." },
  { title: "Udhaar kaise add karein?", content: "Customer profile kholen > 'Udhaar Diya' / 'Add Udhaar' button dabayein. Amount enter karein aur save karein." },
  { title: "Payment kaise record karein?", content: "Customer profile kholen > 'Payment Mila' button dabayein. Amount enter karke mode (cash/upi) select karein." },
  { title: "Nayi Sale kaise add karein?", content: "Sales tab pe jayen aur '+' dabayein. Item aur total enter karke sale record karein." },
  { title: "Inventory se sale kaise karein?", content: "Sales add karte waqt 'Add Item' click karein aur apni inventory se items select karein. Unka stock apne aap kam ho jayega." },
  { title: "Bill/Invoice kaise banayein?", content: "Invoices tab pe '+' dabayein. Items select karein, discount dein aur Generate Bill pe click karein." },
  { title: "Backup kaise download karein?", content: "More > Backup & Export par jayen. 'Full Backup JSON' section mein Download dabayein." },
  { title: "Data restore kaise karein?", content: "Backup page pe Download ke neeche 'Upload' button hai. Wahan apni purani backup file select karein." },
  { title: "AI Assistant ka use kaise karein?", content: "AI tab mein jayen aur mic/keyboard se puchein: 'Aaj meri sales kitni hui' ya 'Sabse zyada udhaar kiska hai'." },
  { title: "Offline mode ka meaning?", content: "Bina internet ke bhi app puri tarah kaam karega. Data aapke phone mein hi safe rahta hai." }
];

export const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">How to use</h1>
            <p className="text-xs text-slate-500 font-medium">App kaise chalayen</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 pb-24 space-y-4">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpen strokeWidth={1.5} size={32} />
        </div>
        
        <div className="space-y-3">
          {helpSections.map((sec, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-100 text-slate-600 text-[10px] rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                {sec.title}
              </h3>
              <p className="text-xs text-slate-600 pl-7">{sec.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
