import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Package } from 'lucide-react';
import { BottomActionBar } from '../components/layout/BottomActionBar';

import { validateQuantityByUnit, isDecimalAllowedForUnit } from '../utils/quantity';

export const AddTransaction = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const { customers, inventory, addTransaction, adjustStock, user } = useStore();
  
  const initialType = searchParams.get('type') || 'udhaar';
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: initialType as 'udhaar' | 'payment',
    paymentMode: 'cash' as 'cash' | 'upi' | 'card',
  });

  const [udhaarMode, setUdhaarMode] = useState<'manual' | 'inventory'>('manual');
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [inventoryQty, setInventoryQty] = useState<string>('1');

  const [errorText, setErrorText] = useState('');

  // If customerId is provided, we strictly add to that customer.
  // We need to support 'select' as customerId placeholder.
  let initialCustomer = customerId && customerId !== 'select' ? customerId : '';
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);

  const isUdhaar = formData.type === 'udhaar';
  const isInventoryMode = isUdhaar && udhaarMode === 'inventory';
  const selectedItem = inventory.find(i => i.id === selectedInventoryId);

  // Auto-calculate amount when inventory item or qty changes
  useEffect(() => {
    if (isInventoryMode && selectedItem) {
      const qty = parseFloat(inventoryQty) || 0;
      if (qty > 0) {
        const totalAmount = (selectedItem.sellingPricePaise / 100) * qty;
        setFormData(prev => ({
          ...prev,
          amount: totalAmount.toFixed(2),
          description: `Inventory Udhaar: ${selectedItem.name} x ${qty}`
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          amount: '',
        }));
      }
    }
  }, [selectedInventoryId, inventoryQty, isInventoryMode, selectedItem]);

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

    if (isInventoryMode) {
      if (!selectedInventoryId || !selectedItem) {
        setErrorText('Please select an inventory item.');
        return;
      }
      const qty = parseFloat(inventoryQty);
      
      const qtyValidation = validateQuantityByUnit(qty, selectedItem.unit);
      if (!qtyValidation.valid) {
        setErrorText(qtyValidation.error || 'Invalid quantity');
        return;
      }

      if (qty > selectedItem.stockQty) {
        setErrorText('Stock available nahi hai');
        return;
      }
    }

    const amountInPaise = Math.round(parsedAmount * 100);
    
    const transactionId = addTransaction({
      userId: user?.id || 'unknown',
      customerId: selectedCustomer,
      type: formData.type,
      amount: amountInPaise,
      description: formData.description || (isUdhaar ? 'Given Udhaar' : 'Received Payment'),
      paymentMode: isUdhaar ? undefined : formData.paymentMode,
      inventoryItemId: isInventoryMode ? selectedInventoryId : undefined,
      stockReducedQty: isInventoryMode ? parseFloat(inventoryQty) : undefined,
    });
    
    if (isInventoryMode && selectedInventoryId) {
       adjustStock(
         selectedInventoryId, 
         -parseFloat(inventoryQty), 
         'Inventory udhaar', 
         'sale', 
         transactionId
       );
    }
    
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

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative w-full">
        <div className="px-6 py-6 pb-16 space-y-5 flex-1">
          {errorText && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-lg mb-2">
            {errorText}
          </div>
        )}
        
        {/* Mode Switch (if Udhaar) */}
        {isUdhaar && (
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setUdhaarMode('manual')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${udhaarMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Manual Udhaar
            </button>
            <button
              type="button"
              onClick={() => setUdhaarMode('inventory')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${udhaarMode === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Package className="w-3.5 h-3.5" />
              Inventory se Udhaar
            </button>
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

        {/* Inventory Selection */}
        {isInventoryMode && (
          <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div>
              <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">Item Select Karo</label>
              <select 
                className="flex h-12 w-full rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                required={isInventoryMode}
              >
                <option value="" disabled>Choose an item...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (-₹{(item.sellingPricePaise / 100).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">Available Stock</label>
                  <div className="h-12 bg-white border border-indigo-100 rounded-xl flex items-center px-4 font-bold text-slate-700">
                    {selectedItem.stockQty} {selectedItem.unit}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-900 mb-1.5 block uppercase tracking-wider">Quantity</label>
                  <Input 
                    type="number"
                    min={isDecimalAllowedForUnit(selectedItem.unit) ? "0.001" : "1"}
                    max={selectedItem.stockQty}
                    step={isDecimalAllowedForUnit(selectedItem.unit) ? "0.001" : "1"}
                    inputMode={isDecimalAllowedForUnit(selectedItem.unit) ? "decimal" : "numeric"}
                    className="h-12 bg-white border-indigo-200 font-bold"
                    value={inventoryQty}
                    onChange={e => setInventoryQty(e.target.value)}
                    required={isInventoryMode}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isDecimalAllowedForUnit(selectedItem.unit) ? 'Decimal allowed' : 'Whole number only'}
                  </p>
                </div>
              </div>
            )}
            <p className="text-[10px] text-indigo-600 font-medium leading-relaxed">
              Inventory se udhaar dene par stock auto kam hoga aur customer ke pending balance mein amount add hoga.
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div>
           <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
             {isInventoryMode ? 'Total Udhaar (₹)' : 'Amount (₹)'}
           </label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold">₹</span>
             </div>
             <Input 
               required 
               type="number"
               step="0.01"
               min="0.1"
               className={`pl-8 text-2xl font-bold h-14 border-slate-200 ${isInventoryMode ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
               placeholder="0.00"
               value={formData.amount}
               onChange={e => {setErrorText(''); setFormData(p => ({...p, amount: e.target.value}))}}
               readOnly={isInventoryMode}
             />
           </div>
        </div>

        {/* Description Input */}
        <div className={isInventoryMode ? 'hidden' : 'block'}>
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
