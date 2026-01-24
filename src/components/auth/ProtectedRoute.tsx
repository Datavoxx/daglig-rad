import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { CompanyOnboardingWizard } from "@/components/onboarding/CompanyOnboardingWizard";

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
      }
      setIsLoading(false);
    });

    // Then check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user needs onboarding (no company_settings or missing required fields)
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const checkOnboarding = async () => {
      try {
        // Check company settings
        const { data: companyData, error: companyError } = await supabase
          .from("company_settings")
          .select("id, company_name, logo_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (companyError) {
          console.error("Error checking company settings:", companyError);
          return;
        }

        // Needs onboarding if no company settings or missing required fields
        if (!companyData || !companyData.company_name || !companyData.logo_url) {
          // Get user profile for reference info
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", userId)
            .single();

          if (profileData) {
            setUserFullName(profileData.full_name || "");
            setUserPhone(profileData.phone || "");
          }

          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error("Onboarding check error:", error);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, userId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show onboarding wizard if needed
  if (needsOnboarding && userId) {
    return (
      <CompanyOnboardingWizard
        userId={userId}
        userFullName={userFullName}
        userPhone={userPhone}
        onComplete={() => setNeedsOnboarding(false)}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
