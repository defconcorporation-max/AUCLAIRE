
import React from 'react';
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
import UsersList from './pages/admin/UsersList';
import { RoleSwitcher } from "./components/debug/RoleSwitcher";
import DebugPage from './pages/DebugPage';
import { RingProvider } from "./context/RingContext";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user && !isAdmin) {
    return <Navigate to="/login" replace />;
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

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CRMLayout>
                  <RoleSwitcher />
                  <Outlet /> {/* This is where nested routes will render */}
                </CRMLayout>
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="projects/:id" element={<ProjectDetails />} />
              <Route path="clients" element={<ClientsList />} />
              <Route path="clients/new" element={<CreateClient />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/new" element={<CreateInvoice />} />
              <Route path="settings" element={<Settings />} />

              {/* Admin Only */}
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersList /></ProtectedRoute>} />

              {/* Debugging */}
              <Route path="debug" element={<DebugPage />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </RingProvider>
    </Router>
  )
}

export default App
