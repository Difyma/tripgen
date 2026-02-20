import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './components/LandingPage';
import { TripsRoute } from './routes/TripsRoute';
import { TripDetailsRoute } from './routes/TripDetailsRoute';
import { ReadyTourDetailsPage } from './pages/ReadyTourDetailsPage';
import Chat from './components/Chat';
import CreatorPage from './components/CreatorPage';
import FlightsPage from './components/FlightTestPage';
import HotelTestPage from './components/HotelTestPage';
import FlightTestPage from './components/FlightTestPage';
import ProfilePage from './components/ProfilePage';
import AboutPage from './components/AboutPage';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ScrollToTop from './components/ScrollToTop';

export function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
    <Router>
          <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
        <Route path="/creator" element={<CreatorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ready-tours/:id" element={<ReadyTourDetailsPage />} />
        <Route element={<AppLayout />}>
                <Route path="/chat" element={<Chat key={Date.now()} />} />
                <Route path="/trips" element={<TripsRoute />} />
                <Route path="/trips/:id" element={<TripDetailsRoute />} />
                <Route path="/flights" element={<FlightsPage />} />
                <Route path="/hotels" element={<HotelTestPage />} />
                <Route path="/flight" element={<FlightTestPage />} />
        </Route>
      </Routes>
    </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}