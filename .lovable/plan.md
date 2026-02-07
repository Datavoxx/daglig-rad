

## Mål

Ersätta den nuvarande Byggio-loggan med den nya "Byggio AI"-loggan (med hjärna och trappor) på alla ställen där Byggio AI visas i appen.

---

## Ny logga

Den nya loggan visar:
- En grön hjärna med nätverksmönster (AI-symbol)
- Gröna byggtrappor (byggbransch-symbol)
- Texten "Byggio AI" i grönt/blått gradient

---

## Ändringar

### 1. Lägg till den nya loggan i projektet

Kopiera den uppladdade bilden till:
```
src/assets/byggio-ai-logo.png
```

### 2. Uppdatera AI-agentens konfiguration

**Fil:** `src/config/aiAgents.ts`

```typescript
// FÖRE:
import byggioLogo from "@/assets/byggio-logo.png";

// EFTER:
import byggioAILogo from "@/assets/byggio-ai-logo.png";

const byggioAgent: AIAgent = {
  name: "Byggio AI",
  title: "Din AI-assistent",
  description: "Din kompletta AI-assistent för byggprojekt",
  promptIntro: "Du är Byggio AI, en expert-assistent för svenska byggföretag.",
  avatar: byggioAILogo,  // <-- NY LOGGA
};
```

### 3. Uppdatera enskilda komponenter som använder loggan direkt

| Fil | Användning | Ändring |
|-----|------------|---------|
| `src/components/shared/AgentChatBubble.tsx` | Chat-bubblans avatar | Byt import till `byggio-ai-logo.png` |
| `src/components/landing/AIAgentsSection.tsx` | Landing page AI-sektion | Byt import till `byggio-ai-logo.png` |
| `src/components/landing/FreeTrainingSection.tsx` | Träningssektion (om det visar AI) | Kontrollera om det är AI-kontext |
| `src/components/dashboard/DashboardAssistantWidget.tsx` | Eventuellt lägga till loggan här | Kontrollera behov |

---

## Filer att ändra

| # | Fil | Ändring |
|---|-----|---------|
| 1 | `src/assets/byggio-ai-logo.png` | Ny fil (kopieras från uppladdning) |
| 2 | `src/config/aiAgents.ts` | Byt avatar till ny logga |
| 3 | `src/components/shared/AgentChatBubble.tsx` | Byt import till ny logga |
| 4 | `src/components/landing/AIAgentsSection.tsx` | Byt import till ny logga |

---

## Resultat

- Alla ställen som visar Byggio AI (chat-bubbla, landing page, sidmeny-avatar etc.) kommer använda den nya loggan med hjärna och trappor
- Den ursprungliga `byggio-logo.png` behålls för allmän Byggio-varumärkning (header, footer, auth-sidor etc.)
- Tydlig visuell skillnad mellan företagsloggan och AI-assistentens avatar

