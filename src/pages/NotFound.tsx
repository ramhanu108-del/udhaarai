import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-6">
        <HelpCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-[280px]">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/dashboard', { replace: true })}
        className="w-full max-w-[200px] py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
      >
        Go to Home
      </button>
    </div>
  );
};
