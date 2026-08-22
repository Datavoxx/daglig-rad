import { Navigate } from "react-router-dom";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProtectedModuleRouteProps {
  module: string;
  children: React.ReactNode;
}

export function ProtectedModuleRoute({ module, children }: ProtectedModuleRouteProps) {
  const { hasAccess, loading, permissions, getDefaultRoute } = useUserPermissions();
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
    // No modules at all — show a message instead of redirecting in a loop
    if (permissions.length === 0) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
          <h1 className="text-lg font-semibold">Du saknar behörighet</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Inga moduler är aktiverade för ditt konto. Kontakta din administratör.
          </p>
        </div>
      );
    }
    return <Navigate to={getDefaultRoute()} replace />;
  }

  return <>{children}</>;
}
