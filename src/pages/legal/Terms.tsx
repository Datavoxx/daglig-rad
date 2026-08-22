import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import byggioLogo from "@/assets/byggio-logo.png";

export default function Terms() {
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
            Användarvillkor
          </h1>
          <p className="text-sm text-muted-foreground">
            Senast uppdaterad: Januari 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Välkommen till Byggio</h2>
            <p className="text-muted-foreground leading-relaxed">
              När du använder Byggio godkänner du dessa villkor. Vi har försökt hålla dem enkla och tydliga.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Ditt konto</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Du får endast använda tjänsten för lagliga ändamål</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Ett konto per person eller företag</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Vad du får göra</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Skapa och hantera byggprojekt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Dokumentera arbete med text och röst</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Exportera din data när som helst</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Vad vi förbehåller oss</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Rätten att uppdatera tjänsten för att förbättra den</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Rätten att stänga konton som bryter mot villkoren</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Att ändra dessa villkor med 30 dagars varsel via e-post</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Ansvarsbegränsning</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>Byggio är ett verktyg – du ansvarar för att verifiera all information innan den används professionellt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">─</span>
                <span>AI-genererat innehåll ska alltid granskas av dig innan det används</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
