import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { FileText, MapPin, User } from "lucide-react";

interface EstimateHeaderProps {
  projectName: string;
  clientName?: string | null;
  address?: string | null;
  offerNumber?: string | null;
  version: number;
  createdAt?: string | null;
}

export function EstimateHeader({
  projectName,
  clientName,
  address,
  offerNumber,
  version,
  createdAt,
}: EstimateHeaderProps) {
  const displayDate = createdAt
    ? format(new Date(createdAt), "d MMM yyyy", { locale: sv })
    : format(new Date(), "d MMM yyyy", { locale: sv });

  const displayOfferNumber = offerNumber || "OFF-DRAFT";

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
          <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">
            {projectName}
          </h1>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[13px] font-medium text-foreground tabular-nums">
            {displayOfferNumber}
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
      </div>
    </div>
  );
}
