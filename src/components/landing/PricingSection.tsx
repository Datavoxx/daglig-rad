import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Bygg Smart",
    price: "1899",
    period: "kr/mån",
    description: "För egenföretagare och mindre byggteam",
    features: [
      "Obegränsat antal användare",
      "Upp till 5 aktiva projekt",
      "AI-genererade offerter & ÄTA",
      "Digital dagbok med röstinspelning",
      "Tidrapportering & närvaro",
      "Kundregister & fakturering",
      "PDF-export med ert varumärke",
      "E-postsupport",
    ],
    cta: "Starta provperiod",
    highlighted: false,
  },
  {
    name: "Bygg Pro",
    price: "3299",
    period: "kr/mån",
    description: "För växande byggföretag som vill skala upp",
    features: [
      "Allt i Bygg Smart, plus:",
      "Obegränsat antal projekt",
      "Avancerad projektplanering (Gantt)",
      "Löneexport till Visma & Fortnox",
      "Kvitto- & leverantörsfakturahantering",
      "Byggio AI-assistent obegränsat",
      "White-label på alla dokument",
      "Egna offertmallar & artikelbibliotek",
      "Prioriterad support & onboarding",
    ],
    cta: "Starta provperiod",
    highlighted: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Priser
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Enkla, transparenta priser
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Välj den plan som passar ditt företag. Inga bindningstider — säg upp när du vill.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col transition-all duration-300 hover:-translate-y-1",
                  plan.highlighted
                    ? "border-primary/40 shadow-xl shadow-primary/10 bg-gradient-to-b from-primary/5 to-transparent"
                    : "border-border/50 hover:shadow-lg"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                      <Sparkles className="h-3 w-3" />
                      Mest populär
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[3rem] px-2">
                    {plan.description}
                  </CardDescription>
                  <div className="pt-6 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">exkl. moms</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => {
                      const isHeader = feature.startsWith("Allt i");
                      return (
                        <li
                          key={feature}
                          className={cn(
                            "flex items-start gap-3 text-sm",
                            isHeader && "font-medium text-foreground pb-1"
                          )}
                        >
                          {!isHeader && (
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                            </span>
                          )}
                          <span className={cn(!isHeader && "text-muted-foreground")}>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            14 dagars gratis provperiod · Inget kreditkort krävs
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
