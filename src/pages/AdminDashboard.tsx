import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  CASABLANCA_DISTRICTS,
  CATEGORY_LABELS,
  exportAdminReportPdf,
  exportBookingsExcel,
  formatDH,
} from '../utils/pdfExport.ts';
import type {
  Booking,
  BookingStatus,
  CategorySlug,
  Provider,
  QuoteRequest,
  Review,
  ServiceItem,
  SiteContent,
  User,
} from '../types.ts';

type AdminTab =
  | 'dashboard'
  | 'providers'
  | 'clients'
  | 'services'
  | 'bookings'
  | 'quotes'
  | 'content'
  | 'reviews'
  | 'reports';

interface AdminOverviewData {
  kpis: {
    clientsCount: number;
    providersCount: number;
    pendingProvidersCount: number;
    servicesCount: number;
    bookingsCount: number;
    pendingBookingsCount: number;
    confirmedBookingsCount: number;
    estimatedRevenue: number;
  };
  categoryBreakdown: { category: CategorySlug; count: number }[];
  popularProviders: {
    id: string;
    name: string;
    categorySlug: CategorySlug;
    district: string;
    rating: number;
    bookingCount: number;
    revenue: number;
  }[];
  monthlySeries: { month: string; bookings: number; quotes: number; revenue: number }[];
}

export function AdminDashboard() {
  const { user, showToast, refreshProviders, refreshSiteContent, siteContent } = useApp();
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allQuotes, setAllQuotes] = useState<QuoteRequest[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [bookingSearchNum, setBookingSearchNum] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingProviderFilter, setBookingProviderFilter] = useState('all');

  // Add provider modal/form
  const [newProv, setNewProv] = useState({
    name: '',
    categorySlug: 'salles' as CategorySlug,
    subCategory: 'Salles de mariage',
    district: 'Anfa',
    priceFrom: 25000,
    shortBio: '',
    phone: '+212 522 00 00 00',
    email: '',
  });

  // Editable site content
  const [editableContent, setEditableContent] = useState<SiteContent | null>(siteContent);

  const loadAllAdmin = async () => {
    const [ov, pr, us, sr, bk, qt, rv] = await Promise.all([
      fetch('/api/admin/overview'),
      fetch('/api/providers?includeAll=true'),
      fetch('/api/admin/users'),
      fetch('/api/admin/services'),
      fetch('/api/bookings'),
      fetch('/api/quotes'),
      fetch('/api/admin/reviews'),
    ]);

    if (ov.ok) setOverview(await ov.json());
    if (pr.ok) setAllProviders((await pr.json()).providers || []);
    if (us.ok) setAllUsers((await us.json()).users || []);
    if (sr.ok) setAllServices((await sr.json()).services || []);
    if (bk.ok) setAllBookings((await bk.json()).bookings || []);
    if (qt.ok) setAllQuotes((await qt.json()).quotes || []);
    if (rv.ok) setAllReviews((await rv.json()).reviews || []);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllAdmin();
    }
  }, [user]);

  useEffect(() => {
    if (siteContent) setEditableContent(siteContent);
  }, [siteContent]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-3">
        <h2 className="font-display text-3xl font-semibold">Accès Administrateur Restreint</h2>
        <p className="text-sm text-[#777777]">
          Cette section est strictement réservée à l&apos;équipe de direction EVENT PRO.
        </p>
      </div>
    );
  }

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProv),
    });
    if (res.ok) {
      showToast('Prestataire ajouté et publié.', 'success');
      setNewProv({
        name: '',
        categorySlug: 'salles',
        subCategory: 'Salles de mariage',
        district: 'Anfa',
        priceFrom: 25000,
        shortBio: '',
        phone: '+212 522 00 00 00',
        email: '',
      });
      loadAllAdmin();
      refreshProviders();
    }
  };

  const handleProviderStatus = async (id: string, status: 'approved' | 'suspended') => {
    const res = await fetch(`/api/admin/providers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Prestataire ${status === 'approved' ? 'validé' : 'suspendu'}.`, 'success');
      loadAllAdmin();
      refreshProviders();
    }
  };

  const handleDeleteProvider = async (id: string) => {
    const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Prestataire supprimé.', 'info');
      loadAllAdmin();
      refreshProviders();
    }
  };

  const handleUserStatus = async (id: string, status: 'active' | 'suspended') => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast('Statut client mis à jour.', 'success');
      loadAllAdmin();
    }
  };

  const handleToggleService = async (s: ServiceItem) => {
    const res = await fetch(`/api/admin/services/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    });
    if (res.ok) {
      loadAllAdmin();
    }
  };

  const handleUpdateServicePrice = async (id: string, price: number) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    if (res.ok) {
      showToast('Tarif mis à jour.', 'success');
      loadAllAdmin();
    }
  };

  const handleBookingStatusChange = async (id: string, status: BookingStatus) => {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast('Statut de réservation mis à jour.', 'success');
      loadAllAdmin();
    }
  };

  const handleQuoteStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast('Statut du devis mis à jour.', 'success');
      loadAllAdmin();
    }
  };

  const handleReviewStatus = async (id: string, status: 'published' | 'hidden') => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast('Avis modéré.', 'success');
      loadAllAdmin();
    }
  };

  const handleDeleteReview = async (id: string) => {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Avis supprimé.', 'info');
      loadAllAdmin();
    }
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableContent) return;
    const res = await fetch('/api/admin/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editableContent }),
    });
    if (res.ok) {
      showToast('Contenu du site et formules mis à jour.', 'success');
      refreshSiteContent();
    }
  };

  const clientsList = allUsers.filter(
    (u) =>
      u.role === 'client' &&
      (u.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const filteredBookings = allBookings.filter((b) => {
    if (bookingSearchNum && !b.bookingNumber.toLowerCase().includes(bookingSearchNum.toLowerCase()) && !b.clientName.toLowerCase().includes(bookingSearchNum.toLowerCase())) {
      return false;
    }
    if (bookingDateFilter && b.eventDate !== bookingDateFilter) return false;
    if (bookingProviderFilter !== 'all' && b.providerId !== bookingProviderFilter) return false;
    return true;
  });

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard & Graphiques', icon: BarChart3 },
    { id: 'providers', label: 'Prestataires', icon: Briefcase },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'services', label: 'Prestations & Tarifs', icon: Layers },
    { id: 'bookings', label: 'Réservations', icon: CalendarCheck },
    { id: 'quotes', label: 'Demandes de devis', icon: FileText },
    { id: 'content', label: 'Contenu & Formules', icon: Settings },
    { id: 'reviews', label: 'Modération avis', icon: MessageSquare },
    { id: 'reports', label: 'Rapports & Exports', icon: Download },
  ];

  const maxBookingsBar = Math.max(...(overview?.monthlySeries.map((m) => m.bookings) || [1]), 1);
  const maxRevenueBar = Math.max(...(overview?.monthlySeries.map((m) => m.revenue) || [1]), 1);

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        {/* Admin Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-[#151515] text-white rounded-2xl p-4 h-fit space-y-4">
          <div className="px-3 py-2 border-b border-white/10">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C9A45C]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administration
            </div>
            <p className="font-display text-xl font-semibold mt-0.5">EVENT PRO Backoffice</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === item.id
                    ? 'bg-[#C9A45C] text-[#151515]'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Admin Viewport */}
        <main className="flex-1 space-y-6">
          {tab === 'dashboard' && overview && (
            <div className="space-y-6">
              {/* 7 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Clients', val: overview.kpis.clientsCount },
                  { label: 'Prestataires', val: `${overview.kpis.providersCount} (${overview.kpis.pendingProvidersCount} en attente)` },
                  { label: 'Prestations actives', val: overview.kpis.servicesCount },
                  { label: 'Total Réservations', val: overview.kpis.bookingsCount },
                  { label: 'En attente', val: overview.kpis.pendingBookingsCount },
                  { label: 'Confirmées', val: overview.kpis.confirmedBookingsCount },
                  { label: 'Chiffre d\'affaires estimé', val: formatDH(overview.kpis.estimatedRevenue), span: true },
                ].map((k) => (
                  <div
                    key={k.label}
                    className={`bg-white border border-[#151515]/10 rounded-xl p-5 ${k.span ? 'col-span-2' : ''}`}
                  >
                    <span className="text-xs text-[#777777]">{k.label}</span>
                    <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">{k.val}</p>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Réservations par mois & Évolution des demandes */}
                <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#151515]">
                    Réservations par mois &amp; Évolution des demandes
                  </h3>
                  <div className="h-52 flex items-end justify-between gap-3 pt-4 border-b border-[#151515]/10 pb-2">
                    {overview.monthlySeries.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1 h-40">
                          <div
                            title={`${m.bookings} réservations`}
                            style={{ height: `${Math.round((m.bookings / maxBookingsBar) * 100)}%` }}
                            className="w-4 bg-[#151515] rounded-t"
                          />
                          <div
                            title={`${m.quotes} demandes`}
                            style={{ height: `${Math.min(100, Math.round((m.quotes / 55) * 100))}%` }}
                            className="w-4 bg-[#C9A45C] rounded-t"
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#777777]">{m.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-5 text-xs text-[#777777]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-[#151515] inline-block rounded-sm" /> Réservations
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-[#C9A45C] inline-block rounded-sm" /> Demandes de devis
                    </span>
                  </div>
                </div>

                {/* Chart 2: Évolution des revenus */}
                <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#151515]">
                    Évolution des revenus (DH)
                  </h3>
                  <div className="space-y-3">
                    {overview.monthlySeries.map((m) => (
                      <div key={m.month} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#151515]">{m.month} 2026</span>
                          <span className="font-mono font-bold tabular-nums">{formatDH(m.revenue)}</span>
                        </div>
                        <div className="h-2.5 bg-[#F7F4EF] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.round((m.revenue / maxRevenueBar) * 100)}%` }}
                            className="h-full bg-[#C9A45C] rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 3: Répartition des catégories */}
                <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#151515]">
                    Répartition des catégories
                  </h3>
                  <div className="space-y-3">
                    {overview.categoryBreakdown.map((c) => {
                      const pct = Math.round((c.count / Math.max(overview.kpis.providersCount, 1)) * 100);
                      return (
                        <div key={c.category} className="flex items-center justify-between text-xs gap-4">
                          <span className="w-44 truncate font-medium text-[#151515]">
                            {CATEGORY_LABELS[c.category] || c.category}
                          </span>
                          <div className="flex-1 h-2 bg-[#F7F4EF] rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="h-full bg-[#151515]" />
                          </div>
                          <span className="font-mono font-bold w-16 text-right tabular-nums">
                            {c.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 4: Prestations / Prestataires les plus populaires */}
                <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-[#151515]">
                    Prestataires les plus demandés
                  </h3>
                  <div className="divide-y divide-[#151515]/10">
                    {overview.popularProviders.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-[#151515]">{p.name}</p>
                          <p className="text-[#777777]">{p.district} · Note {p.rating.toFixed(1)}/5</p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <span className="font-bold block">{p.bookingCount} rés.</span>
                          <span className="text-[#A8843E]">{formatDH(p.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'providers' && (
            <div className="space-y-6">
              <form onSubmit={handleAddProvider} className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">Ajouter un prestataire</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nom du prestataire *"
                    value={newProv.name}
                    onChange={(e) => setNewProv({ ...newProv, name: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                  <select
                    value={newProv.categorySlug}
                    onChange={(e) => setNewProv({ ...newProv, categorySlug: e.target.value as CategorySlug })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                  >
                    {(Object.keys(CATEGORY_LABELS) as CategorySlug[]).map((slug) => (
                      <option key={slug} value={slug}>{CATEGORY_LABELS[slug]}</option>
                    ))}
                  </select>
                  <select
                    value={newProv.district}
                    onChange={(e) => setNewProv({ ...newProv, district: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                  >
                    {CASABLANCA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Tarif de départ (DH)"
                    value={newProv.priceFrom}
                    onChange={(e) => setNewProv({ ...newProv, priceFrom: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={newProv.phone}
                    onChange={(e) => setNewProv({ ...newProv, phone: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description courte"
                    value={newProv.shortBio}
                    onChange={(e) => setNewProv({ ...newProv, shortBio: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter le prestataire
                </button>
              </form>

              <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Gestion des prestataires ({allProviders.length})
                </h2>
                <div className="space-y-3">
                  {allProviders.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#777777]">
                          <span className="font-semibold text-[#A8843E]">{p.status.toUpperCase()}</span>
                          {' · '}
                          <span>{CATEGORY_LABELS[p.categorySlug]}</span>
                          {' · '}
                          <span>{p.district}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-[#151515]">{p.name}</h3>
                        <p className="text-xs text-[#777777] font-mono tabular-nums">À partir de {formatDH(p.priceFrom)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleProviderStatus(p.id, 'approved')}
                            className="px-3 py-1.5 bg-[#151515] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-[#C9A45C]" />
                            Valider
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleProviderStatus(p.id, 'suspended')}
                            className="px-3 py-1.5 border border-[#151515]/20 bg-white text-xs font-semibold rounded-lg"
                          >
                            Suspendre
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="p-2 text-[#777777] hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'clients' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">Gestion des clients</h2>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="px-3.5 py-2 rounded-lg border border-[#151515]/20 text-xs w-full sm:w-64"
                />
              </div>

              <div className="divide-y divide-[#151515]/10">
                {clientsList.map((c) => (
                  <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-[#151515]">{c.name}</p>
                      <p className="text-xs text-[#777777]">{c.email} · {c.phone} · Statut : {c.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUserStatus(c.id, c.status === 'suspended' ? 'active' : 'suspended')}
                      className="px-3 py-1.5 border border-[#151515]/20 rounded-lg text-xs font-semibold"
                    >
                      {c.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Gestion des prestations ({allServices.length})
              </h2>
              <div className="space-y-2.5">
                {allServices.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[#A8843E] font-semibold">{s.providerName}</span>
                      <p className="font-semibold text-sm text-[#151515]">{s.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={s.price}
                        onBlur={(e) => handleUpdateServicePrice(s.id, Number(e.target.value))}
                        className="w-28 px-2.5 py-1.5 rounded border border-[#151515]/20 bg-white font-mono tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleService(s)}
                        className={`px-3 py-1.5 rounded-lg font-semibold ${
                          s.active ? 'bg-[#151515] text-white' : 'bg-white border border-[#151515]/20 text-[#777777]'
                        }`}
                      >
                        {s.active ? 'Active' : 'Désactivée'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Toutes les réservations ({filteredBookings.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Rechercher N° EP-... ou client"
                  value={bookingSearchNum}
                  onChange={(e) => setBookingSearchNum(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-xs"
                />
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-xs"
                />
                <select
                  value={bookingProviderFilter}
                  onChange={(e) => setBookingProviderFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white"
                >
                  <option value="all">Tous les prestataires</option>
                  {allProviders.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                {filteredBookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#A8843E]">{b.bookingNumber}</span>
                      <p className="font-semibold text-sm text-[#151515]">{b.clientName} → {b.providerName}</p>
                      <p className="text-[#777777]">{b.eventDate} · {b.eventType} · {b.guests} inv. · <span className="font-mono font-bold">{formatDH(b.totalPrice)}</span></p>
                    </div>
                    <select
                      value={b.status}
                      onChange={(e) => handleBookingStatusChange(b.id, e.target.value as BookingStatus)}
                      className="px-3 py-1.5 rounded-lg border border-[#151515]/20 bg-white font-semibold"
                    >
                      {['En attente', 'Confirmée', 'Refusée', 'Annulée', 'Terminée'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'quotes' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Demandes de devis ({allQuotes.length})</h2>
              <div className="space-y-3">
                {allQuotes.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#A8843E]">{q.quoteNumber}</span>
                      <p className="font-semibold text-sm text-[#151515]">{q.clientName} → {q.providerName}</p>
                      <p className="text-[#777777]">{q.message}</p>
                    </div>
                    <select
                      value={q.status}
                      onChange={(e) => handleQuoteStatus(q.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[#151515]/20 bg-white font-semibold"
                    >
                      {['En attente', 'Répondu', 'Accepté', 'Archivé'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'content' && editableContent && (
            <form onSubmit={handleSaveSiteContent} className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Gestion du contenu &amp; Tarifs d&apos;organisation
              </h2>
              <div>
                <label className="block text-xs font-semibold mb-1">Titre principal Hero</label>
                <input
                  type="text"
                  value={editableContent.heroTitle}
                  onChange={(e) => setEditableContent({ ...editableContent, heroTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Sous-titre Hero</label>
                <textarea
                  rows={2}
                  value={editableContent.heroSubtitle}
                  onChange={(e) => setEditableContent({ ...editableContent, heroSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Bannière promotionnelle (haut de page)</label>
                <input
                  type="text"
                  value={editableContent.promoBanner}
                  onChange={(e) => setEditableContent({ ...editableContent, promoBanner: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#151515]/10">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Numéro WhatsApp professionnel
                  </label>
                  <input
                    type="text"
                    value={editableContent.whatsappNumber ?? '+212 661 00 11 22'}
                    onChange={(e) =>
                      setEditableContent({ ...editableContent, whatsappNumber: e.target.value })
                    }
                    placeholder="+212 661 00 11 22"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Message WhatsApp prérempli
                  </label>
                  <input
                    type="text"
                    value={
                      editableContent.whatsappPrefilledMessage ??
                      'Bonjour EVENT PRO Casablanca, je souhaite organiser un événement et recevoir des informations sur vos prestataires.'
                    }
                    onChange={(e) =>
                      setEditableContent({
                        ...editableContent,
                        whatsappPrefilledMessage: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#151515]/10">
                <h3 className="font-semibold text-sm">Tarifs Formules Organisation Complète (DH)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {editableContent.plannerPackages.map((pkg, idx) => (
                    <div key={pkg.id} className="p-3 rounded-xl bg-[#F7F4EF] border border-[#151515]/10">
                      <label className="block text-xs font-semibold mb-1">{pkg.name}</label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => {
                          const next = [...editableContent.plannerPackages];
                          next[idx] = { ...pkg, price: Number(e.target.value) };
                          setEditableContent({ ...editableContent, plannerPackages: next });
                        }}
                        className="w-full px-3 py-2 rounded border border-[#151515]/20 bg-white font-mono text-sm tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515]"
              >
                Enregistrer les modifications du site
              </button>
            </form>
          )}

          {tab === 'reviews' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Modération des avis clients</h2>
              <div className="space-y-3">
                {allReviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="max-w-2xl">
                      <span className="font-semibold text-[#A8843E]">{r.providerName} · {r.rating}/5</span>
                      <p className="font-semibold text-sm text-[#151515]">{r.authorName}</p>
                      <p className="text-[#777777]">{r.comment}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReviewStatus(r.id, r.status === 'published' ? 'hidden' : 'published')}
                        className="px-3 py-1.5 border border-[#151515]/20 bg-white rounded-lg font-semibold"
                      >
                        {r.status === 'published' ? 'Masquer' : 'Publier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(r.id)}
                        className="p-2 text-[#777777] hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reports' && overview && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Rapports &amp; Exports Commerciaux
                </h2>
                <p className="text-sm text-[#777777]">
                  Exportez l&apos;ensemble des réservations au format Excel (.xlsx) ou générez un rapport exécutif PDF.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => {
                    exportBookingsExcel(allBookings);
                    showToast('Export Excel téléchargé.', 'success');
                  }}
                  className="px-5 py-3 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] inline-flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#C9A45C]" />
                  Exporter les réservations en Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportAdminReportPdf(allBookings, overview.kpis);
                    showToast('Rapport PDF téléchargé.', 'success');
                  }}
                  className="px-5 py-3 border border-[#151515]/20 text-[#151515] text-xs font-semibold rounded-lg hover:border-[#151515] inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#C9A45C]" />
                  Télécharger le rapport PDF
                </button>
              </div>

              <div className="pt-4 border-t border-[#151515]/10">
                <h3 className="font-display text-xl font-semibold mb-3">Synthèse mensuelle</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {overview.monthlySeries.map((m) => (
                    <div key={m.month} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 text-xs">
                      <span className="font-semibold text-[#151515] block">{m.month} 2026</span>
                      <span className="text-[#777777] block mt-1">{m.bookings} réservations · {m.quotes} devis</span>
                      <span className="font-mono font-bold text-[#A8843E] block mt-1 tabular-nums">
                        {formatDH(m.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
