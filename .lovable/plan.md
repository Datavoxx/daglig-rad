
## Lägg till Bokföring-flik med Fortnox och Visma

### Översikt

Lägga till en tredje flik "Bokföring" i Fakturor-sidan som visar Fortnox och Visma som kommande integrationer. Designen återanvänder befintlig styling från IntegrationsSection på landningssidan.

### Struktur

```text
┌─────────────────────────────────────────────────────────────────┐
│  Fakturor                                                       │
│  Hantera kund- och leverantörsfakturor                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Kundfakturor]  [Leverantörsfakturor]  [Bokföring]             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bokföring & Integrationer                                      │
│  Koppla ihop med ditt bokföringsprogram                         │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │  [Fortnox logo]     │    │  [Visma logo]       │             │
│  │  Fortnox            │    │  Visma              │             │
│  │  - Fakturaexport    │    │  - Realtidssynk     │             │
│  │  - Kundregister     │    │  - Auto-bokföring   │             │
│  │  - Projektredovisn. │    │  - Ekonomirapporter │             │
│  │                     │    │                     │             │
│  │  [Kommande snart]   │    │  [Kommande snart]   │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                                                 │
│  Har du önskemål om andra integrationer? Kontakta oss!          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tekniska ändringar

| Fil | Ändring |
|-----|---------|
| `src/pages/Invoices.tsx` | Lägg till tredje flik "Bokföring" med integrationskort |

### Implementation

1. **Utöka TabsList till 3 kolumner**
   - Ändra `grid-cols-2` till `grid-cols-3`
   - Lägg till "Bokföring"-trigger med `BookOpen` eller `Link2` ikon

2. **Skapa ny TabsContent för "accounting"**
   - Återanvänd kort-design från IntegrationsSection
   - Visa Fortnox och Visma med logotyper
   - Lägg till "Kommande snart" badge på varje kort
   - Inkludera feature-listor

3. **Använd befintliga assets**
   - `src/assets/fortnox-logo.png`
   - `src/assets/visma-logo.png`

### Kodexempel

```typescript
import fortnoxLogo from "@/assets/fortnox-logo.png";
import vismaLogo from "@/assets/visma-logo.png";
import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// I Tabs-komponenten:
<TabsList className="grid w-full grid-cols-3 max-w-lg">
  <TabsTrigger value="customer">Kundfakturor</TabsTrigger>
  <TabsTrigger value="vendor">Leverantörsfakturor</TabsTrigger>
  <TabsTrigger value="accounting">
    <BookOpen className="h-4 w-4 mr-2" />
    Bokföring
  </TabsTrigger>
</TabsList>

<TabsContent value="accounting">
  {/* Integrations content */}
</TabsContent>
```

### Designdetaljer

- **Fortnox-kort**: Grön accentfärg (#3B8230) vid hover
- **Visma-kort**: Röd accentfärg (#E31937) vid hover
- **"Kommande snart" badge**: Visa att integrationerna är under utveckling
- **Responsiv layout**: Kolumner på desktop, staplade på mobil
