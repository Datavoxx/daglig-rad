import { FileText, Calendar, CheckSquare, Calculator, Mic, Users, FolderOpen, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Dagrapporter",
    description: "Dokumentera arbetspass enkelt med röstinspelning. AI:n fyller i alla detaljer automatiskt.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Calendar,
    title: "Projektplanering",
    description: "Skapa tidsplaner med faser och milstolpar. Dela med kund i realtid.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: CheckSquare,
    title: "Egenkontroller",
    description: "Färdiga mallar för våtrum, el, ventilation och mer. Signera digitalt.",
    color: "from-emerald-500 to-emerald-600"
  },
  {
    icon: Calculator,
    title: "AI-Offerter",
    description: "Beskriv projektet med röst – få en komplett offert på sekunder.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Mic,
    title: "Röststyrning",
    description: "Prata istället för att skriva. Perfekt när händerna är smutsiga.",
    color: "from-pink-500 to-pink-600"
  },
  {
    icon: Users,
    title: "Kundregister",
    description: "Håll koll på alla kunder, projekt och historik på ett ställe.",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    icon: FolderOpen,
    title: "Dokumenthantering",
    description: "Ladda upp ritningar, foton och dokument. Allt samlat per projekt.",
    color: "from-amber-500 to-amber-600"
  },
  {
    icon: TrendingUp,
    title: "Ekonomiöversikt",
    description: "Se intäkter, kostnader och marginaler. Koppla till Fortnox/Visma.",
    color: "from-green-500 to-green-600"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funktioner
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Allt du behöver för att driva byggprojekt
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Från offert till slutbesiktning – Byggio täcker hela projektcykeln.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm stagger-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
