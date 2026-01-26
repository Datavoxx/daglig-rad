import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TimeComparisonSection from "@/components/landing/TimeComparisonSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <IntegrationsSection />
        <HowItWorksSection />
        <TimeComparisonSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
