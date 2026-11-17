import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CASABLANCA_DISTRICTS, EVENT_TYPES, formatDH } from '../utils/pdfExport.ts';
import type { CategorySlug } from '../types.ts';

export function BookingModal() {
  const { bookingTarget, closeBookingModal, user, showToast, refreshNotifications } = useApp();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventType, setEventType] = useState<string>('Mariage');
  const [eventDate, setEventDate] = useState('2026-12-26');
  const [eventTime, setEventTime] = useState('19:30');
  const [location, setLocation] = useState('Anfa, Casablanca');
  const [guests, setGuests] = useState(180);
  const [formulaName, setFormulaName] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedNumber, setConfirmedNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingTarget) {
      setConfirmedNumber(null);
      setErrorMsg(null);
      return;
    }
    setClientName(user?.name || '');
    setClientEmail(user?.email || '');
    setClientPhone(user?.phone || '');
    setLocation(`${bookingTarget.district}, Casablanca`);
    setFormulaName(bookingTarget.formulas[0]?.name || 'Formule Standard');
    setSelectedOptions([]);
    setConfirmedNumber(null);
    setErrorMsg(null);

    fetch(`/api/availability/${bookingTarget.id}`)
      .then((r) => r.json())
      .then((d) => {
        setUnavailableDates((d.availability || []).map((a: { eventDate: string }) => a.eventDate));
      })
      .catch(() => {});
  }, [bookingTarget, user]);

  if (!bookingTarget) return null;

  const chosenFormula = bookingTarget.formulas.find((f) => f.name === formulaName);
  const basePrice = chosenFormula
    ? bookingTarget.categorySlug === 'traiteurs' && chosenFormula.price < 2000
      ? chosenFormula.price * guests
      : chosenFormula.price
    : bookingTarget.categorySlug === 'traiteurs' && bookingTarget.priceFrom < 2000
    ? bookingTarget.priceFrom * guests
    : bookingTarget.priceFrom;

  const optionsTotal = selectedOptions.reduce((sum, optName) => {
    const opt = bookingTarget.options.find((o) => o.name === optName);
    return sum + (opt ? opt.price : 0);
  }, 0);

  const totalPrice = basePrice + optionsTotal;
  const dateConflict = unavailableDates.includes(eventDate);

  const toggleOpt = (name: string) => {
    setSelectedOptions((prev) => (prev.includes(name) ? prev.filter((o) => o !== name) : [...prev, name]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (dateConflict) {
      setErrorMsg(`Ce prestataire est déjà réservé le ${eventDate}. Veuillez sélectionner une autre date.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          providerId: bookingTarget.id,
          eventType,
          eventDate,
          eventTime,
          location,
          guests,
          formulaName,
          options: selectedOptions,
          totalPrice,
          comments,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Impossible d\'enregistrer la réservation.');
      } else {
        setConfirmedNumber(data.booking.bookingNumber);
        showToast(`Réservation ${data.booking.bookingNumber} confirmée !`, 'success');
        refreshNotifications();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#151515]/10 overflow-hidden my-auto">
        <div className="bg-[#151515] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#C9A45C]">Système de réservation EVENT PRO</span>
            <h3 className="font-display text-2xl font-semibold">{bookingTarget.name}</h3>
          </div>
          <button
            type="button"
            onClick={closeBookingModal}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedNumber ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-[#C9A45C] mx-auto" />
            <h4 className="font-display text-3xl font-semibold text-[#151515]">
              Demande de réservation enregistrée
            </h4>
            <p className="text-sm text-[#777777]">
              Numéro de réservation unique :{' '}
              <span className="font-mono font-bold text-[#151515]">{confirmedNumber}</span>
            </p>
            <div className="bg-[#F7F4EF] p-4 rounded-xl text-sm text-left space-y-1 border border-[#151515]/10">
              <p><strong>Prestataire :</strong> {bookingTarget.name}</p>
              <p><strong>Date &amp; Heure :</strong> {eventDate} à {eventTime}</p>
              <p><strong>Formule :</strong> {formulaName}</p>
              <p><strong>Montant estimé :</strong> <span className="font-mono font-semibold">{formatDH(totalPrice)}</span></p>
              <p><strong>Statut initial :</strong> En attente de validation prestataire</p>
            </div>
            <p className="text-xs text-[#777777]">
              Une notification a été envoyée au prestataire et ajoutée à votre espace personnel. La date a été bloquée pour éviter toute double réservation.
            </p>
            <button
              type="button"
              onClick={closeBookingModal}
              className="px-6 py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Nom et prénom *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+212 6XX XX XX XX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Type d&apos;événement</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Date de l&apos;événement *</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    dateConflict ? 'border-red-500 bg-red-50' : 'border-[#151515]/20'
                  }`}
                />
                {dateConflict && (
                  <span className="text-[11px] text-red-700 font-medium">
                    Date déjà réservée — choisissez une autre date.
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Heure de début</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Lieu / Quartier</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Nombre d&apos;invités</label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value) || 50)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
                />
              </div>
            </div>

            {bookingTarget.formulas.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1">Formule choisie</label>
                <select
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                >
                  {bookingTarget.formulas.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} — {formatDH(f.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {bookingTarget.options.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#151515] mb-1.5">Options supplémentaires</label>
                <div className="space-y-1.5">
                  {bookingTarget.options.map((opt) => (
                    <label
                      key={opt.name}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#151515]/15 text-xs cursor-pointer hover:bg-[#F7F4EF]"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(opt.name)}
                          onChange={() => toggleOpt(opt.name)}
                          className="accent-[#C9A45C]"
                        />
                        {opt.name}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">+{formatDH(opt.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#151515] mb-1">Commentaires &amp; précisions</label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ex: Horaires d'installation, préférences musicales ou contraintes alimentaires..."
                className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
              />
            </div>

            <div className="pt-3 border-t border-[#151515]/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#777777] block">Estimation totale</span>
                <span className="font-mono text-xl font-bold text-[#151515] tabular-nums">
                  {formatDH(totalPrice)}
                </span>
              </div>
              <button
                type="submit"
                disabled={submitting || dateConflict}
                className="px-6 py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Validation...' : 'Confirmer la réservation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function QuoteModal() {
  const { quoteTarget, closeQuoteModal, user, showToast, refreshNotifications } = useApp();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventType, setEventType] = useState<string>('Mariage');
  const [eventDate, setEventDate] = useState('2026-12-28');
  const [guests, setGuests] = useState(150);
  const [budget, setBudget] = useState(35000);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (quoteTarget) {
      setClientName(user?.name || '');
      setClientEmail(user?.email || '');
      setClientPhone(user?.phone || '');
      setBudget(quoteTarget.priceFrom);
      setMessage('');
    }
  }, [quoteTarget, user]);

  if (!quoteTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          providerId: quoteTarget.id,
          eventType,
          eventDate,
          guests,
          budget,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Demande de devis ${data.quoteNumber} transmise à ${quoteTarget.name}.`, 'success');
        refreshNotifications();
        closeQuoteModal();
      } else {
        showToast(data.error || 'Erreur lors de l\'envoi.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#151515]/10 overflow-hidden my-auto">
        <div className="bg-[#151515] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#C9A45C]">Demande de devis gratuit</span>
            <h3 className="font-display text-2xl font-semibold">{quoteTarget.name}</h3>
          </div>
          <button type="button" onClick={closeQuoteModal} className="p-2 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Nom complet *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
            />
            <input
              type="email"
              required
              placeholder="Email *"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
            />
            <input
              type="number"
              placeholder="Nombre d'invités"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#151515] mb-1">Budget indicatif (DH)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#151515] mb-1">Détails de votre besoin *</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisez vos attentes, lieu à Casablanca, thème..."
              className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
          >
            {submitting ? 'Envoi...' : 'Envoyer ma demande de devis'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AuthModal() {
  const { authModalMode, openAuthModal, closeAuthModal, refreshAuth, showToast, navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [categorySlug, setCategorySlug] = useState<CategorySlug>('salles');
  const [district, setDistrict] = useState<string>('Maarif');
  const [priceFrom, setPriceFrom] = useState(12000);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authModalMode) return null;

  const isLogin = authModalMode === 'login';
  const isProviderReg = authModalMode === 'provider-register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email, password }
        : {
            name,
            email,
            phone,
            password,
            role: isProviderReg ? 'provider' : 'client',
            businessName: isProviderReg ? businessName : undefined,
            categorySlug: isProviderReg ? categorySlug : undefined,
            district: isProviderReg ? district : undefined,
            priceFrom: isProviderReg ? priceFrom : undefined,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return;
      }

      await refreshAuth();
      closeAuthModal();
      showToast(
        isLogin
          ? `Bienvenue, ${data.user.name}`
          : isProviderReg
          ? 'Compte professionnel créé ! Votre fiche sera publiée après validation administrative.'
          : `Bienvenue sur EVENT PRO, ${data.user.name} !`,
        'success'
      );

      if (data.user.role === 'admin') navigate('admin-dashboard');
      else if (data.user.role === 'provider') navigate('provider-dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#151515]/10 overflow-hidden my-auto">
        <div className="bg-[#151515] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#C9A45C]">Espace sécurisé EVENT PRO</span>
            <h3 className="font-display text-2xl font-semibold">
              {isLogin
                ? 'Connexion à votre compte'
                : isProviderReg
                ? 'Inscription Prestataire'
                : 'Créer un compte Client'}
            </h3>
          </div>
          <button type="button" onClick={closeAuthModal} className="p-2 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-1 border-b border-[#151515]/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              isLogin ? 'border-[#C9A45C] text-[#151515]' : 'border-transparent text-[#777777]'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              authModalMode === 'register' ? 'border-[#C9A45C] text-[#151515]' : 'border-transparent text-[#777777]'
            }`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('provider-register')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              isProviderReg ? 'border-[#C9A45C] text-[#151515]' : 'border-transparent text-[#777777]'
            }`}
          >
            Prestataire Pro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <input
                type="text"
                required
                placeholder="Nom et prénom *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
              <input
                type="tel"
                placeholder="Téléphone (+212 6XX...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
              />
            </>
          )}

          {isProviderReg && (
            <div className="p-3.5 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 space-y-2.5">
              <p className="text-xs font-semibold text-[#151515]">Informations de votre établissement</p>
              <input
                type="text"
                required
                placeholder="Nom commercial / Studio / Salle *"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value as CategorySlug)}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white"
                >
                  <option value="salles">Salle de réception</option>
                  <option value="photographes">Photographe / Vidéaste</option>
                  <option value="traiteurs">Traiteur</option>
                  <option value="dj">DJ &amp; Animation</option>
                  <option value="decoration">Décoration</option>
                  <option value="organisation">Organisateur</option>
                </select>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white"
                >
                  {CASABLANCA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                placeholder="Tarif à partir de (DH)"
                value={priceFrom}
                onChange={(e) => setPriceFrom(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-xs bg-white tabular-nums"
              />
            </div>
          )}

          <input
            type="email"
            required
            placeholder="Adresse email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
          />

          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe (6 car. min) *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#151515]/20 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
          >
            {submitting
              ? 'Traitement...'
              : isLogin
              ? 'Se connecter'
              : isProviderReg
              ? 'Soumettre mon dossier prestataire'
              : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
