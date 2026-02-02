import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MapPin, User, UserCheck } from "lucide-react";
import { InlineAddressAutocomplete } from "@/components/shared/InlineAddressAutocomplete";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    <div className="space-y-2">
      {/* Top row: Title and meta */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Offert
            </span>
          </div>
          {isEditable ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange?.(e.target.value)}
              placeholder="Projektnamn..."
              className="w-full text-lg font-semibold tracking-tight text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -ml-1 placeholder:text-muted-foreground/50"
            />
          ) : (
            <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
              {projectName}
            </h1>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-center gap-2 justify-end">
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
            <span className="text-[13px] font-medium text-foreground tabular-nums">
              {displayOfferNumber}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            v{version} • {displayDate}
          </div>
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
