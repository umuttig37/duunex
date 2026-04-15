import EnhancedHeroSection from '@/components/features/landing/hero/enhanced-hero-section';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/faq-section';
import PopularProjectsSection from '@/components/landing/popular-projects-section';
import PremiumCTASection from '@/components/landing/premium-cta-section';
import TestimonialBanner from '@/components/landing/testimonial-banner';

export default function HomePage() {

  return (
    <div>

      {/* 1. Hero Section - Enhanced with TaskRabbit-style categories */}
      <EnhancedHeroSection />

      {/* Short testimonial banner between hero trust (Paytrail) and How It Works */}
      <TestimonialBanner />

      {/* 2. How It Works - Simple 3-step process */}
      <HowItWorksSection />

      {/* 3. Popular Projects - Showcasing trending tasks */}
      <PopularProjectsSection />

      {/* 4. FAQ - Minimalistinen, ammattimainen */}
      <FAQSection />

      {/* 4. Premium CTA - Gradient hero-style */}
      <PremiumCTASection />

      {/* 5. Duunex CTA */}
      {/* <DuunexCtaSection /> */}
    </div>
  );
}
