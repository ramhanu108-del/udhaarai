import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft } from 'lucide-react';

export const AddCustomer = () => {
  const navigate = useNavigate();
  const { addCustomer, user } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      userId: user?.id || 'unknown',
      riskStatus: 'Low',
      ...formData,
    });
    navigate(-1);
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex items-center space-x-4 px-6 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:bg-gray-100 p-2 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Customer Name *</label>
          <Input 
            required 
            placeholder="e.g. Suresh Kumar"
            value={formData.name}
            onChange={e => setFormData(p => ({...p, name: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
          <Input 
            required 
            type="tel"
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address (Optional)</label>
          <Input 
            placeholder="e.g. Shop No. 5, Main Market"
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

        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={!formData.name || !formData.phone}>
            Save Customer
          </Button>
        </div>
      </form>
    </div>
  );
};
