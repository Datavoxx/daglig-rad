import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedModuleRoute } from "@/components/auth/ProtectedModuleRoute";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import ReportNew from "@/pages/ReportNew";
import ReportView from "@/pages/ReportView";
import Planning from "@/pages/Planning";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Inspections from "@/pages/Inspections";
import InspectionNew from "@/pages/InspectionNew";
import InspectionView from "@/pages/InspectionView";
import Estimates from "@/pages/Estimates";
import Customers from "@/pages/Customers";
import Guide from "@/pages/Guide";
import GuidePublic from "@/pages/GuidePublic";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/guide-public" element={<GuidePublic />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<ProtectedModuleRoute module="projects"><Projects /></ProtectedModuleRoute>} />
              <Route path="/reports" element={<ProtectedModuleRoute module="reports"><Reports /></ProtectedModuleRoute>} />
              <Route path="/reports/new" element={<ProtectedModuleRoute module="reports"><ReportNew /></ProtectedModuleRoute>} />
              <Route path="/reports/:id" element={<ProtectedModuleRoute module="reports"><ReportView /></ProtectedModuleRoute>} />
              <Route path="/planning" element={<ProtectedModuleRoute module="planning"><Planning /></ProtectedModuleRoute>} />
              <Route path="/inspections" element={<ProtectedModuleRoute module="inspections"><Inspections /></ProtectedModuleRoute>} />
              <Route path="/inspections/new" element={<ProtectedModuleRoute module="inspections"><InspectionNew /></ProtectedModuleRoute>} />
              <Route path="/inspections/:id" element={<ProtectedModuleRoute module="inspections"><InspectionView /></ProtectedModuleRoute>} />
              <Route path="/estimates" element={<ProtectedModuleRoute module="estimates"><Estimates /></ProtectedModuleRoute>} />
              <Route path="/customers" element={<ProtectedModuleRoute module="customers"><Customers /></ProtectedModuleRoute>} />
              <Route path="/guide" element={<ProtectedModuleRoute module="guide"><Guide /></ProtectedModuleRoute>} />
              <Route path="/settings" element={<ProtectedModuleRoute module="settings"><Settings /></ProtectedModuleRoute>} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
