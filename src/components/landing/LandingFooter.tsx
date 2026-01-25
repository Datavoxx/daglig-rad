import { Link } from "react-router-dom";
import byggio from "@/assets/byggio-logo.png";

const footerLinks = {
  product: {
    title: "Produkt",
    links: [
      { label: "Funktioner", href: "#features" },
      { label: "Priser", href: "#pricing" },
      { label: "Hur det fungerar", href: "#how-it-works" },
      { label: "Integrationer", href: "#" },
    ]
  },
  company: {
    title: "Företag",
    links: [
      { label: "Om oss", href: "#" },
      { label: "Kontakt", href: "#" },
      { label: "Karriär", href: "#" },
      { label: "Press", href: "#" },
    ]
  },
  resources: {
    title: "Resurser",
    links: [
      { label: "Hjälpcenter", href: "#" },
      { label: "Dokumentation", href: "#" },
      { label: "Blogg", href: "#" },
      { label: "API", href: "#" },
    ]
  },
  legal: {
    title: "Juridiskt",
    links: [
      { label: "Användarvillkor", href: "#" },
      { label: "Integritetspolicy", href: "#" },
      { label: "Cookies", href: "#" },
      { label: "GDPR", href: "#" },
    ]
  }
};

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={byggio} alt="Byggio" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Byggio digitaliserar svenska byggföretag med AI-driven dokumentation 
              och projekthantering.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Datavoxx AB</p>
              <p>Stockholm, Sverige</p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-foreground mb-4 text-sm">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Byggio by Datavoxx AB. Alla rättigheter förbehållna.
          </p>
          
          {/* Social links (placeholder) */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
