import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EstimateTable, type EstimateItem } from "@/components/estimates/EstimateTable";
import { EstimateTotals } from "@/components/estimates/EstimateTotals";
import { EstimateSkeleton } from "@/components/skeletons/EstimateSkeleton";
import { generateEstimatePdf } from "@/lib/generateEstimatePdf";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function EstimateShareView() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-estimate", token],
    queryFn: async () => {
      // Get share link
      const { data: shareLink, error: shareLinkError } = await supabase
        .from("estimate_share_links")
        .select("estimate_id, expires_at")
        .eq("token", token)
        .single();

      if (shareLinkError) throw new Error("Delningslänken hittades inte");

      // Check expiry
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        throw new Error("Delningslänken har gått ut");
      }

      // Get estimate
      const { data: estimate, error: estimateError } = await supabase
        .from("project_estimates")
        .select("*, projects(name)")
        .eq("id", shareLink.estimate_id)
        .single();

      if (estimateError) throw new Error("Kalkylen hittades inte");

      // Get items
      const { data: items, error: itemsError } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", shareLink.estimate_id)
        .order("sort_order", { ascending: true });

      if (itemsError) throw itemsError;

      return { ...estimate, items: items || [] };
    },
    enabled: !!token,
  });

  const handleDownloadPdf = async () => {
    if (!data) return;

    try {
      await generateEstimatePdf({
        projectName: (data.projects as any)?.name || "Projekt",
        scope: data.scope || "",
        assumptions: (data.assumptions as string[]) || [],
        uncertainties: (data.uncertainties as string[]) || [],
        items: data.items.map((item: any) => ({
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
          comment: item.comment || "",
          uncertainty: item.uncertainty || "medium",
        })),
        markupPercent: Number(data.markup_percent) || 15,
        version: data.version,
      });
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <EstimateSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Kunde inte ladda kalkylen</h3>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Ett fel uppstod"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectName = (data.projects as any)?.name || "Projekt";
  const assumptions = (data.assumptions as string[]) || [];
  const uncertainties = (data.uncertainties as string[]) || [];
  const items: EstimateItem[] = data.items.map((item: any) => ({
    id: item.id,
    moment: item.moment,
    type: item.type,
    quantity: item.quantity,
    unit: item.unit,
    hours: item.hours,
    unit_price: Number(item.unit_price) || 0,
    subtotal: Number(item.subtotal) || 0,
    comment: item.comment || "",
    uncertainty: item.uncertainty || "medium",
    sort_order: item.sort_order,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">{projectName}</h1>
              <p className="text-sm text-muted-foreground">
                Kalkyl{data.version ? ` v${data.version}` : ""} •{" "}
                {format(new Date(data.created_at), "d MMMM yyyy", { locale: sv })}
              </p>
            </div>
          </div>
          <Button onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Ladda ner PDF
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Summary */}
        {(data.scope || assumptions.length > 0 || uncertainties.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sammanfattning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.scope && <p className="text-muted-foreground">{data.scope}</p>}

              {assumptions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Antaganden
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assumptions.map((assumption, index) => (
                      <Badge key={index} variant="secondary">
                        {assumption}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {uncertainties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Osäkerheter
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uncertainties.map((uncertainty, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-amber-300 text-amber-700 bg-amber-50"
                      >
                        {uncertainty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estimate table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kalkylposter</CardTitle>
          </CardHeader>
          <CardContent>
            <EstimateTable items={items} onItemsChange={() => {}} readOnly />
          </CardContent>
        </Card>

        {/* Totals */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2" />
          <EstimateTotals
            items={items}
            markupPercent={Number(data.markup_percent) || 15}
            onMarkupChange={() => {}}
            readOnly
          />
        </div>
      </main>
    </div>
  );
}
