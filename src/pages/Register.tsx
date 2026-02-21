import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [industry, setIndustry] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateForm = () => {
    try {
      nameSchema.parse(fullName);
      if (!industry) {
        setValidationError("Välj en bransch");
        return false;
      }
      emailSchema.parse(email);
      passwordSchema.parse(password);
      setValidationError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
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
          industry: industry,
        },
      },
    });

    if (signUpError) {
      setIsLoading(false);
      if (signUpError.message.includes("already registered")) {
        setValidationError("Denna e-postadress är redan registrerad. Försök logga in istället.");
      } else {
        setValidationError(signUpError.message);
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
              industry,
            },
          }).catch(console.error);
        }
      });

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
                <Label>Bransch</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Välj bransch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malare">Målare</SelectItem>
                      <SelectItem value="vvs">VVS</SelectItem>
                      <SelectItem value="elektriker">Elektriker</SelectItem>
                      <SelectItem value="bygg">Bygg</SelectItem>
                    </SelectContent>
                  </Select>
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
