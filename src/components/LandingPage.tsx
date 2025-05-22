import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, DollarSign, Users, Star, ChevronRight, ArrowRight, Coins, Gift, Share2, Trophy } from 'lucide-react';
import Navbar from './Navbar';
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