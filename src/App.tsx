import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

// Force new deployment: v4.0.0 - Auclaire Empire Hub (Marketing & Admin Dashboard)
console.log("App Version: v4.0.0 - Auclaire Empire Hub (Marketing & Admin Dashboard)");
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';
import CRMLayout from './components/layout/CRMLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PendingApproval from './pages/PendingApproval';
import { RoleSwitcher } from "./components/debug/RoleSwitcher";
import { RingProvider } from "./context/RingContext";
import { useRealtimeSync } from './hooks/useRealtimeSync';

function LazyFallback() {
    const { t } = useTranslation();
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('app.loadingFallback')}</span>
            </div>
        </div>
    );
}

const Settings = lazy(() => import('./pages/Settings'));
const ProjectsList = lazy(() => import('./pages/projects/ProjectsList'));
const ProjectDetails = lazy(() => import('./pages/projects/ProjectDetails'));
const CreateProject = lazy(() => import('./pages/projects/CreateProject'));
const ClientsList = lazy(() => import('./pages/clients/ClientsList'));
const ClientDetails = lazy(() => import('./pages/clients/ClientDetails'));
const CreateClient = lazy(() => import('./pages/clients/CreateClient'));
const InvoicesList = lazy(() => import('./pages/finance/InvoicesList'));
const CreateInvoice = lazy(() => import('./pages/finance/CreateInvoice'));
const ExpensesList = lazy(() => import('./pages/finance/ExpensesList'));
const SuppliersList = lazy(() => import('./pages/suppliers/SuppliersList'));
const UsersList = lazy(() => import('./pages/admin/UsersList'));
const SharedProjectView = lazy(() => import('./pages/public/SharedProjectView'));
const DebugPage = lazy(() => import('./pages/DebugPage'));
const Studio = lazy(() => import('./pages/Studio'));
const AffiliatesList = lazy(() => import('./pages/affiliates/AffiliatesList'));
const AffiliateDetails = lazy(() => import('./pages/affiliates/AffiliateDetails'));
const Formation = lazy(() => import('./pages/public/Formation'));
const AdminQcmResults = lazy(() => import('./pages/admin/AdminQcmResults'));
const LeadsDashboard = lazy(() => import('./pages/crm/LeadsDashboard'));
const LeadDetails = lazy(() => import('./pages/crm/LeadDetails'));
const ResourcesHub = lazy(() => import('./pages/resources/ResourcesHub'));
const SalesProcess = lazy(() => import('./pages/resources/SalesProcess'));
const ProductCatalog = lazy(() => import('./pages/resources/ProductCatalog'));
const FlashCalculator = lazy(() => import('./pages/resources/FlashCalculator'));
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const CashFlowForecast = lazy(() => import('./pages/analytics/CashFlowForecast'));
const MessageCenter = lazy(() => import('./pages/messages/MessageCenter'));
const ProductionCalendar = lazy(() => import('./pages/production/ProductionCalendar'));
const ClientPortal = lazy(() => import('./pages/clients/ClientPortal'));
const BetaFeedback = lazy(() => import('./pages/BetaFeedback'));
const ClientQuote = lazy(() => import('./pages/resources/ClientQuote'));
const Tasks = lazy(() => import('./pages/crm/Tasks'));
const MarketingHub = lazy(() => import('./pages/marketing/MarketingHub'));
const CreativeSpace = lazy(() => import('./pages/marketing/CreativeSpace'));
const CollaborationsHub = lazy(() => import('./pages/marketing/CollaborationsHub'));
const MarketingRoadmap = lazy(() => import('./pages/marketing/MarketingRoadmap'));
const WebsiteAudit = lazy(() => import('./pages/marketing/WebsiteAudit'));
const AccountsDirectory = lazy(() => import('./pages/marketing/AccountsDirectory'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Realtime sync component — must be inside Router + QueryClientProvider
function RealtimeSync() {
  useRealtimeSync();
  return null;
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) return <div className="flex h-screen items-center justify-center">{t('app.loading')}</div>;

  if (!user && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Pending User Trap
  if (role === 'pending' && !isAdmin) {
    return <Navigate to="/pending" replace />;
  }


  // RBAC Check
  if (allowedRoles && role && !allowedRoles.includes(role) && !isAdmin) {
    return <div className="p-8 text-center text-red-500">{t('app.accessDenied')}</div>;
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
          <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/shared/:token" element={<SharedProjectView />} />
            <Route path="/formation" element={<Formation />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CRMLayout>
                  <RoleSwitcher />
                  <Outlet />
                </CRMLayout>
              </ProtectedRoute>
            }>
              <Route index element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary', 'client']}><Dashboard /></ProtectedRoute>} />
              <Route path="messages" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><MessageCenter /></ProtectedRoute>} />
              <Route path="my-portal" element={<ProtectedRoute allowedRoles={['client']}><ClientPortal /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AnalyticsDashboard /></ProtectedRoute>} />
              <Route path="cash-flow" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><CashFlowForecast /></ProtectedRoute>} />
              <Route path="projects" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><ProjectsList /></ProtectedRoute>} />
              <Route path="production" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'secretary']}><ProductionCalendar /></ProtectedRoute>} />
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
              <Route path="suppliers" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><SuppliersList /></ProtectedRoute>} />
              <Route path="affiliates" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AffiliatesList /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><Settings /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><UsersList /></ProtectedRoute>} />
              <Route path="qcm" element={<ProtectedRoute allowedRoles={['admin']}><AdminQcmResults /></ProtectedRoute>} />
              <Route path="studio" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><Studio /></ProtectedRoute>} />
              <Route path="resources" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><ResourcesHub /></ProtectedRoute>} />
              <Route path="resources/sales-process" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><SalesProcess /></ProtectedRoute>} />
              <Route path="resources/catalog" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary', 'client']}><ProductCatalog /></ProtectedRoute>} />
              <Route path="resources/calculator" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><FlashCalculator /></ProtectedRoute>} />
              <Route path="resources/quote/:projectId" element={<ProtectedRoute allowedRoles={['admin', 'affiliate', 'secretary']}><ClientQuote /></ProtectedRoute>} />
              <Route path="affiliates/:id" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AffiliateDetails /></ProtectedRoute>} />
              <Route path="debug" element={<ProtectedRoute allowedRoles={['admin']}><DebugPage /></ProtectedRoute>} />
              <Route path="tasks" element={<ProtectedRoute allowedRoles={['admin', 'manufacturer', 'affiliate', 'secretary']}><Tasks /></ProtectedRoute>} />
              <Route path="marketing" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><MarketingHub /></ProtectedRoute>} />
              <Route path="marketing/creative" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><CreativeSpace /></ProtectedRoute>} />
              <Route path="marketing/collaborations" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><CollaborationsHub /></ProtectedRoute>} />
              <Route path="marketing/roadmap" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><MarketingRoadmap /></ProtectedRoute>} />
              <Route path="marketing/website" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><WebsiteAudit /></ProtectedRoute>} />
              <Route path="marketing/accounts" element={<ProtectedRoute allowedRoles={['admin', 'secretary']}><AccountsDirectory /></ProtectedRoute>} />
              <Route path="admin-panel" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="feedback" element={<ProtectedRoute allowedRoles={['admin']}><BetaFeedback /></ProtectedRoute>} />
            </Route>

            <Route path="/debug-tool" element={<ProtectedRoute><DebugPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </RingProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
