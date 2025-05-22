import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './components/LandingPage';
import { TripsRoute } from './routes/TripsRoute';
import { TripDetailsRoute } from './routes/TripDetailsRoute';
import Chat from './components/Chat';
import CreatorPage from './components/CreatorPage';
import FlightsPage from './components/FlightTestPage';
import HotelTestPage from './components/HotelTestPage';
import FlightTestPage from './components/FlightTestPage';
import ProfilePage from './components/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';

export function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/creator" element={<CreatorPage />} />
            <Route element={<AppLayout />}>
                <Route path="/chat" element={<Chat key={Date.now()} />} />
                <Route path="/trips" element={<TripsRoute />} />
                <Route path="/trips/:id" element={<TripDetailsRoute />} />
                <Route path="/flights" element={<FlightsPage />} />
                <Route path="/hotels" element={<HotelTestPage />} />
                <Route path="/flight" element={<FlightTestPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}