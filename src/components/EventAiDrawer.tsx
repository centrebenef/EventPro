import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CASABLANCA_DISTRICTS, EVENT_TYPES, formatDH } from '../utils/pdfExport.ts';

function formatWhatsAppUrl(rawPhone?: string, rawMessage?: string): string {
  const digitsOnly = (rawPhone || '+212 661 00 11 22').replace(/[^\d]/g, '');
  let normalized = digitsOnly || '212661001122';
  if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('0') && normalized.length === 10) {
    normalized = `212${normalized.slice(1)}`;
  }
  const message =
    (rawMessage || '').trim() ||
    'Bonjour EVENT PRO Casablanca, je souhaite organiser un événement et recevoir des informations sur vos prestataires.';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProviderIds?: string[];
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content:
    'Bonjour et bienvenue sur EVENT PRO Casablanca. Je suis EVENT AI, votre concierge événementiel. Indiquez-moi votre budget, votre nombre d’invités ou vos envies pour recevoir des conseils et une sélection de prestataires vérifiés.',
};

const QUICK_SUGGESTIONS = [
  'Organiser un mariage à Anfa pour 200 invités',
  'Quels prestataires selon mon budget ?',
  'Idées salle + traiteur + DJ',
  'Préparer un événement corporate',
];

function renderFormattedMessage(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, idx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={idx} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <React.Fragment key={idx}>{part}</React.Fragment>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

export function FloatingActionsAndAi() {
  const {
    aiDrawerOpen,
    setAiDrawerOpen,
    providers,
    siteContent,
    openProviderDetail,
    openBookingModal,
    navigate,
  } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const whatsappHref = formatWhatsAppUrl(
    siteContent?.whatsappNumber,
    siteContent?.whatsappPrefilledMessage
  );

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);

  const [eventType, setEventType] = useState('Mariage');
  const [district, setDistrict] = useState('Anfa');
  const [guests, setGuests] = useState(200);
  const [budget, setBudget] = useState(150000);
  const [eventDate, setEventDate] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
  }, [messages, loading, aiDrawerOpen, shouldReduceMotion]);

  const sendPrompt = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: {
            eventType,
            district,
            guests,
            budget,
            date: eventDate || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content:
              data.error ||
              "Une erreur est survenue lors de la consultation d'EVENT AI.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            recommendedProviderIds: data.recommendedProviderIds || [],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content:
            'Connexion au service EVENT AI momentanément indisponible. Veuillez réessayer.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <>
      {/* Floating Concierge Launchers (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        {/* Floating WhatsApp Button with Discreet Pulse */}
        <div className="relative">
          {!shouldReduceMotion && (
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.24, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-[#25D366]/40 pointer-events-none"
            />
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contacter EVENT PRO sur WhatsApp"
            title={`WhatsApp · ${siteContent?.whatsappNumber || '+212 661 00 11 22'}`}
            className="relative h-11 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white border border-white/25 shadow-xl inline-flex items-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current shrink-0"
              aria-hidden="true"
            >
              <path d="M12.03 2C6.5 2 2 6.48 2 12c0 1.97.57 3.87 1.65 5.5L2.4 22l4.64-1.22A10.02 10.02 0 0 0 12.03 22C17.56 22 22 17.52 22 12S17.56 2 12.03 2zm5.84 14.12c-.25.7-1.45 1.33-2 1.42-.52.08-1.18.12-1.91-.11-.44-.14-1.01-.33-1.73-.64-3.04-1.31-5.02-4.38-5.17-4.58-.15-.2-1.23-1.64-1.23-3.12 0-1.48.77-2.21 1.05-2.51.27-.3.6-.38.8-.38h.58c.19 0 .44-.07.69.52.25.61.85 2.08.93 2.23.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.45.54-.15.15-.31.31-.13.62.18.3.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.46 1.52.31.15.49.13.67-.08.18-.2.77-.9.97-1.21.21-.3.41-.25.69-.15.28.1 1.78.84 2.09.99.31.15.51.23.59.35.08.13.08.73-.17 1.43z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Animated Floating EVENT AI Button */}
        <motion.div
          animate={
            !aiDrawerOpen && !shouldReduceMotion
              ? { y: [0, -4, 0] }
              : { y: 0 }
          }
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          {/* Discreet Concentric Halo */}
          {!aiDrawerOpen && !shouldReduceMotion && (
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.12, 0.45] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border border-[#C9A45C] pointer-events-none"
            />
          )}

          <motion.button
            type="button"
            data-motion-button="true"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            aria-expanded={aiDrawerOpen}
            aria-label="Ouvrir l'assistant virtuel EVENT AI"
            className={`relative h-12 px-5 rounded-full shadow-2xl inline-flex items-center gap-2.5 text-xs font-semibold transition-[colors,box-shadow] duration-250 border whitespace-nowrap shrink-0 hover:shadow-[0_8px_26px_-4px_rgba(201,164,92,0.5),0_0_14px_rgba(201,164,92,0.28)] ${
              aiDrawerOpen
                ? 'bg-[#151515] text-[#C9A45C] border-[#C9A45C]/60'
                : 'bg-[#151515] text-white border-[#C9A45C] hover:bg-[#C9A45C] hover:text-[#151515]'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-[#C9A45C]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            </span>
            <span>EVENT AI</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Animated Modern Conversational Widget */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <motion.div
            role="dialog"
            aria-label="Assistant virtuel EVENT AI"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.96 }
            }
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] h-[min(78vh,620px)] bg-white rounded-2xl shadow-2xl border border-[#151515]/15 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-[#151515] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/60 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#C9A45C]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-lg font-semibold leading-none text-white">
                    EVENT AI
                  </h4>
                  <span className="text-[11px] text-white/65 block mt-1 truncate">
                    Concierge Événementiel · Casablanca
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Nouvelle conversation"
                  aria-label="Réinitialiser la conversation"
                  className="p-2 rounded-lg text-white/65 hover:text-[#C9A45C] hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAiDrawerOpen(false)}
                  aria-label="Fermer l'assistant"
                  className="p-2 rounded-lg text-white/65 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Compact Event Parameters Summary & Expandable Controls */}
            <div className="bg-[#F7F4EF] border-b border-[#151515]/10 shrink-0">
              <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-[#151515] truncate tabular-nums">
                  <span className="font-semibold text-[#A8843E]">{eventType}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{guests} inv.</span>
                  <span aria-hidden="true"> · </span>
                  <span>{formatDH(budget)}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{district}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContextPanel((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#151515]/15 text-[11px] font-semibold text-[#151515] hover:border-[#C9A45C] transition-colors whitespace-nowrap shrink-0"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#A8843E]" />
                  {showContextPanel ? 'Masquer' : 'Critères'}
                </button>
              </div>

              <AnimatePresence initial={false}>
                {showContextPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-3 pt-1 grid grid-cols-2 gap-2 text-[11px] border-t border-[#151515]/5"
                  >
                    <div>
                      <label className="text-[#777777] block mb-0.5">Type</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#151515]/15 text-[#151515]"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[#777777] block mb-0.5">Quartier</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#151515]/15 text-[#151515]"
                      >
                        {CASABLANCA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[#777777] block mb-0.5">Invités</label>
                      <input
                        type="number"
                        min={10}
                        max={1000}
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value) || 50)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#151515]/15 tabular-nums text-[#151515]"
                      />
                    </div>
                    <div>
                      <label className="text-[#777777] block mb-0.5">Budget (DH)</label>
                      <input
                        type="number"
                        min={10000}
                        step={5000}
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value) || 20000)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#151515]/15 tabular-nums text-[#151515]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[#777777] block mb-0.5">
                        Date souhaitée (vérifie la disponibilité en direct)
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#151515]/15 text-[#151515]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] px-4 py-3 rounded-2xl text-xs ${
                      m.role === 'user'
                        ? 'bg-[#151515] text-white rounded-br-sm'
                        : 'bg-[#F7F4EF] text-[#151515] border border-[#151515]/10 rounded-bl-sm'
                    }`}
                  >
                    {renderFormattedMessage(m.content)}
                  </div>

                  {/* Interactive Recommended Provider Cards */}
                  {m.recommendedProviderIds && m.recommendedProviderIds.length > 0 && (
                    <div className="mt-2.5 space-y-2 w-full max-w-[92%]">
                      {m.recommendedProviderIds.map((pid) => {
                        const prov = providers.find((p) => p.id === pid);
                        if (!prov) return null;
                        return (
                          <div
                            key={pid}
                            className="p-2.5 rounded-xl border border-[#151515]/10 bg-white hover:border-[#C9A45C] transition-colors flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#151515] shrink-0">
                              {prov.gallery[0] && (
                                <img
                                  src={prov.gallery[0]}
                                  alt={prov.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#151515] truncate">
                                {prov.name}
                              </p>
                              <p className="text-[11px] text-[#777777] truncate tabular-nums">
                                {prov.district} ·{' '}
                                <Star className="w-3 h-3 inline text-[#C9A45C] fill-[#C9A45C] -mt-0.5" />{' '}
                                {prov.rating.toFixed(1)} · {formatDH(prov.priceFrom)}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <button
                                  type="button"
                                  onClick={() => openProviderDetail(prov)}
                                  className="text-[11px] font-semibold text-[#151515] hover:text-[#A8843E] transition-colors whitespace-nowrap shrink-0"
                                >
                                  Voir détails
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openBookingModal(prov)}
                                  className="text-[11px] font-semibold text-[#A8843E] hover:text-[#151515] transition-colors whitespace-nowrap shrink-0"
                                >
                                  Réserver →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setAiDrawerOpen(false);
                          navigate('event-builder', {
                            eventType,
                            district,
                            guests,
                            date: eventDate || undefined,
                          });
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#151515] text-white text-[11px] font-semibold hover:bg-[#C9A45C] hover:text-[#151515] transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        Composer mon événement avec cette sélection
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Subtle Typing Animation */}
              {loading && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[#F7F4EF] border border-[#151515]/10">
                  <span className="text-[11px] text-[#777777]">EVENT AI prépare sa réponse</span>
                  <span className="inline-flex items-center gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }
                        }
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: dot * 0.16,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-[#C9A45C]"
                      />
                    ))}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts & Message Input */}
            <div className="p-3.5 border-t border-[#151515]/10 bg-[#F7F4EF] space-y-2.5 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendPrompt(q)}
                    className="px-2.5 py-1.5 bg-white border border-[#151515]/15 rounded-lg text-[11px] text-[#151515] hover:border-[#C9A45C] hover:text-[#A8843E] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question (budget, salles, traiteur)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#151515]/20 text-xs text-[#151515] placeholder:text-[#777777] focus:outline-none focus:border-[#C9A45C]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Envoyer le message"
                  className="px-4 py-2.5 bg-[#151515] text-white rounded-xl hover:bg-[#C9A45C] hover:text-[#151515] transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
