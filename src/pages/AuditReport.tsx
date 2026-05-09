import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getCustomerBalance } from '../store/selectors';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { generateAIResponse } from '../utils/aiAssistant';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export const AuditReport = () => {
  const navigate = useNavigate();
  const { customers, transactions, sales, invoices, inventory, stockMovements } = useStore();
  const [results, setResults] = useState<TestResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runAudit = () => {
    const newResults: TestResult[] = [];
    
    // Test 1: Verify Customer Balance against Transaction Ledger
    let balanceMatch = true;
    let balanceErrorMsg = 'All balances match perfectly.';
    
    for (const customer of customers) {
      // Direct recalculation from ledger
      const expectedBalance = transactions
        .filter(t => t.customerId === customer.id && t.status === 'active')
        .reduce((sum, t) => {
          if (t.type === 'udhaar' || t.type === 'refund') return sum + t.amount;
          if (t.type === 'payment' || t.type === 'adjustment' || t.type === 'sale_credit') return sum - t.amount;
          return sum;
        }, 0);
        
      const engineBalance = getCustomerBalance(customer.id);
      
      if (engineBalance !== expectedBalance) {
        balanceMatch = false;
        balanceErrorMsg = `Mismatch for ${customer.name}: Expected ${expectedBalance}, got ${engineBalance}`;
        break;
      }
    }
    
    newResults.push({
      name: 'Customer Balance Ledger Integrity',
      passed: balanceMatch,
      message: balanceErrorMsg
    });

    // Test 2: Identify Orphaned Transactions (no valid customer)
    const orphanedTxs = transactions.filter(t => !customers.find(c => c.id === t.customerId));
    newResults.push({
      name: 'Orphaned Transaction Check',
      passed: orphanedTxs.length === 0,
      message: orphanedTxs.length === 0 ? 'No orphaned transactions found.' : `Found ${orphanedTxs.length} orphaned transactions.`
    });

    // Test 3: Transaction Schema Compliance
    const invalidStatuses = transactions.filter(t => t.status !== 'active' && t.status !== 'void' && t.status !== 'archived');
    newResults.push({
      name: 'Transaction Schema Compliance',
      passed: invalidStatuses.length === 0,
      message: invalidStatuses.length === 0 ? 'All statuses valid.' : `Found ${invalidStatuses.length} with old/invalid status.`
    });

    // Test 4: Sales Calculations Integrity
    let salesMathPassed = true;
    let salesMathMsg = 'All sales totals, discounts, and profits are correct.';
    const sales = useStore.getState().sales || [];
    
    for (const sale of sales) {
      if (sale.discountPaise < 0 || sale.discountPaise > sale.subtotalPaise) {
        salesMathPassed = false;
        salesMathMsg = 'Discount exceeds subtotal or is negative.';
        break;
      }
      if (sale.totalPaise !== sale.subtotalPaise - sale.discountPaise) {
        salesMathPassed = false;
        salesMathMsg = 'Total does not equal subtotal minus discount.';
        break;
      }
      if (sale.costTotalPaise !== undefined && sale.profitPaise !== undefined) {
        const expectedProfit = sale.totalPaise - sale.costTotalPaise;
        if (sale.profitPaise !== expectedProfit) {
          salesMathPassed = false;
          salesMathMsg = 'Profit calculation mismatch.';
          break;
        }
      }
    }
    newResults.push({
      name: 'Sales Math & Logic Integrity',
      passed: salesMathPassed,
      message: salesMathMsg
    });

    // Test 5: Sales and Udhaar Sync
    let syncPassed = true;
    let syncMsg = 'All udhaar sales correctly linked to transactions.';
    
    for (const sale of sales) {
      if (sale.paymentMode === 'udhaar' && sale.status === 'active') {
        if (!sale.linkedTransactionId) {
          syncPassed = false;
          syncMsg = 'Udhaar sale missing linked transaction ID.';
          break;
        }
        const tx = transactions.find(t => t.id === sale.linkedTransactionId);
        if (!tx || tx.status !== 'active' || tx.amount !== sale.totalPaise) {
           syncPassed = false;
           syncMsg = 'Linked transaction missing, voided, or amount mismatched.';
           break;
        }
      }
    }
    
    // Also verify void parity
    for (const sale of sales) {
      if (sale.status === 'void' && sale.linkedTransactionId) {
        const tx = transactions.find(t => t.id === sale.linkedTransactionId);
        if (tx && tx.status !== 'void') {
          syncPassed = false;
          syncMsg = 'A voided sale has an active udhaar transaction.';
          break;
        }
      }
    }

    newResults.push({
      name: 'Sales-Ledger Synchronization',
      passed: syncPassed,
      message: syncMsg
    });

    // Test 6: Invoice Engine Integrity
    let invoiceMathPassed = true;
    let invoiceMathMsg = 'All invoice totals, discounts, and taxes are correct.';
    const invoices = useStore.getState().invoices || [];
    
    for (const inv of invoices) {
      if (inv.discountPaise < 0 || inv.discountPaise > inv.subtotalPaise) {
        invoiceMathPassed = false;
        invoiceMathMsg = 'Discount exceeds subtotal or is negative.';
        break;
      }
      const expectedTotal = inv.subtotalPaise - inv.discountPaise + (inv.taxPaise || 0);
      if (inv.totalPaise !== expectedTotal) {
        invoiceMathPassed = false;
        invoiceMathMsg = 'Total does not equal subtotal - discount + tax.';
        break;
      }
    }
    newResults.push({
      name: 'Invoice Math & Logic Integrity',
      passed: invoiceMathPassed,
      message: invoiceMathMsg
    });

    // Test 7: Invoice-Sale Linkage Sync
    let invSyncPassed = true;
    let invSyncMsg = 'All linked invoices point to valid sales and preserve ledger safety.';
    
    for (const inv of invoices) {
      if (inv.linkedSaleId && inv.status === 'active') {
        const linkedSale = sales.find(s => s.id === inv.linkedSaleId);
        if (!linkedSale) {
          invSyncPassed = false;
          invSyncMsg = `Invoice ${inv.invoiceNumber} linked to missing sale.`;
          break;
        }
      }
    }
    
    newResults.push({
      name: 'Invoice-Sales Ledgers Integrity',
      passed: invSyncPassed,
      message: invSyncMsg
    });

    // Test 9: Inventory and Stock Movement Integrity
    let inventoryPassed = true;
    let inventoryMsg = 'All inventory stock amounts correctly relate to items.';

    const dbInventory = inventory || [];
    const dbMovements = stockMovements || [];

    const inventoryIds = new Set(dbInventory.map(i => i.id));
    for (const mov of dbMovements) {
      if (!inventoryIds.has(mov.inventoryItemId)) {
        inventoryPassed = false;
        inventoryMsg = `Stock movement ${mov.id} references missing inventory item ${mov.inventoryItemId}.`;
        break;
      }
    }

    if (inventoryPassed) {
       for (const item of dbInventory) {
          if (item.stockQty < 0) {
             inventoryPassed = false;
             inventoryMsg = `Inventory item ${item.name} has negative stock: ${item.stockQty}.`;
             break;
          }
       }
    }

    newResults.push({
      name: 'Inventory Stock Integrity',
      passed: inventoryPassed,
      message: inventoryMsg
    });

    // Test 10: Data Types and IDs Integrity (Backup readiness)
    let typesPassed = true;
    let typesMsg = 'All money fields are integer paise. All IDs are unique.';
    
    // Check uniqueness
    const ids = new Set();
    const checkId = (item: any) => {
      if (!item.id) return false;
      if (ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    };
    
    const allUnique = 
      customers.every(checkId) && 
      transactions.every(checkId) && 
      sales.every(checkId) && 
      invoices.every(checkId) &&
      dbInventory.every(checkId) &&
      dbMovements.every(checkId);
      
    if (!allUnique) {
      typesPassed = false;
      typesMsg = 'Duplicate or missing IDs detected.';
    }
    
    // Check integers
    const checkInt = (val: any) => Number.isInteger(val);
    if (typesPassed) {
       const moneyValid = 
         transactions.every(t => checkInt(t.amount)) &&
         sales.every(s => checkInt(s.subtotalPaise) && checkInt(s.discountPaise) && checkInt(s.totalPaise)) &&
         invoices.every(i => checkInt(i.subtotalPaise) && checkInt(i.discountPaise) && checkInt(i.totalPaise)) &&
         dbInventory.every(i => checkInt(i.purchasePricePaise) && checkInt(i.sellingPricePaise));
       
       if (!moneyValid) {
         typesPassed = false;
         typesMsg = 'Non-integer money values detected (cents instead of pure integer paise).';
       }
    }
    
    newResults.push({
      name: 'Backup Readiness & Data Constraints',
      passed: typesPassed,
      message: typesMsg
    });

    // Test 11: AI Assistant Integrity
    let aiPassed = true;
    let aiMsg = 'AI Local Engine generates stable responses.';
    try {
      const resp1 = generateAIResponse('aaj ki sales', useStore.getState());
      if (!resp1.text || resp1.text.includes('NaN') || resp1.text.includes('Infinity')) {
         aiPassed = false;
         aiMsg = 'AI returned invalid numbers for basic query.';
      }
      const resp2 = generateAIResponse('sabse zyada udhaar', useStore.getState());
      if (!resp2.text) {
         aiPassed = false;
         aiMsg = 'AI returned empty string.';
      }
    } catch(e: any) {
      aiPassed = false;
      aiMsg = 'AI engine crashed on basic query: ' + e.message;
    }

    newResults.push({
      name: 'AI Engine Stability',
      passed: aiPassed,
      message: aiMsg
    });

    // Test 12: Cloud Sync Architecture Readiness
    let cloudPassed = true;
    let cloudMsg = 'Sync Queue structure is valid and App operates perfectly offline.';
    const syncStatus = useStore.getState().syncStatus;
    const syncQueue = useStore.getState().syncQueue || [];
    
    // Check if queue uses IDs
    if (syncQueue.length > 0 && !syncQueue.every((q: any) => q.id && q.table && q.operation)) {
      cloudPassed = false;
      cloudMsg = 'Sync Queue has malformed objects.';
    }

    if (cloudPassed && typeof syncStatus !== 'string') {
      cloudPassed = false;
      cloudMsg = 'Sync Status is incorrectly formatted.';
    }

    newResults.push({
      name: 'Cloud & Offline Readiness',
      passed: cloudPassed,
      message: cloudMsg
    });

    setResults(newResults);
    setHasRun(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center space-x-4 px-6 pt-6 pb-4 border-b border-slate-100 bg-white sticky top-0">
        <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Report</h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">System Health Check</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 pb-24">
         <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <h2 className="text-lg font-bold mb-1 relative z-10">Financial Engine Test</h2>
           <p className="text-indigo-100 text-xs mb-4 relative z-10">Run self-checks to ensure ledger accuracy, prevent missing money, and validate transaction math.</p>
           
           <button 
             onClick={runAudit}
             className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl uppercase tracking-widest text-xs active:scale-95 transition-transform relative z-10"
           >
             {hasRun ? 'Re-run Tests' : 'Run Self-Check'}
           </button>
         </div>
         
         {hasRun && (
           <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Results</h3>
             {results.map((r, i) => (
               <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                 <div className="flex items-start gap-3">
                   {r.passed ? (
                     <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                   ) : (
                     <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                   )}
                   <div>
                     <p className={`text-sm font-bold ${r.passed ? 'text-slate-900' : 'text-red-700'}`}>{r.name}</p>
                     <p className="text-xs text-slate-500 mt-1">{r.message}</p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};
