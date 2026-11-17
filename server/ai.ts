import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface DbProviderRow {
  id: string;
  name: string;
  category_slug: string;
  sub_category: string;
  district: string;
  price_from: number;
  price_unit: string;
  capacity_min: number;
  capacity_max: number;
  rating: number;
  short_bio: string;
  formulas_json: string;
}

interface AiContext {
  eventType?: string;
  date?: string;
  guests?: number;
  budget?: number;
  district?: string;
}

function formatDhServer(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} DH`;
}

function buildCatalogAdvisorFallback(
  message: string,
  providers: DbProviderRow[],
  unavailableIds: Set<string>,
  context?: AiContext
): { reply: string; recommendedProviderIds: string[] } {
  const guests = Math.max(10, context?.guests || 150);
  const budget = Math.max(10000, context?.budget || 150000);
  const eventType = context?.eventType || 'Mariage';
  const district = context?.district;
  const lowerMsg = message.toLowerCase();

  const available = providers.filter((p) => !unavailableIds.has(p.id));

  const targetCategories: string[] = [];
  if (lowerMsg.includes('salle') || lowerMsg.includes('lieu') || lowerMsg.includes('palais')) {
    targetCategories.push('salles');
  }
  if (lowerMsg.includes('photo') || lowerMsg.includes('vidéo') || lowerMsg.includes('video')) {
    targetCategories.push('photographes');
  }
  if (lowerMsg.includes('traiteur') || lowerMsg.includes('repas') || lowerMsg.includes('buffet') || lowerMsg.includes('dîner')) {
    targetCategories.push('traiteurs');
  }
  if (lowerMsg.includes('dj') || lowerMsg.includes('musique') || lowerMsg.includes('orchestre') || lowerMsg.includes('animation')) {
    targetCategories.push('dj');
  }
  if (lowerMsg.includes('décor') || lowerMsg.includes('decor') || lowerMsg.includes('fleur')) {
    targetCategories.push('decoration');
  }

  const pickCategories =
    targetCategories.length > 0
      ? targetCategories
      : ['salles', 'traiteurs', 'photographes', 'decoration'];

  const picked: DbProviderRow[] = [];
  for (const cat of pickCategories) {
    const candidates = available
      .filter((p) => p.category_slug === cat)
      .filter((p) => (cat === 'salles' ? p.capacity_max >= Math.min(guests, 220) : true))
      .sort((a, b) => {
        const aDist = district && a.district.toLowerCase() === district.toLowerCase() ? 1 : 0;
        const bDist = district && b.district.toLowerCase() === district.toLowerCase() ? 1 : 0;
        if (aDist !== bDist) return bDist - aDist;
        return b.rating - a.rating;
      });

    const withinBudget = candidates.find((c) => {
      const est = c.category_slug === 'traiteurs' && c.price_from < 2000 ? c.price_from * guests : c.price_from;
      return est <= budget * 0.55;
    });
    const chosen = withinBudget || candidates[0];
    if (chosen && !picked.some((p) => p.id === chosen.id)) {
      picked.push(chosen);
    }
  }

  const estimatedTotal = picked.reduce((sum, p) => {
    const cost = p.category_slug === 'traiteurs' && p.price_from < 2000 ? p.price_from * guests : p.price_from;
    return sum + cost;
  }, 0);

  const lines = picked.map((p) => {
    const est = p.category_slug === 'traiteurs' && p.price_from < 2000 ? p.price_from * guests : p.price_from;
    return `• ${p.name} (${p.district}) — à partir de ${formatDhServer(p.price_from)} ${p.price_unit}${
      p.category_slug === 'traiteurs' && p.price_from < 2000 ? ` (soit env. ${formatDhServer(est)} pour ${guests} invités)` : ''
    }`;
  });

  const dateLine = context?.date
    ? `Disponibilité vérifiée sur le ${context.date} pour nos partenaires disponibles.`
    : `Astuce : indiquez une date précise ci-dessus afin que je vérifie immédiatement les disponibilités réelles.`;

  const reply = [
    `Pour votre ${eventType.toLowerCase()} à Casablanca (${guests} invités · budget cible ${formatDhServer(budget)}${district ? ` · secteur ${district}` : ''}), voici une sélection cohérente issue de notre catalogue vérifié :`,
    '',
    ...lines,
    '',
    `Estimation indicative de cette combinaison : ${formatDhServer(estimatedTotal)} (${estimatedTotal <= budget ? 'dans votre enveloppe budgétaire' : 'légèrement au-dessus de votre budget cible, modulable selon la formule'}).`,
    dateLine,
  ].join('\n');

  return {
    reply,
    recommendedProviderIds: picked.map((p) => p.id).slice(0, 4),
  };
}

export async function runEventAiAssistant(
  message: string,
  history: ChatTurn[],
  context?: AiContext
): Promise<{ reply: string; recommendedProviderIds: string[] }> {
  const ai = getAiClient();

  // Pull real, verified providers and booked availability from SQLite
  const providers = db
    .prepare(
      `SELECT id, name, category_slug, sub_category, district, price_from, price_unit, capacity_min, capacity_max, rating, short_bio, formulas_json
       FROM providers WHERE status = 'approved' ORDER BY featured DESC, rating DESC`
    )
    .all() as DbProviderRow[];

  let unavailableIds = new Set<string>();
  if (context?.date) {
    const busyRows = db
      .prepare(`SELECT provider_id FROM availability WHERE event_date = ?`)
      .all(context.date) as Array<{ provider_id: string }>;
    unavailableIds = new Set(busyRows.map((r) => r.provider_id));
  }

  const verifiedCatalog = providers.map((p) => ({
    id: p.id,
    nom: p.name,
    categorie: p.category_slug,
    specialite: p.sub_category,
    quartier: p.district,
    prixAPartirDeDH: p.price_from,
    unitePrix: p.price_unit,
    capaciteMin: p.capacity_min,
    capaciteMax: p.capacity_max,
    note: p.rating,
    disponiblePourDateDemandee: context?.date ? !unavailableIds.has(p.id) : 'Non vérifiée sans date précise',
  }));

  if (!ai) {
    return buildCatalogAdvisorFallback(message, providers, unavailableIds, context);
  }

  const systemInstruction = `Tu es EVENT AI, l'assistant virtuel officiel et conseiller en événementiel de luxe d'EVENT PRO à Casablanca, Maroc.
Règles strictes et impératives :
1. Réponds toujours en français élégant, professionnel, chaleureux et structuré (phrases concises, listes à puces claires sans jargon technique).
2. Utilise EXCLUSIVEMENT le catalogue vérifié ci-dessous pour citer des noms de prestataires, des tarifs en DH et des disponibilités.
3. N'INVENTE JAMAIS un prix, un prestataire ou une disponibilité. Si l'utilisateur n'a pas précisé une date exacte, indique clairement que la disponibilité doit être vérifiée pour une date précise (ou invite-le à l'indiquer).
4. Adapte systématiquement tes conseils au budget en Dirhams marocains (DH), au nombre d'invités et au quartier à Casablanca (Maarif, Anfa, Ain Diab, Californie, Bouskoura, Sidi Maarouf, Bourgogne, Oasis, Gauthier).
5. Lorsque tu proposes des prestataires, cite leurs noms exacts issus du catalogue ci-dessous et inclus leurs identifiants entre crochets [ID:prov_xxx] pour que l'interface affiche leurs fiches interactives.

Contexte client fourni : ${JSON.stringify(context || {})}

Catalogue vérifié en temps réel (Base de données EVENT PRO) :
${JSON.stringify(verifiedCatalog, null, 2)}`;

  const contents = [
    ...history.slice(-8).map((h) => `${h.role === 'user' ? 'Client' : 'EVENT AI'}: ${h.content}`),
    `Client: ${message}`,
  ].join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });

    const text =
      response.text ||
      'Je suis à votre disposition pour organiser votre événement à Casablanca.';
    const matchedIds = providers
      .filter((p) => text.includes(p.name) || text.includes(p.id))
      .map((p) => p.id)
      .slice(0, 4);

    return {
      reply: text.replace(/\[ID:[^\]]+\]/g, '').trim(),
      recommendedProviderIds: matchedIds,
    };
  } catch (err) {
    console.warn('EVENT AI Gemini fallback activated:', err instanceof Error ? err.message : err);
    return buildCatalogAdvisorFallback(message, providers, unavailableIds, context);
  }
}
