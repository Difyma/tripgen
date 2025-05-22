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
import { AuthProvider } from './contexts/AuthContext';

export function App() {
  return (
    <AuthProvider>
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}