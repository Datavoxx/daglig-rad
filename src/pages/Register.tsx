import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
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
const nameSchema = z.string().min(2, "Namnet måste vara minst 2 tecken");

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    try {
      nameSchema.parse(fullName);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/`;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setIsLoading(false);
      if (signUpError.message.includes("already registered")) {
        toast({
          title: "Kontot finns redan",
          description: "Denna e-postadress är redan registrerad. Försök logga in istället.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registrering misslyckades",
          description: signUpError.message,
          variant: "destructive",
        });
      }
      return;
    }

    // Auto-login after successful registration
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      toast({
        title: "Konto skapat!",
        description: "Automatisk inloggning misslyckades. Logga in manuellt.",
        variant: "destructive",
      });
      navigate("/auth");
    } else {
      // Fire-and-forget webhook notification for new account
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.functions.invoke("notify-new-account", {
            body: {
              email,
              full_name: fullName,
              user_id: data.user.id,
            },
          }).catch(console.error);
        }
      });

      toast({ title: "Välkommen till Byggio!" });
      navigate("/dashboard");
    }
  };

  return (
    <div className="page-transition flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-4">
        <Card className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={byggioLogo} alt="Byggio" className="h-16 mx-auto" />
            </div>
            <CardTitle className="font-display text-2xl">Skapa konto</CardTitle>
            <CardDescription>Registrera dig för att använda Byggio</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Fullständigt namn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ditt namn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-post</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
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
                <Label htmlFor="signup-password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
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
                {isLoading ? "Skapar konto..." : "Registrera dig"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Har du redan ett konto?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Logga in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
