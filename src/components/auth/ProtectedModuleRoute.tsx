import { Navigate } from "react-router-dom";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Loader2 } from "lucide-react";

interface ProtectedModuleRouteProps {
  module: string;
  children: React.ReactNode;
}

export function ProtectedModuleRoute({ module, children }: ProtectedModuleRouteProps) {
  const { hasAccess, loading } = useUserPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess(module)) {
    // Redirect to first available module or projects as fallback
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
