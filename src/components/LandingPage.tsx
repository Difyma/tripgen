import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import Services from './Services';
import CreatorSection from './CreatorSection';
import Footer from './Footer';
import ExampleTour from './ExampleTour';
import CollectiveTour from './CollectiveTour';
import TravelGallery from './TravelGallery';
import CTASection from './CTASection';
import TravelQuiz from './TravelQuiz';
import { AuthModal } from './AuthModal';

export function LandingPage() {
  return (
    <div className="min-h-screen">
    

      {/* Main Content */}
      <main>
        <Hero />
        <HowItWorks />
        <ExampleTour />
        <Services />
        <TravelQuiz />
        <CollectiveTour />
        <CreatorSection />
        <TravelGallery />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
} 