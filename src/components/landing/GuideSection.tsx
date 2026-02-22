import { useState, FormEvent } from "react";
import { Download, BookOpen, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { generateGuidePdf } from "@/lib/generateGuidePdf";
import { toast } from "@/hooks/use-toast";
import TiltCard from "./TiltCard";
import { Link } from "react-router-dom";

const GuideSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Namn saknas",
        description: "Vänligen fyll i ditt namn",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidEmail(email)) {
      toast({
        title: "Ogiltig e-postadress",
        description: "Vänligen ange en giltig e-postadress",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save lead to database
      const { error } = await supabase
        .from("guide_leads")
        .insert({ 
          name: name.trim(), 
          email: email.trim().toLowerCase() 
        });
      
      if (error) {
        console.error("Error saving lead:", error);
        toast({
          title: "Något gick fel",
          description: "Försök igen senare",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Generate and download PDF
      await generateGuidePdf();
      
      toast({
        title: "Guiden laddas ner!",
        description: "Kolla din nedladdningsmapp",
      });
      
      // Reset form
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Något gick fel",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    "Spara tid på dokumentation med AI och röst",
    "Skapa professionella offerter och fakturor",
    "Hantera projekt, tid och personal på ett ställe",
  ];

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Gratis resurs
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Din gratis guide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Komplett guide till effektiv projekthantering för byggföretag
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* PDF Preview with 3D effect */}
          <div className="flex justify-center lg:order-2">
            <TiltCard className="w-full max-w-sm" maxTilt={10}>
              <div className="bg-card border border-border/40 rounded-xl p-8 shadow-2xl">
                <div className="bg-primary/10 rounded-lg p-6 mb-6">
                  <div className="w-12 h-1 bg-primary rounded mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    BYGGIO GUIDE
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Din kompletta guide till effektiv projekthantering
                  </p>
                </div>
                
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>PDF • 2 sidor</span>
                    <span>Byggio Guide</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Form and benefits */}
          <div className="lg:order-1">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Lär dig hur du:</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ditt namn</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Anna Andersson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Din e-postadress</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="anna@foretag.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laddar ner...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Ladda ner gratis
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Genom att ladda ner godkänner du vår{" "}
                <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                  integritetspolicy
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuideSection;
