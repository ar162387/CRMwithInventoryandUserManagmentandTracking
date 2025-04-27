import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FakeInvoicesPage from './pages/FakeInvoice/FakeInvoicesPage';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagment';
import ActivityLogPage from './pages/ActivityLogPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ManageInventory from './pages/Inventory/ManageInventory';
import VendorList from './pages/Vendors/VendorList';
import GenerateVendorInvoice from './pages/Vendors/GenerateVendorInvoice';
import VendorInvoices from './pages/Vendors/VendorInvoices';
import VendorPayables from './pages/Vendors/VendorPayables';
import EditVendorInvoicePage from './pages/Vendors/EditVendorInvoicePage';
import BrokerList from './pages/Brokers/BrokerList';
import BrokerPayables from './pages/Brokers/BrokerPayables';
import CustomerList from './pages/Customers/CustomerList';
import CustomerInvoiceList from './pages/Customers/CustomerInvoiceList';
import GenerateCustomerInvoice from './pages/Customers/GenerateCustomerInvoice';
import ViewCustomerInvoice from './pages/Customers/ViewCustomerInvoice';
// import EditCustomerInvoice from './pages/Customers/EditCustomerInvoice';
import PrintCustomerInvoice from './pages/Customers/PrintCustomerInvoice';
import CommissionerList from './pages/Commissioners/CommissionerList';
import CustomerPayables from './pages/Customers/CustomerPayables';
import BalanceSheetPage from './pages/financial/BalanceSheetPage';
import SalesReportPage from './pages/financial/SalesReportPage';

// Placeholder Pages (to be implemented)
import PlaceholderPage from './pages/PlaceholderPage';

// Import the new commissioner components
import AddCommissionSheet from './pages/Commissioners/AddCommissionSheet';
import CommissionerPayables from './pages/Commissioners/CommissionerPayables';
import ViewCommissionerInvoice from './pages/Commissioners/ViewCommissionerInvoice';

// Main App Component
function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Navbar toggleSidebar={toggleSidebar} />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                    <main className={`flex-1 overflow-auto bg-gray-100 ${sidebarCollapsed ? 'pl-20' : 'pl-4'}`}>
                      <div className="container mx-auto px-4 py-6">
                        <Outlet />
                      </div>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />

            {/* Fake Invoices */}
            <Route path="fake-invoices" element={<FakeInvoicesPage />} />

            {/* Inventory Management */}
            <Route path="inventory" element={<ManageInventory />} />

            {/* Financial Management */}
            <Route path="financial">
              <Route index element={<Navigate to="sales-report" replace />} />
              <Route path="sales-report" element={<SalesReportPage />} />
              <Route path="balance-sheet" element={<BalanceSheetPage />} />
            </Route>

            {/* Customer Management */}
            <Route path="customers">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<CustomerList />} />
              <Route path="payables" element={<CustomerPayables />} />
            </Route>
            {/* Customer Invoice Routes */}
            <Route path="customer-invoices" element={<CustomerInvoiceList />} />
            <Route path="generate-customer-invoice" element={<GenerateCustomerInvoice />} />
            <Route path="customer-invoice/:id" element={<ViewCustomerInvoice />} />
            {/* <Route path="edit-customer-invoice/:id" element={<EditCustomerInvoice />} /> */}
            <Route path="print-customer-invoice" element={<PrintCustomerInvoice />} />

            {/* Vendor Management */}
            <Route path="vendors">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<VendorList />} />
              <Route path="invoices" element={<VendorInvoices />} />
              <Route path="generate" element={<GenerateVendorInvoice />} />
              <Route path="invoice/:id/edit" element={<EditVendorInvoicePage />} />
              <Route path="payables" element={<VendorPayables />} />
            </Route>

            {/* Broker Management */}
            <Route path="brokers">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<BrokerList />} />
              <Route path="payables" element={<BrokerPayables />} />
            </Route>

            {/* Commissioner Management */}
            <Route path="commissioners">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<CommissionerList />} />
              <Route path="add-sheet" element={<AddCommissionSheet />} />
              <Route path="sheets" element={<CommissionerPayables />} />
            </Route>

            {/* Commissioner Invoice Routes */}
            <Route path="commissioner-invoice/:id" element={<ViewCommissionerInvoice />} />

            {/* Settings */}
            <Route path="settings">
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<AccountSettingsPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

            {/* Activity Log */}
            <Route path="activity-log" element={<ActivityLogPage />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App;
