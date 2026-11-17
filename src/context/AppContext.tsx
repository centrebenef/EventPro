import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppPage, NotificationItem, Provider, SiteContent, User } from '../types.ts';
import type { SupportedLocale } from '../i18n/translations.ts';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface SearchPreset {
  eventType?: string;
  category?: string;
  district?: string;
  date?: string;
  guests?: number;
}

interface AppContextValue {
  user: User | null;
  authReady: boolean;
  initialLoading: boolean;
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  providers: Provider[];
  siteContent: SiteContent | null;
  favoriteIds: string[];
  compareIds: string[];
  notifications: NotificationItem[];
  currentPage: AppPage;
  searchPreset: SearchPreset;
  setSearchPreset: (preset: SearchPreset) => void;
  navigate: (page: AppPage, preset?: SearchPreset) => void;
  selectedProvider: Provider | null;
  openProviderDetail: (provider: Provider) => void;
  closeProviderDetail: () => void;
  bookingTarget: Provider | null;
  openBookingModal: (provider: Provider) => void;
  closeBookingModal: () => void;
  quoteTarget: Provider | null;
  openQuoteModal: (provider: Provider) => void;
  closeQuoteModal: () => void;
  authModalMode: 'login' | 'register' | 'provider-register' | null;
  openAuthModal: (mode: 'login' | 'register' | 'provider-register') => void;
  closeAuthModal: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  aiDrawerOpen: boolean;
  setAiDrawerOpen: (open: boolean) => void;
  toggleFavorite: (providerId: string) => Promise<void>;
  toggleCompare: (providerId: string) => void;
  refreshProviders: () => Promise<void>;
  refreshSiteContent: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  logout: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [providersReady, setProvidersReady] = useState(false);
  const [siteContentReady, setSiteContentReady] = useState(false);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [locale, setLocale] = useState<SupportedLocale>('fr');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [searchPreset, setSearchPreset] = useState<SearchPreset>({});

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Provider | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<Provider | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'provider-register' | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      // silent network retry handled by UI
    } finally {
      setProvidersReady(true);
    }
  }, []);

  const refreshSiteContent = useCallback(async () => {
    try {
      const res = await fetch('/api/site-content');
      if (res.ok) {
        const data = await res.json();
        setSiteContent(data.content);
      }
    } catch {
      // ignore
    } finally {
      setSiteContentReady(true);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(data.favoriteIds || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        if (data.user) {
          refreshFavorites();
          refreshNotifications();
        } else {
          setFavoriteIds([]);
          setNotifications([]);
        }
      }
    } finally {
      setAuthReady(true);
    }
  }, [refreshFavorites, refreshNotifications]);

  useEffect(() => {
    refreshAuth();
    refreshProviders();
    refreshSiteContent();
  }, [refreshAuth, refreshProviders, refreshSiteContent]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinSplashDone(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialLoadDone && authReady && providersReady && siteContentReady && minSplashDone) {
      setInitialLoadDone(true);
    }
  }, [initialLoadDone, authReady, providersReady, siteContentReady, minSplashDone]);

  const navigate = useCallback((page: AppPage, preset?: SearchPreset) => {
    if (preset) setSearchPreset(preset);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setFavoriteIds([]);
    setNotifications([]);
    setCurrentPage('home');
    showToast('Vous êtes déconnecté.', 'info');
  }, [showToast]);

  const toggleFavorite = useCallback(
    async (providerId: string) => {
      if (!user) {
        showToast('Connectez-vous pour enregistrer vos prestataires favoris.', 'info');
        setAuthModalMode('login');
        return;
      }
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds((prev) =>
          data.favorited ? [...prev, providerId] : prev.filter((id) => id !== providerId)
        );
        showToast(data.favorited ? 'Ajouté aux favoris.' : 'Retiré des favoris.', 'success');
      }
    },
    [user, showToast]
  );

  const toggleCompare = useCallback(
    (providerId: string) => {
      setCompareIds((prev) => {
        if (prev.includes(providerId)) {
          return prev.filter((id) => id !== providerId);
        }
        if (prev.length >= 3) {
          showToast('Vous pouvez comparer jusqu\'à 3 prestataires simultanément.', 'info');
          return prev;
        }
        return [...prev, providerId];
      });
    },
    [showToast]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        authReady,
        initialLoading: !initialLoadDone,
        locale,
        setLocale,
        providers,
        siteContent,
        favoriteIds,
        compareIds,
        notifications,
        currentPage,
        searchPreset,
        setSearchPreset,
        navigate,
        selectedProvider,
        openProviderDetail: (p) => setSelectedProvider(p),
        closeProviderDetail: () => setSelectedProvider(null),
        bookingTarget,
        openBookingModal: (p) => setBookingTarget(p),
        closeBookingModal: () => setBookingTarget(null),
        quoteTarget,
        openQuoteModal: (p) => setQuoteTarget(p),
        closeQuoteModal: () => setQuoteTarget(null),
        authModalMode,
        openAuthModal: (mode) => setAuthModalMode(mode),
        closeAuthModal: () => setAuthModalMode(null),
        compareModalOpen,
        setCompareModalOpen,
        aiDrawerOpen,
        setAiDrawerOpen,
        toggleFavorite,
        toggleCompare,
        refreshProviders,
        refreshSiteContent,
        refreshAuth,
        refreshNotifications,
        logout,
        showToast,
      }}
    >
      {children}

      {/* Global Toast Notifications */}
      <div className="fixed top-20 right-4 z-[90] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
              t.type === 'error'
                ? 'bg-[#151515] text-white border-red-500/60'
                : t.type === 'info'
                ? 'bg-[#151515] text-[#F7F4EF] border-[#C9A45C]/50'
                : 'bg-[#151515] text-white border-[#C9A45C]'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
