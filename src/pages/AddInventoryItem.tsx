import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Check, Package, DollarSign, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { InventoryUnit } from '../types';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { validateQuantityByUnit, isDecimalAllowedForUnit } from '../utils/quantity';

export const AddInventoryItem = () => {
  const navigate = useNavigate();
  const addInventoryItem = useStore(state => state.addInventoryItem);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchasePrice: '', // Rupee
    sellingPrice: '', // Rupee
    stockQty: '',
    lowStockAlertQty: '5',
    unit: 'pcs' as InventoryUnit,
    sku: '',
  });

  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }

    const purchasePricePaise = Math.round((parseFloat(formData.purchasePrice) || 0) * 100);
    const sellingPricePaise = Math.round((parseFloat(formData.sellingPrice) || 0) * 100);
    const stockQty = parseFloat(formData.stockQty) || 0;
    const lowStockAlertQty = parseFloat(formData.lowStockAlertQty) || 0;

    if (purchasePricePaise < 0) {
      setError('Purchase price cannot be negative.');
      return;
    }
    
    if (sellingPricePaise <= 0) {
      setError('Selling price must be greater than 0.');
      return;
    }
    
    if (stockQty < 0 || lowStockAlertQty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    if (stockQty > 0) {
      const stockValidation = validateQuantityByUnit(stockQty, formData.unit);
      if (!stockValidation.valid) {
        setError(stockValidation.error || 'Invalid stock quantity');
        return;
      }
    }

    if (lowStockAlertQty > 0) {
      const lowStockValidation = validateQuantityByUnit(lowStockAlertQty, formData.unit);
      if (!lowStockValidation.valid) {
        setError(lowStockValidation.error || 'Invalid low stock alert quantity');
        return;
      }
    }

    addInventoryItem({
      userId: useStore.getState().user?.id || '',
      name: formData.name.trim(),
      category: formData.category.trim() || undefined,
      sku: formData.sku.trim() || undefined,
      purchasePricePaise,
      sellingPricePaise,
      stockQty: stockQty > 0 ? Number(stockQty.toFixed(3)) : stockQty, // it's already validated
      lowStockAlertQty: lowStockAlertQty > 0 ? Number(lowStockAlertQty.toFixed(3)) : lowStockAlertQty,
      unit: formData.unit,
    });

    navigate('/inventory', { replace: true });
  };

  const purchaseNum = parseFloat(formData.purchasePrice) || 0;
  const sellingNum = parseFloat(formData.sellingPrice) || 0;
  const profitNum = sellingNum - purchaseNum;
  const marginNum = sellingNum > 0 ? (profitNum / sellingNum) * 100 : 0;

  return (
      <div className="flex flex-col flex-1 w-full bg-slate-50 overflow-hidden relative">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add Item</h1>
            <p className="text-xs text-slate-500 font-medium">New stock item</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 pb-32 space-y-5 overflow-y-auto">
        {error && (
           <div className="bg-red-50 text-red-600 p-3 flex items-center gap-2 text-sm font-medium rounded-xl border border-red-100">
             <AlertCircle className="w-4 h-4 shrink-0" />
             {error}
           </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
           <div>
             <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Item Name *</label>
             <Input 
               value={formData.name}
               onChange={e => setFormData({ ...formData, name: e.target.value })}
               placeholder="e.g. Aashirvaad Atta 5kg"
               className="bg-slate-50 border-slate-200"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Category</label>
                 <Input 
                   value={formData.category}
                   onChange={e => setFormData({ ...formData, category: e.target.value })}
                   placeholder="e.g. Grocery"
                   className="bg-slate-50 border-slate-200"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">SKU / Code</label>
                 <Input 
                   value={formData.sku}
                   onChange={e => setFormData({ ...formData, sku: e.target.value })}
                   placeholder="Optional"
                   className="bg-slate-50 border-slate-200"
                 />
              </div>
           </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Purchase Price (₹)</label>
                 <Input 
                   type="number"
                   value={formData.purchasePrice}
                   onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                   placeholder="0.00"
                   className="bg-slate-50 border-slate-200"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Selling Price (₹) *</label>
                 <Input 
                   type="number"
                   value={formData.sellingPrice}
                   onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                   placeholder="0.00"
                   className="bg-slate-50 border-slate-200 font-bold text-indigo-900"
                 />
              </div>
           </div>

           {sellingNum > 0 && (
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Profit / Unit</span>
                <div className="text-right">
                   <span className={`font-bold ${profitNum >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>₹{profitNum.toFixed(2)}</span>
                   <span className="text-[10px] text-slate-400 font-medium ml-2">({marginNum.toFixed(1)}% margin)</span>
                </div>
             </div>
           )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Opening Stock</label>
                 <Input 
                   type="number"
                   step={isDecimalAllowedForUnit(formData.unit) ? "0.001" : "1"}
                   inputMode={isDecimalAllowedForUnit(formData.unit) ? "decimal" : "numeric"}
                   value={formData.stockQty}
                   onChange={e => setFormData({ ...formData, stockQty: e.target.value })}
                   placeholder="0"
                   className="bg-slate-50 border-slate-200"
                 />
                 <p className="text-[10px] text-slate-500 font-semibold mt-1">
                   {isDecimalAllowedForUnit(formData.unit) ? 'Decimal allowed' : 'Whole number only'}
                 </p>
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Unit *</label>
                 <select 
                   value={formData.unit}
                   onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all h-10"
                 >
                   <option value="pcs">Pieces (pcs)</option>
                   <option value="kg">Kilogram (kg)</option>
                   <option value="g">Gram (g)</option>
                   <option value="l">Liter (l)</option>
                   <option value="ml">Milliliter (ml)</option>
                   <option value="packet">Packet</option>
                   <option value="box">Box</option>
                   <option value="other">Other</option>
                 </select>
              </div>
           </div>

           <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Low Stock Alert at</label>
              <Input 
                type="number"
                step={isDecimalAllowedForUnit(formData.unit) ? "0.001" : "1"}
                inputMode={isDecimalAllowedForUnit(formData.unit) ? "decimal" : "numeric"}
                value={formData.lowStockAlertQty}
                onChange={e => setFormData({ ...formData, lowStockAlertQty: e.target.value })}
                placeholder="5"
                className="bg-slate-50 border-slate-200 w-1/2"
              />
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                {isDecimalAllowedForUnit(formData.unit) ? 'Decimal allowed' : 'Whole number only'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Jab stock itna bachega toh dashboard par alert ayega.</p>
           </div>
        </div>

      </div>

      <BottomActionBar>
        <Button onClick={handleSave} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.2)] font-bold text-sm tracking-wide flex items-center justify-center gap-2">
           <Check className="w-5 h-5" />
           SAVE ITEM
        </Button>
      </BottomActionBar>
    </div>
  );
};
