

## Plan: Suddig prissektion med "Coming Soon"

### Koncept
En teaser-prissektion där själva priskorten är helt suddiga och olåsliga. Ett lås-ikon och lanseringsdatum skapar nyfikenhet utan att avslöja detaljer.

---

## Design

```text
┌─────────────────────────────────────────────────────────────────┐
│                          Priser                                  │
│            Enkla, transparenta priser                           │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │░░░░░░░░░░░░░░░░░░░░░│    │░░░░░░░░░░░░░░░░░░░░░│             │
│  │░░░░ SUDDIGT ░░░░░░░░│    │░░░░ SUDDIGT ░░░░░░░░│             │
│  │░░░░░░░░░░░░░░░░░░░░░│    │░░░░░░░░░░░░░░░░░░░░░│             │
│  │░░░░░░░░░░░░░░░░░░░░░│    │░░░░░░░░░░░░░░░░░░░░░│             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                                                  │
│                         🔒                                       │
│              Priser lanseras 2 mars                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tekniska ändringar

### Fil 1: `src/components/landing/PricingSection.tsx`

**Komplett omskrivning:**

1. **Reducera till 2 paket:**
   - "Gratis" - grundpaket
   - "Pro" - allt inkluderat

2. **Applicera blur på korten:**
   ```tsx
   <div className="blur-md select-none pointer-events-none">
     {/* Priskort */}
   </div>
   ```

3. **Overlay med lås och datum:**
   ```tsx
   <div className="absolute inset-0 flex flex-col items-center justify-center">
     <Lock className="h-12 w-12 text-muted-foreground mb-4" />
     <p className="text-lg font-medium">Priser lanseras 2 mars</p>
   </div>
   ```

4. **Ta bort Trust badges** (Stripe, Visa, etc.) - inte relevant innan lansering

---

### Fil 2: `src/pages/Landing.tsx`

**Lägg till PricingSection:**

```tsx
import PricingSection from "@/components/landing/PricingSection";

// I main-sektionen, efter TimeComparisonSection:
<TimeComparisonSection />
<PricingSection />  // Lägg till här
<GuideSection />
```

---

## Ny kod för PricingSection

```tsx
import { Lock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratis",
    price: "0",
    period: "kr/månad",
    description: "Perfekt för att komma igång",
    features: [
      "3 aktiva projekt",
      "Röstinspelning", 
      "Dagrapporter",
      "PDF-export"
    ],
    cta: "Kom igång gratis"
  },
  {
    name: "Pro",
    price: "???",
    period: "kr/månad",
    description: "För växande byggföretag",
    features: [
      "Obegränsade projekt",
      "AI-genererade offerter",
      "Projektplanering",
      "Kundregister",
      "White-label dokument",
      "Prioriterad support"
    ],
    cta: "Starta provperiod"
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Priser
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Enkla, transparenta priser
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Välj den plan som passar ditt företag.
          </p>
        </div>

        {/* Container med blur och overlay */}
        <div className="relative max-w-3xl mx-auto">
          {/* Suddiga priskort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 blur-md select-none pointer-events-none">
            {plans.map((plan) => (
              <Card key={plan.name} className="border-border/50">
                <CardHeader className="text-center pb-4">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline">
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overlay med lås */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/30 rounded-xl">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-8 py-6 text-center border border-border/50 shadow-lg">
              <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">Priser lanseras 2 mars</p>
              <p className="text-sm text-muted-foreground mt-1">Registrera dig för att bli notifierad</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
```

---

## Sammanfattning

| Ändring | Beskrivning |
|---------|-------------|
| 2 paket | Gratis + Pro (tog bort Enterprise) |
| Blur-effekt | `blur-md` på hela kortområdet |
| Lås-overlay | Centrerad ruta med lås-ikon + datum |
| Lanseringstext | "Priser lanseras 2 mars" |
| Placering | Efter TimeComparisonSection, före GuideSection |

