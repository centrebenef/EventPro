import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Check,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  Star,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CASABLANCA_DISTRICTS, formatDH } from '../utils/pdfExport.ts';
import type { AvailabilityEntry, Booking, Provider, QuoteRequest, Review, ServiceItem } from '../types.ts';

type ProviderTab =
  | 'stats'
  | 'profile'
  | 'services'
  | 'availability'
  | 'bookings'
  | 'quotes'
  | 'reviews';

export function ProviderDashboard() {
  const { user, showToast, refreshProviders } = useApp();
  const [tab, setTab] = useState<ProviderTab>('stats');

  const [myProviders, setMyProviders] = useState<Provider[]>([]);
  const [activeProvId, setActiveProvId] = useState<string>('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);

  // Profile edit form
  const [formState, setFormState] = useState({
    name: '',
    district: 'Maarif',
    address: '',
    shortBio: '',
    description: '',
    priceFrom: 10000,
    priceUnit: 'par événement',
    capacityMin: 20,
    capacityMax: 300,
    phone: '',
    email: '',
    videoUrl: '',
    galleryText: '',
  });

  // New service form
  const [newSrv, setNewSrv] = useState({
    title: '',
    description: '',
    price: 5000,
    priceUnit: 'par événement',
    duration: 'Journée',
  });

  // Block date input
  const [blockDate, setBlockDate] = useState('2026-12-31');

  // Reply quote state
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyPrice, setReplyPrice] = useState<Record<string, number>>({});

  const loadWorkspace = async () => {
    const [myRes, bkRes, qtRes] = await Promise.all([
      fetch('/api/provider/my-data'),
      fetch('/api/bookings'),
      fetch('/api/quotes'),
    ]);
    if (myRes.ok) {
      const d = await myRes.json();
      setMyProviders(d.providers || []);
      setServices(d.services || []);
      setReviews(d.reviews || []);
      if (d.providers?.[0] && !activeProvId) {
        setActiveProvId(d.providers[0].id);
      }
    }
    if (bkRes.ok) setBookings((await bkRes.json()).bookings || []);
    if (qtRes.ok) setQuotes((await qtRes.json()).quotes || []);
  };

  useEffect(() => {
    if (user && (user.role === 'provider' || user.role === 'admin')) {
      loadWorkspace();
    }
  }, [user]);

  const activeProvider = myProviders.find((p) => p.id === activeProvId) || myProviders[0];

  useEffect(() => {
    if (!activeProvider) return;
    setFormState({
      name: activeProvider.name,
      district: activeProvider.district,
      address: activeProvider.address,
      shortBio: activeProvider.shortBio,
      description: activeProvider.description,
      priceFrom: activeProvider.priceFrom,
      priceUnit: activeProvider.priceUnit,
      capacityMin: activeProvider.capacityMin,
      capacityMax: activeProvider.capacityMax,
      phone: activeProvider.phone,
      email: activeProvider.email,
      videoUrl: activeProvider.videoUrl,
      galleryText: activeProvider.gallery.join('\n'),
    });

    fetch(`/api/availability/${activeProvider.id}`)
      .then((r) => r.json())
      .then((d) => setAvailability(d.availability || []));
  }, [activeProvider]);

  if (!user || (user.role !== 'provider' && user.role !== 'admin')) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-3">
        <h2 className="font-display text-3xl font-semibold">Espace Prestataire réservé</h2>
        <p className="text-sm text-[#777777]">Connectez-vous avec un compte professionnel pour gérer vos prestations.</p>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvider) return;
    const gallery = formState.galleryText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch(`/api/provider/profile/${activeProvider.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formState,
        gallery,
        formulas: activeProvider.formulas,
      }),
    });
    if (res.ok) {
      showToast('Profil professionnel mis à jour.', 'success');
      loadWorkspace();
      refreshProviders();
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProvider || !newSrv.title.trim()) return;
    const res = await fetch('/api/provider/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: activeProvider.id, ...newSrv }),
    });
    if (res.ok) {
      showToast('Prestation ajoutée.', 'success');
      setNewSrv({ title: '', description: '', price: 5000, priceUnit: 'par événement', duration: 'Journée' });
      loadWorkspace();
    }
  };

  const handleDeleteService = async (id: string) => {
    const res = await fetch(`/api/provider/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('Prestation supprimée.', 'info');
    }
  };

  const handleToggleDate = async (date: string, action: 'block' | 'unblock') => {
    if (!activeProvider) return;
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: activeProvider.id, eventDate: date, action }),
    });
    const data = await res.json();
    if (res.ok) {
      setAvailability(data.availability || []);
      showToast(action === 'block' ? `Date ${date} bloquée.` : `Date ${date} libérée.`, 'success');
    } else {
      showToast(data.error || 'Action impossible.', 'error');
    }
  };

  const handleBookingDecision = async (bookingId: string, status: 'Confirmée' | 'Refusée') => {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Réservation ${status.toLowerCase()}.`, 'success');
      loadWorkspace();
    }
  };

  const handleReplyQuote = async (quoteId: string) => {
    const msg = replyText[quoteId];
    const price = replyPrice[quoteId] || 0;
    if (!msg) return;
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyMessage: msg, quotedPrice: price, status: 'Répondu' }),
    });
    if (res.ok) {
      showToast('Réponse au devis envoyée au client.', 'success');
      loadWorkspace();
    }
  };

  const totalRevenue = bookings
    .filter((b) => b.status === 'Confirmée' || b.status === 'Terminée')
    .reduce((s, b) => s + b.totalPrice, 0);

  const menu: { id: ProviderTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'bookings', label: 'Réservations', icon: Calendar },
    { id: 'quotes', label: 'Demandes de devis', icon: FileText },
    { id: 'availability', label: 'Disponibilités', icon: Calendar },
    { id: 'services', label: 'Prestations & Tarifs', icon: Layers },
    { id: 'reviews', label: 'Avis clients', icon: MessageSquare },
    { id: 'profile', label: 'Profil & Médias', icon: UserIcon },
  ];

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-[#151515]/10 rounded-2xl p-4 h-fit space-y-4">
          <div className="px-3 py-2 border-b border-[#151515]/10">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A8843E]">
              Espace Prestataire
            </span>
            <p className="font-display text-xl font-semibold text-[#151515] truncate">
              {activeProvider?.name || user.name}
            </p>
            {myProviders.length > 1 && (
              <select
                value={activeProvId}
                onChange={(e) => setActiveProvId(e.target.value)}
                className="mt-2 w-full px-2 py-1.5 rounded border border-[#151515]/15 text-xs bg-[#F7F4EF]"
              >
                {myProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <nav className="space-y-1">
            {menu.map((m) => (
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

        <main className="flex-1 space-y-6">
          {activeProvider?.status === 'pending' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium">
              Votre compte prestataire est en attente de validation par l&apos;administrateur EVENT PRO avant la publication publique de vos services.
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Réservations reçues</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">{bookings.length}</p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Demandes de devis</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">{quotes.length}</p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Note moyenne</span>
                  <p className="font-mono text-2xl font-bold text-[#A8843E] mt-1 tabular-nums">
                    {activeProvider ? activeProvider.rating.toFixed(1) : '5.0'} / 5
                  </p>
                </div>
                <div className="bg-white border border-[#151515]/10 rounded-xl p-5">
                  <span className="text-xs text-[#777777]">Revenus confirmés</span>
                  <p className="font-mono text-2xl font-bold text-[#151515] mt-1 tabular-nums">
                    {formatDH(totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-3">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Dernières demandes clients
                </h2>
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="py-3 border-b border-[#151515]/10 last:border-b-0 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono text-xs text-[#A8843E]">{b.bookingNumber}</span>
                      <p className="font-semibold">{b.clientName} — {b.eventType}</p>
                      <p className="text-xs text-[#777777]">{b.eventDate} · {b.guests} inv. · {b.status}</p>
                    </div>
                    <span className="font-mono font-bold tabular-nums">{formatDH(b.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Gestion des réservations</h2>
              {bookings.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucune réservation reçue.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#A8843E]">{b.bookingNumber} · {b.status}</span>
                        <h3 className="font-semibold text-sm text-[#151515]">{b.clientName} ({b.clientPhone})</h3>
                        <p className="text-xs text-[#777777]">
                          {b.eventType} le {b.eventDate} à {b.eventTime} · {b.guests} invités · {b.formulaName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-sm font-bold mr-2 tabular-nums">{formatDH(b.totalPrice)}</span>
                        {b.status === 'En attente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleBookingDecision(b.id, 'Confirmée')}
                              className="px-3 py-1.5 bg-[#151515] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 hover:bg-[#C9A45C] hover:text-[#151515]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accepter
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBookingDecision(b.id, 'Refusée')}
                              className="px-3 py-1.5 border border-red-300 text-red-700 bg-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'quotes' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Demandes de devis</h2>
              {quotes.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucune demande de devis.</p>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-bold text-[#A8843E]">{q.quoteNumber} · {q.status}</span>
                        <span className="text-[#777777]">{q.eventType} le {q.eventDate} ({q.guests} inv.)</span>
                      </div>
                      <p className="text-sm font-semibold text-[#151515]">
                        {q.clientName} ({q.clientEmail} · {q.clientPhone})
                      </p>
                      <p className="text-xs text-[#777777]">{q.message}</p>

                      {q.status === 'En attente' ? (
                        <div className="pt-2 border-t border-[#151515]/10 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Votre réponse personnalisée..."
                            value={replyText[q.id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                            className="sm:col-span-2 px-3 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Tarif DH"
                              value={replyPrice[q.id] || ''}
                              onChange={(e) => setReplyPrice({ ...replyPrice, [q.id]: Number(e.target.value) })}
                              className="w-28 px-2.5 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => handleReplyQuote(q.id)}
                              className="px-3 py-2 bg-[#151515] text-white text-xs font-semibold rounded-lg"
                            >
                              Répondre
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#151515] bg-white p-3 rounded-lg border border-[#151515]/10">
                          <strong>Réponse envoyée ({formatDH(q.quotedPrice)}) :</strong> {q.replyMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'availability' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Gérer mes disponibilités
              </h2>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Bloquer une date</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleDate(blockDate, 'block')}
                  className="px-4 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg"
                >
                  Marquer indisponible
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {availability.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold block tabular-nums">{a.eventDate}</span>
                      <span className="text-[#777777]">
                        {a.status === 'booked' ? 'Réservé client' : 'Bloqué manuellement'}
                      </span>
                    </div>
                    {a.status === 'blocked' && (
                      <button
                        type="button"
                        onClick={() => handleToggleDate(a.eventDate, 'unblock')}
                        className="text-red-700 hover:underline font-semibold"
                      >
                        Libérer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-6">
              <form onSubmit={handleAddService} className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Ajouter une prestation &amp; tarif
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Titre de la prestation *"
                    value={newSrv.title}
                    onChange={(e) => setNewSrv({ ...newSrv, title: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Tarif en DH"
                    value={newSrv.price}
                    onChange={(e) => setNewSrv({ ...newSrv, price: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="Unité (ex: par soirée)"
                    value={newSrv.priceUnit}
                    onChange={(e) => setNewSrv({ ...newSrv, priceUnit: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Description détaillée..."
                  value={newSrv.description}
                  onChange={(e) => setNewSrv({ ...newSrv, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la prestation
                </button>
              </form>

              <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-3">
                <h3 className="font-display text-xl font-semibold">Mes prestations actives</h3>
                {services.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-[#151515]">{s.title}</h4>
                      <p className="text-xs text-[#777777]">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold tabular-nums">{formatDH(s.price)}</span>
                      <button type="button" onClick={() => handleDeleteService(s.id)} className="text-[#777777] hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">Avis clients reçus</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#777777]">Aucun avis pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 space-y-1">
                      <div className="flex justify-between text-xs">
                        <strong>{r.authorName}</strong>
                        <span className="inline-flex items-center gap-1 font-mono text-[#A8843E]">
                          <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                          {r.rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-[#151515]/85">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleProfileSave} className="bg-white border border-[#151515]/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Profil professionnel, photos &amp; tarifs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nom commercial</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Quartier (Casablanca)</label>
                  <select
                    value={formState.district}
                    onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                  >
                    {CASABLANCA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tarif à partir de (DH)</label>
                  <input
                    type="number"
                    value={formState.priceFrom}
                    onChange={(e) => setFormState({ ...formState, priceFrom: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Téléphone de contact</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Bio courte</label>
                <input
                  type="text"
                  value={formState.shortBio}
                  onChange={(e) => setFormState({ ...formState, shortBio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Présentation complète</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">URL Vidéo de démonstration</label>
                  <input
                    type="text"
                    value={formState.videoUrl}
                    onChange={(e) => setFormState({ ...formState, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">URLs des photos (1 par ligne)</label>
                  <textarea
                    rows={3}
                    value={formState.galleryText}
                    onChange={(e) => setFormState({ ...formState, galleryText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-xs font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515]"
              >
                Sauvegarder le profil professionnel
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
