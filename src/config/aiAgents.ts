// Centraliserad konfiguration för AI-agenter i JIA
// Nu konsoliderat till ett enda AI-varumärke: JIA AI

import jiaAILogo from "@/assets/jia-ai-logo.png";

export interface AIAgent {
  name: string;
  title: string;
  description: string;
  promptIntro: string;
  avatar: string;
}

// JIA AI - enhetligt AI-varumärke
const jiaAgent: AIAgent = {
  name: "JIA AI",
  title: "Din AI-assistent",
  description: "Din kompletta AI-assistent för byggprojekt",
  promptIntro: "Du är JIA AI, en expert-assistent för svenska byggföretag.",
  avatar: jiaAILogo,
};

export const AI_AGENTS = {
  // Primär agent
  jia: jiaAgent,
  
  // Alias för bakåtkompatibilitet (alla pekar på samma agent)
  estimate: jiaAgent,
  planning: jiaAgent,
  diary: jiaAgent,
} as const;

export type AIAgentType = keyof typeof AI_AGENTS;

// Hjälpfunktion för att hämta agent baserat på typ
export function getAgent(type: AIAgentType): AIAgent {
  return AI_AGENTS[type];
}
