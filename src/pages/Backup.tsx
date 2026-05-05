import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, computeCustomerBalance } from '../store/useStore';
import { 
  exportFullBackup, 
  validateBackup,
  exportCustomersCSV,
  exportLedgerCSV,
  exportSalesCSV,
  exportInvoicesCSV,
  exportInventoryCSV,
  exportStockMovementsCSV
} from '../utils/export';
import { ArrowLeft, Download, Upload, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';

export const Backup = () => {
  const navigate = useNavigate();
  const state = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleExportFull = () => {
    exportFullBackup(state);
    state.updateBackupMeta({ lastBackupAt: Date.now() });
    alert('Complete backup downloaded successfully.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = validateBackup(json);
        setValidationResult(result);
        if (result.valid) {
          setPreviewData(json.data);
        } else {
          setPreviewData(null);
        }
      } catch (err: any) {
        setValidationResult({ valid: false, errors: ['Invalid JSON file.'], warnings: [] });
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!previewData || !validationResult?.valid) return;
    
    const confirmMsg = "WARNING: Restoring will REPLACE all your current data.\n\nA safety backup will be downloaded first.\n\nDo you want to continue?";
    if (!window.confirm(confirmMsg)) return;

    // Safety backup
    exportFullBackup(state);
    alert('Safety backup created! Now replacing data...');

    state.restoreData(previewData);
    state.updateBackupMeta({ lastRestoreAt: Date.now() });
    setPreviewData(null);
    setValidationResult(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    alert('Restore completed successfully. It is recommended to run a System Audit.');
    navigate('/audit');
  };

  const handleCSVExport = (type: 'customers' | 'ledger' | 'sales' | 'invoices' | 'inventory' | 'movements') => {
    if (type === 'customers') {
      exportCustomersCSV(state.customers, (id) => computeCustomerBalance(state.transactions, id));
    } else if (type === 'ledger') {
      exportLedgerCSV(state.transactions, state.customers);
    } else if (type === 'sales') {
      exportSalesCSV(state.sales, state.customers);
    } else if (type === 'invoices') {
      exportInvoicesCSV(state.invoices, state.customers);
    } else if (type === 'inventory') {
      exportInventoryCSV(state.inventory || []);
    } else if (type === 'movements') {
      exportStockMovementsCSV(state.stockMovements || [], state.inventory || []);
    }
    state.updateBackupMeta({ lastExportAt: Date.now() });
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Never';
    return format(ts, "dd MMM yyyy, hh:mm a");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backup & Export</h1>
          <p className="text-xs text-slate-500 font-medium">Protect & Download your data</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
        
        {/* Data Safety Summary */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Data Summary</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Customers</p>
                <p className="font-bold text-slate-800 text-lg">{state.customers.length}</p>
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Transactions</p>
                <p className="font-bold text-slate-800 text-lg">{state.transactions.length}</p>
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sales</p>
                <p className="font-bold text-slate-800 text-lg">{state.sales.length}</p>
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Invoices</p>
                <p className="font-bold text-slate-800 text-lg">{state.invoices.length}</p>
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inventory</p>
                <p className="font-bold text-slate-800 text-lg">{state.inventory?.length || 0}</p>
             </div>
          </div>
          <div className="pt-3 border-t border-slate-100">
             <p className="text-[10px] text-slate-500 mb-1">Last Backup: <span className="font-bold text-slate-800">{formatDate(state.lastBackupAt)}</span></p>
             <p className="text-[10px] text-slate-500 mb-1">Last Restore: <span className="font-bold text-slate-800">{formatDate(state.lastRestoreAt)}</span></p>
             <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Currently running locally via browser.
             </p>
          </div>
        </section>

        {/* Full Backup & Restore */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Full Backup JSON</h2>
          <p className="text-[10px] text-slate-500 mb-4">Isse aapka complete hisaab safe rahega aur dusre phone mein restore ho payega.</p>
          
          <div className="space-y-4">
             <Button onClick={handleExportFull} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase tracking-widest text-white h-12 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Complete Backup Download Karo
             </Button>

             <div className="relative">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="backup-upload"
                />
                <Button 
                  onClick={() => document.getElementById('backup-upload')?.click()}
                  variant="outline" 
                  className="w-full text-xs font-bold uppercase tracking-widest text-slate-700 h-12 flex items-center justify-center gap-2 bg-slate-50 border-slate-300"
                >
                   <Upload className="w-4 h-4" />
                   Backup Restore Karo
                </Button>
             </div>
          </div>

          {validationResult && (
             <div className="mt-4 p-4 rounded-xl border bg-slate-50">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-2">Restore Preview</h3>
               
               {validationResult.valid ? (
                  <>
                     <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-3">
                        <CheckCircle className="w-4 h-4" /> Valid Backup File
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 mb-4">
                        <p>Customers: {validationResult.summary.customers}</p>
                        <p>Ledger items: {validationResult.summary.transactions}</p>
                        <p>Sales: {validationResult.summary.sales}</p>
                        <p>Invoices: {validationResult.summary.invoices}</p>
                     </div>
                     <p className="text-[10px] text-red-600 font-bold mb-3 flex gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Restore current data ko replace karega. Pehle automatic safety backup download hoga.
                     </p>
                     <Button onClick={handleRestore} className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest">
                        Confirm Replace & Restore
                     </Button>
                  </>
               ) : (
                  <>
                     <div className="flex items-center gap-2 text-red-600 text-xs font-bold mb-3">
                        <XCircle className="w-4 h-4" /> Invalid Backup File
                     </div>
                     <ul className="list-disc pl-4 text-red-500 text-[10px]">
                        {validationResult.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                     </ul>
                  </>
               )}
             </div>
          )}
        </section>

        {/* CSV Exports */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200">
           <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">CSV Reports</h2>
           <p className="text-[10px] text-slate-500 mb-4">Excel ya Google Sheets ke liye data download karein.</p>
           
           <div className="space-y-3">
              <button onClick={() => handleCSVExport('customers')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer CSV</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleCSVExport('ledger')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Udhaar Ledger</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleCSVExport('sales')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sales Report</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleCSVExport('invoices')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Report</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleCSVExport('inventory')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inventory File</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleCSVExport('movements')} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Stock Movements</span>
                 </div>
                 <Download className="w-4 h-4 text-slate-400" />
              </button>
           </div>
        </section>

      </div>
    </div>
  );
};

export const XCircle = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
   </svg>
);
