import { ArrowLeftRight, Heart, MapPin, Star, Users } from 'lucide-react';
import type { Provider } from '../types.ts';
import { CATEGORY_LABELS, formatDH } from '../utils/pdfExport.ts';
import { useApp } from '../context/AppContext.tsx';
import { ParallaxImage } from './ParallaxImage.tsx';

export function ProviderCard({ provider }: { provider: Provider }) {
  const {
    favoriteIds,
    compareIds,
    toggleFavorite,
    toggleCompare,
    openProviderDetail,
    openBookingModal,
  } = useApp();

  const isFav = favoriteIds.includes(provider.id);
  const isCompared = compareIds.includes(provider.id);
  const coverImage = provider.gallery[0] || '';

  return (
    <article className="group bg-white border border-[#151515]/10 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:border-[#C9A45C]/70 hover:shadow-md">
      <div
        onClick={() => openProviderDetail(provider)}
        className="relative aspect-[4/3] w-full bg-[#EFEAE1] overflow-hidden cursor-pointer"
      >
        {coverImage ? (
          <ParallaxImage
            src={coverImage}
            alt={provider.name}
            intensity={14}
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EFEAE1] to-[#E2D9C8] text-[#777777] text-sm">
            {provider.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

        {/* Top-right functional action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(provider.id);
            }}
            title="Comparer ce prestataire"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm border ${
              isCompared
                ? 'bg-[#C9A45C] text-[#151515] border-[#C9A45C]'
                : 'bg-[#151515]/70 text-white border-white/20 hover:bg-[#151515]'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(provider.id);
            }}
            title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm border ${
              isFav
                ? 'bg-[#C9A45C] text-[#151515] border-[#C9A45C]'
                : 'bg-[#151515]/70 text-white border-white/20 hover:bg-[#151515]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="inline-flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
            {provider.district}, Casablanca
          </span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <Star className="w-3.5 h-3.5 text-[#C9A45C] fill-[#C9A45C]" />
            {provider.rating.toFixed(1)} ({provider.reviewCount})
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Zero-pill unboxed metadata */}
        <div className="flex items-center gap-2 text-xs text-[#777777] mb-1.5">
          <span>{CATEGORY_LABELS[provider.categorySlug]}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{provider.subCategory}</span>
        </div>

        <h3
          onClick={() => openProviderDetail(provider)}
          className="font-display text-2xl font-semibold text-[#151515] leading-snug mb-2 cursor-pointer hover:text-[#A8843E] transition-colors"
        >
          {provider.name}
        </h3>

        <p className="text-sm text-[#777777] line-clamp-2 mb-4 flex-1">
          {provider.shortBio}
        </p>

        {provider.capacityMax > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#777777] mb-4">
            <Users className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span className="tabular-nums">
              Capacité : {provider.capacityMin} – {provider.capacityMax} invités
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-[#151515]/10 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] text-[#777777]">À partir de</span>
            <span className="font-mono text-base font-semibold text-[#151515] tabular-nums">
              {formatDH(provider.priceFrom)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openProviderDetail(provider)}
              className="px-3.5 py-2 text-xs font-semibold border border-[#151515]/20 text-[#151515] rounded-lg hover:border-[#151515] transition-colors whitespace-nowrap shrink-0"
            >
              Voir détails
            </button>
            <button
              type="button"
              onClick={() => openBookingModal(provider)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#151515] text-white rounded-lg hover:bg-[#C9A45C] hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
            >
              Réserver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
