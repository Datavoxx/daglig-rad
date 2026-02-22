import { Navigate } from "react-router-dom";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProtectedModuleRouteProps {
  module: string;
  children: React.ReactNode;
}

export function ProtectedModuleRoute({ module, children }: ProtectedModuleRouteProps) {
  const { hasAccess, loading, permissions } = useUserPermissions();
  const hasShownToast = useRef(false);

  const canAccess = hasAccess(module);

  useEffect(() => {
    if (!loading && !canAccess && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("Du saknar behörighet till denna modul");
    }
  }, [loading, canAccess]);

  if (loading) {
    return null;
  }

  if (!canAccess) {
    // Redirect to daily-reports for employees, or first available module
    const fallback = permissions.includes("daily-reports")
      ? "/daily-reports"
      : permissions.length > 0
        ? `/${permissions[0]}`
        : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
