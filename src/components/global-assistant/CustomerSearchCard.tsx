import { useState, useMemo } from "react";
import { Search, Users, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  city?: string;
  email?: string;
}

interface CustomerSearchCardProps {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  onCreateNew: () => void;
  disabled?: boolean;
}

export function CustomerSearchCard({
  customers,
  onSelect,
  onCreateNew,
  disabled,
}: CustomerSearchCardProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Sök kund</h3>
      </div>

      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder="Sök på namn, stad eller email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pl-9"
        />
      </div>

      {/* Customer list */}
      <ScrollArea className="h-[200px] rounded-lg border border-border/40">
        <div className="p-1">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Inga kunder hittades" : "Inga kunder"}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelect(customer)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left",
                  "transition-colors hover:bg-muted/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {customer.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[customer.city, customer.email].filter(Boolean).join(" • ") || "Ingen info"}
                  </p>
                </div>
                <ChevronRight className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create new button */}
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateNew}
          disabled={disabled}
          className="gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Skapa ny kund
        </Button>
      </div>
    </div>
  );
}
