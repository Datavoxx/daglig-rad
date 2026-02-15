import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Receipt, AlertCircle, ShoppingCart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface EconomyCardProps {
  content: string;
  data: {
    project_id?: string;
    project_name?: string;
    budget?: number;
    estimate_total?: number;
    estimate_labor?: number;
    estimate_material?: number;
    total_hours?: number;
    ata_approved?: number;
    ata_pending?: number;
    ata_count?: number;
    invoiced_amount?: number;
    paid_amount?: number;
    invoice_count?: number;
    vendor_cost_ex_vat?: number;
    vendor_cost_inc_vat?: number;
    vendor_invoice_count?: number;
    labor_cost_actual?: number;
  };
}

function formatCurrency(amount: number): string {
  return Math.round(amount).toLocaleString("sv-SE") + " kr";
}

export function EconomyCard({ content, data }: EconomyCardProps) {
  const budget = data.budget || 0;
  const estimateTotal = data.estimate_total || 0;
  const invoiced = data.invoiced_amount || 0;
  const paid = data.paid_amount || 0;
  const vendorCost = data.vendor_cost_inc_vat || 0;
  const ataApproved = data.ata_approved || 0;
  const laborCost = data.labor_cost_actual || 0;
  
  // Margin calculation (same logic as EconomicOverviewCard)
  const totalProjectValue = estimateTotal + ataApproved;
  const totalExpenses = vendorCost + laborCost;
  const margin = totalProjectValue - totalExpenses;
  
  // Calculate invoice progress
  const invoiceProgress = estimateTotal > 0 ? (invoiced / estimateTotal) * 100 : 0;
  const paymentProgress = invoiced > 0 ? (paid / invoiced) * 100 : 0;
  const costProgress = estimateTotal > 0 ? (vendorCost / estimateTotal) * 100 : 0;

  return (
    <Card className="p-4 space-y-4">
      {data.project_id && (
        <div className="flex justify-end">
          <Link to={`/projects/${data.project_id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Gå till projekt
            </Button>
          </Link>
        </div>
      )}
      <div className="prose prose-sm max-w-none text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      
      {/* Visual Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Budget Card */}
        <div className="p-3 rounded-lg bg-primary/10 space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Budget</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(budget)}</p>
        </div>
        
        {/* Hours Card */}
        <div className="p-3 rounded-lg bg-blue-500/10 space-y-1">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Timmar</span>
          </div>
          <p className="text-lg font-semibold">{data.total_hours || 0}h</p>
        </div>
        
        {/* Invoiced Card */}
        <div className="p-3 rounded-lg bg-green-500/10 space-y-1">
          <div className="flex items-center gap-2 text-green-600">
            <Receipt className="h-4 w-4" />
            <span className="text-xs font-medium">Fakturerat</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(invoiced)}</p>
        </div>
        
        {/* ÄTA Card */}
        <div className="p-3 rounded-lg bg-amber-500/10 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">ÄTA ({data.ata_count || 0})</span>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(data.ata_approved || 0)}</p>
          {(data.ata_pending || 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              + {formatCurrency(data.ata_pending || 0)} väntande
            </p>
          )}
        </div>
        
        {/* Leverantörskostnader */}
        {(data.vendor_invoice_count || 0) > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 space-y-1">
            <div className="flex items-center gap-2 text-red-600">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium">Inköp ({data.vendor_invoice_count})</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(vendorCost)}</p>
          </div>
        )}
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-3">
        {estimateTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fakturerat av offert</span>
              <span className="font-medium">{Math.round(invoiceProgress)}%</span>
            </div>
            <Progress value={invoiceProgress} className="h-2" />
          </div>
        )}
        
        {invoiced > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Betalt av fakturerat</span>
              <span className="font-medium">{Math.round(paymentProgress)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2 [&>div]:bg-green-500" />
          </div>
        )}
        
        {vendorCost > 0 && estimateTotal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Inköpskostnader av offert</span>
              <span className="font-medium">{Math.round(costProgress)}%</span>
            </div>
            <Progress value={costProgress} className="h-2 [&>div]:bg-red-500" />
          </div>
        )}
      </div>
      
      {/* Margin */}
      {totalProjectValue > 0 && (
        <>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">Beräknad marginal</span>
            <span className={`font-semibold text-lg ${margin >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(margin)}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
