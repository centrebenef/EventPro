import { Check, MapPin, Star, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CATEGORY_LABELS, formatDH } from '../utils/pdfExport.ts';

export function CompareModal() {
  const {
    compareModalOpen,
    setCompareModalOpen,
    compareIds,
    toggleCompare,
    providers,
    openBookingModal,
    openProviderDetail,
  } = useApp();

  if (!compareModalOpen) return null;

  const compared = providers.filter((p) => compareIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-[#151515]/10 overflow-hidden my-auto">
        <div className="bg-[#151515] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#C9A45C]">Comparateur de prestataires</span>
            <h3 className="font-display text-2xl font-semibold">
              Comparer vos sélections ({compared.length}/3)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setCompareModalOpen(false)}
            className="p-2 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          {compared.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#777777]">
              Sélectionnez jusqu&apos;à 3 prestataires depuis le catalogue pour comparer leurs tarifs,
              capacités et services inclus.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-[640px]">
              {compared.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#F7F4EF] border border-[#151515]/10 rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#777777]">{CATEGORY_LABELS[p.categorySlug]}</span>
                        <h4 className="font-display text-xl font-semibold text-[#151515]">{p.name}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCompare(p.id)}
                        className="text-xs text-[#777777] hover:text-red-700"
                      >
                        Retirer
                      </button>
                    </div>

                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#EFEAE1]">
                      {p.gallery[0] && (
                        <img src={p.gallery[0]} alt={p.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-[#151515]/10">
                      <div className="flex justify-between">
                        <span className="text-[#777777]">Quartier</span>
                        <span className="font-semibold inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C9A45C]" />
                          {p.district}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#777777]">Tarif à partir de</span>
                        <span className="font-mono font-bold text-[#151515] tabular-nums">
                          {formatDH(p.priceFrom)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#777777]">Note moyenne</span>
                        <span className="font-mono font-semibold inline-flex items-center gap-1 tabular-nums">
                          <Star className="w-3 h-3 text-[#C9A45C] fill-[#C9A45C]" />
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#777777]">Capacité</span>
                        <span className="tabular-nums">
                          {p.capacityMax > 0 ? `${p.capacityMin} – ${p.capacityMax} inv.` : 'Flexible'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#151515]/10">
                      <span className="block text-[11px] font-semibold text-[#777777] mb-1.5">
                        Services &amp; équipements clés
                      </span>
                      <ul className="space-y-1">
                        {[...p.servicesIncluded, ...p.equipments].slice(0, 4).map((s) => (
                          <li key={s} className="flex items-start gap-1.5 text-xs text-[#151515]/85">
                            <Check className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#151515]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setCompareModalOpen(false);
                        openProviderDetail(p);
                      }}
                      className="py-2 text-xs font-semibold border border-[#151515]/20 rounded-lg hover:border-[#151515]"
                    >
                      Détails
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCompareModalOpen(false);
                        openBookingModal(p);
                      }}
                      className="py-2 text-xs font-semibold bg-[#151515] text-white rounded-lg hover:bg-[#C9A45C] hover:text-[#151515]"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
