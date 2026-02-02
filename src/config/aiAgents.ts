// Centraliserad konfiguration för AI-agenter i Byggio
// Varje agent har en unik identitet och personlighet

export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;
}

export const AI_AGENTS = {
  // Saga - Offert & Kalkyl-expert
  estimate: {
    name: "Saga",
    title: "Saga AI",
    description: "Din kalkylexpert",
    promptIntro: "Du heter Saga och är en expert på offerter och kalkyler för byggprojekt i Sverige.",
  },

  // Bo - Planerings-expert
  planning: {
    name: "Bo",
    title: "Bo AI",
    description: "Din projektplanerare",
    promptIntro: "Du heter Bo och är en expert på byggprojektplanering med lång erfarenhet av att organisera tidplaner.",
  },

  // Ulla - Dagrapport & Arbetsdagbok
  diary: {
    name: "Ulla",
    title: "Ulla AI",
    description: "Din platschef-assistent",
    promptIntro: "Du heter Ulla och är en erfaren platschef-assistent för svenska byggarbetsplatser.",
  },

  // Erik - Egenkontroll & Kvalitet
  inspection: {
    name: "Erik",
    title: "Erik AI",
    description: "Din kvalitetskontrollant",
    promptIntro: "Du heter Erik och är en erfaren kvalitetskontrollant på svenska byggarbetsplatser.",
  },

  // Märta - ÄTA & Arbetsorder
  workOrder: {
    name: "Märta",
    title: "Märta AI",
    description: "Din dokumentationsexpert",
    promptIntro: "Du heter Märta och är en dokumentationsexpert för ändrings- och tilläggsarbeten i byggprojekt.",
  },

  // Oscar - Mall-expert
  template: {
    name: "Oscar",
    title: "Oscar AI",
    description: "Din mallexpert",
    promptIntro: "Du heter Oscar och är en expert på att skapa och hantera kalkylmallar för byggprojekt.",
  },
} as const;

export type AIAgentType = keyof typeof AI_AGENTS;

// Hjälpfunktion för att hämta agent baserat på typ
export function getAgent(type: AIAgentType): AIAgent {
  return AI_AGENTS[type];
}
