import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { BottomActionBar } from '../components/layout/BottomActionBar';

export const AddTransaction = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const { customers, addTransaction, user } = useStore();
  
  const initialType = searchParams.get('type') || 'udhaar';
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: initialType as 'udhaar' | 'payment',
    paymentMode: 'cash' as 'cash' | 'upi' | 'card',
  });

  const [errorText, setErrorText] = useState('');

  // If customerId is provided, we strictly add to that customer.
  // We need to support 'select' as customerId placeholder.
  let initialCustomer = customerId && customerId !== 'select' ? customerId : '';
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);

  const isUdhaar = formData.type === 'udhaar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!selectedCustomer) {
      setErrorText('Please select a customer.');
      return;
    }
    
    // Amount is received as Rupee decimal, convert to paise
    const parsedAmount = parseFloat(formData.amount);
    
    // Robust validation
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorText('Please enter a valid amount greater than 0.');
      return;
    }

    const amountInPaise = Math.round(parsedAmount * 100);
    
    addTransaction({
      userId: user?.id || 'unknown',
      customerId: selectedCustomer,
      type: formData.type,
      amount: amountInPaise,
      description: formData.description || (isUdhaar ? 'Given Udhaar' : 'Received Payment'),
      paymentMode: isUdhaar ? undefined : formData.paymentMode,
    });
    
    navigate(-1);
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-white">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 bg-white">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
           {isUdhaar ? 'Give Udhaar' : 'Receive Payment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative">
        <div className="px-6 py-6 space-y-5 flex-1">
          {errorText && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-lg mb-2">
            {errorText}
          </div>
        )}
        
        {/* Customer Selection (if not pre-populated) */}
        {!initialCustomer && (
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Select Customer</label>
             <select 
               className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={selectedCustomer}
               onChange={(e) => setSelectedCustomer(e.target.value)}
               required
             >
               <option value="" disabled>Choose a customer...</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
               ))}
             </select>
          </div>
        )}

        {/* Amount Input */}
        <div>
           <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Amount (₹)</label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold">₹</span>
             </div>
             <Input 
               required 
               type="number"
               step="0.01"
               min="0.1"
               className="pl-8 text-2xl font-bold h-14 bg-slate-50 border-slate-200"
               placeholder="0.00"
               value={formData.amount}
               onChange={e => {setErrorText(''); setFormData(p => ({...p, amount: e.target.value}))}}
             />
           </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Item Details / Notes</label>
          <Input 
            className="h-12 bg-slate-50 border-slate-200 font-medium"
            placeholder={isUdhaar ? "e.g. 5kg sugar, 2 rice" : "e.g. Cleared bill"}
            value={formData.description}
            onChange={e => setFormData(p => ({...p, description: e.target.value}))}
          />
        </div>

        {/* Payment mode (if Payment) */}
        {!isUdhaar && (
           <div>
             <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Payment Mode</label>
             <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'card'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData(p => ({...p, paymentMode: mode as any}))}
                    className={`py-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-colors active:scale-95 ${
                      formData.paymentMode === mode 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
             </div>
           </div>
        )}
        </div>

        <BottomActionBar>
          <Button 
            type="submit" 
            className={`w-full text-sm uppercase tracking-widest font-bold h-14 shadow-sm active:scale-95 transition-transform ${isUdhaar ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`} 
          >
            {isUdhaar ? 'Save Udhaar' : 'Save Payment'}
          </Button>
        </BottomActionBar>
      </form>
    </div>
  );
};
