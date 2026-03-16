import { useState } from 'react';
import { MainNavbar } from '../components/MainNavbar';
import Footer from '../components/Footer';
import { ReadyTours } from '../components/ReadyTours';
import { AuthModal } from '../components/AuthModal';

export function ToursPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <MainNavbar onAuthClick={() => setIsAuthModalOpen(true)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <main className="pt-20">
        <ReadyTours />
      </main>
      <Footer />
    </div>
  );
}


