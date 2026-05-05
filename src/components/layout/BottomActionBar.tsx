import React from 'react';
import { cn } from '../../utils';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const BottomActionBar: React.FC<Props> = ({ children, className }) => {
  return (
    <div 
      className={cn(
        "sticky bottom-0 inset-x-0 p-4 pb-safe-or-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 mt-auto", 
        className
      )}
    >
      {children}
    </div>
  );
};
