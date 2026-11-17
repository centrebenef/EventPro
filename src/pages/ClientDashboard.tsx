import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Download,
  FileText,
  Heart,
  History,
  LayoutDashboard,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ProviderCard } from '../components/ProviderCard.tsx';
import { exportSavedProjectPdf, formatDH } from '../utils/pdfExport.ts';
import type { Booking, EventProject, QuoteRequest } from '../types.ts';

type ClientTab =
  | 'overview'
  | 'profile'
  | 'bookings'
  | 'quotes'
  | 'favorites'
  | 'notifications'
  | 'projects'
  | 'history';

export function ClientDashboard() {
  const {
    user,
    providers,
    favoriteIds,
    notifications,
    refreshAuth,
    refreshNotifications,
    showToast,
    navigate,
  } = useApp();

  const [tab, setTab] = useState<ClientTab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [projects, setProjects] = useState<EventProject[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = async () => {
    const [bkRes, qtRes, prjRes] = await Promise.all([
      fetch('/api/bookings'),
      fetch('/api/quotes'),
      fetch('/api/projects'),
    ]);
    if (bkRes.ok) setBookings((await bkRes.json()).bookings || []);
    if (qtRes.ok) setQuotes((await qtRes.json()).quotes || []);
    if (prjRes.ok) setProjects((await prjRes.json()).projects || []);
  };

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      loadData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-display text-3xl font-semibold">Accès Espace Client</h2>
        <p className="text-sm text-[#777777]">Veuillez vous connecter pour accéder à votre tableau de bord personnel.</p>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      if (res.ok) {
        await refreshAuth();
        showToast('Profil mis à jour.', 'success');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Annulée' }),
    });
    if (res.ok) {
      showToast('Réservation annulée et créneau libéré.', 'info');
      loadData();
      refreshNotifications();
    } else {
      const d = await res.json();
      showToast(d.error || 'Action impossible.', 'error');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast('Projet supprimé.', 'info');
    }
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    refreshNotifications();
  };

  const favProviders = providers.filter((p) => favoriteIds.includes(p.id));
  const activeBookings = bookings.filter((b) => b.status === 'En attente' || b.status === 'Confirmée');
  const historyBookings = bookings.filter((b) => b.status === 'Terminée' || b.status === 'Annulée' || b.status === 'Refusée');

  const menuItems: { id: ClientTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'bookings', label: 'Mes réservations', icon: Calendar },
    { id: 'quotes', label: 'Demandes de devis', icon: FileText },
    { id: 'projects', label: 'Projets Event Builder', icon: Sparkles },
    { id: 'favorites', label: 'Mes favoris', icon: Heart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'profile', label: 'Mon profil', icon: UserIcon },
  ];

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-[#151515]/10 rounded-2xl p-4 h-fit space-y-4">
          <div className="px-3 py-2 border-b border-[#151515]/10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A8843E]">
              Espace Client
            </span>
            <p className="font-display text-xl font-semibold text-[#151515] truncate">{user.name}</p>
            <p className="text-xs text-[#777777] truncate">{user.email}</p>
          </div>

          <nav className="space-y-1">
            {menuItems.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTab(m.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === m.id
                    ? 'bg-[#151515] text-white'
                    : 'text-[#151515]/75 hover:bg-[#F7F4EF] hover:text-[#151515]'
                }`}
              >
                <m.icon className={`w-4 h-4 ${tab === m.id ? 'text-[#C9A45C]' : 'text-[#777777]'}`} />
                <span>{m.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Réservations actives</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">
                    {activeBookings.length}
                  </p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Demandes de devis</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">
                    {quotes.length}
                  </p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Projets Event Builder</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">
                    {projects.length}
                  </p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Prestataires favoris</span>
                  <p className="font-mono text-2xl font-bold text-[#A8843E] mt-1 tabular-nums">
                    {favProviders.length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#151515]">
                    Prochaines réservations
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('event-builder')}
                    className="px-4 py-2 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515]"
                  >
                    + Nouveau projet Event Builder
                  </button>
                </div>
                {bookings.length === 0 ? (
                  <p className="text-sm text-[#777777]">Aucune réservation enregistrée pour l&apos;instant.</p>
                ) : (
                  <div className="divide-y divide-[#151515]/10">
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="font-mono text-xs text-[#A8843E] font-semibold">{b.bookingNumber}</span>
                          <p className="font-semibold text-sm text-[#151515]">{b.providerName}</p>
                          <p className="text-xs text-[#777777]">{b.eventType} · {b.eventDate} · {b.guests} inv.</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold block tabular-nums">{formatDH(b.totalPrice)}</span>
                          <span className="text-xs font-semibold text-[#151515]">{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Mes réservations</h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-[#777777]">Vous n&apos;avez pas encore effectué de réservation.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-[#777777]">
                          <span className="font-mono font-bold text-[#151515]">{b.bookingNumber}</span>
                          {' · '}
                          <span>{b.status}</span>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-[#151515]">{b.providerName}</h3>
                        <p className="text-xs text-[#777777]">
                          {b.eventType} le {b.eventDate} à {b.eventTime} · {b.location} · {b.guests} invités
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-sm font-bold mr-2 tabular-nums">
                          {formatDH(b.totalPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 border border-[#151515]/20 rounded-lg text-xs font-semibold bg-white"
                        >
                          Détails
                        </button>
                        {(b.status === 'En attente' || b.status === 'Confirmée') && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold bg-white hover:bg-red-50"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedBooking && (
                <div className="mt-4 p-5 rounded-xl bg-[#151515] text-white space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <strong className="text-sm text-[#C9A45C]">
                      Détails réservation {selectedBooking.bookingNumber}
                    </strong>
                    <button type="button" onClick={() => setSelectedBooking(null)} className="underline">
                      Fermer
                    </button>
                  </div>
                  <p>Prestataire : {selectedBooking.providerName}</p>
                  <p>Formule : {selectedBooking.formulaName}</p>
                  <p>Options : {selectedBooking.options.length > 0 ? selectedBooking.options.join(', ') : 'Aucune'}</p>
                  <p>Commentaires : {selectedBooking.comments || 'Aucun'}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'quotes' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Mes demandes de devis</h2>
              {quotes.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucune demande de devis envoyée.</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#151515]">{q.quoteNumber} · {q.status}</span>
                        <span className="text-[#777777]">{q.eventDate}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-[#151515]">{q.providerName}</h4>
                      <p className="text-xs text-[#777777]">{q.message}</p>
                      {q.replyMessage && (
                        <div className="p-3 rounded-lg bg-white border border-[#C9A45C]/50 text-xs space-y-1">
                          <strong className="text-[#A8843E]">
                            Réponse du prestataire ({formatDH(q.quotedPrice)}) :
                          </strong>
                          <p className="text-[#151515]">{q.replyMessage}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'projects' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Projets EVENT BUILDER
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('event-builder')}
                  className="px-4 py-2 bg-[#151515] text-white text-xs font-semibold rounded-lg"
                >
                  Créer un projet
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucun projet sauvegardé.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs text-[#A8843E] font-semibold">{p.status} · {p.eventDate}</span>
                        <h3 className="font-display text-xl font-semibold text-[#151515]">{p.title}</h3>
                        <p className="text-xs text-[#777777] tabular-nums">
                          {p.selectedProviders.length} prestataires · Total : {formatDH(p.totalCost)} / Budget : {formatDH(p.budget)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => exportSavedProjectPdf(p, user.name)}
                          className="px-3 py-2 bg-white border border-[#151515]/20 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#151515]"
                        >
                          <Download className="w-3.5 h-3.5 text-[#C9A45C]" />
                          Devis PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-2 text-[#777777] hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'favorites' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Mes prestataires favoris</h2>
              {favProviders.length === 0 ? (
                <div className="bg-white border border-[#151515]/10 rounded-2xl p-8 text-center text-sm text-[#777777]">
                  Vous n&apos;avez aucun favori pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favProviders.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">Notifications</h2>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-[#A8843E] hover:underline"
                >
                  Tout marquer comme lu
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucune notification.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border ${
                        n.isRead ? 'bg-white border-[#151515]/10' : 'bg-[#F7F4EF] border-[#C9A45C]'
                      }`}
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <strong className="text-[#151515]">{n.title}</strong>
                        <span className="text-[#777777]">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="text-xs text-[#777777]">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Historique des réservations
              </h2>
              {historyBookings.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucune réservation passée ou annulée.</p>
              ) : (
                <div className="divide-y divide-[#151515]/10">
                  {historyBookings.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-mono text-xs text-[#777777]">{b.bookingNumber}</span>
                        <p className="font-semibold">{b.providerName}</p>
                        <p className="text-xs text-[#777777]">{b.eventDate} · {b.status}</p>
                      </div>
                      <span className="font-mono font-bold tabular-nums">{formatDH(b.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleProfileSave} className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4 max-w-xl">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Modifier mon profil</h2>
              <div>
                <label className="block text-xs font-semibold mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Adresse email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/10 bg-[#F7F4EF] text-sm text-[#777777]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515]"
              >
                {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
