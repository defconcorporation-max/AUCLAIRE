import React from 'react';

// Force new deployment: V2.1 Fixed Affiliates
console.log("App Version: V2.1 - Fixed Affiliates & Profit Logic");
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import CRMLayout from './components/layout/CRMLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetails from './pages/projects/ProjectDetails';
import CreateProject from './pages/projects/CreateProject';
import ClientsList from './pages/clients/ClientsList';
import ClientDetails from './pages/clients/ClientDetails';
import CreateClient from './pages/clients/CreateClient';
import InvoicesList from './pages/finance/InvoicesList';
import CreateInvoice from './pages/finance/CreateInvoice';
import ExpensesList from './pages/finance/ExpensesList';
import UsersList from './pages/admin/UsersList';
import PendingApproval from './pages/PendingApproval';
import SharedProjectView from './pages/public/SharedProjectView';
import DebugPage from './pages/DebugPage';
import { RoleSwitcher } from "./components/debug/RoleSwitcher";
import DebugPage from './pages/DebugPage';
import { RingProvider } from "./context/RingContext";
import AffiliatesList from './pages/affiliates/AffiliatesList';
import AffiliateDashboard from './pages/affiliates/AffiliateDashboard';
import AffiliateDetails from './pages/affiliates/AffiliateDetails';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Pending User Trap
  if (role === 'pending' && !isAdmin) {
    return <Navigate to="/pending" replace />;
  }

  // Affiliate Redirect: If accessing root dashboard, send to affiliate dashboard
  if (role === 'affiliate' && location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/affiliate" replace />;
  }

  // RBAC Check
  if (allowedRoles && role && !allowedRoles.includes(role) && !isAdmin) {
    return <div className="p-8 text-center text-red-500">Access Denied: You do not have permission to view this page.</div>;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <RingProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Pending Page - separate from Dashboard Layout */}
            <Route path="/pending" element={
              <PendingApproval />
            } />

            {/* Public Shared Project View */}
            <Route path="/shared/:token" element={<SharedProjectView />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CRMLayout>
                  <RoleSwitcher />
                  <Outlet /> {/* This is where nested routes will render */}
                </CRMLayout>
              </ProtectedRoute>
            }>
              <Route index element={<ProtectedRoute allowedRoles={['admin', 'sales', 'manufacturer']}><Dashboard /></ProtectedRoute>} />
              <Route path="projects" element={<ProtectedRoute allowedRoles={['admin', 'sales', 'manufacturer']}><ProjectsList /></ProtectedRoute>} />
              <Route path="projects/new" element={<ProtectedRoute allowedRoles={['admin', 'sales']}><CreateProject /></ProtectedRoute>} />
              <Route path="projects/:id" element={<ProtectedRoute allowedRoles={['admin', 'sales', 'manufacturer', 'affiliate']}><ProjectDetails /></ProtectedRoute>} />
              <Route path="clients" element={<ProtectedRoute allowedRoles={['admin', 'sales']}><ClientsList /></ProtectedRoute>} />
              <Route path="clients/new" element={<ProtectedRoute allowedRoles={['admin', 'sales']}><CreateClient /></ProtectedRoute>} />
              <Route path="clients/:id" element={<ProtectedRoute allowedRoles={['admin', 'sales']}><ClientDetails /></ProtectedRoute>} />
              <Route path="invoices" element={<ProtectedRoute allowedRoles={['admin', 'sales', 'accounting']}><InvoicesList /></ProtectedRoute>} />
              <Route path="invoices/new" element={<ProtectedRoute allowedRoles={['admin', 'sales']}><CreateInvoice /></ProtectedRoute>} />
              <Route path="finance/expenses" element={<ProtectedRoute allowedRoles={['admin']}><ExpensesList /></ProtectedRoute>} />
              <Route path="affiliates" element={<ProtectedRoute allowedRoles={['admin']}><AffiliatesList /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersList /></ProtectedRoute>} />

              {/* Affiliate Routes */}
              <Route path="affiliate" element={<ProtectedRoute allowedRoles={['affiliate']}><AffiliateDashboard /></ProtectedRoute>} />
              <Route path="affiliates/:id" element={<ProtectedRoute allowedRoles={['admin']}><AffiliateDetails /></ProtectedRoute>} />

              {/* Debugging */}
              <Route path="debug" element={<DebugPage />} />
            </Route>



            {/* Debugging */}
            <Route path="/debug-tool" element={<DebugPage />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </RingProvider>
    </Router>
  )
}

export default App
