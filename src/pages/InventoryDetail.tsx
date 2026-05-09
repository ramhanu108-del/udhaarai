import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Check, Package, Archive, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { validateQuantityByUnit, isDecimalAllowedForUnit } from '../utils/quantity';

export const InventoryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const state = useStore();
  const item = state.inventory?.find(i => i.id === id);

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'reduce' | 'correction'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  if (!item) {
    return <div className="p-6">Item not found.</div>;
  }

  const handleAdjustStock = () => {
    const qty = parseFloat(adjustQty);
    
    const qtyValidation = validateQuantityByUnit(qty, item.unit);
    if (!qtyValidation.valid) {
      alert(qtyValidation.error || 'Invalid quantity');
      return;
    }

    let delta = 0;
    if (adjustmentType === 'add') delta = qty;
    if (adjustmentType === 'reduce') delta = -qty;
    if (adjustmentType === 'correction') delta = qty - item.stockQty; // new stock - old stock

    // Prevent reducing below 0 unless explicit correction
    if (adjustmentType === 'reduce' && item.stockQty + delta < 0) {
      alert('Cannot reduce stock below 0. Use "Correction" if needed.');
      return;
    }

    state.adjustStock(item.id, delta, adjustReason, 'adjustment');
    setIsAdjusting(false);
    setAdjustQty('');
    setAdjustReason('');
  };

  const handleArchive = () => {
    if (window.confirm('Are you sure you want to archive this item?')) {
      state.archiveInventoryItem(item.id);
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
            <p className="text-xs text-slate-500 font-medium">Inventory Item</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
           <div className="flex justify-between items-center mb-4">
              <div>
                 <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Current Stock</p>
                 <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-slate-900">{item.stockQty}</p>
                    <p className="text-sm font-bold text-slate-500 mb-1">{item.unit}</p>
                 </div>
              </div>
              <Button onClick={() => setIsAdjusting(!isAdjusting)} variant="outline" className="text-xs font-bold text-indigo-700 border-indigo-200 bg-indigo-50/50">
                 <RefreshCw className="w-4 h-4 mr-2" /> ADJUST
              </Button>
           </div>
           
           {isAdjusting && (
             <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Adjustment Type</label>
                   <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => setAdjustmentType('add')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${adjustmentType === 'add' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Add
                      </button>
                      <button 
                        onClick={() => setAdjustmentType('reduce')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${adjustmentType === 'reduce' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Reduce
                      </button>
                      <button 
                        onClick={() => setAdjustmentType('correction')}
                        className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-colors ${adjustmentType === 'correction' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Correct
                      </button>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                     {adjustmentType === 'correction' ? 'New Total Quantity' : 'Quantity to change'}
                   </label>
                   <Input 
                     type="number"
                     step={isDecimalAllowedForUnit(item.unit) ? "0.001" : "1"}
                     inputMode={isDecimalAllowedForUnit(item.unit) ? "decimal" : "numeric"}
                     placeholder="0"
                     value={adjustQty}
                     onChange={e => setAdjustQty(e.target.value)}
                     className="bg-slate-50 border-slate-200"
                   />
                   <p className="text-[10px] text-slate-500 font-semibold mt-1">
                     {isDecimalAllowedForUnit(item.unit) ? 'Decimal allowed' : 'Whole number only'}
                   </p>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Reason (Optional)</label>
                   <Input 
                     placeholder="e.g. Broken, Found in store, Newly bought"
                     value={adjustReason}
                     onChange={e => setAdjustReason(e.target.value)}
                     className="bg-slate-50 border-slate-200"
                   />
                </div>

                <div className="flex gap-3">
                   <Button onClick={handleAdjustStock} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold tracking-wider uppercase text-[10px]">
                      Confirm Update
                   </Button>
                   <Button onClick={() => setIsAdjusting(false)} variant="outline" className="flex-1 text-[10px] font-bold tracking-wider uppercase text-slate-600">
                      Cancel
                   </Button>
                </div>
             </div>
           )}
        </div>

        <button onClick={handleArchive} className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm tracking-wider uppercase transition-colors hover:bg-red-100">
           <Archive className="w-4 h-4" /> Archive Item
        </button>

      </div>
    </div>
  );
};
