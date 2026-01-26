import { Badge } from "@/components/ui/badge";
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";

const IntegrationsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            Kommande
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Kraftfulla integrationer
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Snart kan du koppla Byggio till ditt bokföringssystem för smidig ekonomihantering
          </p>
        </div>

        {/* Integration cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Fortnox */}
          <div className="group relative bg-card rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-[#3B8230]/50 hover:shadow-lg hover:shadow-[#3B8230]/5">
            <div className="h-16 mb-6 flex items-center">
              <img 
                src={fortnoxLogo} 
                alt="Fortnox" 
                className="h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fortnox</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Synka fakturor, kunder och projekt automatiskt. Exportera godkända offerter direkt till Fortnox.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                Automatisk fakturaexport
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                Synkade kundregister
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B8230]" />
                Projektredovisning
              </li>
            </ul>
          </div>

          {/* Visma */}
          <div className="group relative bg-card rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:border-[#E31937]/50 hover:shadow-lg hover:shadow-[#E31937]/5">
            <div className="h-16 mb-6 flex items-center">
              <img 
                src={vismaLogo} 
                alt="Visma" 
                className="h-10 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visma</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Koppla ihop med Visma eEkonomi eller Visma.net för sömlös bokföring och rapportering.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                Realtidssynkronisering
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                Automatisk bokföring
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E31937]" />
                Ekonomiska rapporter
              </li>
            </ul>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Fler integrationer planeras – kontakta oss om du har önskemål
        </p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
