import { FileText, Calendar, Calculator, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "Dagrapporter på minuter",
    description: "Spela in vad som hände idag med rösten – appen skriver rapporten åt dig. Perfekt när händerna är smutsiga.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Calendar,
    title: "Tidsplaner som du faktiskt använder",
    description: "Dra och släpp faser. Dela med kunden. Uppdatera på sekunder – direkt från mobilen.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Calculator,
    title: "Offerter utan krångel",
    description: "Beskriv projektet, lägg till poster – få en proffsig offert som kunden kan signera digitalt.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Users,
    title: "Alla kunder på ett ställe",
    description: "Sök fram kontaktuppgifter, se projekthistorik och skicka offerter – utan att leta i pappershögar.",
    color: "from-cyan-500 to-cyan-600"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funktioner
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Enklare vardag för dig som bygger
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Slipp krångliga system. Få ordning på dokumentation, planering och offerter – på några minuter.
          </p>
        </div>

        {/* Features grid - 2 columns, larger cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm stagger-item"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardContent className="p-8">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
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
