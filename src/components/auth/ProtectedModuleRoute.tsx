import { Navigate } from "react-router-dom";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Loader2 } from "lucide-react";
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess) {
    // Redirect to dashboard or first available module
    const fallback = permissions.length > 0 ? `/${permissions[0]}` : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
