import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PaymentMode, InvoiceStatus, Sale } from '../types';
import { generateInvoiceNumber } from '../store/selectors';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BottomActionBar } from '../components/layout/BottomActionBar';

export const AddInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, customers, addInvoice, addSale, addTransaction } = useStore();

  const fromSale: Sale | undefined = location.state?.fromSale;

  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    rate: '',
    discount: '',
    tax: '',
    paymentMode: 'unpaid' as PaymentMode,
    paymentStatus: 'unpaid' as InvoiceStatus,
    customerId: '',
    note: '',
    createLinkedSale: false
  });

  useEffect(() => {
    if (fromSale && fromSale.items.length > 0) {
      const item = fromSale.items[0];
      setFormData({
        name: item.name,
        quantity: String(item.quantity),
        rate: String(item.unitPricePaise / 100),
        discount: String(fromSale.discountPaise / 100),
        tax: '',
        paymentMode: fromSale.paymentMode as PaymentMode,
        paymentStatus: fromSale.paymentMode === 'udhaar' ? 'unpaid' : 'paid',
        customerId: fromSale.customerId || '',
        note: `Generated from existing sale`,
        createLinkedSale: false
      });
    }
  }, [fromSale]);

  const [errorText, setErrorText] = useState('');

  const qty = parseFloat(formData.quantity) || 1;
  const rate = parseFloat(formData.rate) || 0;
  const discount = formData.discount ? (parseFloat(formData.discount) || 0) : 0;
  const tax = formData.tax ? (parseFloat(formData.tax) || 0) : 0;
  
  const subtotal = rate * qty;
  const total = subtotal - discount + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!formData.name.trim()) {
      setErrorText('Item name is required.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setErrorText('Quantity must be greater than 0.');
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      setErrorText('Rate must be greater than 0.');
      return;
    }

    if (isNaN(discount) || discount < 0) {
      setErrorText('Discount cannot be negative.');
      return;
    }

    if (isNaN(tax) || tax < 0) {
      setErrorText('Tax cannot be negative.');
      return;
    }

    if (discount > subtotal) {
      setErrorText('Discount cannot exceed subtotal.');
      return;
    }

    if (formData.createLinkedSale) {
      if (formData.paymentMode === 'unpaid') {
        setErrorText('Cannot create linked sale for unpaid mode. Change mode to Udhaar or untick linked sale.');
        return;
      }
      if (formData.paymentMode === 'udhaar' && !formData.customerId) {
        setErrorText('Customer is required when creating Udhaar sale.');
        return;
      }
    }

    const subtotalPaise = Math.round(subtotal * 100);
    const discountPaise = Math.round(discount * 100);
    const taxPaise = Math.round(tax * 100);
    const totalPaise = subtotalPaise - discountPaise + taxPaise;

    let linkedSaleId: string | undefined = fromSale?.id;

    if (formData.createLinkedSale && !fromSale) {
      const saleId = Math.random().toString(36).substring(2, 15);
      linkedSaleId = saleId;
      
      let linkedTxId: string | undefined = undefined;
      if (formData.paymentMode === 'udhaar') {
        linkedTxId = Math.random().toString(36).substring(2, 15);
        addTransaction({
          id: linkedTxId,
          userId: user?.id || 'unknown',
          customerId: formData.customerId,
          type: 'sale_credit',
          amount: totalPaise,
          description: `Invoice: ${qty}x ${formData.name}`,
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
            name: formData.name,
            quantity: qty,
            unitPricePaise: Math.round(rate * 100),
            lineTotalPaise: subtotalPaise,
          }
        ],
        subtotalPaise,
        discountPaise,
        totalPaise,
        paymentMode: formData.paymentMode,
        linkedTransactionId: linkedTxId,
        note: `Generated from Invoice (Tax: ₹${tax.toFixed(2)})`
      });
    }

    const generatedNumber = generateInvoiceNumber();

    addInvoice({
      userId: user?.id || 'unknown',
      invoiceNumber: generatedNumber,
      customerId: formData.customerId || undefined,
      linkedSaleId,
      items: [
        {
          id: Math.random().toString(36).substring(2, 15),
          name: formData.name,
          quantity: qty,
          unitPricePaise: Math.round(rate * 100),
          lineTotalPaise: subtotalPaise,
        }
      ],
      subtotalPaise,
      discountPaise,
      taxPaise,
      totalPaise,
      paymentMode: formData.paymentMode,
      paymentStatus: formData.paymentStatus,
      note: formData.note
    });

    navigate('/invoices');
  };

  return (
    <div className="w-full min-h-full pb-36 bg-white">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 bg-white">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
           Naya Invoice
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col w-full px-6 py-6 mt-2">
        <div className="space-y-5">
          {errorText && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-lg mb-2">
            {errorText}
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
           <label className="text-[10px] font-bold text-slate-600 mb-1.5 block uppercase tracking-wider">Customer (Optional)</label>
           <select 
             className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none"
             value={formData.customerId}
             onChange={(e) => setFormData(p => ({...p, customerId: e.target.value}))}
           >
             <option value="">Walk-in Customer</option>
             {customers.map(c => (
               <option key={c.id} value={c.id}>{c.name}</option>
             ))}
           </select>
        </div>
        
        <div>
           <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Item Name *</label>
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
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Rate (₹) *</label>
            <Input 
              required 
              type="number" 
              step="any"
              min="0.1"
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="0"
              value={formData.rate}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, rate: e.target.value}))}}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Qty *</label>
            <Input 
              required 
              type="number" 
              step="any"
              min="0.1"
              className="h-12 bg-slate-50 border-slate-200 font-bold"
              placeholder="1"
              value={formData.quantity}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, quantity: e.target.value}))}}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Discount (₹)</label>
            <Input 
              type="number" 
              step="any"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0"
              value={formData.discount}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, discount: e.target.value}))}}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Tax (₹)</label>
            <Input 
              type="number" 
              step="any"
              min="0"
              className="h-12 bg-slate-50 border-slate-200 font-medium"
              placeholder="0"
              value={formData.tax}
              onChange={e => {setErrorText(''); setFormData(p => ({...p, tax: e.target.value}))}}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Payment Status</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['unpaid', 'paid'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(p => ({...p, paymentStatus: status as InvoiceStatus}))}
                className={`py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors active:scale-95 ${
                  formData.paymentStatus === status 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Payment Mode</label>
          <select 
             className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"
             value={formData.paymentMode}
             onChange={(e) => setFormData(p => ({...p, paymentMode: e.target.value as PaymentMode}))}
           >
             <option value="unpaid">Unpaid</option>
             <option value="cash">Cash</option>
             <option value="upi">UPI</option>
             <option value="card">Card</option>
             <option value="udhaar">Udhaar (Ledger)</option>
           </select>
        </div>

        {!fromSale && (
          <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
            <input 
              type="checkbox" 
              id="createSale" 
              checked={formData.createLinkedSale}
              onChange={(e) => {
                 const isChecked = e.target.checked;
                 if (isChecked && formData.paymentMode === 'unpaid') {
                   setFormData(p => ({...p, createLinkedSale: isChecked, paymentMode: 'udhaar'}));
                 } else {
                   setFormData(p => ({...p, createLinkedSale: isChecked}));
                 }
              }}
              className="mt-1 flex-shrink-0 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600"
            />
            <label htmlFor="createSale" className="text-sm font-medium text-slate-800">
              Create Linked Sale
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                 Is invoice se auto sale bhi create karein. Accounts sync rahenge.
              </p>
            </label>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">Notes (Optional)</label>
          <Input 
            className="h-10 bg-slate-50 border-slate-200 font-medium"
            placeholder="e.g. Check carefully"
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
          {tax > 0 && (
            <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tax</span>
               <span className="text-sm font-bold text-slate-700">+₹{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="w-full h-px bg-slate-200 my-2"></div>
          <div className="flex justify-between items-center">
             <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total</span>
             <span className="text-xl font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>
        </div>
        </div>

        <div className="mt-6 pb-8">
          <Button 
            type="submit" 
            className="w-full text-sm uppercase tracking-widest font-bold h-14 shadow-sm active:scale-95 transition-transform bg-slate-900 hover:bg-slate-800 text-white" 
          >
            Generate Bill
          </Button>
        </div>
      </form>
    </div>
  );
};
