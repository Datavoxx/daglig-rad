import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// All available modules for admins/owners
const ALL_MODULES = [
  "dashboard",
  "projects",
  "estimates",
  "customers",
  "guide",
  "settings",
  "invoices",
  "time-reporting",
  "attendance",
  "daily-reports",
  "payroll-export"
];

// Strictly limited modules for employees - NEVER includes dashboard or projects
const EMPLOYEE_MODULES = ["attendance", "time-reporting", "daily-reports"];

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

        // Fetch user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const userRole = roleData?.role || null;
        setRole(userRole);

        // Founders and admins get full access
        if (userRole === "founder" || userRole === "admin") {
          setIsEmployee(false);
          setPermissions(ALL_MODULES);
          setLoading(false);
          return;
        }

        // Check if user is an employee (linked via employees table)
        const { data: employeeData } = await supabase
          .from("employees")
          .select("id, user_id")
          .eq("linked_user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        // If user is an employee (role 'user'), ALWAYS use restricted modules
        if (employeeData || userRole === "user") {
          setIsEmployee(true);
          setPermissions(EMPLOYEE_MODULES);
          setLoading(false);
          return;
        }

        // Fallback: fetch from user_permissions table
        const { data, error } = await supabase
          .from("user_permissions")
          .select("modules")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
        } else if (!data || !data.modules || data.modules.length === 0) {
          setPermissions(ALL_MODULES);
        } else {
          if (data.modules.includes("dashboard")) {
            setPermissions(ALL_MODULES);
          } else {
            setPermissions(data.modules);
          }
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

  // Helper to get the first available module (for navigation fallback)
  const getDefaultRoute = () => {
    // Employees go to their dedicated dashboard
    if (isEmployee) return "/employee-dashboard";
    // Admins/owners go to the main dashboard
    if (permissions.includes("dashboard")) return "/dashboard";
    if (permissions.length > 0) return `/${permissions[0]}`;
    return "/employee-dashboard";
  };

  return { 
    permissions, 
    loading, 
    hasAccess, 
    allModules: ALL_MODULES,
    isEmployee,
    role,
    getDefaultRoute
  };
}
