import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, ChevronDown, ChevronRight, AlertTriangle, Lightbulb, Receipt, Clock, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface EconomicOverviewCardProps {
  projectId: string;
  quoteTotal: number | null;
}

interface TimeEntryWithBilling {
  id: string;
  hours: number;
  billing_types: {
    hourly_rate: number | null;
  } | null;
}

interface VendorInvoice {
  id: string;
  total_inc_vat: number;
}

interface ProjectAta {
  id: string;
  subtotal: number | null;
  status: string | null;
}

export function EconomicOverviewCard({ projectId, quoteTotal }: EconomicOverviewCardProps) {
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [ataOpen, setAtaOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithBilling[]>([]);
  const [atas, setAtas] = useState<ProjectAta[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [vendorRes, timeRes, ataRes] = await Promise.all([
        supabase
          .from("vendor_invoices")
          .select("id, total_inc_vat")
          .eq("project_id", projectId),
        supabase
          .from("time_entries")
          .select("id, hours, billing_types(hourly_rate)")
          .eq("project_id", projectId),
        supabase
          .from("project_ata")
          .select("id, subtotal, status")
          .eq("project_id", projectId),
      ]);

      if (vendorRes.data) setVendorInvoices(vendorRes.data);
      if (timeRes.data) setTimeEntries(timeRes.data as TimeEntryWithBilling[]);
      if (ataRes.data) setAtas(ataRes.data);
      
      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("sv-SE", { 
      style: "currency", 
      currency: "SEK", 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Calculate totals
  const vendorTotal = vendorInvoices.reduce((sum, inv) => sum + (inv.total_inc_vat || 0), 0);
  
  const laborCost = timeEntries.reduce((sum, entry) => {
    const rate = entry.billing_types?.hourly_rate || 0;
    return sum + (entry.hours * rate);
  }, 0);
  
  const totalExpenses = vendorTotal + laborCost;

  // ÄTA - only approved ones
  const approvedAtas = atas.filter(a => a.status === "approved");
  const approvedAtaTotal = approvedAtas.reduce((sum, a) => sum + (a.subtotal || 0), 0);

  // Calculate margin and percentage
  const totalProjectValue = (quoteTotal || 0) + approvedAtaTotal;
  const margin = totalProjectValue - totalExpenses;
  const usedPercent = totalProjectValue > 0 
    ? Math.min(100, Math.max(0, (totalExpenses / totalProjectValue) * 100))
    : 0;

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ekonomisk översikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Ekonomisk översikt
        </CardTitle>
        <CardDescription>Projektets ekonomiska status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quote amount */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-sm text-muted-foreground">Offertbelopp</span>
          <span className="font-medium">{formatCurrency(quoteTotal)}</span>
        </div>

        {/* Expenses - Collapsible */}
        <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
          <CollapsibleTrigger className="flex justify-between items-center w-full py-2 border-b hover:bg-muted/50 rounded-sm px-1 -mx-1 transition-colors">
            <div className="flex items-center gap-2">
              {expensesOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">Utgifter</span>
            </div>
            <span className={cn("font-medium", totalExpenses > 0 && "text-destructive")}>
              {totalExpenses > 0 ? "-" : ""}{formatCurrency(totalExpenses)}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="h-3.5 w-3.5" />
                <span>Leverantörsfakturor ({vendorInvoices.length} st)</span>
              </div>
              <span>{formatCurrency(vendorTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Arbetskostnad ({totalHours.toFixed(1)}h)</span>
              </div>
              <span>{formatCurrency(laborCost)}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ÄTA - Collapsible */}
        <Collapsible open={ataOpen} onOpenChange={setAtaOpen}>
          <CollapsibleTrigger className="flex justify-between items-center w-full py-2 border-b hover:bg-muted/50 rounded-sm px-1 -mx-1 transition-colors">
            <div className="flex items-center gap-2">
              {ataOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">ÄTA (godkända)</span>
            </div>
            <span className={cn("font-medium", approvedAtaTotal > 0 && "text-green-600")}>
              {approvedAtaTotal > 0 ? "+" : ""}{formatCurrency(approvedAtaTotal)}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileEdit className="h-3.5 w-3.5" />
              <span>{approvedAtas.length} godkända poster</span>
            </div>
            {atas.filter(a => a.status !== "approved").length > 0 && (
              <div className="text-xs text-muted-foreground/70">
                ({atas.filter(a => a.status !== "approved").length} väntande)
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Margin */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium">Beräknad marginal</span>
          <span className={cn(
            "font-semibold text-lg",
            margin >= 0 ? "text-green-600" : "text-destructive"
          )}>
            {formatCurrency(margin)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={usedPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usedPercent.toFixed(0)}% utnyttjat</span>
            <span>{formatCurrency(totalExpenses)} av {formatCurrency(totalProjectValue)}</span>
          </div>
        </div>

        {/* Warnings / Tips */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Obs! Denna kalkyl baseras endast på data som lagts in i systemet. 
              Poster som saknas påverkar inte beräkningen.
            </p>
          </div>
          
          <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Tips! Se till att anställda valt rätt debiteringstyp vid tidrapportering 
              för korrekt kostnadskalkyl.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
