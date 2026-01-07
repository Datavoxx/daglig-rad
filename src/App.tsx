import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import Projects from "@/pages/Projects";
import Reports from "@/pages/Reports";
import ReportNew from "@/pages/ReportNew";
import ReportView from "@/pages/ReportView";
import ShareView from "@/pages/ShareView";
import ProjectShareView from "@/pages/ProjectShareView";
import Settings from "@/pages/Settings";
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
            {/* Public share routes */}
            <Route path="/share/:token" element={<ShareView />} />
            <Route path="/share/project/:token" element={<ProjectShareView />} />

            {/* Main routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/new" element={<ReportNew />} />
              <Route path="/reports/:id" element={<ReportView />} />
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
