import { useLocation } from "react-router-dom";

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function RouteTransition({ children, className = "" }: RouteTransitionProps) {
  const location = useLocation();
  const needsFullHeight = location.pathname === "/global-assistant";
  
  return (
    <div 
      key={location.pathname}
      className={`page-transition ${className} ${needsFullHeight ? "h-full" : ""}`}
    >
      {children}
    </div>
  );
}
