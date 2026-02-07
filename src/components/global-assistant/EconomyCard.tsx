import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Receipt, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EconomyCardProps {
  content: string;
  data: {
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
  };
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("sv-SE") + " kr";
}

export function EconomyCard({ content, data }: EconomyCardProps) {
  const budget = data.budget || 0;
  const estimateTotal = data.estimate_total || 0;
  const invoiced = data.invoiced_amount || 0;
  const paid = data.paid_amount || 0;
  
  // Calculate invoice progress
  const invoiceProgress = estimateTotal > 0 ? (invoiced / estimateTotal) * 100 : 0;
  const paymentProgress = invoiced > 0 ? (paid / invoiced) * 100 : 0;

  return (
    <Card className="p-4 space-y-4">
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
      </div>
    </Card>
  );
}
