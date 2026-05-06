import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { AddCustomer } from './pages/AddCustomer';
import { CustomerDetail } from './pages/CustomerDetail';
import { AddTransaction } from './pages/AddTransaction';
import { Udhaar } from './pages/Udhaar';
import { Sales } from './pages/Sales';
import { AddSale } from './pages/AddSale';
import { Invoices } from './pages/Invoices';
import { AddInvoice } from './pages/AddInvoice';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Backup } from './pages/Backup';
import { Inventory } from './pages/Inventory';
import { AddInventoryItem } from './pages/AddInventoryItem';
import { InventoryDetail } from './pages/InventoryDetail';
import { AIAssistant } from './pages/AIAssistant';
import { Auth } from './pages/Auth';
import { AccountSync } from './pages/AccountSync';
import { More } from './pages/More';
import { AuditReport } from './pages/AuditReport';
import { NotFound } from './pages/NotFound';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { Help } from './pages/Help';
import { Reports } from './pages/Reports';
import { Privacy } from './pages/Privacy';
import { Settings } from './pages/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useStore(state => state.user);
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Onboarding />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/new" element={<ProtectedRoute><AddCustomer /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
            
            <Route path="/udhaar" element={<ProtectedRoute><Udhaar /></ProtectedRoute>} />
            <Route path="/udhaar/new" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
            <Route path="/payment/new" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
            <Route path="/add-transaction/:customerId" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
            
            <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
            <Route path="/sales/new" element={<ProtectedRoute><AddSale /></ProtectedRoute>} />
            
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><AddInvoice /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/add" element={<ProtectedRoute><AddInventoryItem /></ProtectedRoute>} />
            <Route path="/inventory/:id" element={<ProtectedRoute><InventoryDetail /></ProtectedRoute>} />

            <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />

            <Route path="/auth" element={<Auth />} />
            <Route path="/account-sync" element={<AccountSync />} />

            <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />
            <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditReport /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

