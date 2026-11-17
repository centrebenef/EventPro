import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import {
  CASABLANCA_DISTRICTS,
  CATEGORY_LABELS,
  EVENT_TYPES,
  formatDH,
  generateProjectQuotePdf,
} from '../utils/pdfExport.ts';
import type { CategorySlug, EventBuilderSelectedProvider, Provider } from '../types.ts';

const BUILDER_CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: 'salles', label: 'Salle de réception' },
  { slug: 'photographes', label: 'Photographe & Vidéaste' },
  { slug: 'traiteurs', label: 'Traiteur' },
  { slug: 'dj', label: 'DJ & Animation' },
  { slug: 'decoration', label: 'Décoration' },
  { slug: 'organisation', label: 'Organisation complète' },
];

export function EventBuilderPage() {
  const { user, openAuthModal, showToast, refreshNotifications } = useApp();

  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<string>('Mariage');
  const [eventDate, setEventDate] = useState('2026-12-27');
  const [district, setDistrict] = useState<string>('Anfa');
  const [guests, setGuests] = useState(200);
  const [budget, setBudget] = useState(180000);
  const [selectedServices, setSelectedServices] = useState<CategorySlug[]>([
    'salles',
    'photographes',
    'traiteurs',
    'dj',
    'decoration',
  ]);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<EventBuilderSelectedProvider[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Load real providers available for the selected date
  useEffect(() => {
    const params = new URLSearchParams();
    if (eventDate) params.set('date', eventDate);
    fetch(`/api/providers?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setAvailableProviders(d.providers || []))
      .catch(() => {});
  }, [eventDate]);

  const computeProviderEstimate = (p: Provider): number => {
    if (p.categorySlug === 'traiteurs' && p.priceFrom < 2000) {
      return p.priceFrom * guests;
    }
    return p.priceFrom;
  };

  const toggleService = (slug: CategorySlug) => {
    setSelectedServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const selectProviderForCategory = (p: Provider) => {
    const price = computeProviderEstimate(p);
    setSelectedProviders((prev) => {
      const exists = prev.find((item) => item.providerId === p.id);
      if (exists) {
        return prev.filter((item) => item.providerId !== p.id);
      }
      // Replace existing provider in same category or add
      const filtered = prev.filter((item) => item.categorySlug !== p.categorySlug);
      return [
        ...filtered,
        {
          providerId: p.id,
          providerName: p.name,
          categorySlug: p.categorySlug,
          price,
          formulaName: p.formulas[0]?.name || 'Formule standard',
        },
      ];
    });
  };

  const removeSelectedProvider = (providerId: string) => {
    setSelectedProviders((prev) => prev.filter((p) => p.providerId !== providerId));
  };

  const totalCost = selectedProviders.reduce((sum, item) => sum + item.price, 0);
  const remainingBudget = budget - totalCost;

  const handleSaveProject = async () => {
    if (!user) {
      showToast('Connectez-vous pour sauvegarder votre projet dans votre espace.', 'info');
      openAuthModal('login');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${eventType} à ${district} (${guests} inv.)`,
          eventType,
          eventDate,
          district,
          guests,
          budget,
          selectedServices,
          selectedProviders,
          totalCost,
          status: 'Sauvegardé',
        }),
      });
      if (res.ok) {
        showToast('Projet EVENT BUILDER sauvegardé dans votre espace client !', 'success');
      } else {
        const d = await res.json();
        showToast(d.error || 'Erreur lors de la sauvegarde.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    generateProjectQuotePdf({
      title: `${eventType} à ${district} — Casablanca`,
      eventType,
      eventDate,
      district,
      guests,
      budget,
      selectedProviders,
      totalCost,
      clientName: user?.name,
    });
    showToast('Devis PDF téléchargé.', 'success');
  };

  const handleSendRequests = async () => {
    if (!user) {
      showToast('Connectez-vous pour envoyer vos demandes de devis aux prestataires.', 'info');
      openAuthModal('login');
      return;
    }
    if (selectedProviders.length === 0) {
      showToast('Sélectionnez au moins un prestataire avant d\'envoyer votre demande.', 'error');
      return;
    }
    setSending(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${eventType} à ${district} (${guests} inv.)`,
          eventType,
          eventDate,
          district,
          guests,
          budget,
          selectedServices,
          selectedProviders,
          totalCost,
          status: 'Demande envoyée',
        }),
      });

      for (const item of selectedProviders) {
        await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: user.name,
            clientEmail: user.email,
            clientPhone: user.phone || '+212 600 00 00 00',
            providerId: item.providerId,
            eventType,
            eventDate,
            guests,
            budget: item.price,
            message: `Demande issue d'EVENT BUILDER pour un(e) ${eventType} à ${district} (${guests} invités). Budget global : ${formatDH(budget)}.`,
          }),
        });
      }
      refreshNotifications();
      showToast(
        `${selectedProviders.length} demande(s) envoyée(s) aux prestataires sélectionnés !`,
        'success'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#A8843E]">
            Outil exclusif EVENT PRO
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#151515]">
            EVENT BUILDER
          </h1>
          <p className="text-sm text-[#777777]">
            Construisez votre événement à Casablanca étape par étape et maîtrisez votre budget en DH.
          </p>
        </div>

        {/* Stepper Bar */}
        <div className="bg-white border border-[#151515]/10 rounded-xl p-3 flex items-center justify-between gap-2 overflow-x-auto">
          {[
            '1. Événement',
            '2. Date & Lieu',
            '3. Invités',
            '4. Budget',
            '5. Prestations',
            '6. Prestataires',
            '7. Récapitulatif',
          ].map((label, idx) => {
            const sNum = idx + 1;
            const active = step === sNum;
            const done = step > sNum;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(sNum)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#151515] text-white'
                    : done
                    ? 'bg-[#C9A45C]/20 text-[#151515]'
                    : 'text-[#777777] hover:text-[#151515]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="bg-white border border-[#151515]/10 rounded-2xl p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Étape 1 : Quel type d&apos;événement organisez-vous ?
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  'Mariage',
                  'Fiançailles',
                  'Anniversaire',
                  'Baptême',
                  'Soirée privée',
                  'Conférence',
                  'Séminaire',
                  'Événement professionnel',
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all ${
                      eventType === type
                        ? 'bg-[#151515] text-white border-[#151515]'
                        : 'bg-[#F7F4EF] text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Étape 2 : Date souhaitée &amp; Quartier à Casablanca
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#151515] mb-1.5">
                    Date de l&apos;événement
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#151515]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#151515] mb-1.5">
                    Quartier privilégié
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#151515]/20 text-sm bg-white"
                  >
                    {CASABLANCA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}, Casablanca</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Étape 3 : Combien d&apos;invités attendez-vous ?
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#777777]">Nombre d&apos;invités estimé</span>
                  <span className="font-mono text-2xl font-bold text-[#151515] tabular-nums">
                    {guests} personnes
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={650}
                  step={10}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full accent-[#C9A45C]"
                />
                <div className="flex justify-between text-xs text-[#777777] tabular-nums">
                  <span>20 invités</span>
                  <span>300 invités</span>
                  <span>650 invités</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Étape 4 : Définissez votre budget global (DH)
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#777777]">Budget maximal alloué</span>
                  <span className="font-mono text-2xl font-bold text-[#A8843E] tabular-nums">
                    {formatDH(budget)}
                  </span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={600000}
                  step={5000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-[#C9A45C]"
                />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value) || 0)}
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-[#151515]/20 text-sm font-mono tabular-nums"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#151515]">
                Étape 5 : Sélectionnez les prestations souhaitées
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BUILDER_CATEGORIES.map((cat) => {
                  const active = selectedServices.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleService(cat.slug)}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        active
                          ? 'bg-[#151515] text-white border-[#151515]'
                          : 'bg-[#F7F4EF] text-[#151515] border-[#151515]/10'
                      }`}
                    >
                      <span className="text-sm font-semibold">{cat.label}</span>
                      {active && <Check className="w-4 h-4 text-[#C9A45C]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#151515]">
                  Étape 6 : Sélectionnez vos prestataires disponibles le {eventDate}
                </h2>
                <p className="text-xs text-[#777777] mt-1">
                  Seuls les prestataires vérifiés et disponibles à la date choisie sont affichés.
                </p>
              </div>

              {selectedServices.map((catSlug) => {
                const matching = availableProviders.filter((p) => p.categorySlug === catSlug);
                return (
                  <div key={catSlug} className="space-y-3 pt-4 border-t border-[#151515]/10 first:border-t-0 first:pt-0">
                    <h3 className="font-display text-xl font-semibold text-[#151515]">
                      {CATEGORY_LABELS[catSlug]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {matching.map((p) => {
                        const isPicked = selectedProviders.some((sp) => sp.providerId === p.id);
                        const est = computeProviderEstimate(p);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProviderForCategory(p)}
                            className={`p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                              isPicked
                                ? 'bg-[#151515] text-white border-[#C9A45C]'
                                : 'bg-[#F7F4EF] text-[#151515] border-[#151515]/10 hover:border-[#C9A45C]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{p.name}</div>
                              <div className={`text-xs ${isPicked ? 'text-white/70' : 'text-[#777777]'}`}>
                                {p.district} · Note {p.rating.toFixed(1)}/5
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-sm font-bold text-[#C9A45C] tabular-nums block">
                                {formatDH(est)}
                              </span>
                              <span className={`text-[11px] ${isPicked ? 'text-white' : 'text-[#777777]'}`}>
                                {isPicked ? 'Sélectionné' : 'Choisir'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl font-semibold text-[#151515]">
                  Récapitulatif personnalisé de votre événement
                </h2>
                <p className="text-xs text-[#777777] mt-1">
                  {eventType} à {district}, Casablanca · Date : {eventDate} · {guests} invités
                </p>
              </div>

              {/* KPI Budget Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10">
                  <span className="text-xs text-[#777777] block">Budget global</span>
                  <span className="font-mono text-2xl font-bold text-[#151515] tabular-nums">
                    {formatDH(budget)}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10">
                  <span className="text-xs text-[#777777] block">Coût total estimé</span>
                  <span className="font-mono text-2xl font-bold text-[#A8843E] tabular-nums">
                    {formatDH(totalCost)}
                  </span>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    remainingBudget >= 0
                      ? 'bg-[#151515] text-white border-[#151515]'
                      : 'bg-red-50 text-red-900 border-red-200'
                  }`}
                >
                  <span className="text-xs opacity-75 block">Budget restant</span>
                  <span className="font-mono text-2xl font-bold tabular-nums">
                    {remainingBudget >= 0 ? '+' : ''}
                    {formatDH(remainingBudget)}
                  </span>
                </div>
              </div>

              {/* Selected Providers List */}
              {selectedProviders.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#151515]/20 rounded-xl text-sm text-[#777777]">
                  Aucun prestataire sélectionné. Revenez à l&apos;étape 6 pour composer votre sélection.
                </div>
              ) : (
                <div className="divide-y divide-[#151515]/10 border border-[#151515]/10 rounded-xl overflow-hidden">
                  {selectedProviders.map((item) => (
                    <div
                      key={item.providerId}
                      className="p-4 bg-white flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs text-[#777777]">
                          {CATEGORY_LABELS[item.categorySlug]}
                        </span>
                        <h4 className="font-semibold text-sm text-[#151515]">
                          {item.providerName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-bold text-[#151515] tabular-nums">
                          {formatDH(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelectedProvider(item.providerId)}
                          title="Supprimer"
                          className="p-2 text-[#777777] hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={saving}
                  className="px-5 py-3 border border-[#151515]/20 text-[#151515] text-xs font-semibold rounded-lg hover:border-[#151515] inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#C9A45C]" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder mon projet'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-3 border border-[#151515]/20 text-[#151515] text-xs font-semibold rounded-lg hover:border-[#151515] inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#C9A45C]" />
                  Télécharger mon devis PDF
                </button>
                <button
                  type="button"
                  onClick={handleSendRequests}
                  disabled={sending || selectedProviders.length === 0}
                  className="px-6 py-3 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] disabled:opacity-50 inline-flex items-center gap-2 ml-auto"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi...' : 'Envoyer ma demande'}
                </button>
              </div>
            </div>
          )}

          {/* Step Footer Navigation */}
          <div className="pt-6 border-t border-[#151515]/10 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="px-4 py-2.5 border border-[#151515]/20 rounded-lg text-xs font-semibold disabled:opacity-30 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Précédent
            </button>

            {step < 7 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(7, s + 1))}
                className="px-5 py-2.5 bg-[#151515] text-white rounded-lg text-xs font-semibold hover:bg-[#C9A45C] hover:text-[#151515] inline-flex items-center gap-1.5 transition-colors"
              >
                Étape suivante
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
