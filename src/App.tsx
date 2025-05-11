import { BrowserRouter as Router, Routes, Route, ScrollRestoration } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './components/LandingPage';
import { TripsRoute } from './routes/TripsRoute';
import { TripDetailsRoute } from './routes/TripDetailsRoute';
import Chat from './components/Chat';
import CreatorPage from './components/CreatorPage';
import FlightsPage from './pages/FlightsPage';
import { Suspense } from 'react';

export function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <ScrollRestoration />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Creator Page */}
          <Route path="/creator" element={<CreatorPage />} />

          {/* App Routes */}
          <Route element={<AppLayout />}>
            <Route path="trips" element={<TripsRoute />} />
            <Route path="trips/:id" element={<TripDetailsRoute />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:id" element={<Chat />} />
          </Route>

          <Route path="/flights" element={<FlightsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}