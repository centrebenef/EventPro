import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { ProviderDetailModal } from './components/ProviderDetailModal.tsx';
import { AuthModal, BookingModal, QuoteModal } from './components/BookingAndQuoteModals.tsx';
import { CompareModal } from './components/CompareModal.tsx';
import { FloatingActionsAndAi } from './components/EventAiDrawer.tsx';
import { GoldParticlesBackground } from './components/GoldParticlesBackground.tsx';
import { GoldCustomCursor } from './components/GoldCustomCursor.tsx';
import { ScrollProgressBar } from './components/ScrollProgressBar.tsx';
import { InitialLoadingScreen } from './components/InitialLoadingScreen.tsx';
import { WelcomePopup } from './components/WelcomePopup.tsx';
import { ButtonRevealObserver } from './components/ButtonRevealObserver.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPages.tsx';
import { EventBuilderPage } from './pages/EventBuilderPage.tsx';
import { ExtraPage } from './pages/ExtraPages.tsx';
import { ClientDashboard } from './pages/ClientDashboard.tsx';
import { ProviderDashboard } from './pages/ProviderDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

function MainRouter() {
  const { currentPage } = useApp();

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'prestations':
      return <CatalogPage mode="prestations" />;
    case 'salles':
      return <CatalogPage mode="salles" />;
    case 'photographes':
      return <CatalogPage mode="photographes" />;
    case 'traiteurs':
      return <CatalogPage mode="traiteurs" />;
    case 'dj':
      return <CatalogPage mode="dj" />;
    case 'decoration':
      return <CatalogPage mode="decoration" />;
    case 'organisation':
      return <CatalogPage mode="organisation" />;
    case 'event-builder':
      return <EventBuilderPage />;
    case 'client-dashboard':
      return <ClientDashboard />;
    case 'provider-dashboard':
      return <ProviderDashboard />;
    case 'admin-dashboard':
      return <AdminDashboard />;
    default:
      return <ExtraPage page={currentPage} />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#F7F4EF] text-[#151515]">
        <InitialLoadingScreen />
        <GoldParticlesBackground globalBackdrop density="normal" tone="adaptive" />
        <ScrollProgressBar />
        <GoldCustomCursor />
        <ButtonRevealObserver />
        <Navbar />
        <div className="flex-1">
          <MainRouter />
        </div>
        <Footer />
        <ProviderDetailModal />
        <BookingModal />
        <QuoteModal />
        <AuthModal />
        <CompareModal />
        <WelcomePopup />
        <FloatingActionsAndAi />
      </div>
    </AppProvider>
  );
}
