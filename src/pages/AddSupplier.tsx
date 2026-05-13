import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft } from 'lucide-react';

export const AddSupplier = () => {
  const navigate = useNavigate();
  const { addSupplier, user } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [errorText, setErrorText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    const name = formData.name.trim();
    if (!name) {
      setErrorText('Supplier Name cannot be empty.');
      return;
    }

    if (formData.phone) {
       const cleanPhone = formData.phone.replace(/[\s+-]/g, '');
       if (!/^\d{6,15}$/.test(cleanPhone)) {
         setErrorText('Phone Number must contain 6 to 15 digits.');
         return;
       }
    }

    addSupplier({
      userId: user?.id || 'unknown',
      name,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes,
    });
    navigate(-1);
  };

  return (
    <div className="w-full min-h-full pb-36 bg-white">
      <div className="flex items-center space-x-4 px-6 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:bg-gray-100 p-2 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col w-full px-6 py-6 mt-2">
        {errorText && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl">
            {errorText}
          </div>
        )}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Supplier Name *</label>
          <Input 
            required 
            placeholder="e.g. ABC Agencies"
            value={formData.name}
            onChange={e => setFormData(p => ({...p, name: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number (Optional)</label>
          <Input 
            type="tel"
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address (Optional)</label>
          <Input 
            placeholder="e.g. Industrial Area, Phase 1"
            value={formData.address}
            onChange={e => setFormData(p => ({...p, address: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes (Optional)</label>
          <Input 
            placeholder="Any special instruction or detail..."
            value={formData.notes}
            onChange={e => setFormData(p => ({...p, notes: e.target.value}))}
          />
        </div>
        </div>

        <div className="mt-6 pb-8">
          <Button type="submit" className="w-full text-base font-bold h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-sm" disabled={!formData.name}>
            Save Supplier
          </Button>
        </div>
      </form>
    </div>
  );
};
