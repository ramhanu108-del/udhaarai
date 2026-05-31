import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Scissors, Wrench, Shirt, BookOpen, Truck, MoreHorizontal, Package, Cloud, Check, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BusinessType, Language } from '../types';
import { cn } from '../utils';

const businessTypes: { id: BusinessType; label: string; icon: any }[] = [
  { id: 'kirana', label: 'Kirana Store', icon: Store },
  { id: 'salon', label: 'Salon & Spa', icon: Scissors },
  { id: 'mobile_repair', label: 'Mobile Repair', icon: Wrench },
  { id: 'garments', label: 'Garments', icon: Shirt },
  { id: 'coaching', label: 'Coaching', icon: BookOpen },
  { id: 'wholesale', label: 'Wholesaler', icon: Truck },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

const languages: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'hinglish', label: 'Hinglish' },
];

export const Onboarding = () => {
  const navigate = useNavigate();
  const { setUser, user, setPin, setAppLockEnabled } = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    businessType: 'kirana' as BusinessType,
    language: 'hinglish' as Language,
    pin: '',
    confirmPin: '',
    appLockEnabled: true,
  });

  // If already onboarded, redirect to dashboard.
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleComplete = () => {
    setUser({
      id: Math.random().toString(36).substring(2, 9),
      name: formData.name,
      phone: formData.phone,
      businessName: formData.businessName,
      businessType: formData.businessType,
      language: formData.language,
      createdAt: Date.now(),
    });
    setPin(formData.pin);
    setAppLockEnabled(formData.appLockEnabled);
    navigate('/dashboard');
  };

  const currentStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full items-center justify-center text-center p-6"
          >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
               <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                 <Store size={48} strokeWidth={1.5} />
               </div>
               <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">SmartUdhaar AI</h1>
               <p className="text-sm font-bold text-indigo-600 mb-6 px-4">
                 Small shops ke liye simple udhaar, sales aur stock manager.
               </p>
               
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left w-full mb-8 space-y-3">
                 <p className="text-xs text-slate-700 font-medium flex items-start gap-2">
                   <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                   Core features free rahenge: udhaar, sales, stock, bill aur backup.
                 </p>
                 <p className="text-xs text-slate-700 font-medium flex items-start gap-2">
                   <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                   Abhi app local/offline mode mein hai. Aapka data device par save hota hai.
                 </p>
               </div>
            </div>
            
            <div className="w-full pb-4">
               <Button className="w-full py-6 text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md" onClick={handleNext}>
                 Start Now
               </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop details</h2>
            <p className="text-gray-500 mb-8">Enter your basic information</p>

            <div className="space-y-4 mb-auto">
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1 block">Your Name *</label>
                 <Input 
                   placeholder="e.g. Ramesh Sharma" 
                   value={formData.name}
                   onChange={(e) => updateForm('name', e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1 block">Shop Name *</label>
                 <Input 
                   placeholder="e.g. Sharma Kirana Store" 
                   value={formData.businessName}
                   onChange={(e) => updateForm('businessName', e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1 block">Business Type</label>
                 <select 
                   value={formData.businessType} 
                   onChange={(e) => updateForm('businessType', e.target.value as BusinessType)}
                   className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                 >
                   {businessTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1 block">App Language</label>
                 <select 
                   value={formData.language} 
                   onChange={(e) => updateForm('language', e.target.value as Language)}
                   className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                 >
                   {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.label}</option>)}
                 </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="outline" className="w-16" onClick={handleBack}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleNext}
                disabled={!formData.name || !formData.businessName}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
      case 3: {
        const pinValid = /^\d{4}$/.test(formData.pin);
        const confirmValid = formData.pin === formData.confirmPin;
        const canContinue = pinValid && confirmValid;

        return (
          <motion.div
            key="step3_pin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12 animate-fadeIn"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Set Security PIN</h2>
            </div>
            <p className="text-gray-500 text-xs mb-8">
              SmartUdhaar app open karne par security ke liye 4-digit PIN enter karna hoga.
            </p>

            <div className="space-y-5 mb-auto">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wider">
                  Enter 4-Digit PIN *
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={formData.pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    updateForm("pin", val);
                  }}
                  className="bg-slate-50 border-slate-200 text-center text-xl font-bold tracking-[1em] h-12"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-wider">
                  Confirm PIN *
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={formData.confirmPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    updateForm("confirmPin", val);
                  }}
                  className="bg-slate-50 border-slate-200 text-center text-xl font-bold tracking-[1em] h-12"
                />
              </div>

              {formData.pin && formData.pin.length < 4 && (
                <p className="text-xs text-amber-600 font-semibold">PIN exactly 4-digits ka hona chahiye.</p>
              )}

              {formData.pin.length === 4 && formData.confirmPin.length === 4 && !confirmValid && (
                <p className="text-xs text-red-600 font-semibold">PIN match nahi kar raha. Kripya check karein.</p>
              )}

              <div className="flex items-center gap-3 bg-slate-50 p-4 border border-slate-100 rounded-xl mt-4">
                <input
                  type="checkbox"
                  id="appLockEnabled"
                  checked={formData.appLockEnabled}
                  onChange={(e) => updateForm("appLockEnabled", e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="appLockEnabled" className="text-xs text-slate-750 font-semibold select-none cursor-pointer leading-snug">
                  App open hote hi Lock Screen show karein (Recommended)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="outline" className="w-16" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleNext} disabled={!canContinue}>
                Continue
              </Button>
            </div>
          </motion.div>
        );
      }
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">App Features</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-auto">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center text-center">
                 <Store className="w-6 h-6 text-indigo-600 mb-2" />
                 <span className="font-bold text-sm text-indigo-900">Udhaar Track Karo</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                 <span className="text-xl mb-2">💰</span>
                 <span className="font-bold text-sm text-emerald-900">Sales Add Karo</span>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                 <Package className="w-6 h-6 text-orange-600 mb-2" />
                 <span className="font-bold text-sm text-orange-900">Stock Manage Karo</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                 <Cloud className="w-6 h-6 text-blue-600 mb-2" />
                 <span className="font-bold text-sm text-blue-900">Backup Safe Rakho</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="outline" className="w-16" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </motion.div>
        );
      case 5:
         return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12"
          >
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">All Set!</h2>
              <p className="text-gray-500 mb-8">How would you like to start using SmartUdhaar AI?</p>
              
              <div className="w-full space-y-3">
                 <Button className="w-full h-12 text-sm font-bold bg-indigo-600" onClick={handleComplete}>
                   Start Fresh
                 </Button>
                 <div className="space-y-2 pt-2">
                   <Button variant="outline" className="w-full h-12 text-sm font-bold border-indigo-200 text-indigo-700 bg-indigo-50" onClick={() => {
                     try {
                       useStore.getState().addDemoData();
                     } catch (e) {
                       alert("Demo data add nahi ho paya. Aap Start Fresh use kar sakte hain.");
                     }
                     handleComplete();
                   }}>
                     Try Demo Data
                   </Button>
                   <p className="text-[10.5px] text-gray-500 font-medium leading-snug">
                     Demo data se aap app ko sample customer, sale, stock aur invoice ke saath test kar sakte hain.
                   </p>
                 </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-white relative">
       <AnimatePresence mode="wait">
        {currentStepContent()}
       </AnimatePresence>
    </div>
  );
};
