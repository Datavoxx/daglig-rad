import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import byggioLogo from "@/assets/byggio-logo.png";

export default function GDPR() {
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
            GDPR
          </h1>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: Januari 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 mt-0">Dina rättigheter enligt GDPR</h2>
            <p className="text-muted-foreground mb-0">
              Som användare i EU har du starka rättigheter över din personliga data. Här förklarar vi hur du kan utöva dem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rätt till insyn</h2>
            <p className="text-muted-foreground mb-3">
              Du har rätt att veta exakt vilken data vi har om dig.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Begär en komplett kopia av all din data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Kontakta oss via appen för att göra en begäran</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Vi svarar inom 30 dagar</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rätt till radering</h2>
            <p className="text-muted-foreground mb-3">
              Du kan när som helst radera all din data.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Radera ditt konto direkt i inställningarna</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>All data raderas permanent inom 30 dagar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Säkerhetskopior rensas automatiskt</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rätt till dataportabilitet</h2>
            <p className="text-muted-foreground mb-3">
              Du kan ta med dig din data om du vill byta tjänst.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Exportera alla projekt som PDF</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Exportera kunddata som Excel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Kontakta oss för fullständig dataexport i maskinläsbart format</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Rättslig grund för behandling</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded mt-0.5">Avtal</span>
                <span>Vi behandlar din data för att leverera tjänsten du betalar för</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded mt-0.5">Berättigat intresse</span>
                <span>Säkerhet, missbruksförebyggande och förbättring av tjänsten</span>
              </li>
            </ul>
          </section>

          <section className="bg-muted/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 mt-0">Kontakta oss</h2>
            <p className="text-muted-foreground mb-0">
              För GDPR-relaterade frågor eller förfrågningar, kontakta oss genom att logga in och använda kontaktformuläret 
              i inställningarna. Vi svarar inom 30 dagar enligt GDPR:s krav.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
