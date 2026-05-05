import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Customer, Transaction, Sale, Invoice, InventoryItem, StockMovement, StockMovementType, SyncStatus, SyncQueueItem, SyncOperation } from '../types';

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
  
  // Actions
  setUser: (user: User) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPending'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
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

      deleteTransaction: (id) => {
        get().updateTransaction(id, { status: 'void' });
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
                      stockQty: Number(inv.stockQty || 0) + Number(item.stockReducedQty || 0),
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
          const newStockQty = item.stockQty + deltaQty;
          
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

      resetAll: () => set({ user: null, customers: [], transactions: [], sales: [], invoices: [], inventory: [], stockMovements: [] }),
    }),
    {
      name: 'smartudhaar-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

