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
import ProfilePage from './components/ProfilePage';
import AboutPage from './components/AboutPage';
import CreatorsListPage from './pages/CreatorsListPage';
import CreatorClientChatPage from './pages/CreatorClientChatPage';
import FavoritesPage from './pages/FavoritesPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ToursPage } from './pages/ToursPage';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ScrollToTop from './components/ScrollToTop';

// Creator Dashboard
import { CreatorDashboardLayout } from './components/creator-dashboard';
import CreatorProfilePage from './components/creator-dashboard/pages/ProfilePage';
import OrdersPage from './components/creator-dashboard/pages/OrdersPage';
import CalendarPage from './components/creator-dashboard/pages/CalendarPage';
import CrmPage from './components/creator-dashboard/pages/CrmPage';
import FinancesPage from './components/creator-dashboard/pages/FinancesPage';
import AnalyticsPage from './components/creator-dashboard/pages/AnalyticsPage';
import ReviewsPage from './components/creator-dashboard/pages/ReviewsPage';
import SettingsPage from './components/creator-dashboard/pages/SettingsPage';
import ChatPage from './components/creator-dashboard/pages/ChatPage';

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
        <Route path="/creators" element={<CreatorsListPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/ready-tours/:id" element={<ReadyTourDetailsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        
        {/* Creator Dashboard Routes */}
        <Route element={<CreatorDashboardLayout />}>
          <Route path="/creator-dashboard/profile" element={<CreatorProfilePage />} />
          <Route path="/creator-dashboard/orders" element={<OrdersPage />} />
          <Route path="/creator-dashboard/calendar" element={<CalendarPage />} />
          <Route path="/creator-dashboard/crm" element={<CrmPage />} />
          <Route path="/creator-dashboard/finances" element={<FinancesPage />} />
          <Route path="/creator-dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/creator-dashboard/reviews" element={<ReviewsPage />} />
          <Route path="/creator-dashboard/settings" element={<SettingsPage />} />
          <Route path="/creator-dashboard/chat" element={<ChatPage />} />
          <Route path="/creator-dashboard" element={<CreatorProfilePage />} />
        </Route>
        
        <Route element={<AppLayout />}>
          <Route path="/chat" element={<Chat key={Date.now()} />} />
          <Route path="/chat/:chatId" element={<CreatorClientChatPage />} />
          <Route path="/trips" element={<TripsRoute />} />
          <Route path="/trips/:id" element={<TripDetailsRoute />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/flights" element={<FlightsPage />} />
          <Route path="/hotels" element={<HotelTestPage />} />
          <Route path="/flight" element={<FlightsPage />} />
        </Route>
      </Routes>
    </Router>
      </SidebarProvider>
    </AuthProvider>
  );
}