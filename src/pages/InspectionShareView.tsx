import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Minus, Building2, Calendar, User, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Checkpoint {
  id: string;
  text: string;
  required: boolean;
  result: "ok" | "deviation" | "na" | null;
  comment: string;
}

export default function InspectionShareView() {
  const { token } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-inspection", token],
    queryFn: async () => {
      // First get the share link
      const { data: shareLink, error: linkError } = await supabase
        .from("inspection_share_links")
        .select("*, inspections(*, projects(name, client_name))")
        .eq("token", token)
        .maybeSingle();

      if (linkError) throw linkError;
      if (!shareLink) throw new Error("Länken hittades inte eller har gått ut");

      // Check if expired
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        throw new Error("Denna delningslänk har gått ut");
      }

      return shareLink.inspections;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Kunde inte ladda egenkontrollen</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Ett fel uppstod"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspection = data as any;
  const checkpoints = inspection.checkpoints as Checkpoint[];
  const completedCount = checkpoints.filter((cp) => cp.result !== null).length;
  const deviationCount = checkpoints.filter((cp) => cp.result === "deviation").length;
  const okCount = checkpoints.filter((cp) => cp.result === "ok").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Utkast</Badge>;
      case "completed":
        return <Badge variant="default">Slutförd</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Godkänd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            {inspection.template_category}
          </Badge>
          <h1 className="text-3xl font-bold">{inspection.template_name}</h1>
          <div className="flex items-center justify-center gap-6 mt-4 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {inspection.projects?.name}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(inspection.inspection_date), "d MMMM yyyy", { locale: sv })}
            </span>
            {inspection.inspector_name && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {inspection.inspector_name}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{checkpoints.length}</div>
              <p className="text-sm text-muted-foreground">Kontrollpunkter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{okCount}</div>
              <p className="text-sm text-muted-foreground">Godkända</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-red-600">{deviationCount}</div>
              <p className="text-sm text-muted-foreground">Avvikelser</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              {getStatusBadge(inspection.status)}
              <p className="text-sm text-muted-foreground mt-2">Status</p>
            </CardContent>
          </Card>
        </div>

        {(inspection.inspector_name || inspection.inspector_company || inspection.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inspection.inspector_name && (
                <div>
                  <span className="text-sm text-muted-foreground">Kontrollant:</span>
                  <span className="ml-2">{inspection.inspector_name}</span>
                </div>
              )}
              {inspection.inspector_company && (
                <div>
                  <span className="text-sm text-muted-foreground">Företag:</span>
                  <span className="ml-2">{inspection.inspector_company}</span>
                </div>
              )}
              {inspection.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Anteckningar:</span>
                  <p className="mt-1 bg-muted p-3 rounded">{inspection.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Kontrollpunkter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checkpoints.map((checkpoint, index) => (
                <div
                  key={checkpoint.id}
                  className={`p-4 rounded-lg border ${
                    checkpoint.result === "deviation"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                      : checkpoint.result === "ok"
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className={checkpoint.required ? "font-medium" : ""}>
                          {checkpoint.text}
                        </span>
                        {checkpoint.required && (
                          <Badge variant="secondary" className="text-xs">
                            Obligatorisk
                          </Badge>
                        )}
                      </div>
                      {checkpoint.comment && (
                        <p className="mt-2 text-sm text-muted-foreground bg-background p-2 rounded">
                          {checkpoint.comment}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {checkpoint.result === "ok" && (
                        <Badge className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      )}
                      {checkpoint.result === "deviation" && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Avvikelse
                        </Badge>
                      )}
                      {checkpoint.result === "na" && (
                        <Badge variant="secondary">
                          <Minus className="h-3 w-3 mr-1" />
                          Ej tillämplig
                        </Badge>
                      )}
                      {checkpoint.result === null && (
                        <Badge variant="outline">Ej ifylld</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Denna egenkontroll delades via en säker länk</p>
        </div>
      </div>
    </div>
  );
}
