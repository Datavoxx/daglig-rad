// Centraliserad konfiguration för AI-agenter i Byggio
// Tre agenter: Saga (Offerter & Mallar), Bo (Planering), Ulla (Dokumentation)

export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;
}

export const AI_AGENTS = {
  // Saga - Offert & Kalkyl-expert (hanterar även mallar)
  estimate: {
    name: "Saga",
    title: "Saga AI",
    description: "Din kalkylexpert",
    promptIntro: "Du heter Saga och är en expert på offerter, kalkyler och kalkylmallar för byggprojekt i Sverige.",
  },

  // Bo - Planerings-expert
  planning: {
    name: "Bo",
    title: "Bo AI",
    description: "Din projektplanerare",
    promptIntro: "Du heter Bo och är en expert på byggprojektplanering med lång erfarenhet av att organisera tidplaner.",
  },

  // Ulla - Dokumentationsassistent (dagrapporter, ÄTA, arbetsorder, egenkontroll)
  diary: {
    name: "Ulla",
    title: "Ulla AI",
    description: "Din dokumentationsassistent",
    promptIntro: "Du heter Ulla och är en erfaren dokumentationsassistent för svenska byggarbetsplatser. Du hjälper till med dagrapporter, ÄTA, arbetsorder och egenkontroller.",
  },
} as const;

export type AIAgentType = keyof typeof AI_AGENTS;

// Hjälpfunktion för att hämta agent baserat på typ
export function getAgent(type: AIAgentType): AIAgent {
  return AI_AGENTS[type];
}
