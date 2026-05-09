import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getInventoryItems } from '../store/selectors';
import { PaymentMode, InventoryItem } from '../types';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { validateQuantityByUnit, isDecimalAllowedForUnit } from '../utils/quantity';

export const AddSale = () => {
  const navigate = useNavigate();
  const { user, customers, addSale, addTransaction } = useStore();
  const inventoryItems = getInventoryItems();

  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    sellingPrice: '',
    costPrice: '',
    discount: '',
    paymentMode: 'cash' as PaymentMode,
    customerId: '',
    note: '',
    inventoryItemId: '',
  });

  const [errorText, setErrorText] = useState('');

  const qty = parseFloat(formData.quantity) || 1;
  const sp = parseFloat(formData.sellingPrice) || 0;
  const discount = formData.discount ? (parseFloat(formData.discount) || 0) : 0;
  const cp = formData.costPrice ? (parseFloat(formData.costPrice) || 0) : 0;
  
  const subtotal = sp * qty;
  const total = subtotal - discount;
  const profit = (cp > 0) ? (total - (cp * qty)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!formData.name.trim()) {
      setErrorText('Item/service name is required.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setErrorText('Quantity must be greater than 0.');
      return;
    }

    if (isNaN(sp) || sp <= 0) {
      setErrorText('Selling price must be greater than 0.');
      return;
    }

    if (isNaN(cp) || cp < 0) {
      setErrorText('Cost price cannot be negative.');
      return;
    }

    if (isNaN(discount) || discount < 0) {
      setErrorText('Discount cannot be negative.');
      return;
    }

    if (discount > subtotal) {
      setErrorText('Discount cannot exceed subtotal.');
      return;
    }

    if (formData.paymentMode === 'udhaar' && !formData.customerId) {
      setErrorText('Customer is required for Udhaar sale. Please select one.');
      return;
    }

    const selectedInventoryItem = inventoryItems.find((i: InventoryItem) => i.id === formData.inventoryItemId);
    const requiredStock = qty;

    if (selectedInventoryItem) {
      const qtyValidation = validateQuantityByUnit(qty, selectedInventoryItem.unit);
      if (!qtyValidation.valid) {
        setErrorText(qtyValidation.error || 'Invalid quantity');
        return;
      }

      if (selectedInventoryItem.stockQty < requiredStock) {
        setErrorText(`Quantity cannot exceed available stock (${selectedInventoryItem.stockQty} ${selectedInventoryItem.unit}).`);
        return;
      }
    }

    const subtotalPaise = Math.round(subtotal * 100);
    const discountPaise = Math.round(discount * 100);
    const totalPaise = subtotalPaise - discountPaise;
    const cpPaise = cp ? Math.round(cp * qty * 100) : 0;
    const profitPaise = cpPaise > 0 ? totalPaise - cpPaise : 0;

    let linkedTxId: string | undefined = undefined;
    const saleId = Math.random().toString(36).substring(2, 15);

    if (formData.paymentMode === 'udhaar') {
      linkedTxId = Math.random().toString(36).substring(2, 15);
      
      const noteStr = formData.note ? ` - ${formData.note}` : '';
      
      addTransaction({
        id: linkedTxId,
        userId: user?.id || 'unknown',
        customerId: formData.customerId,
        type: 'sale_credit',
        amount: totalPaise,
        description: `${qty}x ${formData.name}${noteStr}`,
        linkedSaleId: saleId,
        paymentMode: 'udhaar'
      });
    }

    addSale({
      id: saleId,
      userId: user?.id || 'unknown',
      customerId: formData.customerId || undefined,
      items: [
        {
          id: Math.random().toString(36).substring(2, 15),
          inventoryItemId: formData.inventoryItemId || undefined,
          name: formData.name,
          quantity: qty,
          unitPricePaise: Math.round(sp * 100),
          costPricePaise: cp ? Math.round(cp * 100) : undefined,
          lineTotalPaise: subtotalPaise,
          profitPaise: profitPaise,
          stockReducedQty: formData.inventoryItemId ? qty : undefined,
        }
      ],
      subtotalPaise,
      discountPaise,
      totalPaise,
      costTotalPaise: cpPaise || undefined,
      profitPaise: cpPaise > 0 ? profitPaise : undefined,
      paymentMode: formData.paymentMode,
      linkedTransactionId: linkedTxId,
      note: formData.note
    });

    navigate('/dashboard'); // or redirect to /sales which we will build
  };

  const selectedItemInfo = formData.inventoryItemId 
    ? inventoryItems.find((i: InventoryItem) => i.id === formData.inventoryItemId)
    : null;

  return (
    <div className="flex flex-col flex-1 w-full bg-white">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 bg-white">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
           New Sale
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative overflow-hidden">
        <div className="px-6 py-6 pb-32 space-y-5 flex-1 overflow-y-auto">
          {errorText && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-lg mb-2">
            {errorText}
          </div>
        )}
        
        {inventoryItems.length > 0 && (
           <div className="space-y-3">
              <label className="text-xs font-bold text-indigo-700 flex items-center gap-1 uppercase tracking-wider">
                 <Package className="w-3.5 h-3.5" /> Inventory se item select karo
              </label>
              <select 
                value={formData.inventoryItemId}
                onChange={e => {
                  const id = e.target.value;
                  if (!id) {
                     setFormData(p => ({ ...p, inventoryItemId: '', name: '', sellingPrice: '', costPrice: '' }));
                     return;
                  }
                  const item = inventoryItems.find((i: InventoryItem) => i.id === id);
                  if (item) {
                     setFormData(p => ({ 
                        ...p, 
                        inventoryItemId: id, 
                        name: item.name, 
                        sellingPrice: (item.sellingPricePaise / 100).toString(),
                        costPrice: (item.purchasePricePaise / 100).toString()
                     }));
                     setErrorText('');
                  }
                }}
                className="w-full h-12 px-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
              >
                 <option value="">Stock item choose karo...</option>
                 {inventoryItems.map((item: InventoryItem, index) => (
                    <option key={`${item.id}-${index}`} value={item.id}>
                       {item.name} — {item.stockQty} {item.unit} available — ₹{(item.sellingPricePaise / 100).toFixed(2)}
                    </option>
                 ))}
              </select>
              
              {!formData.inventoryItemId ? (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-2 rounded-lg font-bold">
                    ⚠️ Manual sale inventory stock ko reduce nahi karegi. Stock auto-update ke liye upar se inventory item select karein.
                 </div>
              ) : selectedItemInfo && (
                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-indigo-50">
                       <span className="text-indigo-400 block mb-0.5">Available Stock</span>
                       <span className="text-indigo-950 text-xs">{selectedItemInfo.stockQty} {selectedItemInfo.unit}</span>
                    </div>
                    <div className="bg-white px-2 py-1.5 rounded-lg border border-indigo-50">
                       <span className="text-indigo-400 block mb-0.5">Profit per item</span>
                       <span className="text-emerald-600 text-xs text-right">
                         ₹{((selectedItemInfo.sellingPricePaise - selectedItemInfo.purchasePricePaise) / 100).toFixed(2)}
                       </span>
                    </div>
                 </div>
              )}
           </div>
        )}

        <div>
           <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Item / Service Name</label>
           <Input 
             required 
             className="h-12 bg-slate-50 border-slate-200 font-bold"
             placeholder="e.g. T-Shirt, Repair Service"
             value={formData.name}
             onChange={e => {setErrorText(''); setFormData(p => ({...p, name: e.target.value}))}}
           />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Selling Price (₹)</label>
            <Input 
              required 
              type="number" 
              step="any"
              min="0.1"
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="0"
              value={formData.sellingPrice}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, sellingPrice: e.target.value}))}}
            />
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5">
               <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</label>
            </div>
            <Input 
              required 
              type="number" 
              step={selectedItemInfo ? (isDecimalAllowedForUnit(selectedItemInfo.unit) ? "0.001" : "1") : "any"}
              inputMode={selectedItemInfo ? (isDecimalAllowedForUnit(selectedItemInfo.unit) ? "decimal" : "numeric") : "decimal"}
              min="0.001"
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="1"
              value={formData.quantity}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, quantity: e.target.value}))}}
            />
            {selectedItemInfo && (
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                 {isDecimalAllowedForUnit(selectedItemInfo.unit) ? 'Decimal allowed' : 'Whole number only'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Total Discount (₹)</label>
            <Input 
              type="number" 
              step="any"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0 (Optional)"
              value={formData.discount}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, discount: e.target.value}))}}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Cost Price (₹/item)</label>
            <Input 
              type="number" 
              step="any"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0 (For profit calcs)"
              value={formData.costPrice}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, costPrice: e.target.value}))}}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Payment Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {['cash', 'upi', 'card', 'udhaar'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setFormData(p => ({...p, paymentMode: mode as PaymentMode}))}
                className={`py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors active:scale-95 ${
                  formData.paymentMode === mode 
                    ? mode === 'udhaar' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {formData.paymentMode === 'udhaar' && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
             <label className="text-xs font-bold text-red-800 mb-1.5 block uppercase tracking-wider">Select Customer *</label>
             <select 
               className="flex h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
               value={formData.customerId}
               onChange={(e) => setFormData(p => ({...p, customerId: e.target.value}))}
               required
             >
               <option value="">Select customer...</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
             <p className="text-[10px] text-red-600 font-semibold mb-2">Is sale ka amount customer ke pending udhaar mein add hoga.</p>
             <Button type="button" onClick={() => navigate('/customers/new')} variant="outline" className="w-full text-xs h-10 border-red-200 text-red-700 bg-white">
                Naya Customer Add Karo
             </Button>
          </div>
        )}

        {(formData.paymentMode === 'cash' || formData.paymentMode === 'upi' || formData.paymentMode === 'card') && (
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
             <label className="text-[10px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">Optional: Link to Customer</label>
             <select 
               className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none"
               value={formData.customerId}
               onChange={(e) => setFormData(p => ({...p, customerId: e.target.value}))}
             >
               <option value="">No customer linked</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
           </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Notes (Optional)</label>
          <Input 
            className="h-12 bg-slate-50 border-slate-200 font-medium"
            placeholder="e.g. Size L, Color Blue"
            value={formData.note}
            onChange={e => setFormData(p => ({...p, note: e.target.value}))}
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
          <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
             <span className="text-sm font-bold text-slate-700">₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Discount</span>
               <span className="text-sm font-bold text-emerald-600">-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="w-full h-px bg-slate-200 my-2"></div>
          <div className="flex justify-between items-center">
             <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Net Total</span>
             <span className="text-xl font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>
          {cp > 0 && profit > 0 && (
             <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-100">
               <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Est. Profit</span>
               <span className="text-xs font-bold text-emerald-600">₹{profit.toFixed(2)}</span>
             </div>
          )}
        </div>
        </div>

        <BottomActionBar>
          <Button 
            type="submit" 
            className="w-full text-sm uppercase tracking-widest font-bold h-14 shadow-sm active:scale-95 transition-transform bg-slate-900 hover:bg-slate-800 text-white" 
          >
            Save Sale
          </Button>
        </BottomActionBar>
      </form>
    </div>
  );
};
