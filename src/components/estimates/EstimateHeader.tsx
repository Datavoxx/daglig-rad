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
    <div className="space-y-3">
      {/* Top row: Title and meta */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Offert
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
            {projectName}
          </h1>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-medium text-foreground tabular-nums">
            {displayOfferNumber}
          </div>
          <div className="text-xs text-muted-foreground">
            v{version} • {displayDate}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Client and address row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {clientName && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{clientName}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[300px]">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
