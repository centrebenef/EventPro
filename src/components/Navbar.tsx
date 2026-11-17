import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from 'lucide-react';
import { BrandLogo } from './Logo.tsx';
import { useApp } from '../context/AppContext.tsx';
import type { AppPage } from '../types.ts';

export function Navbar() {
  const {
    user,
    navigate,
    currentPage,
    openAuthModal,
    logout,
    notifications,
    compareIds,
    setCompareModalOpen,
  } = useApp();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const go = (page: AppPage) => {
    setMobileOpen(false);
    setServicesOpen(false);
    navigate(page);
  };

  const dashboardPage: AppPage =
    user?.role === 'admin'
      ? 'admin-dashboard'
      : user?.role === 'provider'
      ? 'provider-dashboard'
      : 'client-dashboard';

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-[#151515]/10 shadow-sm'
          : 'bg-[#F7F4EF]/95 backdrop-blur-sm border-[#151515]/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => go('home')}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] rounded-md"
        >
          <BrandLogo />
        </button>

        {/* Zone 2: Primary Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#151515]/80">
          <button
            type="button"
            onClick={() => go('home')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              currentPage === 'home'
                ? 'text-[#151515] border-[#C9A45C]'
                : 'border-transparent hover:text-[#151515]'
            }`}
          >
            Accueil
          </button>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              onClick={() => go('prestations')}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
                ['prestations', 'salles', 'photographes', 'traiteurs', 'dj', 'decoration', 'organisation', 'carte'].includes(
                  currentPage
                )
                  ? 'text-[#151515] border-[#C9A45C]'
                  : 'border-transparent hover:text-[#151515]'
              }`}
            >
              Nos prestations
              <ChevronDown className="w-3.5 h-3.5 text-[#C9A45C]" />
            </button>

            {servicesOpen && (
              <div className="absolute top-full left-0 pt-2 w-64 z-50">
                <div className="bg-white border border-[#151515]/10 rounded-xl shadow-xl py-2">
                  {[
                    { page: 'salles' as AppPage, label: 'Salles de réception' },
                    { page: 'photographes' as AppPage, label: 'Photographes & Vidéastes' },
                    { page: 'traiteurs' as AppPage, label: 'Traiteurs' },
                    { page: 'dj' as AppPage, label: 'DJ & Animation' },
                    { page: 'decoration' as AppPage, label: 'Décoration' },
                    { page: 'organisation' as AppPage, label: 'Organisation complète' },
                    { page: 'carte' as AppPage, label: 'Carte interactive Casablanca' },
                  ].map((item) => (
                    <button
                      key={item.page}
                      type="button"
                      onClick={() => go(item.page)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        currentPage === item.page
                          ? 'bg-[#F7F4EF] text-[#151515] font-semibold'
                          : 'text-[#151515]/80 hover:bg-[#F7F4EF] hover:text-[#151515]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => go('salles')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              currentPage === 'salles'
                ? 'text-[#151515] border-[#C9A45C]'
                : 'border-transparent hover:text-[#151515]'
            }`}
          >
            Salles
          </button>

          <button
            type="button"
            onClick={() => go('realisations')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              currentPage === 'realisations'
                ? 'text-[#151515] border-[#C9A45C]'
                : 'border-transparent hover:text-[#151515]'
            }`}
          >
            Nos réalisations
          </button>

          <button
            type="button"
            onClick={() => go('contact')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              currentPage === 'contact'
                ? 'text-[#151515] border-[#C9A45C]'
                : 'border-transparent hover:text-[#151515]'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: Actions & Primary CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold border border-[#C9A45C] text-[#151515] rounded-lg hover:bg-[#C9A45C]/15 transition-colors whitespace-nowrap shrink-0 tabular-nums"
            >
              Comparer ({compareIds.length})
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(dashboardPage)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border border-[#151515]/20 text-[#151515] rounded-lg hover:border-[#151515] transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#C9A45C]" />
                <span>
                  {user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'provider'
                    ? 'Espace Pro'
                    : 'Mon espace'}
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-[#A8843E]">
                    <Bell className="w-3 h-3" />
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={logout}
                title="Se déconnecter"
                className="p-2 text-[#777777] hover:text-[#151515] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3 py-2 text-xs font-semibold text-[#151515] hover:text-[#A8843E] transition-colors whitespace-nowrap shrink-0"
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-3.5 py-2 text-xs font-semibold border border-[#151515]/20 text-[#151515] rounded-lg hover:border-[#151515] transition-colors whitespace-nowrap shrink-0"
              >
                Inscription
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => go('event-builder')}
            className="px-4 py-2.5 text-xs font-semibold bg-[#151515] text-white rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
          >
            Organiser mon événement
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu mobile"
          className="lg:hidden p-2.5 rounded-lg border border-[#151515]/15 text-[#151515]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#151515]/10 px-4 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {[
              { page: 'home' as AppPage, label: 'Accueil' },
              { page: 'prestations' as AppPage, label: 'Nos prestations' },
              { page: 'salles' as AppPage, label: 'Salles de réception' },
              { page: 'photographes' as AppPage, label: 'Photographes & Vidéastes' },
              { page: 'traiteurs' as AppPage, label: 'Traiteurs' },
              { page: 'dj' as AppPage, label: 'DJ & Animation' },
              { page: 'decoration' as AppPage, label: 'Décoration' },
              { page: 'organisation' as AppPage, label: 'Organisation complète' },
              { page: 'carte' as AppPage, label: 'Carte interactive Casablanca' },
              { page: 'realisations' as AppPage, label: 'Nos réalisations' },
              { page: 'contact' as AppPage, label: 'Contact' },
            ].map((item) => (
              <button
                key={item.page}
                type="button"
                onClick={() => go(item.page)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === item.page
                    ? 'bg-[#F7F4EF] text-[#151515] font-semibold'
                    : 'text-[#151515]/80 hover:bg-[#F7F4EF]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#151515]/10 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => go('event-builder')}
              className="w-full py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg"
            >
              Organiser mon événement
            </button>
            {user ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(dashboardPage)}
                  className="flex-1 py-2.5 border border-[#151515]/20 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-[#C9A45C]" />
                  Mon espace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="px-4 py-2.5 border border-[#151515]/20 rounded-lg text-sm text-[#777777]"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('login');
                  }}
                  className="py-2.5 border border-[#151515]/20 rounded-lg text-sm font-semibold"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('register');
                  }}
                  className="py-2.5 bg-[#C9A45C] text-[#151515] rounded-lg text-sm font-semibold"
                >
                  Inscription
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
