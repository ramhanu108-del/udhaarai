import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Customer, Transaction, Sale, Invoice, InventoryItem, StockMovement, StockMovementType, SyncStatus, SyncQueueItem, SyncOperation } from '../types';
import { sanitizeQuantityByUnit } from '../utils/quantity';

interface AppState {
  user: User | null;
  // Auth & Sync metadata
  authUser: { id: string, email: string } | null;
  syncStatus: SyncStatus;
  lastSyncedAt?: number;
  syncQueue: SyncQueueItem[];

  customers: Customer[];
  transactions: Transaction[];
  sales: Sale[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  lastBackupAt?: number;
  lastRestoreAt?: number;
  lastExportAt?: number;
  
  monetization: {
    adsEnabled: false,
    aiProEnabled: false,
    aiProPrice: 99
  };
  
  // Actions
  setUser: (user: User) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPending'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  voidTransaction: (id: string) => { ok: boolean, message: string };
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  voidSale: (id: string) => { ok: boolean, message: string };
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  voidInvoice: (id: string) => void;
  markInvoicePaid: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  archiveInventoryItem: (id: string) => void;
  adjustStock: (id: string, deltaQty: number, reason: string | undefined, type: StockMovementType, linkedSaleId?: string) => void;
  updateBackupMeta: (meta: { lastBackupAt?: number; lastRestoreAt?: number; lastExportAt?: number; }) => void;
  restoreData: (data: any) => void;
  resetAll: () => void;
  addDemoData: () => { ok: boolean; message: string };
  clearDemoData: () => { ok: boolean; message: string };
  repairDuplicateData: () => { ok: boolean; message: string };
  hasDemoData: () => boolean;
  setDismissedBackupReminderAt: (time: number) => void;
  dismissedBackupReminderAt?: number;
  
  // Auth & Sync Actions
  setAuthUser: (authUser: { id: string, email: string } | null) => void;
  setSyncStatus: (status: SyncStatus, lastSyncedAt?: number) => void;
  queueSyncAction: (table: string, operation: SyncOperation, payload: any) => void;
  removeFromQueue: (ids: string[]) => void;
  clearQueue: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Calculate single customer balance directly from transactions
export const computeCustomerBalance = (transactions: Transaction[], customerId: string) => {
  return transactions
    .filter(tx => tx.customerId === customerId && tx.status === 'active')
    .reduce((sum, tx) => {
      if (tx.type === 'udhaar' || tx.type === 'sale_credit') return sum + tx.amount;
      if (tx.type === 'payment' || tx.type === 'adjustment' || tx.type === 'refund') return sum - tx.amount;
      return sum;
    }, 0);
};

const dedupeById = <T extends { id?: string }>(arr: T[]): T[] => {
  const map = new Map<string, T>();
  arr.forEach(item => {
    if (item?.id) {
       map.set(item.id, item); // latest overrides
    }
  });
  return Array.from(map.values());
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authUser: null,
      syncStatus: 'idle',
      syncQueue: [],
      customers: [],
      transactions: [],
      sales: [],
      invoices: [],
      inventory: [],
      stockMovements: [],
      lastBackupAt: undefined,
      lastRestoreAt: undefined,
      lastExportAt: undefined,
      dismissedBackupReminderAt: undefined,
      monetization: {
        adsEnabled: false,
        aiProEnabled: false,
        aiProPrice: 99
      },

      setAuthUser: (authUser) => set({ authUser }),
      setSyncStatus: (syncStatus, lastSyncedAt) => set((state) => ({ syncStatus, lastSyncedAt: lastSyncedAt ?? state.lastSyncedAt })),
      queueSyncAction: (table, operation, payload) => set((state) => ({
        syncQueue: [...state.syncQueue, { id: generateId(), table, operation, payload, createdAt: Date.now() }]
      })),
      removeFromQueue: (ids) => set((state) => ({
        syncQueue: state.syncQueue.filter(i => !ids.includes(i.id))
      })),
      clearQueue: () => set({ syncQueue: [] }),

      setUser: (user) => set({ user }),

      addCustomer: (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: generateId(),
          createdAt: Date.now(),
          totalPending: 0,
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        if (get().authUser) get().queueSyncAction('customers', 'insert', newCustomer);
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        const updated = get().customers.find(c => c.id === id);
        if (get().authUser && updated) get().queueSyncAction('customers', 'update', updated);
      },

      addTransaction: (txData) => {
        const txId = txData.id || generateId();
        const newTx: Transaction = {
          ...txData,
          id: txId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active',
        };

        set((state) => {
          const updatedTransactions = [...state.transactions, newTx];
          const newBalance = computeCustomerBalance(updatedTransactions, newTx.customerId);
          
          let riskStatus: 'Low' | 'Medium' | 'High' | undefined = 'Low';
          if (newBalance > 1000000) riskStatus = 'High';
          else if (newBalance > 200000) riskStatus = 'Medium';

          const updatedCustomers = state.customers.map((c) => 
            c.id === newTx.customerId ? { ...c, totalPending: newBalance, riskStatus } : c
          );

          return {
            transactions: updatedTransactions,
            customers: updatedCustomers,
          };
        });
        
        if (get().authUser) get().queueSyncAction('transactions', 'insert', newTx);
        return txId;
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const tx = state.transactions.find(t => t.id === id);
          if (!tx) return state;

          const updatedTransactions = state.transactions.map((t) => 
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          );
          
          const newBalance = computeCustomerBalance(updatedTransactions, tx.customerId);
          let riskStatus: 'Low' | 'Medium' | 'High' | undefined = 'Low';
          if (newBalance > 1000000) riskStatus = 'High';
          else if (newBalance > 200000) riskStatus = 'Medium';

          return {
            transactions: updatedTransactions,
            customers: state.customers.map((c) => 
              c.id === tx.customerId ? { ...c, totalPending: newBalance, riskStatus } : c
            ),
          };
        });
        const updated = get().transactions.find(t => t.id === id);
        if (get().authUser && updated) get().queueSyncAction('transactions', 'update', updated);
      },

      voidTransaction: (id) => {
        let result = { ok: false, message: "Transaction not found" };
        const nowTime = Date.now();
        const state = get();
        
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return result;
        if (tx.status === 'void') return { ok: false, message: "Transaction already voided" };

        let stockMovements = state.stockMovements ? [...state.stockMovements] : [];
        let updatedInventory = state.inventory ? [...state.inventory] : [];

        // If transaction has linked inventory item, restore stock
        if (tx.inventoryItemId && tx.stockReducedQty) {
          const item = updatedInventory.find(i => i.id === tx.inventoryItemId);
          if (item) {
            updatedInventory = updatedInventory.map(i => 
              i.id === item.id ? { ...i, stockQty: sanitizeQuantityByUnit(i.stockQty + (tx.stockReducedQty || 0), i.unit), updatedAt: nowTime } : i
            );
            stockMovements.push({
              id: generateId(),
              inventoryItemId: item.id,
              type: 'void_restore',
              qtyChange: tx.stockReducedQty,
              reason: 'Inventory udhaar voided',
              linkedTransactionId: tx.id,
              createdAt: nowTime
            });
          }
        }

        const updatedTransactions = state.transactions.map((t) => 
          t.id === id ? { ...t, status: 'void' as const, updatedAt: nowTime } : t
        );
        
        const newBalance = computeCustomerBalance(updatedTransactions, tx.customerId);
        let riskStatus: 'Low' | 'Medium' | 'High' | undefined = 'Low';
        if (newBalance > 1000000) riskStatus = 'High';
        else if (newBalance > 200000) riskStatus = 'Medium';

        const updatedCustomers = state.customers.map((c) => 
          c.id === tx.customerId ? { ...c, totalPending: newBalance, riskStatus } : c
        );

        set({
          transactions: updatedTransactions,
          customers: updatedCustomers,
          inventory: updatedInventory,
          stockMovements
        });

        const updatedTx = updatedTransactions.find(t => t.id === id);
        if (state.authUser && updatedTx) get().queueSyncAction('transactions', 'update', updatedTx);
        
        return { ok: true, message: "Transaction voided successfully" };
      },

      addSale: (saleData) => {
        const saleId = saleData.id || generateId();
        const newSale: Sale = {
          ...saleData,
          id: saleId,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ sales: [...(state.sales || []), newSale] }));
        
        // Adjust stock for any inventory items in the sale
        newSale.items.forEach(item => {
          if (item.inventoryItemId && item.stockReducedQty) {
            get().adjustStock(item.inventoryItemId, -item.stockReducedQty, 'Sale', 'sale', saleId);
          }
        });

        if (get().authUser) get().queueSyncAction('sales', 'insert', newSale);
        return saleId;
      },

      updateSale: (id, updates) => {
        set((state) => ({
          sales: (state.sales || []).map((s) => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
        }));
        const updated = get().sales.find(s => s.id === id);
        if (get().authUser && updated) get().queueSyncAction('sales', 'update', updated);
      },

      voidSale: (saleId: string) => {
        let result = { ok: false, message: "" };

        set((state) => {
          const sale = state.sales?.find((s) => s.id === saleId);

          if (!sale) {
            result = { ok: false, message: "Sale not found" };
            return state;
          }

          if (sale.status === "void") {
            result = { ok: false, message: "Sale already void" };
            return state;
          }

          const nowTime = Date.now();

          const updatedSales = state.sales.map((s) =>
            s.id === saleId
              ? { ...s, status: "void" as const, updatedAt: nowTime }
              : s
          );

          let updatedTransactions = state.transactions ? [...state.transactions] : [];
          let updatedCustomers = state.customers ? [...state.customers] : [];

          if (sale.linkedTransactionId) {
            const tx = updatedTransactions.find(t => t.id === sale.linkedTransactionId);
            if (tx) {
              updatedTransactions = updatedTransactions.map((t) =>
                t.id === sale.linkedTransactionId
                  ? { ...t, status: "void" as const, updatedAt: nowTime }
                  : t
              );
              
              // recompute customer balance
              const newBalance = computeCustomerBalance(updatedTransactions, tx.customerId);
              let riskStatus: 'Low' | 'Medium' | 'High' | undefined = 'Low';
              if (newBalance > 1000000) riskStatus = 'High';
              else if (newBalance > 200000) riskStatus = 'Medium';
              
              updatedCustomers = updatedCustomers.map(c => 
                c.id === tx.customerId ? { ...c, totalPending: newBalance, riskStatus } : c
              );
            }
          }

          let updatedInventory = state.inventory ? [...state.inventory] : [];
          let newStockMovements = state.stockMovements ? [...state.stockMovements] : [];

          for (const item of sale.items || []) {
            if (item.inventoryItemId && item.stockReducedQty && item.stockReducedQty > 0) {
              updatedInventory = updatedInventory.map((inv) =>
                inv.id === item.inventoryItemId
                  ? {
                      ...inv,
                      stockQty: sanitizeQuantityByUnit(Number(inv.stockQty || 0) + Number(item.stockReducedQty || 0), inv.unit),
                      updatedAt: nowTime,
                    }
                  : inv
              );

              newStockMovements.push({
                id: Math.random().toString(36).substring(2, 15),
                inventoryItemId: item.inventoryItemId,
                type: "void_restore",
                qtyChange: Number(item.stockReducedQty),
                reason: "Sale void stock restore",
                linkedSaleId: saleId,
                createdAt: nowTime,
              });
            }
          }

          result = { ok: true, message: "Sale voided successfully" };

          return {
            ...state,
            sales: updatedSales,
            transactions: updatedTransactions,
            customers: updatedCustomers,
            inventory: updatedInventory,
            stockMovements: newStockMovements,
          };
        });

        return result;
      },

      addInvoice: (invoiceData) => {
        const invoiceId = invoiceData.id || generateId();
        const newInvoice: Invoice = {
          ...invoiceData,
          id: invoiceId,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ invoices: [...(state.invoices || []), newInvoice] }));
        if (get().authUser) get().queueSyncAction('invoices', 'insert', newInvoice);
        return invoiceId;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: (state.invoices || []).map((i) => (i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i))
        }));
        const updated = get().invoices.find(i => i.id === id);
        if (get().authUser && updated) get().queueSyncAction('invoices', 'update', updated);
      },

      voidInvoice: (id) => {
        get().updateInvoice(id, { status: 'void', paymentStatus: 'void' });
      },

      markInvoicePaid: (id) => {
        get().updateInvoice(id, { paymentStatus: 'paid' });
      },

      addInventoryItem: (itemData) => {
        const id = generateId();
        const newItem: InventoryItem = {
          ...itemData,
          id,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ inventory: [...(state.inventory || []), newItem] }));
        if (get().authUser) get().queueSyncAction('inventory_items', 'insert', newItem);
        return id;
      },

      updateInventoryItem: (id, updates) => {
        set((state) => ({
          inventory: (state.inventory || []).map((i) => (i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i))
        }));
        const updated = get().inventory.find(i => i.id === id);
        if (get().authUser && updated) get().queueSyncAction('inventory_items', 'update', updated);
      },

      archiveInventoryItem: (id) => {
        get().updateInventoryItem(id, { status: 'archived' });
      },

      adjustStock: (id, deltaQty, reason, type, linkedSaleId) => {
        set((state) => {
          const inventory = state.inventory || [];
          const itemIndex = inventory.findIndex(i => i.id === id);
          if (itemIndex === -1) return state;

          const item = inventory[itemIndex];
          const newStockQty = sanitizeQuantityByUnit(item.stockQty + deltaQty, item.unit);
          
          if (newStockQty < 0 && type !== 'adjustment') {
             // Let UI handle negative if adjustment, but sale should fail ideally. 
             // We just log it here.
          }

          const updatedItem = { ...item, stockQty: newStockQty, updatedAt: Date.now() };
          const newInventory = [...inventory];
          newInventory[itemIndex] = updatedItem;

          const movementId = generateId();
          const newMovement: StockMovement = {
            id: movementId,
            inventoryItemId: id,
            type,
            qtyChange: deltaQty,
            reason,
            linkedSaleId,
            createdAt: Date.now()
          };

          return {
            inventory: newInventory,
            stockMovements: [...(state.stockMovements || []), newMovement]
          };
        });
        
        if (get().authUser) {
           const state = get();
           const updated = state.inventory.find(i => i.id === id);
           const movement = state.stockMovements[state.stockMovements.length - 1];
           if (updated) get().queueSyncAction('inventory_items', 'update', updated);
           if (movement) get().queueSyncAction('stock_movements', 'insert', movement);
        }
      },

      updateBackupMeta: (meta) => set((state) => ({ ...state, ...meta })),
      
      restoreData: (data) => set({
        user: data.user || null,
        customers: data.customers || [],
        transactions: data.transactions || [],
        sales: data.sales || [],
        invoices: data.invoices || [],
        inventory: data.inventory || [],
        stockMovements: data.stockMovements || [],
        lastRestoreAt: Date.now(),
      }),

      setDismissedBackupReminderAt: (time) => set({ dismissedBackupReminderAt: time }),

      hasDemoData: () => {
        const state = get();
        const safeCustomers = state.customers || [];
        const safeTransactions = state.transactions || [];
        const safeSales = state.sales || [];
        const safeInvoices = state.invoices || [];
        const safeInventoryItems = state.inventory || [];
        const safeStockMovements = state.stockMovements || [];
        
        const isDemoRecord = (record: any) => Boolean(record?.isDemo) || Boolean(record?.id?.startsWith('demo_'));

        return safeCustomers.some(isDemoRecord) ||
          safeTransactions.some(isDemoRecord) ||
          safeSales.some(isDemoRecord) ||
          safeInvoices.some(isDemoRecord) ||
          safeInventoryItems.some(isDemoRecord) ||
          safeStockMovements.some(isDemoRecord);
      },

      addDemoData: () => {
        if (get().hasDemoData()) {
          return { ok: false, message: 'Demo data already exists.' };
        }
        
        const now = Date.now();
        const demoBatchId = `demo_${now}`;
        const c1Id = `${demoBatchId}_c1`;
        const c2Id = `${demoBatchId}_c2`;
        const c3Id = `${demoBatchId}_c3`;
        const i1Id = `${demoBatchId}_i1`;
        const i2Id = `${demoBatchId}_i2`;
        const i3Id = `${demoBatchId}_i3`;
        
        const demoCustomers: Customer[] = [
          { id: c1Id, userId: get().user?.id || 'demo_u', name: 'Ramesh Singh (Demo)', phone: '9876543210', totalPending: 250000, riskStatus: 'Medium', createdAt: now, isDemo: true },
          { id: c2Id, userId: get().user?.id || 'demo_u', name: 'Amit Kumar (Demo)', phone: '8765432109', totalPending: -50000, riskStatus: 'Low', createdAt: now, isDemo: true },
          { id: c3Id, userId: get().user?.id || 'demo_u', name: 'Suresh Patel (Demo)', phone: '7654321098', totalPending: 0, riskStatus: 'Low', createdAt: now, isDemo: true },
        ];
        const demoTransactions: Transaction[] = [
          { id: `${demoBatchId}_t1`, userId: get().user?.id || 'demo_u', customerId: c1Id, type: 'udhaar', amount: 250000, description: 'Grocery items', status: 'active', createdAt: now - 86400000, updatedAt: now - 86400000, isDemo: true },
          { id: `${demoBatchId}_t2`, userId: get().user?.id || 'demo_u', customerId: c2Id, type: 'payment', amount: 50000, description: 'Advance payment', status: 'active', paymentMode: 'upi', createdAt: now - 40000000, updatedAt: now - 40000000, isDemo: true },
        ];
        const demoInventory: InventoryItem[] = [
          { id: i1Id, userId: get().user?.id || 'demo_u', name: 'Sugar 1kg (Demo)', category: 'Grocery', purchasePricePaise: 4000, sellingPricePaise: 4500, stockQty: 50, lowStockAlertQty: 10, unit: 'packet', status: 'active', createdAt: now, updatedAt: now, isDemo: true },
          { id: i2Id, userId: get().user?.id || 'demo_u', name: 'Biscuits (Demo)', category: 'Snacks', purchasePricePaise: 800, sellingPricePaise: 1000, stockQty: 100, lowStockAlertQty: 20, unit: 'packet', status: 'active', createdAt: now, updatedAt: now, isDemo: true },
          { id: i3Id, userId: get().user?.id || 'demo_u', name: 'Shampoo (Demo)', category: 'Personal Care', purchasePricePaise: 15000, sellingPricePaise: 18000, stockQty: 5, lowStockAlertQty: 10, unit: 'box', status: 'active', createdAt: now, updatedAt: now, isDemo: true },
        ];
        const demoStock: StockMovement[] = [
          { id: `${demoBatchId}_s1`, inventoryItemId: i1Id, type: 'purchase', qtyChange: 50, createdAt: now, isDemo: true },
          { id: `${demoBatchId}_s2`, inventoryItemId: i2Id, type: 'purchase', qtyChange: 100, createdAt: now, isDemo: true },
          { id: `${demoBatchId}_s3`, inventoryItemId: i3Id, type: 'purchase', qtyChange: 5, createdAt: now, isDemo: true },
        ];
        const demoSales: Sale[] = [
          { 
            id: `${demoBatchId}_sale1`, userId: get().user?.id || 'demo_u', customerId: c1Id, 
            items: [{ id: `${demoBatchId}_dsi1`, name: 'Sugar 1kg (Demo)', quantity: 2, unitPricePaise: 4500, lineTotalPaise: 9000, inventoryItemId: i1Id }], 
            subtotalPaise: 9000, discountPaise: 0, totalPaise: 9000, status: 'active', paymentMode: 'udhaar', createdAt: now, updatedAt: now, isDemo: true 
          },
          { 
            id: `${demoBatchId}_sale2`, userId: get().user?.id || 'demo_u', 
            items: [{ id: `${demoBatchId}_dsi2`, name: 'Biscuits (Demo)', quantity: 10, unitPricePaise: 1000, lineTotalPaise: 10000, inventoryItemId: i2Id }], 
            subtotalPaise: 10000, discountPaise: 0, totalPaise: 10000, status: 'active', paymentMode: 'cash', createdAt: now, updatedAt: now, isDemo: true 
          },
        ];
        const demoInvoices: Invoice[] = [
          { 
            id: `${demoBatchId}_inv1`, userId: get().user?.id || 'demo_u', invoiceNumber: 'INV-DEMO-1', customerId: c1Id, 
            items: [{ id: `${demoBatchId}_dii1`, name: 'Shampoo (Demo)', quantity: 2, unitPricePaise: 18000, lineTotalPaise: 36000 }], 
            subtotalPaise: 36000, discountPaise: 0, totalPaise: 36000,
            status: 'active', paymentStatus: 'unpaid', paymentMode: 'cash', createdAt: now, updatedAt: now, isDemo: true 
          }
        ];
        
        set((state) => ({
          ...state,
          customers: [...(state.customers || []), ...demoCustomers],
          transactions: [...(state.transactions || []), ...demoTransactions],
          inventory: [...(state.inventory || []), ...demoInventory],
          stockMovements: [...(state.stockMovements || []), ...demoStock],
          sales: [...(state.sales || []), ...demoSales],
          invoices: [...(state.invoices || []), ...demoInvoices],
        }));
        
        return { ok: true, message: 'Demo data added successfully.' };
      },
      
      clearDemoData: () => {
        set((state) => ({
          ...state,
          customers: (state.customers || []).filter(c => !c?.isDemo && !c?.id?.startsWith('demo_')),
          transactions: (state.transactions || []).filter(t => !t?.isDemo && !t?.id?.startsWith('demo_')),
          sales: (state.sales || []).filter(s => !s?.isDemo && !s?.id?.startsWith('demo_')),
          invoices: (state.invoices || []).filter(i => !i?.isDemo && !i?.id?.startsWith('demo_')),
          inventory: (state.inventory || []).filter(i => !i?.isDemo && !i?.id?.startsWith('demo_')),
          stockMovements: (state.stockMovements || []).filter(m => !m?.isDemo && !m?.id?.startsWith('demo_')),
        }));
        return { ok: true, message: 'Demo data cleared successfully.' };
      },

      repairDuplicateData: () => {
        const state = get();
        state.clearDemoData(); // Also clears demo data first to be safe
        
        set((s) => ({
          ...s,
          customers: dedupeById(s.customers || []),
          transactions: dedupeById(s.transactions || []),
          sales: dedupeById(s.sales || []),
          invoices: dedupeById(s.invoices || []),
          inventory: dedupeById(s.inventory || []),
          stockMovements: dedupeById(s.stockMovements || []),
        }));
        return { ok: true, message: 'Duplicates cleared.' };
      },

      resetAll: () => set({ user: null, customers: [], transactions: [], sales: [], invoices: [], inventory: [], stockMovements: [] }),
    }),
    {
      name: 'smartudhaar-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

