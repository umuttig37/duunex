import EnhancedHeroSection from '@/components/features/landing/hero/enhanced-hero-section';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/faq-section';
import PopularProjectsSection from '@/components/landing/popular-projects-section';
import PremiumCTASection from '@/components/landing/premium-cta-section';
import TestimonialBanner from '@/components/landing/testimonial-banner';

export default function HomePage() {
  return (
    <div>
      <EnhancedHeroSection />
      <TestimonialBanner />
      <HowItWorksSection />
      <PopularProjectsSection />
      <FAQSection />
      <PremiumCTASection />
    </div>
  );
}
