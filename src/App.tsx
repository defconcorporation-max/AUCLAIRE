
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
import { RoleSwitcher } from "./components/debug/RoleSwitcher";
import DebugPage from './pages/DebugPage';
import { RingProvider } from "./context/RingContext";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user && !isAdmin) {
    return <Navigate to="/login" replace />;
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
