import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AIAgentsSection from "@/components/landing/AIAgentsSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FreeTrainingSection from "@/components/landing/FreeTrainingSection";
import TimeComparisonSection from "@/components/landing/TimeComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import GuideSection from "@/components/landing/GuideSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FreeTrainingSection />
        <AIAgentsSection />
        <IntegrationsSection />
        <HowItWorksSection />
        <TimeComparisonSection />
        <PricingSection />
        <GuideSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
