import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  Share2,
  Star,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CATEGORY_LABELS, formatDH } from '../utils/pdfExport.ts';
import type { Review } from '../types.ts';

export function ProviderDetailModal() {
  const {
    selectedProvider,
    closeProviderDetail,
    openBookingModal,
    openQuoteModal,
    favoriteIds,
    toggleFavorite,
    user,
    openAuthModal,
    showToast,
  } = useApp();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewEventType, setReviewEventType] = useState('Mariage');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!selectedProvider) return;
    setActivePhotoIndex(0);
    fetch(`/api/providers/${selectedProvider.id}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setUnavailableDates(data.unavailableDates || []);
      })
      .catch(() => {});
  }, [selectedProvider]);

  if (!selectedProvider) return null;

  const isFav = favoriteIds.includes(selectedProvider.id);
  const gallery = selectedProvider.gallery.length > 0 ? selectedProvider.gallery : [];

  const handleShare = async () => {
    const shareText = `${selectedProvider.name} sur EVENT PRO Casablanca (${selectedProvider.district}) — à partir de ${formatDH(selectedProvider.priceFrom)}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      showToast('Lien et fiche copiés dans le presse-papiers.', 'success');
    } else {
      showToast(shareText, 'info');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          rating: reviewRating,
          comment: reviewComment,
          eventType: reviewEventType,
        }),
      });
      if (res.ok) {
        showToast('Merci ! Votre avis a été publié.', 'success');
        setReviewComment('');
        const detail = await fetch(`/api/providers/${selectedProvider.id}`).then((r) => r.json());
        setReviews(detail.reviews || []);
      } else {
        const d = await res.json();
        showToast(d.error || 'Erreur lors de la publication.', 'error');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Next 18 upcoming weekend/event dates for availability calendar preview
  const upcomingDates: string[] = [];
  const baseDate = new Date();
  for (let i = 3; i <= 45; i += 2) {
    const d = new Date(baseDate.getTime() + i * 86400000);
    upcomingDates.push(d.toISOString().slice(0, 10));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F7F4EF] w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-[#151515]/10 my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-[#151515]/10 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#777777]">
              <span>{CATEGORY_LABELS[selectedProvider.categorySlug]}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedProvider.subCategory}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedProvider.district}, Casablanca</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#151515]">
              {selectedProvider.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              title="Partager la fiche"
              className="p-2.5 rounded-lg border border-[#151515]/15 text-[#151515] hover:border-[#C9A45C] transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(selectedProvider.id)}
              title="Favoris"
              className={`p-2.5 rounded-lg border transition-colors ${
                isFav
                  ? 'bg-[#C9A45C] border-[#C9A45C] text-[#151515]'
                  : 'border-[#151515]/15 text-[#151515] hover:border-[#C9A45C]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={closeProviderDetail}
              aria-label="Fermer"
              className="p-2.5 rounded-lg bg-[#151515] text-white hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Gallery & Key Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="relative aspect-[16/10] bg-[#EFEAE1] rounded-xl overflow-hidden group">
                {gallery[activePhotoIndex] && (
                  <img
                    src={gallery[activePhotoIndex]}
                    alt={selectedProvider.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
                {gallery[activePhotoIndex] && (
                  <button
                    type="button"
                    onClick={() => setZoomImage(gallery[activePhotoIndex])}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-[#151515]/80 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Agrandir la photo
                  </button>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activePhotoIndex === idx ? 'border-[#C9A45C]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Booking Summary Card */}
            <div className="bg-white border border-[#151515]/10 rounded-xl p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#151515]/10">
                  <div>
                    <span className="text-xs text-[#777777] block">Tarif à partir de</span>
                    <span className="font-mono text-2xl font-bold text-[#151515] tabular-nums">
                      {formatDH(selectedProvider.priceFrom)}
                    </span>
                    <span className="text-xs text-[#777777] block">{selectedProvider.priceUnit}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-[#151515] tabular-nums">
                      <Star className="w-4 h-4 text-[#C9A45C] fill-[#C9A45C]" />
                      {selectedProvider.rating.toFixed(1)}
                    </span>
                    <span className="block text-xs text-[#777777]">{selectedProvider.reviewCount} avis vérifiés</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm text-[#151515]/80">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                    <span>{selectedProvider.address}</span>
                  </div>
                  {selectedProvider.capacityMax > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#C9A45C] shrink-0" />
                      <span className="tabular-nums">
                        {selectedProvider.capacityMin} à {selectedProvider.capacityMax} invités
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeProviderDetail();
                    openBookingModal(selectedProvider);
                  }}
                  className="w-full py-3 bg-[#151515] text-white text-sm font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
                >
                  Réserver ce prestataire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeProviderDetail();
                    openQuoteModal(selectedProvider);
                  }}
                  className="w-full py-3 border border-[#151515]/20 text-[#151515] text-sm font-semibold rounded-lg hover:border-[#151515] transition-colors"
                >
                  Demander un devis personnalisé
                </button>
                <a
                  href={`https://wa.me/212661000000?text=${encodeURIComponent(
                    `Bonjour EVENT PRO, je suis intéressé(e) par ${selectedProvider.name} à Casablanca.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#F7F4EF] text-[#151515] text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 hover:bg-[#EFEAE1] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#C9A45C]" />
                  Contacter via WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Description + Equipments & Included */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#151515]/10 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-2xl font-semibold text-[#151515]">Présentation</h3>
              <p className="text-sm text-[#151515]/80 leading-relaxed">{selectedProvider.description}</p>

              {selectedProvider.videoUrl && (
                <div className="pt-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8843E] mb-2">
                    <Play className="w-3.5 h-3.5" />
                    Vidéo de démonstration
                  </div>
                  <div className="p-4 rounded-lg bg-[#151515] text-white flex items-center justify-between gap-4">
                    <span className="text-xs text-white/80">
                      Showreel officiel de {selectedProvider.name} — Casablanca
                    </span>
                    <a
                      href={selectedProvider.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#C9A45C] text-[#151515] text-xs font-semibold rounded-md shrink-0"
                    >
                      Visionner le showreel
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-5">
              {selectedProvider.equipments.length > 0 && (
                <div>
                  <h4 className="font-display text-lg font-semibold text-[#151515] mb-2.5">
                    Équipements &amp; Atouts
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedProvider.equipments.map((eq) => (
                      <li key={eq} className="flex items-start gap-2 text-xs text-[#151515]/80">
                        <Check className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                        <span>{eq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedProvider.servicesIncluded.length > 0 && (
                <div>
                  <h4 className="font-display text-lg font-semibold text-[#151515] mb-2.5">
                    Services inclus
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedProvider.servicesIncluded.map((srv) => (
                      <li key={srv} className="flex items-start gap-2 text-xs text-[#151515]/80">
                        <Check className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Formules & Menus Traiteur */}
          {selectedProvider.formulas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-semibold text-[#151515]">Formules proposées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProvider.formulas.map((f) => (
                  <div key={f.name} className="bg-white border border-[#151515]/10 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <h4 className="font-display text-xl font-semibold text-[#151515]">{f.name}</h4>
                        <span className="font-mono text-sm font-bold text-[#A8843E] tabular-nums whitespace-nowrap">
                          {formatDH(f.price)}
                        </span>
                      </div>
                      <p className="text-xs text-[#777777] mb-3">{f.description}</p>
                      <ul className="space-y-1">
                        {f.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-1.5 text-xs text-[#151515]/80">
                            <Check className="w-3.5 h-3.5 text-[#C9A45C]" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProvider.menus.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-semibold text-[#151515]">Menus disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedProvider.menus.map((m) => (
                  <div key={m.name} className="bg-white border border-[#151515]/10 rounded-xl p-5">
                    <div className="flex items-baseline justify-between gap-2 mb-3">
                      <h4 className="font-display text-lg font-semibold text-[#151515]">{m.name}</h4>
                      <span className="font-mono text-xs font-bold text-[#A8843E] tabular-nums whitespace-nowrap">
                        {formatDH(m.pricePerPerson)} / pers.
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#151515]/80">
                      {m.items.map((dish) => (
                        <li key={dish} className="flex items-start gap-1.5">
                          <span className="text-[#C9A45C]">•</span>
                          <span>{dish}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Calendar Preview */}
          <div className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C9A45C]" />
                <h3 className="font-display text-2xl font-semibold text-[#151515]">
                  Calendrier des disponibilités
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#777777]">
                <span>Disponible : fond clair</span>
                <span aria-hidden="true">·</span>
                <span className="text-red-700 font-medium">Réservé / Indisponible : barré</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {upcomingDates.map((d) => {
                const busy = unavailableDates.includes(d);
                return (
                  <div
                    key={d}
                    className={`px-2 py-2 rounded-lg text-center text-xs font-mono tabular-nums border ${
                      busy
                        ? 'bg-red-50 border-red-200 text-red-700 line-through'
                        : 'bg-[#F7F4EF] border-[#151515]/10 text-[#151515]'
                    }`}
                  >
                    {d.slice(5)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Reviews & Add Review */}
          <div className="bg-white border border-[#151515]/10 rounded-xl p-6 space-y-6">
            <h3 className="font-display text-2xl font-semibold text-[#151515]">
              Avis clients ({reviews.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-[#F7F4EF] border border-[#151515]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#151515]">{r.authorName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-[#A8843E]">
                      <Star className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                      {r.rating}/5
                    </span>
                  </div>
                  <p className="text-xs text-[#777777]">{r.eventType}</p>
                  <p className="text-sm text-[#151515]/85 leading-relaxed">{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-[#777777]">Aucun avis pour le moment. Soyez le premier à partager votre expérience.</p>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-[#151515]/10 space-y-3">
              <h4 className="text-sm font-semibold text-[#151515]">Laisser un avis vérifié</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                >
                  <option value={5}>5 étoiles — Exceptionnel</option>
                  <option value={4}>4 étoiles — Très satisfait</option>
                  <option value={3}>3 étoiles — Correct</option>
                  <option value={2}>2 étoiles — Moyen</option>
                  <option value={1}>1 étoile — Décevant</option>
                </select>
                <input
                  type="text"
                  value={reviewEventType}
                  onChange={(e) => setReviewEventType(e.target.value)}
                  placeholder="Type d'événement (ex: Mariage)"
                  className="px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
                />
              </div>
              <textarea
                rows={2}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Partagez votre retour d'expérience..."
                className="w-full px-3 py-2 rounded-lg border border-[#151515]/20 text-sm bg-white"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-[#151515] text-white text-xs font-semibold rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors"
              >
                {submittingReview ? 'Publication...' : 'Publier mon avis'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={zoomImage} alt="Zoom" className="max-w-full max-h-[88vh] rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
