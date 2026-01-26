import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import byggioLogo from "@/assets/byggio-logo.png";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <div className="relative z-10 container max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till startsidan
          </Link>
          <Link to="/" className="block mb-6">
            <img src={byggioLogo} alt="Byggio" className="h-10" />
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Integritetspolicy
          </h1>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: Januari 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 mt-0">Din data är din</h2>
            <p className="text-muted-foreground mb-0">
              Vi samlar endast in data som behövs för att tjänsten ska fungera. Inget mer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Vad vi sparar</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Kontoinformation (e-post, namn)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Projektdata du själv skapar (rapporter, offerter, planer)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Röstinspelningar transkriberas och raderas sedan inom 24 timmar</span>
              </li>
            </ul>
          </section>

          <section className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 mt-0">Vad vi INTE gör</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Säljer aldrig din data till tredje part</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Använder inte din data för reklam</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Delar inte projektinformation med andra användare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Tränar inte AI-modeller på din specifika projektdata</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Var data lagras</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>All data lagras inom EU (Sverige/Tyskland)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Krypterad överföring med HTTPS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Automatisk säkerhetskopiering dagligen</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Dina rättigheter</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Exportera all din data när som helst (PDF, Excel)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Radera ditt konto och all data permanent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Begär insyn i vilken data vi har om dig</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
