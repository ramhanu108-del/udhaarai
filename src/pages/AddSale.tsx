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
import { validateMoneyAmount, sanitizeMoneyInput, handleMoneyKeyDown } from '../utils/money';
import { generateDocumentNumber } from '../utils/documentNo';
import { format } from 'date-fns';

export const AddSale = () => {
  const navigate = useNavigate();
  const { user, customers, sales, transactions, addSale, addTransaction } = useStore();
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
    dueDate: '',
    useAdvance: true,
  });

  const [generateBill, setGenerateBill] = useState(true);
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null);

  const selectedCustomerObj = formData.customerId ? customers.find(c => c.id === formData.customerId) : null;
  const customerBalance = selectedCustomerObj ? selectedCustomerObj.totalPending : 0;
  const advanceAvailablePaise = customerBalance < 0 ? Math.abs(customerBalance) : 0;
  const advanceAvailable = advanceAvailablePaise / 100;

  const [errorText, setErrorText] = useState('');

  const qty = parseFloat(formData.quantity) || 1;
  const sp = parseFloat(formData.sellingPrice) || 0;
  const discount = formData.discount ? (parseFloat(formData.discount) || 0) : 0;
  const cp = formData.costPrice ? (parseFloat(formData.costPrice) || 0) : 0;
  
  const subtotal = sp * qty;
  const total = subtotal - discount;
  
  const advanceUsedPaise = formData.useAdvance && advanceAvailablePaise > 0 ? Math.min(advanceAvailablePaise, Math.round(total * 100)) : 0;
  const advanceUsed = advanceUsedPaise / 100;
  const remainingPayable = total - advanceUsed;

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

    const spVal = validateMoneyAmount(formData.sellingPrice, { required: true });
    if (!spVal.valid) {
      setErrorText(spVal.error || 'Invalid selling price');
      return;
    }

    const cpVal = validateMoneyAmount(formData.costPrice, { allowZero: true });
    if (formData.costPrice && !cpVal.valid) {
      setErrorText(cpVal.error || 'Invalid cost price');
      return;
    }

    const discountVal = validateMoneyAmount(formData.discount, { allowZero: true });
    if (formData.discount && !discountVal.valid) {
      setErrorText(discountVal.error || 'Invalid discount');
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
        setErrorText(`Stock available nahi hai. Sirf ${selectedInventoryItem.stockQty} ${selectedInventoryItem.unit} available hai.`);
        return;
      }
    }

    const subtotalPaise = Math.round(subtotal * 100);
    const discountPaise = Math.round(discount * 100);
    const totalPaise = subtotalPaise - discountPaise;
    const cpPaise = cp ? Math.round(cp * qty * 100) : 0;
    const profitPaise = cpPaise > 0 ? totalPaise - cpPaise : 0;

    const finalAdvanceUsedPaise = formData.useAdvance ? Math.min(advanceAvailablePaise, totalPaise) : 0;
    const finalRemainingPayablePaise = totalPaise - finalAdvanceUsedPaise;

    let linkedTxIds: string[] = [];
    const saleId = Math.random().toString(36).substring(2, 15);

    // 1. If advance used, create adjustment transaction
    if (finalAdvanceUsedPaise > 0 && formData.customerId) {
        const adjTxId = Math.random().toString(36).substring(2, 15);
        addTransaction({
          id: adjTxId,
          userId: user?.id || 'unknown',
          customerId: formData.customerId,
          type: 'advance_adjustment',
          amount: finalAdvanceUsedPaise,
          description: `Advance adjusted against: ${formData.name}`,
          linkedSaleId: saleId,
        });
        linkedTxIds.push(adjTxId);
    }

    // 2. If remaining amount is Udhaar, create udhaar transaction
    let linkedUdhaarTxId: string | undefined = undefined;
    if (formData.paymentMode === 'udhaar' && finalRemainingPayablePaise > 0 && formData.customerId) {
      linkedUdhaarTxId = Math.random().toString(36).substring(2, 15);
      const noteStr = formData.note ? ` - ${formData.note}` : '';
      
      addTransaction({
        id: linkedUdhaarTxId,
        userId: user?.id || 'unknown',
        customerId: formData.customerId,
        type: 'sale_credit',
        amount: finalRemainingPayablePaise,
        description: `${qty}x ${formData.name}${noteStr} (Partial Udhaar)`,
        linkedSaleId: saleId,
        paymentMode: 'udhaar',
        dueDate: formData.dueDate || undefined,
      });
      linkedTxIds.push(linkedUdhaarTxId);
    }

    const finalPaymentMode = (finalRemainingPayablePaise === 0 && finalAdvanceUsedPaise > 0) ? 'advance' : formData.paymentMode;

    const invoiceNo = generateBill ? generateDocumentNumber('sale_invoice', sales, transactions) : undefined;

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
      paymentMode: finalPaymentMode as any,
      advanceUsedPaise: finalAdvanceUsedPaise,
      linkedTransactionId: linkedUdhaarTxId || (linkedTxIds.length > 0 ? linkedTxIds[0] : undefined),
      note: formData.note,
      invoiceNumber: invoiceNo,
      billGenerated: generateBill
    });

    if (generateBill) {
      setSavedSaleId(saleId);
    } else {
      navigate('/dashboard');
    }
  };

  const selectedItemInfo = formData.inventoryItemId 
    ? inventoryItems.find((i: InventoryItem) => i.id === formData.inventoryItemId)
    : null;

  return (
    <div className="w-full min-h-full pb-36 bg-white">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 bg-white">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
           New Sale
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col w-full px-6 py-6 mt-2">
        <div className="space-y-5">
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
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
               Selling Price {selectedItemInfo ? `(₹/${selectedItemInfo.unit})` : '(₹)'}
            </label>
            <Input 
              required 
              type="number" 
              inputMode="decimal"
              step="0.01"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="0.00"
              value={formData.sellingPrice}
              onKeyDown={handleMoneyKeyDown}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, sellingPrice: sanitizeMoneyInput(e.target.value)}))}}
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
              min={selectedItemInfo ? (isDecimalAllowedForUnit(selectedItemInfo.unit) ? "0.001" : "1") : "0"}
              max={selectedItemInfo ? selectedItemInfo.stockQty : undefined}
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="1"
              value={formData.quantity}
              onKeyDown={(e) => {
                 if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                   e.preventDefault();
                 }
                 if (!selectedItemInfo || !isDecimalAllowedForUnit(selectedItemInfo.unit)) {
                   if (e.key === '.') {
                     e.preventDefault();
                   }
                 }
              }}
              onChange={e => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setErrorText(''); setFormData(p => ({...p, quantity: val}))
              }}
            />
            {selectedItemInfo && (
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                 {isDecimalAllowedForUnit(selectedItemInfo.unit) ? 'Decimal allowed up to 3 places' : 'Whole number only'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Total Discount (₹)</label>
            <Input 
              type="number" 
              inputMode="decimal"
              step="0.01"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0 (Optional)"
              value={formData.discount}
              onKeyDown={handleMoneyKeyDown}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, discount: sanitizeMoneyInput(e.target.value)}))}}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
              Cost Price {selectedItemInfo ? `(₹/${selectedItemInfo.unit})` : '(₹/item)'}
            </label>
            <Input 
              type="number" 
              inputMode="decimal"
              step="0.01"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0 (For profit calcs)"
              value={formData.costPrice}
              onKeyDown={handleMoneyKeyDown}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, costPrice: sanitizeMoneyInput(e.target.value)}))}}
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

        {advanceAvailable > 0 && (
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
             <div className="flex justify-between items-center">
                <div>
                   <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Customer Advance Available</h4>
                   <p className="text-sm font-bold text-indigo-700">₹{advanceAvailable.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Use Advance?</span>
                   <button 
                     type="button"
                     onClick={() => setFormData(p => ({ ...p, useAdvance: !p.useAdvance }))}
                     className={`w-10 h-5 rounded-full transition-colors relative ${formData.useAdvance ? 'bg-indigo-600' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.useAdvance ? 'left-6' : 'left-1'}`}></div>
                   </button>
                </div>
             </div>
             {formData.useAdvance && (
                <div className="pt-2 border-t border-indigo-100 flex justify-between items-center text-[10px] font-bold text-indigo-600 italic">
                   <span>Iss sale mein ₹{advanceUsed.toFixed(2)} adjust hoga.</span>
                   <span>Remaining: ₹{remainingPayable.toFixed(2)}</span>
                </div>
             )}
          </div>
        )}

        {formData.paymentMode === 'udhaar' && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
             <label className="text-xs font-bold text-red-800 mb-1.5 block uppercase tracking-wider">Select Customer *</label>
             <select 
               className="flex h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
               value={formData.customerId}
               onChange={(e) => setFormData(p => ({...p, customerId: e.target.value}))}
               required
             >
               <option value="">Select customer...</option>
               {customers.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
               ))}
             </select>
             
             <label className="text-xs font-bold text-red-800 mb-1.5 block uppercase tracking-wider">Payment kab tak lena hai? (Optional)</label>
             <Input 
               type="date"
               className="h-12 bg-white border-red-200 font-medium mb-3"
               value={formData.dueDate}
               min={new Date().toISOString().split('T')[0]}
               onChange={e => setFormData(p => ({...p, dueDate: e.target.value}))}
             />

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

          {advanceUsed > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1">
               <div className="flex justify-between items-center text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  <span>Advance Used</span>
                  <span>-₹{advanceUsed.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold text-slate-900 uppercase tracking-widest">
                  <span>Remaining Payable</span>
                  <span>₹{remainingPayable.toFixed(2)}</span>
               </div>
            </div>
          )}
          {cp > 0 && profit > 0 && (
             <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-100">
               <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Est. Profit</span>
               <span className="text-xs font-bold text-emerald-600">₹{profit.toFixed(2)}</span>
             </div>
          )}
        </div>
        </div>

        <div className="flex items-center space-x-3 bg-indigo-50/55 p-3.5 rounded-2xl border border-indigo-100/50 mt-5 mb-1.5">
          <input
            id="bill-toggle"
            type="checkbox"
            checked={generateBill}
            onChange={(e) => setGenerateBill(e.target.checked)}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <label htmlFor="bill-toggle" className="text-xs font-extrabold text-indigo-900 cursor-pointer select-none uppercase tracking-wide">
            Bill banana hai
          </label>
        </div>

        <div className="mt-6 pb-8">
          <Button 
            type="submit" 
            className="w-full text-sm uppercase tracking-widest font-bold h-14 shadow-sm active:scale-95 transition-transform bg-slate-900 hover:bg-slate-800 text-white" 
          >
            Save Sale
          </Button>
        </div>
      </form>

      {/* Bill Save Success Modal Overlay */}
      {savedSaleId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Sale Transaction Saved!</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Invoice generated successfully</p>
            </div>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 space-y-2">
               <div className="flex justify-between">
                 <span className="text-slate-400">Bill Number:</span>
                 <span className="font-mono text-indigo-800">{sales.find(s => s.id === savedSaleId)?.invoiceNumber || 'N/A'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-400">Total Amount:</span>
                 <span className="text-slate-900">Rs. {total.toFixed(2)}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={() => navigate(`/documents/sale_invoice/${savedSaleId}`)}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                View Bill
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const saleObj = sales.find(s => s.id === savedSaleId);
                  const dateStr = format(new Date(), 'dd MMM yyyy');
                  const customerName = formData.customerId ? (customers.find(c => c.id === formData.customerId)?.name || 'Walk-in Customer') : 'Walk-in Customer';
                  const remainingUdhaarVal = formData.paymentMode === 'udhaar' ? (total - advanceUsed) : 0;
                  
                  let text = `*SmartUdhaar AI Sale Bill*\n`;
                  text += `Shop Name: ${user?.businessName || 'Our Shop'}\n`;
                  text += `Bill No: ${saleObj?.invoiceNumber || 'N/A'}\n`;
                  text += `Customer: ${customerName}\n`;
                  text += `Item: ${formData.quantity}x ${formData.name} @ Rs. ${sp.toFixed(2)}\n`;
                  if (discount > 0) text += `Discount: Rs. ${discount.toFixed(2)}\n`;
                  text += `Total Amount: Rs. ${total.toFixed(2)}\n`;
                  if (advanceUsed > 0) text += `Advance Used: Rs. ${advanceUsed.toFixed(2)}\n`;
                  text += `Paid Amount: ${formData.paymentMode === 'udhaar' ? 'Rs. 0.00' : `Rs. ${remainingPayable.toFixed(2)}`}\n`;
                  if (remainingUdhaarVal > 0) text += `Remaining Udhaar: Rs. ${remainingUdhaarVal.toFixed(2)}\n`;
                  text += `Date: ${dateStr}`;
                  
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full h-12 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-800 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
              >
                Share WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  // Simply redirect to view page and trigger normal browser printing which is print-optimized!
                  navigate(`/documents/sale_invoice/${savedSaleId}`);
                  setTimeout(() => {
                    window.print();
                  }, 500);
                }}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
              >
                Download PDF
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-[10px] text-slate-400 font-black hover:text-slate-600 uppercase tracking-widest pt-2 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
