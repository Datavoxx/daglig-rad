import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// All module keys that can be controlled from the database (user_permissions.modules)
const ALL_MODULES = [
  "dashboard",
  "projects",
  "estimates",
  "customers",
  "guide",
  "settings",
  "invoices",
  "accounting",
  "receipts",
  "time-reporting",
  "attendance",
  "daily-reports",
  "payroll-export",
  "inspections",
  "docs",
];

// Preferred order when picking a landing page for a user
const ROUTE_BY_MODULE: Record<string, string> = {
  dashboard: "/dashboard",
  projects: "/projects",
  estimates: "/estimates",
  customers: "/customers",
  invoices: "/invoices",
  accounting: "/accounting",
  receipts: "/invoices?tab=receipts",
  "time-reporting": "/time-reporting",
  attendance: "/attendance",
  "daily-reports": "/daily-reports",
  "payroll-export": "/payroll-export",
  inspections: "/inspections",
  docs: "/docs",
  guide: "/guide",
  settings: "/settings",
};

const FALLBACK_ORDER = [
  "dashboard",
  "daily-reports",
  "time-reporting",
  "estimates",
  "projects",
  "docs",
  "attendance",
  "customers",
  "invoices",
  "accounting",
  "receipts",
  "inspections",
  "payroll-export",
  "guide",
  "settings",
];

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployee, setIsEmployee] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Role only decides which menu variant / start page is used, not access
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const userRole = roleData?.role || null;
        setRole(userRole);

        const { data: employeeData } = await supabase
          .from("employees")
          .select("id")
          .eq("linked_user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        setIsEmployee(!!employeeData || userRole === "user");

        // The database is the single source of truth for module access
        const { data, error } = await supabase
          .from("user_permissions")
          .select("modules")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        } else {
          setPermissions(data?.modules ?? []);
        }
      } catch (err) {
        console.error("Error in fetchPermissions:", err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasAccess = (module: string) => permissions.includes(module);

  // First allowed module, in a sensible order
  const getDefaultRoute = () => {
    if (isEmployee && permissions.includes("daily-reports")) {
      return "/employee-dashboard";
    }
    const first = FALLBACK_ORDER.find((m) => permissions.includes(m));
    return first ? ROUTE_BY_MODULE[first] : "/profile";
  };

  return {
    permissions,
    loading,
    hasAccess,
    allModules: ALL_MODULES,
    isEmployee,
    role,
    getDefaultRoute,
  };
}
