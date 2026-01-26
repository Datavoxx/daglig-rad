import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// All available modules
const ALL_MODULES = [
  "projects",
  "reports", 
  "planning",
  "estimates",
  "customers",
  "guide",
  "settings",
  "economy"
];

// Default modules for new users (restricted access - no projects)
const DEFAULT_MODULES = [
  "estimates",
  "customers",
  "settings"
];
export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_permissions")
          .select("modules")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching permissions:", error);
          // On error, give access to all modules
          setPermissions(ALL_MODULES);
        } else if (!data || !data.modules || data.modules.length === 0) {
          // No permissions set = use default restricted modules
          setPermissions(DEFAULT_MODULES);
        } else {
          setPermissions(data.modules);
        }
      } catch (err) {
        console.error("Error in fetchPermissions:", err);
        setPermissions(ALL_MODULES);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasAccess = (module: string) => permissions.includes(module);

  return { permissions, loading, hasAccess, allModules: ALL_MODULES };
}
