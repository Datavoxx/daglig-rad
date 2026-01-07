import { useLocation } from "react-router-dom";

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function RouteTransition({ children, className = "" }: RouteTransitionProps) {
  const location = useLocation();
  
  return (
    <div 
      key={location.pathname + location.search}
      className={`page-transition ${className}`}
    >
      {children}
    </div>
  );
}
