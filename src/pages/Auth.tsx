import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, BookOpen, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import byggioLogo from "@/assets/byggio-logo.png";

const emailSchema = z.string().email("Ogiltig e-postadress");
const passwordSchema = z.string().min(6, "Lösenordet måste vara minst 6 tecken");

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Valideringsfel",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Inloggning misslyckades",
        description: error.message === "Invalid login credentials" 
          ? "Felaktiga inloggningsuppgifter" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Välkommen tillbaka!" });
      navigate("/projects");
    }
  };

  return (
    <div className="page-transition flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-4">
        {/* About Byggio */}
        <Card className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vilka är Byggio?</CardTitle>
          </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            <strong className="text-foreground">Byggio</strong> är en demoapp byggd av <strong className="text-foreground">Mahad Abdullahi</strong>.
          </p>
          <p>
            Målet med Byggio är att visa hur byggföretag kan digitalisera sina 
            dagliga arbetsflöden – från dagrapporter och besiktningar till 
            kalkyler och projektplanering – allt samlat i en enkel och 
            användarvänlig app.
          </p>
          <p>
            Med hjälp av <strong className="text-foreground">AI-assistans</strong> gör Byggio arbetet 
            <strong className="text-primary"> 62% enklare</strong> – genom automatisk generering av 
            rapporter, offerter och projektplaner baserat på röstinmatning och smart datahantering.
          </p>
        </CardContent>
        </Card>

        {/* Login Card */}
        <Card className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={byggioLogo} alt="Byggio" className="h-16 mx-auto" />
            </div>
            <CardTitle className="font-display text-2xl">Välkommen till Byggio</CardTitle>
            <CardDescription>Byggprojekt, enkelt och digitalt</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="din@email.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loggar in..." : "Logga in"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/50">
              <Link 
                to="/guide-public"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span>Förstå Byggio</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Kontakt</p>
          <p>Mahad Abdullahi</p>
          <div className="flex items-center justify-center gap-3">
            <a 
              href="tel:0707747731" 
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              0707747731
            </a>
            <span>•</span>
            <a 
              href="mailto:info@datavoxx.se" 
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3" />
              info@datavoxx.se
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
