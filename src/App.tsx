import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "@/pages/Auth";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import ReportNew from "@/pages/ReportNew";
import ReportView from "@/pages/ReportView";
import Planning from "@/pages/Planning";
import Settings from "@/pages/Settings";
import Inspections from "@/pages/Inspections";
import InspectionNew from "@/pages/InspectionNew";
import InspectionView from "@/pages/InspectionView";
import Estimates from "@/pages/Estimates";
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
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/new" element={<ReportNew />} />
              <Route path="/reports/:id" element={<ReportView />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/inspections" element={<Inspections />} />
              <Route path="/inspections/new" element={<InspectionNew />} />
              <Route path="/inspections/:id" element={<InspectionView />} />
              <Route path="/estimates" element={<Estimates />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/settings" element={<Settings />} />
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
