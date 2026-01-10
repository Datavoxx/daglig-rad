import { Link } from "react-router-dom";
import { FileText, CalendarDays, ClipboardCheck, Calculator, ArrowRight, Download } from "lucide-react";
import { generateGuidePdf } from "@/lib/generateGuidePdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import byggioLogo from "@/assets/byggio-logo.png";

const features = [
  {
    icon: FileText,
    title: "Dagrapporter",
    description: "Dokumentera arbetsdagen enkelt med röstinspelning. Spela in vad som gjorts, vilka som var på plats och eventuella avvikelser.",
  },
  {
    icon: CalendarDays,
    title: "Planering",
    description: "Skapa projektplaner med faser och milstolpar. Visualisera tidslinjen och dela med ditt team.",
  },
  {
    icon: ClipboardCheck,
    title: "Egenkontroller",
    description: "Genomför standardiserade kontroller med färdiga mallar. Dokumentera och signera direkt i appen.",
  },
  {
    icon: Calculator,
    title: "Kalkyler",
    description: "Skapa detaljerade kostnadskalkyler med arbete, material och underentreprenörer. Generera professionella offerter.",
  },
];

export default function GuidePublic() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/auth" className="inline-block mb-6">
            <img src={byggioLogo} alt="Byggio" className="h-14 mx-auto" />
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Förstå Byggio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Byggio är en digital plattform för byggprojekt som gör det enkelt att dokumentera, 
            planera och kalkylera – direkt från mobilen eller datorn.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PDF Download */}
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => generateGuidePdf()}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Ladda ner guide som PDF
          </Button>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="inline-block border-border/50 bg-card/80 backdrop-blur-sm px-8 py-6">
            <p className="text-muted-foreground mb-4">
              Redo att digitalisera dina byggprojekt?
            </p>
            <Button asChild size="lg">
              <Link to="/auth" className="gap-2">
                Kom igång gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
