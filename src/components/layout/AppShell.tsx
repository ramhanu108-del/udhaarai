import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Users, Menu, Truck } from 'lucide-react';
import { cn } from '../../utils';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const tabs = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Truck, label: 'Suppliers', path: '/suppliers' },
    { icon: Plus, label: 'Add', path: '/add' },
    { icon: Menu, label: 'More', path: '/more' },
  ];

  return (
    <div className="bottom-nav">
      <div className="mx-auto w-full flex justify-around items-center px-4 h-[76px]">
        {tabs.map((tab) => {
          let isActive = false;
          
          if (tab.label === 'Customers') {
            isActive = location.pathname.startsWith('/customers');
          } else if (tab.label === 'Suppliers') {
            isActive = location.pathname.startsWith('/suppliers');
          } else if (tab.label === 'Add') {
            isActive = location.pathname === '/add' || 
                       location.pathname === '/sales/new' || 
                       location.pathname.startsWith('/add-transaction') ||
                       location.pathname === '/customers/new' ||
                       location.pathname === '/suppliers/new' ||
                       location.pathname === '/inventory/add' ||
                       location.pathname === '/payment/new' ||
                       location.pathname === '/udhaar/new';
          } else {
            isActive = location.pathname.startsWith(tab.path);
          }

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
    </div>
  );
};

export const AppShell = () => {
  const location = useLocation();
  // Hide bottom nav on certain screens like onboarding
  const hideBottomNav = location.pathname === '/' || location.pathname === '/onboarding';

  return (
    <div className="h-[100dvh] bg-slate-100 flex justify-center font-sans overflow-hidden">
      <div className={cn(
        "w-full sm:max-w-[400px] bg-white sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-slate-900 overflow-hidden",
        hideBottomNav ? "flex flex-col" : "app-shell"
      )}>
        
        {/* Status Bar decorative (hidden on real mobile) */}
        <div className="hidden sm:flex h-6 w-full justify-between px-8 items-center pt-2 shrink-0 bg-white">
          <span className="text-[10px] font-bold text-slate-800">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
            <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
          </div>
        </div>

        <main className={cn(
          "app-scroll no-visible-scrollbar w-full",
          hideBottomNav ? "flex-1 overflow-y-auto" : "app-main"
        )}>
           <Outlet />
        </main>
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
};
