import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import byggioLogo from "@/assets/byggio-logo.png";

export default function Cookies() {
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
            Cookies
          </h1>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: Januari 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 mt-0">Minimal användning</h2>
            <p className="text-muted-foreground mb-0">
              Vi använder endast nödvändiga cookies för att tjänsten ska fungera. Inga spårningscookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Vad vi använder</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded mt-0.5">Nödvändig</span>
                <div>
                  <span className="font-medium text-foreground">Sessionscookie</span>
                  <p className="text-sm mt-1">Håller dig inloggad medan du använder tjänsten</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded mt-0.5">Nödvändig</span>
                <div>
                  <span className="font-medium text-foreground">Preferenscookie</span>
                  <p className="text-sm mt-1">Sparar ditt val av ljust eller mörkt tema</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 mt-0">Vad vi INTE använder</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Spårningscookies (Google Analytics, Facebook Pixel, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Annonscookies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✕</span>
                <span>Tredjepartscookies för marknadsföring</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Blockera cookies</h2>
            <p className="text-muted-foreground">
              Du kan blockera alla cookies i din webbläsares inställningar. Observera att om du blockerar 
              våra nödvändiga cookies kommer inloggningen inte att fungera.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
