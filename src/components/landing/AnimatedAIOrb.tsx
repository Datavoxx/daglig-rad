import { Sparkles } from "lucide-react";

const AnimatedAIOrb = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "w-10 h-10",
    default: "w-16 h-16",
    large: "w-24 h-24"
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-10 w-10"
  };

  return (
    <div className="relative">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
      
      {/* Secondary glow */}
      <div className="absolute -inset-2 rounded-full bg-primary/10 blur-2xl animate-glow-pulse" />
      
      {/* Main orb */}
      <div 
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 
                    shadow-[0_0_40px_hsl(var(--primary)/0.5)] animate-float`}
      >
        {/* Scanning ring 1 */}
        <div className="absolute inset-1 rounded-full border-2 border-white/20 animate-spin-slow" />
        
        {/* Scanning ring 2 */}
        <div className="absolute inset-2 rounded-full border border-white/30 animate-[spin_4s_linear_infinite_reverse]" />
        
        {/* Inner gradient overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10" />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className={`${iconSizes[size]} text-white drop-shadow-lg animate-pulse`} />
        </div>
        
        {/* Particle effects */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/60 animate-ping" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-white/40 animate-ping" style={{ animationDelay: "0.5s" }} />
      </div>
    </div>
  );
};

export default AnimatedAIOrb;
