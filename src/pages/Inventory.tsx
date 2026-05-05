import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getInventoryItems, getLowStockItems, getInventorySummary } from '../store/selectors';
import { ArrowLeft, Plus, Package, AlertTriangle, Search, Archive, PackagePlus, FileText } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Inventory = () => {
  const navigate = useNavigate();
  const summary = getInventorySummary();
  const items = getInventoryItems();
  const lowStockItems = getLowStockItems();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'low_stock' ? item.stockQty <= item.lowStockAlertQty : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
              <p className="text-xs text-slate-500 font-medium">Stock Manage Karo</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/inventory/add')}
            className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="min-w-[140px] bg-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-[10px] uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5" /> Total Items
            </div>
            <p className="text-white font-bold text-xl">{summary.activeItemCount}</p>
            <p className="text-slate-400 text-[10px] mt-1 flex gap-1">Value: {formatCurrency(summary.totalPurchaseValuePaise)}</p>
          </div>
          
          <div className="min-w-[140px] bg-amber-50 p-3 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
            </div>
            <p className="text-amber-900 font-bold text-xl">{summary.lowStockCount}</p>
            <p className="text-amber-600/70 text-[10px] mt-1 font-medium">Items need reorder</p>
          </div>

          <div className="min-w-[140px] bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-[10px] uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5" /> Potential Sale
            </div>
            <p className="text-emerald-900 font-bold text-xl">{formatCurrency(summary.totalSellingValuePaise)}</p>
            <p className="text-emerald-600/70 text-[10px] mt-1 font-medium flex gap-1">Profit: {formatCurrency(summary.potentialProfitPaise)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-24 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>

        {/* Item List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No items found</p>
              <p className="text-xs text-slate-400 mt-1">Tap + to add your first item.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isLowStock = item.stockQty <= item.lowStockAlertQty;
              const marginPaise = item.sellingPricePaise - item.purchasePricePaise;
              const marginPercent = item.purchasePricePaise > 0 
                ? ((marginPaise / item.sellingPricePaise) * 100).toFixed(1) 
                : 100;

              return (
                <div key={item.id} onClick={() => navigate(`/inventory/${item.id}`)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {item.category && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.category}</p>}
                    </div>
                    {isLowStock && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" /> Low
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Stock</p>
                      <p className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {item.stockQty} <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                      <p className="font-bold text-slate-800">{formatCurrency(item.sellingPricePaise)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Margin</p>
                      <p className="font-bold text-emerald-600">{marginPercent}%</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
