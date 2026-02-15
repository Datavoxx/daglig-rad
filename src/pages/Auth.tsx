import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, BookOpen, Phone, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Forgot password state
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Password recovery state
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Get returnTo parameter for post-login redirect
  const returnTo = searchParams.get("returnTo");

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    // Fallback: check URL hash directly for recovery token
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecoveryMode(true);
    }

    // Also listen for the Supabase PASSWORD_RECOVERY event
    supabase.auth.getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const validateForm = () => {
    try {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      setValidationError(
        error.message === "Invalid login credentials"
          ? "Felaktiga inloggningsuppgifter"
          : error.message
      );
    } else {
      navigate(returnTo || "/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(resetEmail);
    } catch {
      setValidationError("Ogiltig e-postadress");
      return;
    }

    setResetLoading(true);
    setValidationError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "https://byggio.io/auth",
    });
    setResetLoading(false);

    if (error) {
      setValidationError(error.message);
    } else {
      setResetSent(true);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setValidationError("Lösenordet måste vara minst 6 tecken");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setValidationError("Lösenorden matchar inte");
      return;
    }

    setRecoveryLoading(true);
    setValidationError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setRecoveryLoading(false);

    if (error) {
      setValidationError(error.message);
    } else {
      navigate(returnTo || "/dashboard");
    }
  };

  // Recovery mode: set new password
  if (isRecoveryMode) {
    return (
      <div className="page-transition flex min-h-screen items-center justify-center bg-background p-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
        <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-4">
          <Card className="w-full border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <img src={byggioLogo} alt="Byggio" className="h-16 mx-auto" />
              </div>
              <CardTitle className="font-display text-2xl">Nytt lösenord</CardTitle>
              <CardDescription>Ange ditt nya lösenord</CardDescription>
            </CardHeader>
            <CardContent>
              {validationError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nytt lösenord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setValidationError(null); }}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPasswordConfirm}
                      onChange={(e) => { setNewPasswordConfirm(e.target.value); setValidationError(null); }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={recoveryLoading}>
                  {recoveryLoading ? "Sparar..." : "Spara nytt lösenord"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-4">
        {/* Tillbaka-knapp */}
        <Link 
          to="/"
          className="self-start flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka till startsidan</span>
        </Link>

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
            {/* Validation error alert */}
            {validationError && !forgotPassword && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Forgot password view */}
            {forgotPassword ? (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ett e-postmeddelande har skickats till <strong>{resetEmail}</strong> med en länk för att återställa ditt lösenord.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setForgotPassword(false); setResetSent(false); setResetEmail(""); setValidationError(null); }}
                    >
                      Tillbaka till inloggning
                    </Button>
                  </div>
                ) : (
                  <>
                    {validationError && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground text-center mb-2">
                      Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">E-post</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="din@email.se"
                            value={resetEmail}
                            onChange={(e) => { setResetEmail(e.target.value); setValidationError(null); }}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={resetLoading}>
                        {resetLoading ? "Skickar..." : "Skicka återställningslänk"}
                      </Button>
                    </form>
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => { setForgotPassword(false); setValidationError(null); }}
                    >
                      Tillbaka till inloggning
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
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
                        onChange={(e) => { setEmail(e.target.value); setValidationError(null); }}
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
                        onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
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
                    <button
                      type="button"
                      onClick={() => { setForgotPassword(true); setValidationError(null); setResetEmail(email); }}
                      className="text-sm text-primary hover:underline"
                    >
                      Glömt lösenord?
                    </button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loggar in..." : "Logga in"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Har du inget konto?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Registrera dig
                  </Link>
                </p>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <Link 
                    to="/guide-public"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Förstå Byggio</span>
                  </Link>
                </div>
              </>
            )}
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
