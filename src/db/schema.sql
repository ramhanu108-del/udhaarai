-- Supabase Schema & RLS Policies for SmartUdhaar AI

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  owner_name TEXT,
  shop_name TEXT,
  phone TEXT,
  business_type TEXT,
  language TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can only read their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can only update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_pending BIGINT,
  last_reminder_at BIGINT,
  risk_status TEXT,
  created_at BIGINT,
  status TEXT DEFAULT 'active'
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own customers" ON customers FOR ALL USING (auth.uid() = user_id);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id TEXT,
  type TEXT,
  amount BIGINT,
  description TEXT,
  due_date BIGINT,
  status TEXT,
  payment_mode TEXT,
  linked_sale_id TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- 4. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id TEXT,
  items JSONB,
  subtotal_paise BIGINT,
  discount_paise BIGINT,
  total_paise BIGINT,
  cost_total_paise BIGINT,
  profit_paise BIGINT,
  payment_mode TEXT,
  linked_transaction_id TEXT,
  note TEXT,
  status TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own sales" ON sales FOR ALL USING (auth.uid() = user_id);

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  invoice_number TEXT,
  customer_id TEXT,
  linked_sale_id TEXT,
  items JSONB,
  subtotal_paise BIGINT,
  discount_paise BIGINT,
  tax_paise BIGINT,
  total_paise BIGINT,
  payment_mode TEXT,
  payment_status TEXT,
  note TEXT,
  status TEXT,
  due_date BIGINT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);

-- 6. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT,
  category TEXT,
  sku TEXT,
  purchase_price_paise BIGINT,
  selling_price_paise BIGINT,
  stock_qty BIGINT,
  low_stock_alert_qty BIGINT,
  unit TEXT,
  supplier_name TEXT,
  note TEXT,
  status TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own inventory" ON inventory_items FOR ALL USING (auth.uid() = user_id);

-- 7. Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  inventory_item_id TEXT,
  type TEXT,
  qty_change BIGINT,
  reason TEXT,
  linked_sale_id TEXT,
  created_at BIGINT
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own stock movements" ON stock_movements FOR ALL USING (auth.uid() = user_id);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  last_backup_at BIGINT,
  last_restore_at BIGINT,
  last_export_at BIGINT,
  ai_mode TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only handle their own settings" ON settings FOR ALL USING (auth.uid() = user_id);
