import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  FileText,
  CalendarDays,
  Calculator,
  Users,
  Download,
  Mic,
  Sparkles,
  FileDown,
  FolderKanban,
  PenLine,
  Lightbulb,
  Play,
  ArrowRight,
  HelpCircle,
  ChevronRight,
  Clock,
  ClipboardCheck,
  Landmark,
  QrCode,
  Receipt,
  MessageSquare,
  Search,
} from "lucide-react";
import { generateGuidePdf } from "@/lib/generateGuidePdf";
import { toast } from "sonner";


export default function Guide() {
  const navigate = useNavigate();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await generateGuidePdf();
      toast.success("PDF nedladdad");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Kunde inte generera PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="page-transition max-w-4xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-4 pb-6 border-b">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Kom igång med Byggio
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Din kompletta guide till effektiv projekthantering för byggbranschen
        </p>
      </div>

      {/* Quick Start Steps */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Play className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Snabbstart</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/estimates")}
          >
            <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              1
            </div>
            <CardContent className="pt-14 pb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Skapa en offert
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Börja med att skapa en offert. Använd mallar eller bygg från grunden med AI-stöd.
              </p>
              <Button variant="link" className="p-0 h-auto text-primary" onClick={(e) => { e.stopPropagation(); navigate("/estimates"); }}>
                Skapa din första offert <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            <CardContent className="pt-14 pb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                Konvertera till projekt
              </h3>
              <p className="text-sm text-muted-foreground">
                När offerten är godkänd, konvertera den till ett aktivt projekt med ett klick.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/projects")}
          >
            <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
              3
            </div>
            <CardContent className="pt-14 pb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                Dokumentera arbetet
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Använd arbetsdagboken för att logga det dagliga arbetet, ÄTA och avvikelser.
              </p>
              <Button variant="link" className="p-0 h-auto text-primary" onClick={(e) => { e.stopPropagation(); navigate("/projects"); }}>
                Gå till projekt <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Guides */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Funktionsguider</h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {/* Projects */}
          <AccordionItem value="projects" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Projekt – Hela arbetsflödet</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Dagbok, planering, ÄTA och arbetsorder
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Projekt är hjärtat i Byggio. Här samlas all information om dina aktiva jobb – från offert till slutbesiktning. Allt du behöver finns samlat i projektets flikar.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Mic className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Arbetsdagbok</p>
                      <p className="text-xs text-muted-foreground">
                        Spela in dagrapporter direkt från byggplatsen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Planering & Tidslinje</p>
                      <p className="text-xs text-muted-foreground">
                        Skapa visuella Gantt-tidslinjer för projektet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">ÄTA-hantering</p>
                      <p className="text-xs text-muted-foreground">
                        Dokumentera och spåra alla ändringsarbeten
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileDown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Arbetsorder & Filer</p>
                      <p className="text-xs text-muted-foreground">
                        Skapa order och hantera projektdokument
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/projects")} className="gap-2">
                  Gå till projekt <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Estimates */}
          <AccordionItem value="estimates" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Offerter & Kalkyler</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Skapa professionella offerter snabbt
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Skapa detaljerade offerter med hjälp av mallar och AI. Beskriv arbetet med röst eller text så beräknas tid och kostnad automatiskt.
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b">
                    <p className="font-medium text-sm">Exempelflöde</p>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">1</Badge>
                      <span>Välj en mall (t.ex. "Badrumsrenovering")</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">2</Badge>
                      <span>Beskriv mängder: "8 kvm golv, 20 kvm vägg"</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">3</Badge>
                      <span>AI beräknar tid och kostnad automatiskt</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="shrink-0">4</Badge>
                      <span>Justera påslag och exportera som PDF</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/estimates")} className="gap-2">
                  Skapa offert <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Time Reporting */}
          <AccordionItem value="time-reporting" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Tidsrapportering</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Rapportera arbetstid per projekt och anställd
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Rapportera arbetstid per projekt och anställd. Månads- och veckovyer, attestering och periodhantering.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Kalendervyer</p>
                      <p className="text-xs text-muted-foreground">Månads- och veckoöversikt</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Tidsregistrering per projekt</p>
                      <p className="text-xs text-muted-foreground">Koppla tid till rätt projekt</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Attestering</p>
                      <p className="text-xs text-muted-foreground">Godkänn tidposter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileDown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Periodlåsning</p>
                      <p className="text-xs text-muted-foreground">Lås avslutade perioder</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/time-reporting")} className="gap-2">
                  Gå till tidsrapportering <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Daily Reports */}
          <AccordionItem value="daily-reports" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Dagrapporter</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Dokumentera arbetsdagen med röstinspelning
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Dokumentera arbetsdagen med röstinspelning. AI strukturerar rapporten automatiskt med arbetsmoment, personal och avvikelser.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Mic className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Röstinspelning från fältet</p>
                      <p className="text-xs text-muted-foreground">Spela in direkt på byggplatsen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">AI-strukturerad dokumentation</p>
                      <p className="text-xs text-muted-foreground">Automatisk kategorisering</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FolderKanban className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Koppla till projekt</p>
                      <p className="text-xs text-muted-foreground">Samla rapporter per projekt</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileDown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Exportera som PDF</p>
                      <p className="text-xs text-muted-foreground">Professionell dokumentation</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/daily-reports")} className="gap-2">
                  Gå till dagrapporter <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Attendance */}
          <AccordionItem value="attendance" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Personalliggare / Närvaro</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Digital personalliggare med QR-kodincheckning
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Digital personalliggare med QR-kodincheckning. Se vilka som är på plats i realtid.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <QrCode className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">QR-kodscanning</p>
                      <p className="text-xs text-muted-foreground">Snabb in- och utcheckning</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Realtidsöversikt</p>
                      <p className="text-xs text-muted-foreground">Se aktiva på plats just nu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Närvarohistorik</p>
                      <p className="text-xs text-muted-foreground">Fullständig logg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Skatteverks-kompatibel</p>
                      <p className="text-xs text-muted-foreground">Uppfyller lagkrav</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/attendance")} className="gap-2">
                  Gå till personalliggare <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Invoices */}
          <AccordionItem value="invoices" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Fakturor</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Kund- och leverantörsfakturor
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Hantera kund- och leverantörsfakturor. Skapa fakturor, scanna kvitton och exportera.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Kundfakturor</p>
                      <p className="text-xs text-muted-foreground">Skapa och skicka fakturor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Landmark className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Leverantörsfakturor</p>
                      <p className="text-xs text-muted-foreground">Registrera inkommande fakturor</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Receipt className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Kvittoscanning</p>
                      <p className="text-xs text-muted-foreground">Fotografera och spara kvitton</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <FileDown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">PDF-export</p>
                      <p className="text-xs text-muted-foreground">Professionella faktura-PDF:er</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/invoices")} className="gap-2">
                  Gå till fakturor <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Customers */}
          <AccordionItem value="customers" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Kundhantering</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Håll koll på dina kunder
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Samla all kundinformation på ett ställe. Lägg till kontaktuppgifter, adresser och anteckningar för att hålla ordning på dina kundrelationer.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Kontaktuppgifter</Badge>
                  <Badge variant="outline">Adresser</Badge>
                  <Badge variant="outline">Organisationsnummer</Badge>
                  <Badge variant="outline">Anteckningar</Badge>
                  <Badge variant="outline">Koppling till projekt</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/customers")} className="gap-2">
                  Hantera kunder <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* AI Assistant */}
          <AccordionItem value="ai-assistant" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">AI-assistenten (Byggio AI)</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    Skapa och hantera med röst eller text
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Fråga Byggio AI vad som helst. Skapa projekt, offerter, tidrapporter och mer med röst eller text.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Mic className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Röststyrning</p>
                      <p className="text-xs text-muted-foreground">Prata med AI:n</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Skapa poster via chat</p>
                      <p className="text-xs text-muted-foreground">Projekt, offerter, kunder m.m.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Search className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Sök och analysera data</p>
                      <p className="text-xs text-muted-foreground">Hitta information snabbt</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Intelligent hjälp</p>
                      <p className="text-xs text-muted-foreground">Kontextmedveten assistans</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/global-assistant")} className="gap-2">
                  Öppna AI-assistenten <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Tips Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Tips för bästa resultat</h2>
        </div>

        <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/30">
          <CardContent className="pt-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <strong>Använd röstinspelning</strong> – snabbaste sättet att dokumentera från fältet
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <strong>Granska AI-genererat innehåll</strong> innan du sparar eller skickar
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <strong>Skapa egna mallar</strong> för arbetsmoment du ofta återkommer till
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <strong>Dokumentera ÄTA direkt</strong> – det sparar tid vid fakturering
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  <strong>Exportera viktiga dokument</strong> som PDF för säker arkivering
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Vanliga frågor</h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          <AccordionItem value="faq-1" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              Kan jag använda Byggio på mobilen?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Ja! Byggio är optimerat för mobil användning. Du kan enkelt dokumentera arbete, 
              skapa rapporter och hantera projekt direkt från din telefon ute på byggplatsen.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              Hur fungerar AI-funktionerna?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              AI hjälper dig att strukturera information automatiskt. När du spelar in eller 
              skriver text analyserar AI innehållet och organiserar det i rätt fält. Du kan 
              alltid redigera och justera resultatet innan du sparar.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              Kan jag exportera mina dokument?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Ja, alla dokument kan exporteras som professionella PDF-filer. Detta inkluderar 
              offerter, dagrapporter, projektplaner och ÄTA-dokument. PDF:erna inkluderar 
              automatiskt din företagslogga och kontaktuppgifter.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              Hur lägger jag till min företagslogga?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Gå till Inställningar och välj Företagsprofil. Där kan du ladda upp din logga 
              som sedan visas automatiskt i alla PDF-exporter och i applikationen.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Download PDF Button */}
      <div className="flex justify-center pt-6 pb-4 border-t">
        <Button 
          size="lg" 
          onClick={handleDownloadPdf} 
          disabled={downloadingPdf}
          className="gap-2"
        >
          <Download className="h-5 w-5" />
          {downloadingPdf ? "Genererar..." : "Ladda ner som PDF"}
        </Button>
      </div>
    </div>
  );
}
