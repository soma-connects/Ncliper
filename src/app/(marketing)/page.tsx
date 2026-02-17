import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProof } from '@/components/landing/SocialProof';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ncliper — Turn Long Videos Into Viral Clips with AI',
    description:
        'Paste any video URL. Our AI finds the most viral moments, generates captions, and exports clips ready for TikTok, Reels, and Shorts — all in seconds.',
};

export default function LandingPage() {
    return (
        <>
            <HeroSection />
            <SocialProof />
            <FeaturesSection />
            <HowItWorks />
            <PricingSection />
            <FAQSection />
            <CTASection />
        </>
    );
}
