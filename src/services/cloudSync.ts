import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { SyncOperation } from '../types';

export const cloudSync = {
  getSyncStatus() {
    return useStore.getState().syncStatus;
  },

  queueChange(table: string, operation: SyncOperation, payload: any) {
    // Only queue if user is logged in
    const state = useStore.getState();
    if (!state.authUser) return;
    
    state.queueSyncAction(table, operation, payload);
    this.processSyncQueue();
  },

  async processSyncQueue() {
    if (!supabase) return;
    
    const state = useStore.getState();
    if (state.syncStatus === 'syncing' || state.syncQueue.length === 0) return;
    if (!state.authUser) return;

    state.setSyncStatus('syncing');

    try {
      const queue = state.syncQueue;
      const successfulIds: string[] = [];

      for (const item of queue) {
        // Prepare payload with user_id
        const pgPayload = { ...item.payload, user_id: state.authUser.id };

        let error;
        if (item.operation === 'insert' || item.operation === 'update') {
           const { error: upsertError } = await supabase.from(item.table).upsert(pgPayload);
           error = upsertError;
        } else if (item.operation === 'delete') {
           const { error: deleteError } = await supabase.from(item.table).delete().eq('id', item.payload.id);
           error = deleteError;
        }

        if (!error) {
          successfulIds.push(item.id);
        } else {
          console.error(`Sync error on ${item.table} (${item.operation}):`, error);
          // Assuming immediate failure stops sync but valid items were processed
          break;
        }
      }

      state.removeFromQueue(successfulIds);
      state.setSyncStatus(state.syncQueue.length === 0 ? 'synced' : 'error', Date.now());
    } catch (err) {
      console.error('Process Sync Queue failed', err);
      state.setSyncStatus('error');
    }
  },

  async syncCollection(collectionName: string, localData: any[]) {
    if (!supabase) return;
    const state = useStore.getState();
    if (!state.authUser) return;

    try {
      const { data: cloudData, error } = await supabase.from(collectionName).select('*');
      if (error) throw error;

      // Simplistic conflict resolution: latest updatedAt wins or just upsert all for MVP
      // For MVP migration: local -> cloud upsert
      const toUpsert = localData.map(loc => ({
        ...loc,
        user_id: state.authUser!.id
      }));

      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase.from(collectionName).upsert(toUpsert);
        if (upsertError) throw upsertError;
      }
    } catch (err) {
      console.error(`Error syncing collection ${collectionName}`, err);
      throw err;
    }
  },

  async pushLocalDataToCloud() {
    if (!supabase) return;
    const state = useStore.getState();
    if (!state.authUser) return;

    state.setSyncStatus('syncing');

    try {
       await this.syncCollection('customers', state.customers);
       await this.syncCollection('transactions', state.transactions);
       await this.syncCollection('sales', state.sales);
       await this.syncCollection('invoices', state.invoices);
       await this.syncCollection('inventory_items', state.inventory);
       await this.syncCollection('stock_movements', state.stockMovements);
       
       state.setSyncStatus('synced', Date.now());
    } catch (err) {
       console.error('Push to cloud failed', err);
       state.setSyncStatus('error');
       throw err;
    }
  },

  async pullCloudData() {
    if (!supabase) return;
    const state = useStore.getState();
    if (!state.authUser) return;

    state.setSyncStatus('syncing');

    try {
       const pulls = await Promise.all([
         supabase.from('customers').select('*'),
         supabase.from('transactions').select('*'),
         supabase.from('sales').select('*'),
         supabase.from('invoices').select('*'),
         supabase.from('inventory_items').select('*'),
         supabase.from('stock_movements').select('*'),
       ]);
       
       for (const pull of pulls) {
         if (pull.error) throw pull.error;
       }

       const [customersData, txsData, salesData, invoicesData, invData, stockData] = pulls;

       // Use useStore directly to restore avoiding deep object re-references manually
       // For a cleaner MVP, just restore data cleanly
       state.restoreData({
         ...state,
         customers: customersData.data,
         transactions: txsData.data,
         sales: salesData.data,
         invoices: invoicesData.data,
         inventory: invData.data,
         stockMovements: stockData.data,
       });

       state.setSyncStatus('synced', Date.now());
    } catch (err) {
       console.error('Pull from cloud failed', err);
       state.setSyncStatus('error');
       throw err;
    }
  },

  resolveConflict(localRecord: any, cloudRecord: any) {
    if (!localRecord) return cloudRecord;
    if (!cloudRecord) return localRecord;
    // Latest updatedAt wins
    if (localRecord.updatedAt >= cloudRecord.updatedAt) {
      return localRecord;
    }
    return cloudRecord;
  }
};
