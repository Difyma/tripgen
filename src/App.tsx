import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
//import TourPackages from './components/TourPackages';
//import ExperienceStats from './components/ExperienceStats';
//import TourGuides from './components/TourGuides';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import TripForm from './components/TripForm';
import PopularDestinations from './components/PopularDestinations';
import Services from './components/Services';
import TravelQuiz from './components/TravelQuiz';
import CreatorSection from './components/CreatorSection';
import TravelGallery from './components/TravelGallery';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки ресурсов
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <HowItWorks />
      <TripForm />
      <PopularDestinations />
      <Services />
      <TravelQuiz />
      <CreatorSection />
      <CTASection />
      <TravelGallery />
      <Footer />
    </div>
  );
};

export default App;