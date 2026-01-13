import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  CalendarDays,
  ClipboardCheck,
  Calculator,
  Download,
  Mic,
  Sparkles,
  FileDown,
} from "lucide-react";
import { generateGuidePdf } from "@/lib/generateGuidePdf";
import { toast } from "sonner";

export default function Guide() {
  const handleDownloadPdf = () => {
    try {
      generateGuidePdf();
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    }
  };

  return (
    <div className="page-transition p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Guide</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Lär dig hur du använder Byggio för att effektivisera dina byggprojekt.
        </p>
      </div>

      {/* Dagrapporter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Dagrapporter</CardTitle>
              <CardDescription>Dokumentera det dagliga arbetet på byggplatsen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Dagrapporter är kärnan i projektdokumentationen. Varje rapport innehåller information om 
            bemanning, utfört arbete, avvikelser, ÄTA och materialleveranser.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Mic className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Röstinspelning</p>
                <p className="text-xs text-muted-foreground">Prata in din rapport direkt från byggplatsen</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI-strukturering</p>
                <p className="text-xs text-muted-foreground">AI organiserar informationen automatiskt</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <FileDown className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">PDF-export</p>
                <p className="text-xs text-muted-foreground">Exportera rapporter för arkivering</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Avvikelser & ÄTA</p>
                <p className="text-xs text-muted-foreground">Dokumentera och spåra alla ändringar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planering */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Planering</CardTitle>
              <CardDescription>Skapa visuella tidsplaner för dina projekt</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Planeringsfunktionen hjälper dig att skapa en grov tidsplan för projektet. Beskriv projektets 
            faser med röst eller text, så genererar AI en visuell Gantt-tidslinje.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-sm">Så här fungerar det:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Välj ett projekt från listan</li>
              <li>Beskriv projektets faser och tidsramar</li>
              <li>AI skapar en visuell tidslinje</li>
              <li>Redigera och justera efter behov</li>
              <li>Exportera som PDF för att dela med teamet</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Egenkontroller */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Egenkontroller</CardTitle>
              <CardDescription>Säkerställ kvaliteten i dina byggprojekt</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Egenkontroller är systematiska kontroller som säkerställer att arbetet utförs enligt krav 
            och standarder. Använd färdiga mallar eller skapa egna för olika arbetsmoment.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Tätskikt</Badge>
            <Badge variant="outline">Elinstallation</Badge>
            <Badge variant="outline">VVS</Badge>
            <Badge variant="outline">Brandskydd</Badge>
            <Badge variant="outline">Stomme</Badge>
            <Badge variant="outline">Fasad</Badge>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30">
            <p className="text-sm">
              <span className="font-medium">Tips:</span> Varje kontrollpunkt kan markeras som 
              <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs">OK</span>, 
              <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-xs">Avvikelse</span> eller 
              <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">Ej tillämplig</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Offerter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Offerter</CardTitle>
              <CardDescription>Skapa detaljerade kostnadsberäkningar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Offertfunktionen låter dig skapa detaljerade kostnadsberäkningar för dina projekt. 
            Använd mallar med fördefinierade arbetsmoment och timpriser för att snabbt ta fram offerter.
          </p>

          {/* Example template */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b">
              <p className="font-medium text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Exempelmall: Badrumsrenovering
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">WBS</th>
                    <th className="px-4 py-2 font-medium">Moment</th>
                    <th className="px-4 py-2 font-medium">Enhet</th>
                    <th className="px-4 py-2 font-medium">Tim/enh</th>
                    <th className="px-4 py-2 font-medium">Resurs</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">1.0</td>
                    <td className="px-4 py-2">Rivning av befintligt</td>
                    <td className="px-4 py-2 text-muted-foreground">m²</td>
                    <td className="px-4 py-2 text-muted-foreground">0.9</td>
                    <td className="px-4 py-2 text-muted-foreground">Snickare</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">2.0</td>
                    <td className="px-4 py-2">Tätskikt golv</td>
                    <td className="px-4 py-2 text-muted-foreground">m²</td>
                    <td className="px-4 py-2 text-muted-foreground">0.7</td>
                    <td className="px-4 py-2 text-muted-foreground">Snickare</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">3.0</td>
                    <td className="px-4 py-2">Plattsättning golv</td>
                    <td className="px-4 py-2 text-muted-foreground">m²</td>
                    <td className="px-4 py-2 text-muted-foreground">1.2</td>
                    <td className="px-4 py-2 text-muted-foreground">Plattsättare</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">4.0</td>
                    <td className="px-4 py-2">VVS-installation</td>
                    <td className="px-4 py-2 text-muted-foreground">st</td>
                    <td className="px-4 py-2 text-muted-foreground">4.0</td>
                    <td className="px-4 py-2 text-muted-foreground">Rörmokare</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-muted-foreground">5.0</td>
                    <td className="px-4 py-2">El-installation</td>
                    <td className="px-4 py-2 text-muted-foreground">st</td>
                    <td className="px-4 py-2 text-muted-foreground">3.0</td>
                    <td className="px-4 py-2 text-muted-foreground">Elektriker</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Med mallen ovan behöver du bara ange mängderna (t.ex. "8 kvadrat golv, 20 kvadrat vägg"), 
            så beräknar systemet automatiskt tidsåtgång och kostnad.
          </p>
        </CardContent>
      </Card>

      {/* Download button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleDownloadPdf} className="gap-2">
          <Download className="h-5 w-5" />
          Ladda ner PDF
        </Button>
      </div>
    </div>
  );
}
