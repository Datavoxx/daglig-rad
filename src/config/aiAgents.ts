// Centraliserad konfiguration för AI-agenter i Byggio
// Nu konsoliderat till ett enda AI-varumärke: Byggio AI

import byggioLogo from "@/assets/byggio-logo.png";

export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;
  avatar: string;
}

// Byggio AI - enhetligt AI-varumärke
const byggioAgent: AIAgent = {
  name: "Byggio AI",
  title: "Din AI-assistent",
  description: "Din kompletta AI-assistent för byggprojekt",
  promptIntro: "Du är Byggio AI, en expert-assistent för svenska byggföretag.",
  avatar: byggioLogo,
};

export const AI_AGENTS = {
  // Primär agent
  byggio: byggioAgent,
  
  // Alias för bakåtkompatibilitet (alla pekar på samma agent)
  estimate: byggioAgent,
  planning: byggioAgent,
  diary: byggioAgent,
} as const;

export type AIAgentType = keyof typeof AI_AGENTS;

// Hjälpfunktion för att hämta agent baserat på typ
export function getAgent(type: AIAgentType): AIAgent {
  return AI_AGENTS[type];
}
