

## Plan: AI-agentsektion på landningssidan + individuella agentsidor

### Vision
Skapa en visuellt slående sektion som presenterar Byggio's tre AI-kollegor (Saga, Bo, Ulla) på ett sätt som får besökare att tänka "Wow, det här är annorlunda!". Varje agent visas med sin avatar (transparent bakgrund), grön accenttext för vad de gör, och är klickbar för att komma till en dedikerad undersida.

---

### 1. Ny komponent: AIAgentsSection

**Fil:** `src/components/landing/AIAgentsSection.tsx`

**Design-koncept:**
- Mörk bakgrund (för kontrast mot ljus landing page)
- Tre agenter i en horisontell layout (kolumner på mobil)
- Varje agent har:
  - Stort profilfoto med drop-shadow och subtil glow
  - Namn i grön text (primary color)
  - Titel/specialitet
  - 2-3 "superkrafter" som badges
  - Hover-effekt med scale + glow
- Animerad "AI-partikel" effekt i bakgrunden

**Layout-struktur:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     🤖  Möt dina AI-kollegor                       │
│     Tre specialister som jobbar dygnet runt för att underlätta     │
│                        ditt vardagsjobb                             │
├───────────────────┬───────────────────┬─────────────────────────────┤
│    [SAGA BILD]    │    [BO BILD]      │    [ULLA BILD]              │
│    ─ glow ─       │    ─ glow ─       │    ─ glow ─                 │
│                   │                   │                             │
│    SAGA           │    BO             │    ULLA                     │
│    Kalkylexpert   │    Projektplanerare│   Dokumentationsassistent   │
│                   │                   │                             │
│  [Offerter]       │  [Tidsplaner]     │  [Dagrapporter]             │
│  [Mallar]         │  [Gantt]          │  [ÄTA]                      │
│  [ROT/RUT]        │  [Faser]          │  [Arbetsorder]              │
│                   │                   │                             │
│    Läs mer →      │    Läs mer →      │    Läs mer →                │
└───────────────────┴───────────────────┴─────────────────────────────┘
```

**Kod-struktur:**

```tsx
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import sagaAvatar from "@/assets/saga-avatar.png";
import boAvatar from "@/assets/bo-avatar.png";
import ullaAvatar from "@/assets/ulla-avatar.png";

const agents = [
  {
    slug: "saga",
    name: "Saga",
    title: "Kalkylexpert",
    description: "Skapar proffsiga offerter från röstinspelningar och hjälper dig med prissättning.",
    avatar: sagaAvatar,
    skills: ["Offerter", "Kalkylmallar", "ROT/RUT-beräkning"],
  },
  {
    slug: "bo",
    name: "Bo",
    title: "Projektplanerare",
    description: "Bygger realistiska tidsplaner och håller koll på projektets alla faser.",
    avatar: boAvatar,
    skills: ["Tidsplaner", "Gantt-schema", "Fasplanering"],
  },
  {
    slug: "ulla",
    name: "Ulla",
    title: "Dokumentationsassistent",
    description: "Strukturerar dagrapporter, hanterar ÄTA och skapar arbetsorder automatiskt.",
    avatar: ullaAvatar,
    skills: ["Dagrapporter", "ÄTA-hantering", "Arbetsorder"],
  },
];

const AIAgentsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-foreground/[0.02] relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/6 w-32 h-32 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/6 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-drivna assistenter
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Möt dina AI-kollegor
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tre specialister som jobbar dygnet runt för att underlätta ditt vardagsjobb
          </p>
        </div>

        {/* Agents grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {agents.map((agent, index) => (
            <Link
              key={agent.slug}
              to={`/ai/${agent.slug}`}
              className="group relative"
            >
              {/* Hover glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative bg-card rounded-2xl border border-border/50 p-6 sm:p-8 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:-translate-y-1">
                {/* Top highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl" />

                {/* Avatar with glow */}
                <div className="relative mb-6 flex justify-center">
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="w-24 h-24 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />
                  </div>
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Name & Title */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-primary mb-1">{agent.name}</h3>
                  <p className="text-muted-foreground font-medium">{agent.title}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                  {agent.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {agent.skills.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-0 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  Läs mer
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
```

---

### 2. Lägg till sektionen i Landing.tsx

**Fil:** `src/pages/Landing.tsx`

Lägg till `AIAgentsSection` mellan `FeaturesSection` och `IntegrationsSection`:

```tsx
import AIAgentsSection from "@/components/landing/AIAgentsSection";

// ...

<main>
  <HeroSection />
  <FeaturesSection />
  <AIAgentsSection />  {/* NY SEKTION */}
  <IntegrationsSection />
  <HowItWorksSection />
  ...
</main>
```

---

### 3. Individuella agentsidor

**Fil:** `src/pages/ai/AgentDetail.tsx`

Skapa en dedikerad sida för varje agent med:
- Hero-sektion med stor avatar och bakgrundseffekt
- Detaljerad beskrivning av vad agenten gör
- Lista på funktioner/capabilities
- Demo/mockup av agenten i aktion
- CTA att komma igång

**Routing:**
- `/ai/saga` → Sagas sida
- `/ai/bo` → Bos sida
- `/ai/ulla` → Ullas sida

**Kod-struktur:**

```tsx
const agentData = {
  saga: {
    name: "Saga",
    title: "Din kalkylexpert",
    heroDescription: "Saga förstår byggprojekt in och ut. Beskriv vad du ska göra...",
    color: "from-primary to-emerald-500",
    capabilities: [
      { icon: Mic, title: "Röststyrd offert", description: "Prata in projektbeskrivningen..." },
      { icon: Calculator, title: "Smart prissättning", description: "Saga föreslår priser..." },
      { icon: FileText, title: "Kalkylmallar", description: "Spara tid med återanvändbara mallar..." },
    ],
    mockup: <SagaMockup />,
  },
  bo: { ... },
  ulla: { ... },
};
```

---

### 4. Uppdatera App.tsx med routing

**Fil:** `src/App.tsx`

Lägg till route för AI-agent-sidor:

```tsx
import AgentDetail from "@/pages/ai/AgentDetail";

// I Routes:
<Route path="/ai/:slug" element={<AgentDetail />} />
```

---

### Sammanfattning av filer

| Fil | Åtgärd |
|-----|--------|
| `src/components/landing/AIAgentsSection.tsx` | **NY** - Huvudsektion med tre agenter |
| `src/pages/Landing.tsx` | Lägg till AIAgentsSection |
| `src/pages/ai/AgentDetail.tsx` | **NY** - Individuella agentsidor |
| `src/App.tsx` | Lägg till `/ai/:slug` route |

---

### Visuell preview

**Landningssidan (mellan Funktioner och Datamigrering):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ✨ AI-drivna assistenter                          │
│                        Möt dina AI-kollegor                              │
│    Tre specialister som jobbar dygnet runt för att underlätta ditt jobb  │
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│   │    👩‍💼           │  │    👨‍💼           │  │    👩‍🔧           │         │
│   │                 │  │                 │  │                 │         │
│   │     SAGA        │  │      BO         │  │     ULLA        │         │
│   │   Kalkylexpert  │  │ Projektplanerare│  │ Dokumentations- │         │
│   │                 │  │                 │  │  assistent      │         │
│   │ [Offerter]      │  │ [Tidsplaner]    │  │ [Dagrapporter]  │         │
│   │ [Mallar]        │  │ [Gantt]         │  │ [ÄTA]           │         │
│   │                 │  │                 │  │                 │         │
│   │  Läs mer →      │  │  Läs mer →      │  │  Läs mer →      │         │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Individuell agentsida (t.ex. /ai/saga):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Tillbaka                                                               │
│                                                                          │
│                           ✨ [SAGA AVATAR]                               │
│                              med glow                                     │
│                                                                          │
│                              SAGA                                        │
│                          Din kalkylexpert                                │
│                                                                          │
│    "Saga förstår byggprojekt in och ut. Beskriv vad du ska göra –        │
│     Saga skapar en proffsig offert med rätt priser och ROT/RUT."         │
│                                                                          │
│                      [Kom igång gratis]                                  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                         Vad kan Saga göra?                               │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│   │ 🎤          │  │ 💰          │  │ 📋          │                      │
│   │ Röststyrd   │  │ Smart       │  │ Kalkyl-     │                      │
│   │ offert      │  │ prissättning│  │ mallar      │                      │
│   └─────────────┘  └─────────────┘  └─────────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Tekniska detaljer

**Hover-effekter:**
- Scale 1.1 på avatar
- Glow-ring bakom avatar
- Border blir primärfärg
- Kortskugga ökar
- Translatey -1 (lyfter kortet)

**Responsivitet:**
- Desktop: 3 kolumner
- Mobil: 1 kolumn, vertikalt staplat
- Avatarer: 128px på desktop, 112px på mobil

**Animationer:**
- Floating orbs i bakgrunden
- Pulsande glow bakom avatarer
- Staggered fade-in på kort

