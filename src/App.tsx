import React from 'react';

// Force new deployment: V2.5 Added Formation Guide
console.log("App Version: V2.5 - Added Formation Guide");
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';
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
import Studio from './pages/Studio';
import { RoleSwitcher } from "./components/debug/RoleSwitcher";
import { RingProvider } from "./context/RingContext";
import AffiliatesList from './pages/affiliates/AffiliatesList';
import AffiliateDetails from './pages/affiliates/AffiliateDetails';
import Formation from './pages/public/Formation';
import AdminQcmResults from './pages/admin/AdminQcmResults';
import LeadsDashboard from './pages/crm/LeadsDashboard';
import LeadDetails from './pages/crm/LeadDetails';
import ResourcesHub from './pages/resources/ResourcesHub';
import SalesProcess from './pages/resources/SalesProcess';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import ClientPortal from './pages/clients/ClientPortal';
import { useRealtimeSync } from './hooks/useRealtimeSync';

// Realtime sync component — must be inside Router + QueryClientProvider
function RealtimeSync() {
  useRealtimeSync();
  return null;
}

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


  // RBAC Check
  if (allowedRoles && role && !allowedRoles.includes(role) && !isAdmin) {
    return <div className="p-8 text-center text-red-500">Access Denied: You do not have permission to view this page.</div>;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="auclaire-theme">
      <Toaster />
      <Router>
        <RealtimeSync />
        <RingProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Pending Page - separate from Dashboard Layout */}
            <Route path="/pending" element={
              <PendingApproval />
            } />

            {/* Public Shared Project View */}
            <Route path="/shared/:token" element={<SharedProjectView />} />

            {/* Public Formation Guide View */}
            <Route path="/formation" element={<Formation />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CRMLayout>
                  {/* RoleSwitcher only for real admins */}
                  <RoleSwitcher />
                  <Outlet /> {/* This is where nested routes will render */}
                </CRMLayout>
              </ProtectedRoute>
            }>
              <Route index element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary', 'client']}><Dashboard /></ProtectedRoute>} />
              <Route path="my-portal" element={<ProtectedRoute allowedRoles={['client']}><ClientPortal /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AnalyticsDashboard /></ProtectedRoute>} />
              <Route path="projects" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><ProjectsList /></ProtectedRoute>} />
              <Route path="projects/new" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><CreateProject /></ProtectedRoute>} />
              <Route path="projects/:id" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary', 'client']}><ProjectDetails /></ProtectedRoute>} />
              <Route path="leads" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><LeadsDashboard /></ProtectedRoute>} />
              <Route path="leads/:id" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><LeadDetails /></ProtectedRoute>} />
              <Route path="clients" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><ClientsList /></ProtectedRoute>} />
              <Route path="clients/new" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><CreateClient /></ProtectedRoute>} />
              <Route path="clients/:id" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><ClientDetails /></ProtectedRoute>} />
              <Route path="invoices" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'accounting', 'secretary']}><InvoicesList /></ProtectedRoute>} />
              <Route path="invoices/new" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><CreateInvoice /></ProtectedRoute>} />
              <Route path="finance/expenses" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><ExpensesList /></ProtectedRoute>} />
              <Route path="affiliates" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AffiliatesList /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><Settings /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><UsersList /></ProtectedRoute>} />
              <Route path="qcm" element={<ProtectedRoute allowedRoles={['admin']}><AdminQcmResults /></ProtectedRoute>} />
              <Route path="studio" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><Studio /></ProtectedRoute>} />
              <Route path="resources" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><ResourcesHub /></ProtectedRoute>} />
              <Route path="resources/sales-process" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><SalesProcess /></ProtectedRoute>} />

              <Route path="affiliates/:id" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AffiliateDetails /></ProtectedRoute>} />

              {/* Debugging - Admin only */}
              <Route path="debug" element={<ProtectedRoute allowedRoles={['admin']}><DebugPage /></ProtectedRoute>} />
            </Route>



            {/* Debugging - Admin only */}
            <Route path="/debug-tool" element={<ProtectedRoute><DebugPage /></ProtectedRoute>} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </RingProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
