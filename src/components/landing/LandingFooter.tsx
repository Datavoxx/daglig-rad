import { Link } from "react-router-dom";
import byggio from "@/assets/byggio-logo.png";

const legalLinks = [
  { label: "Användarvillkor", href: "/terms" },
  { label: "Integritetspolicy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "GDPR", href: "/gdpr" },
];

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
          {/* Logo and description */}
          <div className="max-w-sm">
            <Link to="/" className="inline-block mb-4">
              <img src={byggio} alt="Byggio" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Byggio digitaliserar svenska byggföretag med AI-driven dokumentation 
              och projekthantering.
            </p>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm">
              Juridiskt
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Byggio. Alla rättigheter förbehållna.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
