import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "kr/månad",
    description: "Perfekt för att komma igång",
    features: [
      "3 aktiva projekt",
      "Röstinspelning",
      "Dagrapporter",
      "PDF-export",
      "Email-support"
    ],
    cta: "Kom igång gratis",
    popular: false
  },
  {
    name: "Pro",
    price: "499",
    period: "kr/månad",
    description: "För växande byggföretag",
    features: [
      "Obegränsade projekt",
      "AI-genererade offerter",
      "Egenkontroller",
      "Kundregister",
      "Projektplanering",
      "Prioriterad support",
      "White-label dokument"
    ],
    cta: "Starta 14 dagars provperiod",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Kontakta oss",
    period: "",
    description: "För större organisationer",
    features: [
      "Allt i Pro",
      "Anpassade integrationer",
      "Fortnox/Visma-koppling",
      "Dedikerad kundansvarig",
      "SLA-garanti",
      "Anpassad onboarding"
    ],
    cta: "Kontakta säljteamet",
    popular: false
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Priser
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Enkla, transparenta priser
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Välj den plan som passar ditt företag. Byt eller avbryt när som helst.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg stagger-item ${
                plan.popular 
                  ? "border-primary shadow-lg scale-105 md:scale-110 z-10" 
                  : "border-border/50"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-500" />
              )}
              
              <CardHeader className="text-center pb-4">
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    Populär
                  </Badge>
                )}
                <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Säker betalning med
          </p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <span className="text-sm font-medium">Stripe</span>
            <span className="text-sm font-medium">Visa</span>
            <span className="text-sm font-medium">Mastercard</span>
            <span className="text-sm font-medium">Swish</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
