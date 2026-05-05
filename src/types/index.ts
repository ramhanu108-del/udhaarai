export type Language = 'en' | 'hi' | 'hinglish';
export type BusinessType = 'kirana' | 'salon' | 'mobile_repair' | 'garments' | 'coaching' | 'wholesale' | 'other';
export type RiskStatus = 'Low' | 'Medium' | 'High';
export type TransactionType = 'udhaar' | 'payment' | 'sale_credit' | 'adjustment' | 'refund';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'udhaar' | 'unpaid';
export type TransactionStatus = 'active' | 'archived' | 'void';
export type InvoiceStatus = 'paid' | 'unpaid' | 'partial' | 'void';
export type InventoryUnit = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'packet' | 'box' | 'other';
export type StockMovementType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'void_restore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';
export type SyncOperation = 'insert' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: SyncOperation;
  payload: any;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  businessType: BusinessType;
  language: Language;
  createdAt: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  totalPending: number; // Will be derived if possible, but kept for cache/simplicity
  lastReminderAt?: number;
  riskStatus: RiskStatus;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  customerId: string;
  type: TransactionType;
  amount: number; // in paise
  description: string;
  dueDate?: number;
  status: TransactionStatus;
  paymentMode?: PaymentMode;
  linkedSaleId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaleItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  costPricePaise?: number;
  lineTotalPaise: number;
  profitPaise?: number;
  stockReducedQty?: number;
}

export interface Sale {
  id: string;
  userId: string;
  customerId?: string;
  items: SaleItem[];
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  costTotalPaise?: number;
  profitPaise?: number;
  paymentMode: PaymentMode;
  linkedTransactionId?: string;
  note?: string;
  status: TransactionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerId?: string;
  linkedSaleId?: string;
  items: InvoiceItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise?: number;
  totalPaise: number;
  paymentMode: PaymentMode;
  paymentStatus: InvoiceStatus;
  note?: string;
  status: TransactionStatus;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category?: string;
  sku?: string;
  purchasePricePaise: number;
  sellingPricePaise: number;
  stockQty: number;
  lowStockAlertQty: number;
  unit: InventoryUnit;
  supplierName?: string;
  note?: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  qtyChange: number;
  reason?: string;
  linkedSaleId?: string;
  createdAt: number;
}
