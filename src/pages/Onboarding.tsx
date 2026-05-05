import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Scissors, Wrench, Shirt, BookOpen, Truck, MoreHorizontal } from 'lucide-react';
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
  const { setUser, user } = useStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    businessType: 'kirana' as BusinessType,
    language: 'hinglish' as Language,
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
      ...formData,
      createdAt: Date.now(),
    });
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
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-8">
              <Store size={48} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">SmartUdhaar AI</h1>
            <p className="text-lg text-gray-600 mb-12">
              Apna business smart banao.<br/>Udhaar, sales aur payments ek jagah.
            </p>
            <Button className="w-full" size="lg" onClick={handleNext}>
              Start Now
            </Button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Aapka business kaisa hai?</h2>
            <div className="grid grid-cols-2 gap-4 mb-auto">
              {businessTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.businessType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => updateForm('businessType', type.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-100 bg-white hover:border-gray-200 text-gray-600"
                    )}
                  >
                    <Icon className="mb-3 w-8 h-8" />
                    <span className="font-medium text-sm">{type.label}</span>
                  </button>
                );
              })}
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
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop details</h2>
            <p className="text-gray-500 mb-8">Enter your basic information</p>

            <div className="space-y-5 mb-auto">
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name</label>
                 <Input 
                   placeholder="e.g. Ramesh Sharma" 
                   value={formData.name}
                   onChange={(e) => updateForm('name', e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mobile Number</label>
                 <Input 
                   type="tel"
                   placeholder="e.g. 9876543210" 
                   value={formData.phone}
                   onChange={(e) => updateForm('phone', e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-sm font-medium text-gray-700 mb-1.5 block">Shop/Business Name</label>
                 <Input 
                   placeholder="e.g. Sharma Kirana Store" 
                   value={formData.businessName}
                   onChange={(e) => updateForm('businessName', e.target.value)}
                 />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="outline" className="w-16" onClick={handleBack}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleNext}
                disabled={!formData.name || !formData.phone || !formData.businessName}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        );
      case 4:
         return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full p-6 pt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose App Language</h2>
            
            <div className="space-y-4 mb-auto">
              {languages.map((lang) => {
                const isSelected = formData.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => updateForm('language', lang.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-100 bg-white hover:border-gray-200 text-gray-700"
                    )}
                  >
                    <span className="font-semibold text-lg">{lang.label}</span>
                    {isSelected && (
                       <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                         <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3">
                           <polyline points="20 6 9 17 4 12" />
                         </svg>
                       </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="outline" className="w-16" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleComplete}>
                Complete Setup
              </Button>
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
