import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import ChatIntro from './components/ChatIntro';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import TripForm from './components/TripForm';
import PopularDestinations from './components/PopularDestinations';
import Services from './components/Services';
import TravelQuiz from './components/TravelQuiz';
import CreatorSection from './components/CreatorSection';
import TravelGallery from './components/TravelGallery';
import Chat from './components/Chat';
import HowItWorks from './components/HowItWorks';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <Hero />
            <HowItWorks />
            <Services />
            <TravelQuiz />
            <TripForm />
            <PopularDestinations />
            <TravelGallery />
            <CreatorSection />
            <CTASection />
            <Footer />
          </>
        } />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
};

export default App;