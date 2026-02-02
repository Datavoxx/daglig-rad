import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedModuleRoute } from "@/components/auth/ProtectedModuleRoute";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Terms from "@/pages/legal/Terms";
import Privacy from "@/pages/legal/Privacy";
import Cookies from "@/pages/legal/Cookies";
import GDPR from "@/pages/legal/GDPR";
import Projects from "@/pages/Projects";
import ProjectView from "@/pages/ProjectView";
import ReportView from "@/pages/ReportView";

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
import Register from "@/pages/Register";
import Invoices from "@/pages/Invoices";
import AcceptInvitation from "@/pages/AcceptInvitation";
import TimeReporting from "@/pages/TimeReporting";
import Attendance from "@/pages/Attendance";
import AttendanceScan from "@/pages/AttendanceScan";
import DailyReports from "@/pages/DailyReports";

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
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/guide-public" element={<GuidePublic />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/attendance/scan/:projectId/:token" element={<AttendanceScan />} />

            {/* Protected routes with layout */}
            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedModuleRoute module="dashboard"><Dashboard /></ProtectedModuleRoute>} />
              <Route path="/projects" element={<ProtectedModuleRoute module="projects"><Projects /></ProtectedModuleRoute>} />
              <Route path="/projects/:id" element={<ProtectedModuleRoute module="projects"><ProjectView /></ProtectedModuleRoute>} />
              <Route path="/reports/:id" element={<ProtectedModuleRoute module="daily-reports"><ReportView /></ProtectedModuleRoute>} />
              
              <Route path="/inspections" element={<ProtectedModuleRoute module="inspections"><Inspections /></ProtectedModuleRoute>} />
              <Route path="/inspections/new" element={<ProtectedModuleRoute module="inspections"><InspectionNew /></ProtectedModuleRoute>} />
              <Route path="/inspections/:id" element={<ProtectedModuleRoute module="inspections"><InspectionView /></ProtectedModuleRoute>} />
              <Route path="/estimates" element={<ProtectedModuleRoute module="estimates"><Estimates /></ProtectedModuleRoute>} />
              <Route path="/customers" element={<ProtectedModuleRoute module="customers"><Customers /></ProtectedModuleRoute>} />
              <Route path="/guide" element={<ProtectedModuleRoute module="guide"><Guide /></ProtectedModuleRoute>} />
              <Route path="/settings" element={<ProtectedModuleRoute module="settings"><Settings /></ProtectedModuleRoute>} />
              <Route path="/invoices" element={<ProtectedModuleRoute module="invoices"><Invoices /></ProtectedModuleRoute>} />
              <Route path="/time-reporting" element={<ProtectedModuleRoute module="time-reporting"><TimeReporting /></ProtectedModuleRoute>} />
              <Route path="/attendance" element={<ProtectedModuleRoute module="attendance"><Attendance /></ProtectedModuleRoute>} />
              <Route path="/daily-reports" element={<ProtectedModuleRoute module="daily-reports"><DailyReports /></ProtectedModuleRoute>} />
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
