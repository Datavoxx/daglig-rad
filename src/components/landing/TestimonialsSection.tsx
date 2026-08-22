import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "Byggio har revolutionerat hur vi dokumenterar våra projekt. Röstinspelningen sparar mig minst en timme om dagen.",
    author: "Marcus Lindqvist",
    role: "VD, Lindqvist Bygg AB",
    initials: "ML",
    rating: 5
  },
  {
    quote: "Äntligen ett verktyg byggt för hur vi faktiskt jobbar på byggarbetsplatsen. Enkelt att använda även med smutsiga händer.",
    author: "Anna Bergström",
    role: "Projektledare, Bergströms Entreprenad",
    initials: "AB",
    rating: 5
  },
  {
    quote: "AI-offerterna är otroligt exakta. Våra kunder imponeras av hur professionella dokumenten ser ut.",
    author: "Erik Johansson",
    role: "Ägare, EJ Renovering",
    initials: "EJ",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Omdömen
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Vad våra kunder säger
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Byggföretag i hela Sverige använder Byggio för att effektivisera sin vardag.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.author}
              className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 stagger-item"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {testimonial.author}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Decorative quote mark */}
                <div className="absolute top-4 right-4 text-6xl font-serif text-primary/10 leading-none">
                  "
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
