import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';

interface LockScreenProps {
  ownerName: string;
  shopName: string;
  correctPin: string;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  ownerName,
  shopName,
  correctPin,
  onUnlock,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const controls = useAnimation();

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      setErrorMsg('');
      const newPin = pin + num;
      setPin(newPin);

      // Trigger unlock check if 4 digits are completed
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          // Success!
          setTimeout(() => {
            onUnlock();
          }, 200);
        } else {
          // Shake pattern
          setTimeout(async () => {
             setErrorMsg('Wrong PIN. Kripya sahi PIN enter karein.');
             setPin('');
             await controls.start({
               x: [-10, 10, -8, 8, -4, 4, 0],
               transition: { duration: 0.4 }
             });
          }, 250);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  // Support physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, correctPin]);

  return (
    <div className="flex flex-col h-full bg-slate-900 justify-between items-center text-white py-12 px-6">
      <div className="w-full flex-1 flex flex-col justify-center items-center text-center space-y-6">
        
        {/* Lock Icon and Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-slate-800 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-slate-700/50">
            {pin.length === 4 && pin === correctPin ? (
              <Unlock className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-4">
             {shopName || "SmartUdhaar AI"}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
             Welcome back, <span className="text-indigo-300 font-bold">{ownerName || "Owner"}</span>
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="space-y-4 py-4 w-full">
          <motion.div 
            animate={controls}
            className="flex justify-center gap-6 items-center"
          >
            {[0, 1, 2, 3].map((index) => {
              const active = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    active 
                      ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/30' 
                      : 'border-slate-600 bg-slate-800'
                  }`}
                />
              );
            })}
          </motion.div>

          <div className="h-6 flex items-center justify-center text-center">
            {errorMsg ? (
              <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 bg-rose-950/40 px-3 py-1 rounded-full border border-rose-900/30 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                App Lock Secured
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Touch Number Pad */}
      <div className="w-full max-w-[280px] mx-auto pb-6">
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              id={`lock-num-${num}`}
              key={num}
              onClick={() => handleNumberPress(num)}
              className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-90 border border-slate-700/30 transition-all font-bold text-xl flex items-center justify-center text-white cursor-pointer select-none"
            >
              {num}
            </button>
          ))}
          
          <button
            id="lock-num-clear"
            onClick={handleClear}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Clear
          </button>

          <button
            id="lock-num-0"
            onClick={() => handleNumberPress('0')}
            className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 active:scale-90 border border-slate-700/30 transition-all font-bold text-xl flex items-center justify-center text-white cursor-pointer select-none"
          >
            0
          </button>

          <button
            id="lock-num-delete"
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
