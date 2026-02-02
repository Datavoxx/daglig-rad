import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MapPin, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAddressAutocomplete } from "@/components/shared/InlineAddressAutocomplete";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EstimateHeaderProps {
  projectName: string;
  clientName?: string | null;
  address?: string | null;
  offerNumber?: string | null;
  version: number;
  createdAt?: string | null;
  status: "draft" | "completed";
  isEditable?: boolean;
  ourReference?: string | null;
  onProjectNameChange?: (name: string) => void;
  onClientNameChange?: (name: string) => void;
  onAddressChange?: (address: string) => void;
  onStatusChange?: (newStatus: "draft" | "completed") => void;
}

export function EstimateHeader({
  projectName,
  clientName,
  address,
  offerNumber,
  version,
  createdAt,
  status,
  isEditable = false,
  ourReference,
  onProjectNameChange,
  onClientNameChange,
  onAddressChange,
  onStatusChange,
}: EstimateHeaderProps) {
  const isMobile = useIsMobile();
  const displayDate = createdAt
    ? format(new Date(createdAt), "d MMM yyyy", { locale: sv })
    : format(new Date(), "d MMM yyyy", { locale: sv });

  const displayOfferNumber = offerNumber || "OFF-DRAFT";

  const handleBadgeClick = () => {
    if (onStatusChange) {
      onStatusChange(status === "draft" ? "completed" : "draft");
    }
  };

  return (
    <div className="space-y-2 flex-1 min-w-0">
      {/* Top row: Title and meta */}
      <div className={cn(
        "gap-3",
        isMobile ? "space-y-2" : "flex items-start justify-between"
      )}>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Offert
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={status === "draft" ? "secondary" : "default"}
                    className={cn(
                      status === "completed" ? "bg-green-600 hover:bg-green-700" : "",
                      onStatusChange && "cursor-pointer hover:opacity-80 transition-opacity"
                    )}
                    onClick={handleBadgeClick}
                  >
                    {status === "draft" ? "DRAFT" : "KLAR"}
                  </Badge>
                </TooltipTrigger>
                {onStatusChange && (
                  <TooltipContent>
                    <p>{status === "draft" ? "Klicka för att markera som klar" : "Klicka för att ändra till utkast"}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          {isEditable ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              placeholder="Projektnamn..."
              className="w-full text-lg md:text-xl font-semibold tracking-tight text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -ml-1 placeholder:text-muted-foreground/50"
            />
          ) : (
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground">
              {projectName}
            </h1>
          )}
        </div>

        {/* Meta info - stacked on mobile */}
        <div className={cn(
          "text-sm",
          isMobile ? "flex items-center gap-2 flex-wrap" : "text-right shrink-0"
        )}>
          <span className="font-medium text-foreground tabular-nums">
            {displayOfferNumber}
          </span>
          <span className="text-muted-foreground">
            v{version} • {displayDate}
          </span>
          {!isMobile && status === "draft" && onStatusChange && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBadgeClick}
              className="h-7 text-xs px-3 ml-2"
            >
              Starta projekt
            </Button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Client and address row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        {isEditable ? (
          <>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              <input
                type="text"
                value={clientName || ""}
                onChange={(e) => onClientNameChange?.(e.target.value)}
                placeholder="Kundnamn..."
                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -ml-1 placeholder:text-muted-foreground/50 min-w-[100px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <InlineAddressAutocomplete
                value={address || ""}
                onChange={(addr) => onAddressChange?.(addr)}
                placeholder="Adress..."
                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -ml-1 placeholder:text-muted-foreground/50 min-w-[150px]"
              />
            </div>
          </>
        ) : (
          <>
            {clientName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{clientName}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[280px]">{address}</span>
              </div>
            )}
          </>
        )}
        {ourReference && (
          <div className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            <span>Vår ref: {ourReference}</span>
          </div>
        )}
      </div>
    </div>
  );
}
