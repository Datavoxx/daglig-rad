import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode, Printer, Copy, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
  projects: Array<{ id: string; name: string; address?: string | null; city?: string | null }>;
}

export function QRCodeGenerator({ projects }: QRCodeGeneratorProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch existing token for selected project
  const { data: existingToken, isLoading: tokenLoading } = useQuery({
    queryKey: ["attendance-qr-token", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data, error } = await supabase
        .from("attendance_qr_tokens")
        .select("*")
        .eq("project_id", selectedProjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      // Delete existing token if any
      await supabase
        .from("attendance_qr_tokens")
        .delete()
        .eq("project_id", projectId);

      // Create new token
      const { data, error } = await supabase
        .from("attendance_qr_tokens")
        .insert({
          project_id: projectId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-qr-token", selectedProjectId] });
      toast.success("QR-kod skapad!");
    },
    onError: (error) => {
      toast.error("Kunde inte skapa QR-kod: " + error.message);
    },
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  
  const getScanUrl = () => {
    if (!existingToken || !selectedProjectId) return "";
    // Använd produktions-URL för QR-koder (egen domän)
    const baseUrl = "https://datavoxx.se";
    return `${baseUrl}/attendance/scan/${selectedProjectId}/${existingToken.token}`;
  };

  const handleCopyLink = async () => {
    const url = getScanUrl();
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Länk kopierad!");
    } catch {
      toast.error("Kunde inte kopiera länk");
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-kod - ${selectedProject?.name || "Personalliggare"}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .print-container {
              text-align: center;
              border: 2px solid #000;
              padding: 40px;
              max-width: 400px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .project-name {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .address {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .instruction {
              font-size: 16px;
              margin-top: 20px;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          QR-kod för incheckning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project selector */}
        <div className="flex gap-2">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Välj projekt..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedProjectId && !existingToken && (
            <Button
              onClick={() => createTokenMutation.mutate(selectedProjectId)}
              disabled={createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Skapa QR-kod"
              )}
            </Button>
          )}
        </div>

        {/* QR Code display */}
        {selectedProjectId && tokenLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {existingToken && selectedProject && (
          <>
            {/* Printable content */}
            <div
              ref={printRef}
              className="border rounded-lg p-6 bg-card flex flex-col items-center"
            >
              <div className="print-container">
                <div className="title">PERSONALLIGGARE</div>
                <div className="project-name">{selectedProject.name}</div>
                {(selectedProject.address || selectedProject.city) && (
                  <div className="address">
                    {[selectedProject.address, selectedProject.city].filter(Boolean).join(", ")}
                  </div>
                )}
                <QRCodeSVG
                  value={getScanUrl()}
                  size={200}
                  level="M"
                  includeMargin
                />
                <div className="instruction">Skanna för att checka in/ut</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Skriv ut
              </Button>
              <Button variant="outline" onClick={handleCopyLink} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Kopiera länk
              </Button>
              <Button
                variant="outline"
                onClick={() => createTokenMutation.mutate(selectedProjectId)}
                disabled={createTokenMutation.isPending}
                className="flex-1"
              >
                {createTokenMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Ny kod
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Att skapa en ny kod ogiltigförklarar den gamla
            </p>
          </>
        )}

        {selectedProjectId && !tokenLoading && !existingToken && (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Klicka "Skapa QR-kod" för att generera en kod för detta projekt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
