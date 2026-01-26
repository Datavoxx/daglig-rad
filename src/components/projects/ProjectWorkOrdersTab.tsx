import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ClipboardList, FileText, Package, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateWorkOrderPdf } from "@/lib/generateWorkOrderPdf";

interface ProjectWorkOrdersTabProps {
  projectId: string;
  projectName: string;
  estimateId?: string | null;
}

interface EstimateItem {
  id: string;
  quantity: number | null;
  unit: string | null;
  article: string | null;
  moment: string;
  description: string | null;
  type: string;
  hours: number | null;
}

interface EstimateData {
  id: string;
  offer_number: string | null;
  manual_client_name: string | null;
  manual_address: string | null;
  manual_postal_code: string | null;
  manual_city: string | null;
}

export default function ProjectWorkOrdersTab({ projectId, projectName, estimateId }: ProjectWorkOrdersTabProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  // Fetch estimate metadata
  const { data: estimate, isLoading: loadingEstimate } = useQuery({
    queryKey: ['estimate-for-workorder', estimateId],
    queryFn: async () => {
      if (!estimateId) return null;
      const { data, error } = await supabase
        .from('project_estimates')
        .select('id, offer_number, manual_client_name, manual_address, manual_postal_code, manual_city')
        .eq('id', estimateId)
        .maybeSingle();
      if (error) throw error;
      return data as EstimateData | null;
    },
    enabled: !!estimateId
  });

  // Fetch estimate items
  const { data: estimateItems, isLoading: loadingItems } = useQuery({
    queryKey: ['estimate-items-for-workorder', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_items')
        .select('id, quantity, unit, article, moment, description, type, hours')
        .eq('estimate_id', estimateId)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as EstimateItem[];
    },
    enabled: !!estimateId
  });

  // Fetch project data for PDF
  const { data: projectData } = useQuery({
    queryKey: ['project-for-workorder', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('client_name, address, postal_code, city, start_date')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const handleDownloadPdf = async () => {
    if (!estimate) return;
    
    setDownloading(true);
    try {
      await generateWorkOrderPdf({
        orderNumber: estimate.offer_number || 'AO',
        projectName,
        title: `Arbetsorder för ${projectName}`,
        description: '',
        assignedTo: '',
        dueDate: null,
        status: 'pending',
        clientName: projectData?.client_name || estimate.manual_client_name || undefined,
        address: projectData?.address || estimate.manual_address || undefined,
        postalCode: projectData?.postal_code || estimate.manual_postal_code || undefined,
        city: projectData?.city || estimate.manual_city || undefined,
        startDate: projectData?.start_date || undefined,
        estimateItems: estimateItems?.map(item => ({
          quantity: item.quantity,
          unit: item.unit,
          article: item.article,
          moment: item.moment
        })) || []
      });
      toast({ title: "PDF genererad" });
    } catch (error) {
      toast({ title: "Kunde inte generera PDF", variant: "destructive" });
    }
    setDownloading(false);
  };

  const isLoading = loadingEstimate || loadingItems;

  // No estimate linked
  if (!estimateId) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">Ingen offert kopplad</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Koppla en offert i Översikt-fliken för att se arbetsmoment och generera arbetsorder.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const workItems = estimateItems?.filter(item => item.type === 'labor') || [];
  const materialItems = estimateItems?.filter(item => item.type === 'material') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Arbetsorder</h3>
          <p className="text-sm text-muted-foreground">
            Baserat på offert {estimate?.offer_number || 'N/A'}
          </p>
        </div>
        <Button onClick={handleDownloadPdf} disabled={downloading || !estimate}>
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Genererar...' : 'Ladda ner PDF'}
        </Button>
      </div>

      {/* Work items section */}
      {workItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Arbetsmoment
              <Badge variant="secondary" className="ml-auto">{workItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {workItems.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="text-sm text-muted-foreground min-w-[80px]">
                      {item.hours || item.quantity || '-'} {item.unit || 'tim'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.moment}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {item.article && (
                      <Badge variant="outline" className="text-xs">{item.article}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material items section */}
      {materialItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Material
              <Badge variant="secondary" className="ml-auto">{materialItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {materialItems.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="text-sm text-muted-foreground min-w-[80px]">
                      {item.quantity || '-'} {item.unit || 'st'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.moment}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {item.article && (
                      <Badge variant="outline" className="text-xs">{item.article}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state if no items */}
      {workItems.length === 0 && materialItems.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium">Inga moment i offerten</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Lägg till arbetsmoment i offerten för att se dem här.
          </p>
        </Card>
      )}
    </div>
  );
}
