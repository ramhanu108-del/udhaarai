import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Notebook, Receipt, Users, Menu } from 'lucide-react';
import { cn } from '../../utils';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Notebook, label: 'Udhaar', path: '/udhaar' },
    { icon: Receipt, label: 'Sales', path: '/sales' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Menu, label: 'More', path: '/more' },
  ];

  return (
    <div className="bg-white border-t border-slate-100 pb-safe shrink-0 text-slate-800">
      <div className="mx-auto w-full flex justify-around items-center px-4 h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1.5 w-16 py-1",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
              )}
            >
              <tab.icon className={cn("w-6 h-6", !isActive && "opacity-60", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-bold")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Home Indicator line (decorative for the phone outline) */}
      <div className="h-6 w-full flex justify-center items-center pb-2 hidden sm:flex">
        <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
      </div>
    </div>
  );
};

export const AppShell = () => {
  const location = useLocation();
  // Hide bottom nav on certain screens like onboarding
  const hideBottomNav = location.pathname === '/' || location.pathname === '/onboarding';

  return (
    <div className="h-[100dvh] bg-slate-100 flex justify-center font-sans sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-[400px] flex flex-col h-full relative bg-white sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden">
        
        {/* Status Bar decorative (hidden on real mobile) */}
        <div className="hidden sm:flex h-6 w-full justify-between px-8 items-center pt-2 shrink-0 bg-white">
          <span className="text-[10px] font-bold text-slate-800">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
            <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar relative w-full">
           <Outlet />
        </main>
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
};
