import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  FileText, 
  Check, 
  AlertCircle,
  Trash2,
  PlusCircle,
  MinusCircle,
  Truck
} from 'lucide-react';
import { useStore, computeSupplierBalance } from '../store/useStore';
import { formatCurrency } from '../utils';
import { validateQuantityByUnit, sanitizeQuantityByUnit, isDecimalAllowedForUnit } from '../utils/quantity';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { suppliers, supplierTransactions, voidSupplierTransaction, inventory, addSupplierTransaction, adjustStock, user } = useStore();
  
  const supplier = suppliers.find(s => s.id === id);
  const ledger = useMemo(() => {
    return (supplierTransactions || [])
      .filter(t => t.supplierId === id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [id, supplierTransactions]);

  const balance = useMemo(() => computeSupplierBalance(supplierTransactions, id || ''), [id, supplierTransactions]);

  const advanceAvailablePaise = balance < 0 ? Math.abs(balance) : 0;
  const advanceAvailable = advanceAvailablePaise / 100;

  const [txType, setTxType] = useState<'purchase_credit' | 'supplier_payment' | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    paymentMode: 'cash' as any,
    inventoryItemId: '', // '' means no link, 'new' means create new
    inventoryQty: '',
    unitPrice: '',
    purchaseName: '',
    unit: 'pcs' as string,
    sellingPrice: '',
    lowStockAlert: '10',
    updateSellingPrice: false,
    useAdvance: true,
  });

  const parsedAmount = parseFloat(formData.amount) || 0;
  const amountPaise = Math.round(parsedAmount * 100);
  const advanceUsedPaise = (txType === 'purchase_credit' && formData.useAdvance) ? Math.min(advanceAvailablePaise, amountPaise) : 0;
  const advanceUsed = advanceUsedPaise / 100;
  const remainingPayable = Math.max(0, parsedAmount - advanceUsed);

  const [errorText, setErrorText] = useState('');
  const [transactionToVoid, setTransactionToVoid] = useState<string | null>(null);
  const [voidMessage, setVoidMessage] = useState<string>('');

  const blockInvalidChar = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const sanitizePositiveNumber = (value: string, maxDecimals: number = 2) => {
    // Remove everything except digits and one decimal point
    let sanitized = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimals
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      sanitized = parts[0] + '.' + parts[1].substring(0, maxDecimals);
    }
    
    return sanitized;
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text');
    if (/[eE+-]/.test(paste)) {
      e.preventDefault();
      setErrorText('Invalid characters in pasted text.');
      setTimeout(() => setErrorText(''), 3000);
    }
  };

  // Auto-calculate amount for purchase
  React.useEffect(() => {
    if (txType === 'purchase_credit' && formData.inventoryQty && formData.unitPrice) {
      const qty = parseFloat(formData.inventoryQty);
      const price = parseFloat(formData.unitPrice);
      
      if (!isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
        const total = qty * price;
        setFormData(prev => ({ ...prev, amount: total.toFixed(2) }));
      } else {
        setFormData(prev => ({ ...prev, amount: '' }));
      }
    }
  }, [formData.inventoryQty, formData.unitPrice, txType]);

  // Auto-fill purchase name and unit when inventory is selected
  React.useEffect(() => {
    if (txType === 'purchase_credit' && formData.inventoryItemId && formData.inventoryItemId !== 'new') {
      const item = inventory.find(i => i.id === formData.inventoryItemId);
      if (item) {
        setFormData(prev => ({ 
          ...prev, 
          purchaseName: item.name, 
          unit: item.unit,
          // Pre-fill selling price if toggle is on but field is empty
          sellingPrice: prev.updateSellingPrice ? (prev.sellingPrice || (item.sellingPricePaise / 100).toString()) : prev.sellingPrice
        }));
      }
    } else if (txType === 'purchase_credit' && !formData.inventoryItemId) {
      // Don't reset everything, but unit defaults to pcs if no inventory
      setFormData(prev => ({ ...prev, unit: prev.unit || 'pcs' }));
    }
  }, [formData.inventoryItemId, txType, inventory, formData.updateSellingPrice]);

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-slate-800">Supplier not found</h1>
        <button onClick={() => navigate('/suppliers')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Go Back</button>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Namaste ${supplier.name}, aapka ${formatCurrency(balance)} ka payable balance hai. - SmartUdhaar AI`);
    window.open(`https://wa.me/91${supplier.phone}?text=${text}`, '_blank');
  };

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    
    if (!txType) return;

    const amountStr = formData.amount;
    const qtyStr = formData.inventoryQty;
    const unitPriceStr = formData.unitPrice;

    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      setErrorText('Amount 0 se zyada hona chahiye.');
      return;
    }

    let finalInventoryItemId = formData.inventoryItemId === 'new' ? undefined : (formData.inventoryItemId || undefined);

    if (txType === 'purchase_credit') {
      const pName = formData.purchaseName.trim();
      if (!pName) {
        setErrorText('Purchase Name / Description mandatory hai.');
        return;
      }
      if (pName.length > 80) {
        setErrorText('Description 80 characters se kam honi chahiye.');
        return;
      }

      const qty = parseFloat(qtyStr);
      const unitPrice = parseFloat(unitPriceStr);

      if (isNaN(qty) || qty <= 0) {
        setErrorText('Quantity positive honi chahiye.');
        return;
      }
      
      if (isNaN(unitPrice) || unitPrice <= 0) {
        setErrorText('Unit price 0 se zyada hona chahiye.');
        return;
      }

      if (formData.inventoryItemId === 'new') {
        const sPrice = parseFloat(formData.sellingPrice);
        if (isNaN(sPrice) || sPrice <= 0) {
          setErrorText('Selling Price 0 se zyada honi chahiye.');
          return;
        }
        if (sPrice < unitPrice) {
          if (!window.confirm('Selling Price purchase price se kam hai. Kya aap sure hain?')) return;
        }
        
        // Check for duplicate name
        const exists = inventory.some(i => i.name.toLowerCase() === pName.toLowerCase());
        if (exists) {
          setErrorText('Ye item inventory mein already hai. Existing item select karein.');
          return;
        }

        // Create new item
        const newItemId = useStore.getState().addInventoryItem({
          userId: user?.id || 'unknown',
          name: pName,
          category: 'Uncategorized',
          purchasePricePaise: Math.round(unitPrice * 100),
          sellingPricePaise: Math.round(sPrice * 100),
          stockQty: 0, // Will be adjusted by adjustStock
          lowStockAlertQty: parseInt(formData.lowStockAlert) || 10,
          unit: formData.unit,
        });
        finalInventoryItemId = newItemId;
      } else if (formData.inventoryItemId && formData.updateSellingPrice) {
        const sPrice = parseFloat(formData.sellingPrice);
        if (isNaN(sPrice) || sPrice <= 0) {
          setErrorText('New Selling Price 0 se zyada honi chahiye.');
          return;
        }
        if (sPrice < unitPrice) {
          if (!window.confirm('Naya Selling Price purchase price se kam hai. Kya aap sure hain?')) return;
        }
      }

      if (finalInventoryItemId) {
        const item = inventory.find(i => i.id === finalInventoryItemId) || 
                     useStore.getState().inventory.find(i => i.id === finalInventoryItemId);
        if (item) {
          const validation = validateQuantityByUnit(qty, item.unit);
          if (!validation.valid) {
            setErrorText(validation.error || 'Invalid quantity');
            return;
          }
        }
      } else {
        // Validation for pcs/packet/box should be whole number
        if (['pcs', 'packet', 'box'].includes(formData.unit) && !Number.isInteger(qty)) {
          setErrorText(`${formData.unit} quantity whole number honi chahiye.`);
          return;
        }
      }
    }

    const amountPaise = Math.round(amount * 100);
    const qty = parseFloat(qtyStr);
    const unitPrice = parseFloat(unitPriceStr);
    const linkedRefId = Math.random().toString(36).substring(2, 11);

    const finalAdvanceUsedPaise = (txType === 'purchase_credit' && formData.useAdvance) ? Math.min(advanceAvailablePaise, amountPaise) : 0;
    const finalRemainingPayablePaise = amountPaise - finalAdvanceUsedPaise;

    // 1. Advance Adjustment Transaction
    if (finalAdvanceUsedPaise > 0) {
      addSupplierTransaction({
        userId: user?.id || 'unknown',
        supplierId: supplier.id,
        type: 'supplier_advance_adjustment',
        amountPaise: finalAdvanceUsedPaise,
        notes: `Advance adjusted against purchase: ${formData.purchaseName.trim()}`,
        date: new Date().toISOString(),
        linkedReferenceId: linkedRefId
      });
    }

    // 2. Main Transaction (Remaining Purchase Credit or Payment)
    // We only skip purchase_credit if full amount was covered by advance AND we already created an adjustment tx
    // But we still want a record of the purchase details even if 0 remaining
    const txId = addSupplierTransaction({
      userId: user?.id || 'unknown',
      supplierId: supplier.id,
      type: txType,
      amountPaise: txType === 'supplier_payment' ? amountPaise : finalRemainingPayablePaise,
      paymentMode: txType === 'supplier_payment' ? formData.paymentMode : undefined,
      notes: formData.notes + (txType === 'purchase_credit' ? ` | Qty: ${formData.inventoryQty} ${formData.unit} @ ₹${formData.unitPrice}${finalAdvanceUsedPaise > 0 ? ` (₹${(finalAdvanceUsedPaise/100).toFixed(2)} Adjusted)` : ''}` : ''),
      date: new Date().toISOString(),
      inventoryItemId: finalInventoryItemId,
      purchaseName: txType === 'purchase_credit' ? formData.purchaseName.trim() : undefined,
      quantity: txType === 'purchase_credit' ? qty : undefined,
      unit: txType === 'purchase_credit' ? formData.unit : undefined,
      unitPricePaise: txType === 'purchase_credit' ? Math.round(unitPrice * 100) : undefined,
      linkedReferenceId: linkedRefId,
    });

    if (txType === 'purchase_credit' && finalInventoryItemId && !isNaN(qty) && !isNaN(unitPrice)) {
      const item = inventory.find(i => i.id === finalInventoryItemId) || 
                   useStore.getState().inventory.find(i => i.id === finalInventoryItemId);
      if (item) {
        // Weighted Average Cost Strategy
        const oldStock = item.stockQty || 0;
        const oldPrice = item.purchasePricePaise || 0;
        const newQty = sanitizeQuantityByUnit(qty, item.unit);
        const newUnitPricePaise = Math.round(unitPrice * 100);
        
        const newStock = sanitizeQuantityByUnit(oldStock + newQty, item.unit);
        let newAvgPricePaise = newUnitPricePaise;
        
        if (oldStock > 0) {
           newAvgPricePaise = Math.round(((oldStock * oldPrice) + (newQty * newUnitPricePaise)) / newStock);
        }

        // Update item price and stock
        adjustStock(
          item.id, 
          newQty, 
          `Purchase from ${supplier.name}`, 
          'purchase',
          undefined,
          {
            supplierId: supplier.id,
            unitCostPaise: newUnitPricePaise,
            totalAmountPaise: amountPaise
          }
        );

        const updateData: any = {
          purchasePricePaise: newAvgPricePaise,
          updatedAt: Date.now()
        };

        // Update selling price if toggle is on (for existing items via Modal)
        if (formData.inventoryItemId !== 'new' && formData.updateSellingPrice) {
          const sPrice = parseFloat(formData.sellingPrice);
          if (!isNaN(sPrice) && sPrice > 0) {
            updateData.sellingPricePaise = Math.round(sPrice * 100);
          }
        }

        useStore.getState().updateInventoryItem(item.id, updateData);
      }
    }

    setTxType(null);
    setFormData({ 
      amount: '', 
      notes: '', 
      paymentMode: 'cash', 
      inventoryItemId: '', 
      inventoryQty: '', 
      unitPrice: '', 
      purchaseName: '', 
      unit: 'pcs',
      sellingPrice: '',
      lowStockAlert: '10',
      updateSellingPrice: false,
      useAdvance: true
    });
  };

  const handleVoid = () => {
    if (!transactionToVoid) return;
    const res = voidSupplierTransaction(transactionToVoid);
    if (res.ok) {
      setVoidMessage("Entry voided");
      setTimeout(() => setVoidMessage(''), 3000);
    }
    setTransactionToVoid(null);
  };

  return (
    <div className="w-full px-6 pt-6 pb-24 bg-white min-h-screen">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-center space-x-4 mb-4">
        <button onClick={() => navigate('/suppliers')} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
          {supplier.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{supplier.name}</h1>
          <p className="text-[10px] text-slate-500">{supplier.phone || 'No Phone'}</p>
        </div>
        {supplier.phone && (
          <a href={`tel:${supplier.phone}`} className="w-10 h-10 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Balance Card */}
      <div className={`p-5 rounded-2xl mb-6 ${balance > 0 ? 'bg-amber-50 border border-amber-100' : (balance < 0 ? 'bg-indigo-50 border border-indigo-100' : 'bg-emerald-50 border border-emerald-100')}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {balance > 0 ? 'Total Payable' : (balance < 0 ? 'Supplier Advance' : 'All Settled')}
        </p>
        <h2 className={`text-3xl font-bold ${balance > 0 ? 'text-amber-900' : (balance < 0 ? 'text-indigo-900' : 'text-emerald-900')}`}>
          {formatCurrency(Math.abs(balance))}
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-1">
          {balance > 0 ? 'Paisa dena baaki hai' : (balance < 0 ? 'Supplier ko extra advance diya hua hai. Next purchase mein adjust ho sakta hai.' : 'Hisaab barabar hai')}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <button 
          onClick={() => setTxType('purchase_credit')}
          className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors"
        >
          <PlusCircle className="w-6 h-6 text-amber-600 mb-2" />
          <span className="text-xs font-bold text-slate-700">Add Purchase</span>
        </button>
        <button 
          onClick={() => setTxType('supplier_payment')}
          disabled={balance < -500000} // Disable if advance > 5000
          className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-colors ${balance <= 0 ? 'bg-slate-50/50 border-slate-100 grayscale opacity-60' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
        >
          <MinusCircle className="w-6 h-6 text-emerald-600 mb-2" />
          <span className="text-xs font-bold text-slate-700">Pay Supplier</span>
        </button>
      </div>

      {balance < 0 && (
        <p className="text-[10px] text-indigo-600 font-bold text-center mb-6 px-4">
          Supplier already has advance. Add purchase to adjust it.
        </p>
      )}

      {supplier.phone && (
        <button 
          onClick={handleWhatsApp}
          className="w-full mb-8 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp Message
        </button>
      )}

      {/* Ledger */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Supplier Ledger</h3>
        {ledger.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ledger.map((tx) => (
              <div key={tx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 capitalize text-sm">
                      {tx.type === 'purchase_credit' 
                        ? (tx.inventoryItemId ? 'Inventory Purchase' : 'Purchase Credit') 
                        : (tx.type === 'supplier_advance_adjustment' ? 'Advance Adjusted' : tx.type.replace('_', ' '))}
                    </p>
                    {tx.type === 'purchase_credit' && (
                      <p className="text-[10px] text-indigo-600 font-medium">
                        {tx.inventoryItemId 
                          ? `${tx.purchaseName || 'Item'} — ${tx.quantity} ${tx.unit} × ${formatCurrency(tx.unitPricePaise || 0)}`
                          : `${tx.purchaseName || 'No Description'} — ${tx.quantity || 0} ${tx.unit || ''} × ${formatCurrency(tx.unitPricePaise || 0)}`}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      {format(new Date(tx.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.status === 'void' ? 'line-through text-slate-400' : (tx.type === 'purchase_credit' || tx.type === 'supplier_advance_adjustment' ? 'text-amber-600' : 'text-emerald-600')}`}>
                      {tx.type === 'purchase_credit' || tx.type === 'supplier_advance_adjustment' || tx.type === 'adjustment' ? '+' : '-'}{formatCurrency(tx.amountPaise)}
                    </p>
                    {tx.status === 'void' && <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">Voided</span>}
                  </div>
                </div>
                {tx.notes && <p className="text-[11px] text-slate-600 mt-2 bg-white/50 p-2 rounded">{tx.notes}</p>}
                
                {tx.status === 'active' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                    <button 
                      onClick={() => setTransactionToVoid(tx.id)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase"
                    >
                      Void Entry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {txType && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90dvh] bg-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            
            <div className="shrink-0 px-6 pt-6 pb-3">
              <h2 className="text-xl font-bold text-slate-900">
                {txType === 'purchase_credit' ? 'Add Purchase Credit' : 'Pay Supplier'}
              </h2>
            </div>

            <form onSubmit={handleSubmitTx} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto no-visible-scrollbar px-6 pb-6 space-y-4">
                {errorText && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errorText}
                  </div>
                )}
                
                {txType === 'purchase_credit' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Link to Inventory (Optional)</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                      value={formData.inventoryItemId}
                      onChange={e => setFormData(p => ({...p, inventoryItemId: e.target.value, inventoryQty: '', unitPrice: '', amount: '', purchaseName: '', unit: 'pcs'}))}
                    >
                      <option value="">No Inventory Link</option>
                      <option value="new">+ Create New Inventory Item</option>
                      <optgroup label="Existing Items">
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.stockQty} {item.unit})</option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {formData.inventoryItemId === 'new' 
                        ? 'Naya item inventory mein add hoga, stock badhega aur supplier payable bhi update hoga.'
                        : (formData.inventoryItemId 
                          ? 'Purchase price average cost update karega. Selling price sirf tab badlega jab aap update option on karenge.'
                          : 'Sirf supplier payable badhega, inventory stock change nahi hoga.')
                      }
                    </p>
                  </div>
                )}

                {txType === 'purchase_credit' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                        {formData.inventoryItemId === 'new' ? 'New Item Name *' : 'Purchase Name / Description *'}
                      </label>
                      <Input 
                        placeholder={formData.inventoryItemId === 'new' ? "e.g. Marie Gold Biscuit" : "e.g. Plastic bags, old bill, packaging material"}
                        value={formData.purchaseName}
                        onChange={e => setFormData(p => ({...p, purchaseName: e.target.value}))}
                        maxLength={80}
                        disabled={!!formData.inventoryItemId && formData.inventoryItemId !== 'new'}
                        className={!!formData.inventoryItemId && formData.inventoryItemId !== 'new' ? 'bg-slate-50' : ''}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Purchase Qty *</label>
                        <Input 
                          type="text" 
                          inputMode="decimal"
                          onKeyDown={blockInvalidChar}
                          onPaste={handlePaste}
                          placeholder="0.00"
                          value={formData.inventoryQty}
                          onChange={e => {
                            const item = inventory.find(i => i.id === formData.inventoryItemId);
                            const unit = item ? item.unit : formData.unit;
                            const decimalAllowed = isDecimalAllowedForUnit(unit);
                            const maxDec = decimalAllowed ? 3 : 0;
                            setFormData(p => ({...p, inventoryQty: sanitizePositiveNumber(e.target.value, maxDec)}))
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Unit / Pack Type *</label>
                        {formData.inventoryItemId && formData.inventoryItemId !== 'new' ? (
                          <Input value={formData.unit} readOnly className="bg-slate-50" />
                        ) : (
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                            value={formData.unit}
                            onChange={e => setFormData(p => ({...p, unit: e.target.value, inventoryQty: ''}))}
                          >
                            <option value="pcs">pcs</option>
                            <option value="packet">packet</option>
                            <option value="box">box</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="other">other</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                          {formData.inventoryItemId === 'new' 
                            ? `Purchase Price (₹/${formData.unit}) *` 
                            : (formData.inventoryItemId ? `Unit Price (₹/${formData.unit}) *` : 'Unit Price (₹) *')}
                        </label>
                        <Input 
                          type="text" 
                          inputMode="decimal"
                          onKeyDown={blockInvalidChar}
                          onPaste={handlePaste}
                          placeholder="0.00"
                          value={formData.unitPrice}
                          onChange={e => setFormData(p => ({...p, unitPrice: sanitizePositiveNumber(e.target.value, 2)}))}
                        />
                      </div>
                      {formData.inventoryItemId === 'new' ? (
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Selling Price (₹/${formData.unit}) *</label>
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            onKeyDown={blockInvalidChar}
                            onPaste={handlePaste}
                            placeholder="0.00"
                            value={formData.sellingPrice}
                            onChange={e => setFormData(p => ({...p, sellingPrice: sanitizePositiveNumber(e.target.value, 2)}))}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Total Amount (Rs.)</label>
                          <Input 
                            value={formData.amount} 
                            readOnly 
                            className="bg-slate-50 border-slate-100" 
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>

                    {formData.inventoryItemId !== 'new' && formData.inventoryItemId !== '' && (
                      <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Selling Price Update Karna Hai?</label>
                          <button 
                            type="button"
                            onClick={() => setFormData(p => ({...p, updateSellingPrice: !p.updateSellingPrice, sellingPrice: ''}))}
                            className={`w-10 h-5 rounded-full transition-colors relative ${formData.updateSellingPrice ? 'bg-indigo-600' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.updateSellingPrice ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">Off rakhne par purana selling price same rahega.</p>
                        
                        {formData.updateSellingPrice && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">New Selling Price (₹/${formData.unit}) *</label>
                            <Input 
                              type="text" 
                              inputMode="decimal"
                              onKeyDown={blockInvalidChar}
                              onPaste={handlePaste}
                              placeholder="0.00"
                              value={formData.sellingPrice}
                              onChange={e => setFormData(p => ({...p, sellingPrice: sanitizePositiveNumber(e.target.value, 2)}))}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {formData.inventoryItemId === 'new' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Low Stock Alert</label>
                          <Input 
                            type="number"
                            placeholder="10"
                            value={formData.lowStockAlert}
                            onChange={e => setFormData(p => ({...p, lowStockAlert: e.target.value}))}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Total Amount (Rs.)</label>
                          <Input 
                            value={formData.amount} 
                            readOnly 
                            className="bg-slate-50 border-slate-100" 
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {/* Advance Adjustment Box */}
                    {txType === 'purchase_credit' && advanceAvailablePaise > 0 && (
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-600 rounded-lg">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Supplier Advance Available</span>
                          </div>
                          <span className="text-xs font-bold text-indigo-700">{formatCurrency(advanceAvailablePaise)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-indigo-100 mt-2">
                          <label className="text-xs font-medium text-indigo-900">Use Advance for this purchase</label>
                          <button 
                            type="button"
                            onClick={() => setFormData(p => ({...p, useAdvance: !p.useAdvance}))}
                            className={`w-10 h-5 rounded-full transition-colors relative ${formData.useAdvance ? 'bg-indigo-600' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.useAdvance ? 'translate-x-6' : 'translate-x-1'}`}></div>
                          </button>
                        </div>

                        {formData.useAdvance && (
                          <div className="flex flex-col gap-1 text-[11px] font-bold text-indigo-600 pt-1">
                            <div className="flex justify-between">
                              <span>Advance Used:</span>
                              <span>{formatCurrency(advanceUsedPaise)}</span>
                            </div>
                            <div className="flex justify-between border-t border-indigo-100 pt-1 mt-1 text-slate-700">
                              <span>Remaining Payable:</span>
                              <span>{formatCurrency(Math.max(0, amountPaise - advanceUsedPaise))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {txType === 'supplier_payment' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Payment Amount (Rs.) *</label>
                    <Input 
                      type="text" 
                      inputMode="decimal"
                      required 
                      onKeyDown={blockInvalidChar}
                      onPaste={handlePaste}
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData(p => ({...p, amount: sanitizePositiveNumber(e.target.value, 2)}))}
                    />
                  </div>
                )}

                {txType === 'supplier_payment' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Payment Mode</label>
                    <div className="flex gap-2">
                      {['cash', 'upi', 'card'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData(p => ({...p, paymentMode: mode}))}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border uppercase ${formData.paymentMode === mode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Notes</label>
                  <Input 
                    placeholder="e.g. Bill No. 123"
                    value={formData.notes}
                    onChange={e => setFormData(p => ({...p, notes: e.target.value}))}
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 bg-white border-t border-slate-100 grid grid-cols-2 gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button type="button" variant="outline" onClick={() => setTxType(null)}>Cancel</Button>
                <Button type="submit" className={txType === 'purchase_credit' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Confirmation */}
      {transactionToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-xl">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Void Entry?</h3>
            <p className="text-sm text-slate-500 mb-6">Kya aap is entry ko cancel karna chahte hain?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setTransactionToVoid(null)}>No</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleVoid}>Yes, Void</Button>
            </div>
          </div>
        </div>
      )}

      {voidMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 animate-bounce">
          {voidMessage}
        </div>
      )}
    </div>
  );
};
