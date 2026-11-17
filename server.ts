import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './server/db.ts';
import { seedDatabase, generateId } from './server/seed.ts';
import {
  attachAuth,
  clearSessionCookie,
  hashPassword,
  requireAuth,
  requireRole,
  setSessionCookie,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import { runEventAiAssistant } from './server/ai.ts';
import type { BookingStatus, CategorySlug, Provider, SiteContent } from './src/types.ts';

initDatabase();
seedDatabase();

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());
app.use(attachAuth);

function mapProviderRow(row: Record<string, unknown>): Provider {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    categorySlug: row.category_slug as CategorySlug,
    subCategory: String(row.sub_category),
    district: String(row.district),
    address: String(row.address),
    lat: Number(row.lat),
    lng: Number(row.lng),
    description: String(row.description),
    shortBio: String(row.short_bio),
    priceFrom: Number(row.price_from),
    priceUnit: String(row.price_unit),
    capacityMin: Number(row.capacity_min),
    capacityMax: Number(row.capacity_max),
    equipments: JSON.parse(String(row.equipments_json || '[]')),
    servicesIncluded: JSON.parse(String(row.services_included_json || '[]')),
    formulas: JSON.parse(String(row.formulas_json || '[]')),
    menus: JSON.parse(String(row.menus_json || '[]')),
    options: JSON.parse(String(row.options_json || '[]')),
    gallery: JSON.parse(String(row.gallery_json || '[]')),
    videoUrl: String(row.video_url || ''),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    status: row.status as 'approved' | 'pending' | 'suspended',
    featured: Boolean(row.featured),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    createdAt: String(row.created_at),
  };
}

function recalculateProviderRating(providerId: string): void {
  const stats = db
    .prepare(
      `SELECT COUNT(*) as cnt, COALESCE(AVG(rating), 5.0) as avgRating
       FROM reviews WHERE provider_id = ? AND status = 'published'`
    )
    .get(providerId) as { cnt: number; avgRating: number };
  db.prepare(`UPDATE providers SET rating = ?, review_count = ? WHERE id = ?`).run(
    Math.round(stats.avgRating * 10) / 10,
    stats.cnt,
    providerId
  );
}

// ==========================================
// AUTH ROUTES
// ==========================================
app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.auth) {
    res.json({ user: null });
    return;
  }
  const user = db
    .prepare('SELECT id, name, email, phone, role, status, created_at as createdAt FROM users WHERE id = ?')
    .get(req.auth.userId) as Record<string, unknown> | undefined;
  if (!user || user.status === 'suspended') {
    clearSessionCookie(res);
    res.json({ user: null });
    return;
  }
  res.json({ user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, role, businessName, categorySlug, subCategory, district, priceFrom } = req.body;
  if (!name || !email || !password || String(password).length < 6) {
    res.status(400).json({ error: 'Veuillez renseigner nom, email et mot de passe (6 caractères minimum).' });
    return;
  }
  const safeRole = role === 'provider' ? 'provider' : 'client';
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(String(email).trim());
  if (existing) {
    res.status(409).json({ error: 'Un compte existe déjà avec cette adresse email.' });
    return;
  }
  const userId = generateId('usr');
  const now = new Date().toISOString();
  const userStatus = safeRole === 'provider' ? 'pending' : 'active';

  db.prepare(
    `INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, String(name).trim(), String(email).trim().toLowerCase(), String(phone || '').trim(), hashPassword(String(password)), safeRole, userStatus, now);

  if (safeRole === 'provider') {
    const provId = generateId('prov');
    const dist = String(district || 'Maarif');
    db.prepare(
      `INSERT INTO providers (
        id, user_id, name, category_slug, sub_category, district, address, lat, lng,
        description, short_bio, price_from, price_unit, capacity_min, capacity_max,
        equipments_json, services_included_json, formulas_json, menus_json, options_json,
        gallery_json, video_url, rating, review_count, status, featured, phone, email, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      provId,
      userId,
      String(businessName || name).trim(),
      String(categorySlug || 'salles'),
      String(subCategory || 'Prestation événementielle'),
      dist,
      `${dist}, Casablanca`,
      33.582 + (Math.random() - 0.5) * 0.04,
      -7.632 + (Math.random() - 0.5) * 0.04,
      'Nouveau prestataire inscrit sur EVENT PRO Casablanca. Fiche en attente de validation administrative.',
      'Professionnel de l\'événementiel à Casablanca.',
      Number(priceFrom) || 8000,
      'par événement',
      20,
      300,
      '[]',
      '[]',
      JSON.stringify([{ name: 'Formule Standard', price: Number(priceFrom) || 8000, description: 'Prestation de base configurable.', features: ['Accompagnement personnalisé'] }]),
      '[]',
      '[]',
      JSON.stringify(['/src/assets/images/hero_wedding_casablanca_1794908654336.jpg']),
      '',
      5.0,
      0,
      'pending',
      0,
      String(phone || ''),
      String(email).trim().toLowerCase(),
      now
    );

    db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      generateId('nt'),
      'usr_admin_1',
      'Nouveau prestataire à valider',
      `${String(businessName || name)} (${dist}) attend votre validation avant publication.`,
      'system',
      0,
      now
    );
  }

  setSessionCookie(res, userId, safeRole);
  const user = db.prepare('SELECT id, name, email, phone, role, status, created_at as createdAt FROM users WHERE id = ?').get(userId);
  res.status(201).json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis.' });
    return;
  }
  const userRow = db
    .prepare('SELECT id, name, email, phone, password_hash, role, status, created_at FROM users WHERE LOWER(email) = LOWER(?)')
    .get(String(email).trim()) as Record<string, unknown> | undefined;

  if (!userRow || !verifyPassword(String(password), String(userRow.password_hash))) {
    res.status(401).json({ error: 'Identifiants invalides.' });
    return;
  }
  if (userRow.status === 'suspended') {
    res.status(403).json({ error: 'Ce compte a été suspendu par l\'administration.' });
    return;
  }

  setSessionCookie(res, String(userRow.id), userRow.role as 'client' | 'provider' | 'admin');
  res.json({
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      status: userRow.status,
      createdAt: userRow.created_at,
    },
  });
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, phone } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Le nom est requis.' });
    return;
  }
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(String(name).trim(), String(phone || '').trim(), req.auth!.userId);
  const user = db.prepare('SELECT id, name, email, phone, role, status, created_at as createdAt FROM users WHERE id = ?').get(req.auth!.userId);
  res.json({ user });
});

// ==========================================
// PUBLIC CATALOG & CONTENT ROUTES
// ==========================================
app.get('/api/providers', (req: AuthenticatedRequest, res) => {
  const { category, subCategory, district, search, minCapacity, maxBudget, date, featured, includeAll } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!(includeAll === 'true' && req.auth?.role === 'admin')) {
    conditions.push(`status = 'approved'`);
  }
  if (category && category !== 'all') {
    conditions.push(`category_slug = ?`);
    params.push(String(category));
  }
  if (subCategory && subCategory !== 'all') {
    conditions.push(`sub_category = ?`);
    params.push(String(subCategory));
  }
  if (district && district !== 'all') {
    conditions.push(`district = ?`);
    params.push(String(district));
  }
  if (featured === 'true') {
    conditions.push(`featured = 1`);
  }
  if (minCapacity && Number(minCapacity) > 0) {
    conditions.push(`(capacity_max = 0 OR capacity_max >= ?)`);
    params.push(Number(minCapacity));
  }
  if (maxBudget && Number(maxBudget) > 0) {
    conditions.push(`price_from <= ?`);
    params.push(Number(maxBudget));
  }
  if (search) {
    const q = `%${String(search).trim().toLowerCase()}%`;
    conditions.push(`(LOWER(name) LIKE ? OR LOWER(short_bio) LIKE ? OR LOWER(district) LIKE ? OR LOWER(sub_category) LIKE ?)`);
    params.push(q, q, q, q);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM providers ${whereClause} ORDER BY featured DESC, rating DESC, review_count DESC`)
    .all(...params) as Record<string, unknown>[];

  let providers = rows.map(mapProviderRow);

  if (date) {
    const busyRows = db
      .prepare('SELECT provider_id FROM availability WHERE event_date = ?')
      .all(String(date)) as Array<{ provider_id: string }>;
    const busySet = new Set(busyRows.map((r) => r.provider_id));
    providers = providers.filter((p) => !busySet.has(p.id));
  }

  res.json({ providers });
});

app.get('/api/providers/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM providers WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }
  const provider = mapProviderRow(row);
  const reviews = db
    .prepare(
      `SELECT id, provider_id as providerId, user_id as userId, author_name as authorName, rating, comment, event_type as eventType, status, created_at as createdAt
       FROM reviews WHERE provider_id = ? AND status = 'published' ORDER BY created_at DESC`
    )
    .all(provider.id);
  const unavailableDates = (
    db.prepare('SELECT event_date as eventDate, status FROM availability WHERE provider_id = ?').all(provider.id) as Array<{
      eventDate: string;
      status: string;
    }>
  ).map((d) => d.eventDate);

  const services = db
    .prepare(
      `SELECT id, provider_id as providerId, category_slug as categorySlug, title, description, price, price_unit as priceUnit, duration, active, created_at as createdAt
       FROM services WHERE provider_id = ? AND active = 1`
    )
    .all(provider.id);

  res.json({ provider, reviews, unavailableDates, services });
});

app.get('/api/site-content', (_req, res) => {
  const row = db.prepare(`SELECT value_json FROM site_content WHERE key = 'main'`).get() as { value_json: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'Contenu introuvable.' });
    return;
  }
  const parsed = JSON.parse(row.value_json) as SiteContent;
  res.json({
    content: {
      whatsappNumber: '+212 661 00 11 22',
      whatsappPrefilledMessage:
        'Bonjour EVENT PRO Casablanca, je souhaite organiser un événement et recevoir des informations sur vos prestataires.',
      ...parsed,
    },
  });
});

app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !String(email).includes('@')) {
    res.status(400).json({ error: 'Adresse email invalide.' });
    return;
  }
  try {
    db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(
      generateId('news'),
      String(email).trim().toLowerCase(),
      new Date().toISOString()
    );
  } catch {
    // Already subscribed - return polite confirmation
  }
  res.json({ ok: true, message: 'Merci ! Vous êtes inscrit à la newsletter EVENT PRO.' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Veuillez remplir les champs obligatoires.' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    generateId('msg'),
    String(name).trim(),
    String(email).trim(),
    String(phone || '').trim(),
    String(subject || 'Demande d\'information').trim(),
    String(message).trim(),
    now
  );
  db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    generateId('nt'),
    'usr_admin_1',
    'Nouveau message de contact',
    `${String(name)} (${String(email)}) : ${String(subject || 'Message')}`,
    'system',
    0,
    now
  );
  res.status(201).json({ ok: true });
});

// ==========================================
// AVAILABILITY & BOOKINGS
// ==========================================
app.get('/api/availability/:providerId', (req, res) => {
  const rows = db
    .prepare(`SELECT id, provider_id as providerId, event_date as eventDate, status, booking_id as bookingId FROM availability WHERE provider_id = ?`)
    .all(req.params.providerId);
  res.json({ availability: rows });
});

app.post('/api/availability', requireAuth, (req: AuthenticatedRequest, res) => {
  const { providerId, eventDate, action } = req.body;
  const prov = db.prepare('SELECT id, user_id FROM providers WHERE id = ?').get(providerId) as { id: string; user_id: string } | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }
  if (req.auth!.role !== 'admin' && prov.user_id !== req.auth!.userId) {
    res.status(403).json({ error: 'Action non autorisée.' });
    return;
  }

  const existing = db.prepare('SELECT id, status FROM availability WHERE provider_id = ? AND event_date = ?').get(providerId, eventDate) as
    | { id: string; status: string }
    | undefined;

  if (action === 'unblock') {
    if (existing?.status === 'booked') {
      res.status(409).json({ error: 'Impossible de débloquer une date liée à une réservation active.' });
      return;
    }
    db.prepare('DELETE FROM availability WHERE provider_id = ? AND event_date = ?').run(providerId, eventDate);
  } else {
    if (!existing) {
      db.prepare('INSERT INTO availability (id, provider_id, event_date, status, booking_id) VALUES (?, ?, ?, ?, NULL)').run(
        generateId('av'),
        providerId,
        eventDate,
        'blocked'
      );
    }
  }
  const updated = db
    .prepare(`SELECT id, provider_id as providerId, event_date as eventDate, status, booking_id as bookingId FROM availability WHERE provider_id = ?`)
    .all(providerId);
  res.json({ availability: updated });
});

app.get('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  let rows: Record<string, unknown>[] = [];
  if (req.auth!.role === 'admin') {
    rows = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all() as Record<string, unknown>[];
  } else if (req.auth!.role === 'provider') {
    rows = db
      .prepare(
        `SELECT b.* FROM bookings b
         JOIN providers p ON b.provider_id = p.id
         WHERE p.user_id = ? OR b.client_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(req.auth!.userId, req.auth!.userId) as Record<string, unknown>[];
  } else {
    rows = db.prepare('SELECT * FROM bookings WHERE client_id = ? ORDER BY created_at DESC').all(req.auth!.userId) as Record<string, unknown>[];
  }

  const bookings = rows.map((r) => ({
    id: r.id,
    bookingNumber: r.booking_number,
    clientId: r.client_id,
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    providerId: r.provider_id,
    providerName: r.provider_name,
    eventType: r.event_type,
    eventDate: r.event_date,
    eventTime: r.event_time,
    location: r.location,
    guests: Number(r.guests),
    formulaName: r.formula_name,
    options: JSON.parse(String(r.options_json || '[]')),
    totalPrice: Number(r.total_price),
    comments: r.comments,
    status: r.status,
    createdAt: r.created_at,
  }));
  res.json({ bookings });
});

app.post('/api/bookings', (req: AuthenticatedRequest, res) => {
  const {
    clientName,
    clientEmail,
    clientPhone,
    providerId,
    eventType,
    eventDate,
    eventTime,
    location,
    guests,
    formulaName,
    options,
    totalPrice,
    comments,
  } = req.body;

  if (!clientName || !clientEmail || !clientPhone || !providerId || !eventDate) {
    res.status(400).json({ error: 'Veuillez compléter toutes les informations obligatoires de réservation.' });
    return;
  }

  const prov = db.prepare('SELECT id, user_id, name, price_from FROM providers WHERE id = ?').get(providerId) as
    | { id: string; user_id: string; name: string; price_from: number }
    | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }

  // Prevent double booking!
  const conflict = db
    .prepare('SELECT id, status FROM availability WHERE provider_id = ? AND event_date = ?')
    .get(providerId, eventDate) as { id: string; status: string } | undefined;

  if (conflict) {
    res.status(409).json({
      error: `Le prestataire ${prov.name} est déjà réservé ou indisponible le ${eventDate}. Veuillez choisir une autre date.`,
    });
    return;
  }

  const bookingId = generateId('bk');
  const bookingNumber = `EP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const clientId = req.auth?.userId || `guest_${generateId('gst')}`;
  const now = new Date().toISOString();
  const safePrice = Number(totalPrice) > 0 ? Number(totalPrice) : prov.price_from;

  const insertBookingTx = db.transaction(() => {
    db.prepare(
      `INSERT INTO bookings (
        id, booking_number, client_id, client_name, client_email, client_phone,
        provider_id, provider_name, event_type, event_date, event_time, location,
        guests, formula_name, options_json, total_price, comments, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      bookingId,
      bookingNumber,
      clientId,
      String(clientName).trim(),
      String(clientEmail).trim(),
      String(clientPhone).trim(),
      prov.id,
      prov.name,
      String(eventType || 'Mariage'),
      String(eventDate),
      String(eventTime || '19:00'),
      String(location || 'Casablanca'),
      Number(guests) || 100,
      String(formulaName || 'Formule Standard'),
      JSON.stringify(Array.isArray(options) ? options : []),
      safePrice,
      String(comments || ''),
      'En attente',
      now
    );

    db.prepare('INSERT INTO availability (id, provider_id, event_date, status, booking_id) VALUES (?, ?, ?, ?, ?)').run(
      generateId('av'),
      prov.id,
      String(eventDate),
      'booked',
      bookingId
    );

    if (req.auth?.userId) {
      db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        generateId('nt'),
        req.auth.userId,
        'Demande de réservation enregistrée',
        `Votre réservation ${bookingNumber} chez ${prov.name} pour le ${eventDate} a bien été transmise.`,
        'booking',
        0,
        now
      );
    }

    db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      generateId('nt'),
      prov.user_id,
      'Nouvelle réservation reçue',
      `${String(clientName)} souhaite réserver ${prov.name} le ${eventDate} (${bookingNumber}).`,
      'booking',
      0,
      now
    );

    db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      generateId('nt'),
      'usr_admin_1',
      'Nouvelle réservation plateforme',
      `Réservation ${bookingNumber} — ${prov.name} (${safePrice.toLocaleString('fr-FR')} DH).`,
      'booking',
      0,
      now
    );
  });

  insertBookingTx();

  res.status(201).json({
    booking: {
      id: bookingId,
      bookingNumber,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      providerId: prov.id,
      providerName: prov.name,
      eventType,
      eventDate,
      eventTime,
      location,
      guests: Number(guests) || 100,
      formulaName,
      options: Array.isArray(options) ? options : [],
      totalPrice: safePrice,
      comments: comments || '',
      status: 'En attente',
      createdAt: now,
    },
  });
});

app.patch('/api/bookings/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const { status } = req.body as { status: BookingStatus };
  const validStatuses: BookingStatus[] = ['En attente', 'Confirmée', 'Refusée', 'Annulée', 'Terminée'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Statut invalide.' });
    return;
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!booking) {
    res.status(404).json({ error: 'Réservation introuvable.' });
    return;
  }

  const prov = db.prepare('SELECT user_id FROM providers WHERE id = ?').get(booking.provider_id) as { user_id: string } | undefined;
  const isAdmin = req.auth!.role === 'admin';
  const isOwnerClient = booking.client_id === req.auth!.userId;
  const isOwnerProvider = prov?.user_id === req.auth!.userId;

  if (!isAdmin && !isOwnerClient && !isOwnerProvider) {
    res.status(403).json({ error: 'Accès refusé.' });
    return;
  }
  if (isOwnerClient && !isAdmin && !isOwnerProvider && status !== 'Annulée') {
    res.status(403).json({ error: 'Un client peut uniquement annuler sa réservation.' });
    return;
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, booking.id);
    if (status === 'Annulée' || status === 'Refusée') {
      db.prepare('DELETE FROM availability WHERE booking_id = ?').run(booking.id);
    } else if (status === 'Confirmée') {
      db.prepare('INSERT OR IGNORE INTO availability (id, provider_id, event_date, status, booking_id) VALUES (?, ?, ?, ?, ?)').run(
        generateId('av'),
        booking.provider_id,
        booking.event_date,
        'booked',
        booking.id
      );
    }

    if (String(booking.client_id).startsWith('usr_')) {
      db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        generateId('nt'),
        String(booking.client_id),
        `Mise à jour réservation ${booking.booking_number}`,
        `Votre réservation chez ${booking.provider_name} est désormais : ${status}.`,
        'booking',
        0,
        now
      );
    }
  })();

  res.json({ ok: true, status });
});

// ==========================================
// QUOTES
// ==========================================
app.get('/api/quotes', requireAuth, (req: AuthenticatedRequest, res) => {
  let rows: Record<string, unknown>[] = [];
  if (req.auth!.role === 'admin') {
    rows = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all() as Record<string, unknown>[];
  } else if (req.auth!.role === 'provider') {
    rows = db
      .prepare(
        `SELECT q.* FROM quotes q
         JOIN providers p ON q.provider_id = p.id
         WHERE p.user_id = ? OR q.client_id = ?
         ORDER BY q.created_at DESC`
      )
      .all(req.auth!.userId, req.auth!.userId) as Record<string, unknown>[];
  } else {
    rows = db.prepare('SELECT * FROM quotes WHERE client_id = ? ORDER BY created_at DESC').all(req.auth!.userId) as Record<string, unknown>[];
  }

  const quotes = rows.map((r) => ({
    id: r.id,
    quoteNumber: r.quote_number,
    clientId: r.client_id,
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    providerId: r.provider_id,
    providerName: r.provider_name,
    eventType: r.event_type,
    eventDate: r.event_date,
    guests: Number(r.guests),
    budget: Number(r.budget),
    message: r.message,
    replyMessage: r.reply_message,
    quotedPrice: Number(r.quoted_price),
    status: r.status,
    createdAt: r.created_at,
  }));
  res.json({ quotes });
});

app.post('/api/quotes', (req: AuthenticatedRequest, res) => {
  const { clientName, clientEmail, clientPhone, providerId, eventType, eventDate, guests, budget, message } = req.body;
  if (!clientName || !clientEmail || !providerId || !message) {
    res.status(400).json({ error: 'Veuillez renseigner les informations nécessaires pour le devis.' });
    return;
  }
  const prov = db.prepare('SELECT id, user_id, name FROM providers WHERE id = ?').get(providerId) as
    | { id: string; user_id: string; name: string }
    | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }

  const id = generateId('qt');
  const quoteNumber = `DV-2026-${Math.floor(100 + Math.random() * 900)}`;
  const clientId = req.auth?.userId || `guest_${generateId('gst')}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO quotes (
      id, quote_number, client_id, client_name, client_email, client_phone,
      provider_id, provider_name, event_type, event_date, guests, budget,
      message, reply_message, quoted_price, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 0, 'En attente', ?)`
  ).run(
    id,
    quoteNumber,
    clientId,
    String(clientName).trim(),
    String(clientEmail).trim(),
    String(clientPhone || '').trim(),
    prov.id,
    prov.name,
    String(eventType || 'Mariage'),
    String(eventDate || ''),
    Number(guests) || 100,
    Number(budget) || 0,
    String(message).trim(),
    now
  );

  db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    generateId('nt'),
    prov.user_id,
    `Nouvelle demande de devis ${quoteNumber}`,
    `${String(clientName)} demande un devis pour ${prov.name}.`,
    'quote',
    0,
    now
  );

  res.status(201).json({ ok: true, quoteNumber });
});

app.patch('/api/quotes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { replyMessage, quotedPrice, status } = req.body;
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!quote) {
    res.status(404).json({ error: 'Demande de devis introuvable.' });
    return;
  }
  const prov = db.prepare('SELECT user_id FROM providers WHERE id = ?').get(quote.provider_id) as { user_id: string } | undefined;
  if (req.auth!.role !== 'admin' && prov?.user_id !== req.auth!.userId && quote.client_id !== req.auth!.userId) {
    res.status(403).json({ error: 'Action non autorisée.' });
    return;
  }

  const nextStatus = status || (replyMessage ? 'Répondu' : quote.status);
  db.prepare('UPDATE quotes SET reply_message = ?, quoted_price = ?, status = ? WHERE id = ?').run(
    replyMessage !== undefined ? String(replyMessage) : quote.reply_message,
    quotedPrice !== undefined ? Number(quotedPrice) : quote.quoted_price,
    nextStatus,
    quote.id
  );

  if (String(quote.client_id).startsWith('usr_') && replyMessage) {
    db.prepare('INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      generateId('nt'),
      String(quote.client_id),
      `Réponse au devis ${quote.quote_number}`,
      `${quote.provider_name} a répondu à votre demande (${Number(quotedPrice || 0).toLocaleString('fr-FR')} DH).`,
      'quote',
      0,
      new Date().toISOString()
    );
  }

  res.json({ ok: true });
});

// ==========================================
// REVIEWS, FAVORITES, PROJECTS, NOTIFICATIONS
// ==========================================
app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  const { providerId, rating, comment, eventType } = req.body;
  if (!providerId || !rating || !comment) {
    res.status(400).json({ error: 'Note et commentaire requis.' });
    return;
  }
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.auth!.userId) as { name: string } | undefined;
  const id = generateId('rev');
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO reviews (id, provider_id, user_id, author_name, rating, comment, event_type, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)`
  ).run(id, providerId, req.auth!.userId, user?.name || 'Client EVENT PRO', Math.min(5, Math.max(1, Number(rating))), String(comment).trim(), String(eventType || 'Événement'), now);

  recalculateProviderRating(providerId);
  res.status(201).json({ ok: true });
});

app.get('/api/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT provider_id FROM favorites WHERE user_id = ?').all(req.auth!.userId) as Array<{ provider_id: string }>;
  res.json({ favoriteIds: rows.map((r) => r.provider_id) });
});

app.post('/api/favorites/toggle', requireAuth, (req: AuthenticatedRequest, res) => {
  const { providerId } = req.body;
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND provider_id = ?').get(req.auth!.userId, providerId);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND provider_id = ?').run(req.auth!.userId, providerId);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (id, user_id, provider_id, created_at) VALUES (?, ?, ?, ?)').run(
      generateId('fav'),
      req.auth!.userId,
      providerId,
      new Date().toISOString()
    );
    res.json({ favorited: true });
  }
});

app.get('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT * FROM event_projects WHERE user_id = ? ORDER BY created_at DESC').all(req.auth!.userId) as Record<
    string,
    unknown
  >[];
  const projects = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    eventType: r.event_type,
    eventDate: r.event_date,
    district: r.district,
    guests: Number(r.guests),
    budget: Number(r.budget),
    selectedServices: JSON.parse(String(r.selected_services_json || '[]')),
    selectedProviders: JSON.parse(String(r.selected_providers_json || '[]')),
    totalCost: Number(r.total_cost),
    status: r.status,
    createdAt: r.created_at,
  }));
  res.json({ projects });
});

app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, eventType, eventDate, district, guests, budget, selectedServices, selectedProviders, totalCost, status } = req.body;
  const id = generateId('prj');
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO event_projects (id, user_id, title, event_type, event_date, district, guests, budget, selected_services_json, selected_providers_json, total_cost, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.auth!.userId,
    String(title || `${eventType || 'Événement'} à ${district || 'Casablanca'}`),
    String(eventType || 'Mariage'),
    String(eventDate || ''),
    String(district || 'Casablanca'),
    Number(guests) || 100,
    Number(budget) || 0,
    JSON.stringify(selectedServices || []),
    JSON.stringify(selectedProviders || []),
    Number(totalCost) || 0,
    String(status || 'Sauvegardé'),
    now
  );
  res.status(201).json({ ok: true, id });
});

app.delete('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM event_projects WHERE id = ? AND user_id = ?').run(req.params.id, req.auth!.userId);
  res.json({ ok: true });
});

app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT id, user_id as userId, title, message, type, is_read as isRead, created_at as createdAt
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`
    )
    .all(req.auth!.userId) as Array<Record<string, unknown>>;
  res.json({ notifications: rows.map((n) => ({ ...n, isRead: Boolean(n.isRead) })) });
});

app.patch('/api/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.auth!.userId);
  res.json({ ok: true });
});

// ==========================================
// PROVIDER WORKSPACE ROUTES
// ==========================================
app.get('/api/provider/my-data', requireRole('provider', 'admin'), (req: AuthenticatedRequest, res) => {
  const provRows = db.prepare('SELECT * FROM providers WHERE user_id = ?').all(req.auth!.userId) as Record<string, unknown>[];
  const providers = provRows.map(mapProviderRow);
  const providerIds = providers.map((p) => p.id);
  const services =
    providerIds.length > 0
      ? db
          .prepare(
            `SELECT id, provider_id as providerId, category_slug as categorySlug, title, description, price, price_unit as priceUnit, duration, active, created_at as createdAt
             FROM services WHERE provider_id IN (${providerIds.map(() => '?').join(',')})`
          )
          .all(...providerIds)
      : [];
  const reviews =
    providerIds.length > 0
      ? db
          .prepare(
            `SELECT id, provider_id as providerId, user_id as userId, author_name as authorName, rating, comment, event_type as eventType, status, created_at as createdAt
             FROM reviews WHERE provider_id IN (${providerIds.map(() => '?').join(',')}) ORDER BY created_at DESC`
          )
          .all(...providerIds)
      : [];
  res.json({ providers, services, reviews });
});

app.put('/api/provider/profile/:id', requireRole('provider', 'admin'), (req: AuthenticatedRequest, res) => {
  const prov = db.prepare('SELECT user_id FROM providers WHERE id = ?').get(req.params.id) as { user_id: string } | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }
  if (req.auth!.role !== 'admin' && prov.user_id !== req.auth!.userId) {
    res.status(403).json({ error: 'Accès refusé.' });
    return;
  }

  const { name, district, address, shortBio, description, priceFrom, priceUnit, capacityMin, capacityMax, phone, email, videoUrl, gallery, formulas } =
    req.body;
  db.prepare(
    `UPDATE providers SET name = ?, district = ?, address = ?, short_bio = ?, description = ?, price_from = ?, price_unit = ?,
     capacity_min = ?, capacity_max = ?, phone = ?, email = ?, video_url = ?, gallery_json = ?, formulas_json = ? WHERE id = ?`
  ).run(
    String(name),
    String(district),
    String(address),
    String(shortBio),
    String(description),
    Number(priceFrom),
    String(priceUnit || 'par événement'),
    Number(capacityMin || 0),
    Number(capacityMax || 0),
    String(phone || ''),
    String(email || ''),
    String(videoUrl || ''),
    JSON.stringify(gallery || []),
    JSON.stringify(formulas || []),
    req.params.id
  );
  res.json({ ok: true });
});

app.post('/api/provider/services', requireRole('provider', 'admin'), (req: AuthenticatedRequest, res) => {
  const { providerId, title, description, price, priceUnit, duration } = req.body;
  const prov = db.prepare('SELECT id, user_id, category_slug FROM providers WHERE id = ?').get(providerId) as
    | { id: string; user_id: string; category_slug: string }
    | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }
  if (req.auth!.role !== 'admin' && prov.user_id !== req.auth!.userId) {
    res.status(403).json({ error: 'Accès refusé.' });
    return;
  }
  const id = generateId('srv');
  db.prepare(
    `INSERT INTO services (id, provider_id, category_slug, title, description, price, price_unit, duration, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(id, prov.id, prov.category_slug, String(title), String(description || ''), Number(price), String(priceUnit || 'par événement'), String(duration || 'Journée'), new Date().toISOString());
  res.status(201).json({ ok: true, id });
});

app.delete('/api/provider/services/:id', requireRole('provider', 'admin'), (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================
app.get('/api/admin/overview', requireRole('admin'), (_req, res) => {
  const clientsCount = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'client'`).get() as { c: number }).c;
  const providersCount = (db.prepare(`SELECT COUNT(*) as c FROM providers`).get() as { c: number }).c;
  const pendingProvidersCount = (db.prepare(`SELECT COUNT(*) as c FROM providers WHERE status = 'pending'`).get() as { c: number }).c;
  const servicesCount = (db.prepare(`SELECT COUNT(*) as c FROM services WHERE active = 1`).get() as { c: number }).c;
  const bookingsCount = (db.prepare(`SELECT COUNT(*) as c FROM bookings`).get() as { c: number }).c;
  const pendingBookingsCount = (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status = 'En attente'`).get() as { c: number }).c;
  const confirmedBookingsCount = (
    db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status IN ('Confirmée', 'Terminée')`).get() as { c: number }
  ).c;
  const estimatedRevenue = (
    db.prepare(`SELECT COALESCE(SUM(total_price), 0) as s FROM bookings WHERE status IN ('Confirmée', 'Terminée', 'En attente')`).get() as {
      s: number;
    }
  ).s;

  const categoryBreakdown = db
    .prepare(
      `SELECT category_slug as category, COUNT(*) as count
       FROM providers GROUP BY category_slug`
    )
    .all();

  const popularProviders = db
    .prepare(
      `SELECT p.id, p.name, p.category_slug as categorySlug, p.district, p.rating, p.review_count as reviewCount,
              COUNT(b.id) as bookingCount, COALESCE(SUM(b.total_price), 0) as revenue
       FROM providers p
       LEFT JOIN bookings b ON p.id = b.provider_id
       GROUP BY p.id
       ORDER BY bookingCount DESC, p.rating DESC
       LIMIT 6`
    )
    .all();

  const monthlySeries = [
    { month: 'Juil', bookings: 12, quotes: 18, revenue: 185000 },
    { month: 'Août', bookings: 19, quotes: 27, revenue: 294000 },
    { month: 'Sept', bookings: 24, quotes: 35, revenue: 372000 },
    { month: 'Oct', bookings: 28, quotes: 41, revenue: 448000 },
    { month: 'Nov', bookings: Math.max(14, bookingsCount * 4), quotes: 46, revenue: Math.max(210000, estimatedRevenue) },
    { month: 'Déc', bookings: 34, quotes: 52, revenue: 540000 },
  ];

  res.json({
    kpis: {
      clientsCount,
      providersCount,
      pendingProvidersCount,
      servicesCount,
      bookingsCount,
      pendingBookingsCount,
      confirmedBookingsCount,
      estimatedRevenue,
    },
    categoryBreakdown,
    popularProviders,
    monthlySeries,
  });
});

app.get('/api/admin/users', requireRole('admin'), (_req, res) => {
  const users = db
    .prepare('SELECT id, name, email, phone, role, status, created_at as createdAt FROM users ORDER BY created_at DESC')
    .all();
  res.json({ users });
});

app.patch('/api/admin/users/:id', requireRole('admin'), (req, res) => {
  const { name, phone, status, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!user) {
    res.status(404).json({ error: 'Utilisateur introuvable.' });
    return;
  }
  db.prepare('UPDATE users SET name = ?, phone = ?, status = ?, role = ? WHERE id = ?').run(
    name !== undefined ? String(name) : user.name,
    phone !== undefined ? String(phone) : user.phone,
    status !== undefined ? String(status) : user.status,
    role !== undefined ? String(role) : user.role,
    req.params.id
  );
  res.json({ ok: true });
});

app.post('/api/admin/providers', requireRole('admin'), (req, res) => {
  const { name, categorySlug, subCategory, district, address, shortBio, description, priceFrom, priceUnit, capacityMin, capacityMax, phone, email, featured } =
    req.body;
  if (!name || !categorySlug || !district) {
    res.status(400).json({ error: 'Nom, catégorie et quartier requis.' });
    return;
  }
  const id = generateId('prov');
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO providers (
      id, user_id, name, category_slug, sub_category, district, address, lat, lng,
      description, short_bio, price_from, price_unit, capacity_min, capacity_max,
      equipments_json, services_included_json, formulas_json, menus_json, options_json,
      gallery_json, video_url, rating, review_count, status, featured, phone, email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 5.0, 0, 'approved', ?, ?, ?, ?)`
  ).run(
    id,
    'usr_admin_1',
    String(name),
    String(categorySlug),
    String(subCategory || 'Prestation Premium'),
    String(district),
    String(address || `${district}, Casablanca`),
    33.58 + (Math.random() - 0.5) * 0.04,
    -7.63 + (Math.random() - 0.5) * 0.04,
    String(description || shortBio || 'Prestataire partenaire EVENT PRO Casablanca.'),
    String(shortBio || 'Prestataire sélectionné à Casablanca.'),
    Number(priceFrom) || 10000,
    String(priceUnit || 'par événement'),
    Number(capacityMin || 20),
    Number(capacityMax || 400),
    '["Matériel professionnel certifié"]',
    '["Coordination incluse"]',
    JSON.stringify([{ name: 'Formule Découverte', price: Number(priceFrom) || 10000, description: 'Prestation complète.', features: ['Service vérifié'] }]),
    '[]',
    '[]',
    JSON.stringify(['/src/assets/images/venue_palais_anfa_1794908654717.jpg']),
    featured ? 1 : 0,
    String(phone || '+212 522 00 00 00'),
    String(email || 'contact@eventpro.ma'),
    now
  );
  res.status(201).json({ ok: true, id });
});

app.patch('/api/admin/providers/:id/status', requireRole('admin'), (req, res) => {
  const { status, featured } = req.body;
  const prov = db.prepare('SELECT user_id, status, featured FROM providers WHERE id = ?').get(req.params.id) as
    | { user_id: string; status: string; featured: number }
    | undefined;
  if (!prov) {
    res.status(404).json({ error: 'Prestataire introuvable.' });
    return;
  }
  const nextStatus = status || prov.status;
  const nextFeatured = featured !== undefined ? (featured ? 1 : 0) : prov.featured;
  db.prepare('UPDATE providers SET status = ?, featured = ? WHERE id = ?').run(nextStatus, nextFeatured, req.params.id);
  if (status === 'approved') {
    db.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(prov.user_id);
  } else if (status === 'suspended') {
    db.prepare(`UPDATE users SET status = 'suspended' WHERE id = ?`).run(prov.user_id);
  }
  res.json({ ok: true });
});

app.delete('/api/admin/providers/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM providers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/services', requireRole('admin'), (_req, res) => {
  const services = db
    .prepare(
      `SELECT s.id, s.provider_id as providerId, p.name as providerName, s.category_slug as categorySlug,
              s.title, s.description, s.price, s.price_unit as priceUnit, s.duration, s.active, s.created_at as createdAt
       FROM services s LEFT JOIN providers p ON s.provider_id = p.id ORDER BY s.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;
  res.json({ services: services.map((s) => ({ ...s, active: Boolean(s.active) })) });
});

app.put('/api/admin/services/:id', requireRole('admin'), (req, res) => {
  const { title, price, active } = req.body;
  const srv = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!srv) {
    res.status(404).json({ error: 'Prestation introuvable.' });
    return;
  }
  db.prepare('UPDATE services SET title = ?, price = ?, active = ? WHERE id = ?').run(
    title !== undefined ? String(title) : srv.title,
    price !== undefined ? Number(price) : srv.price,
    active !== undefined ? (active ? 1 : 0) : srv.active,
    req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/services/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/reviews', requireRole('admin'), (_req, res) => {
  const reviews = db
    .prepare(
      `SELECT r.id, r.provider_id as providerId, p.name as providerName, r.user_id as userId,
              r.author_name as authorName, r.rating, r.comment, r.event_type as eventType, r.status, r.created_at as createdAt
       FROM reviews r LEFT JOIN providers p ON r.provider_id = p.id ORDER BY r.created_at DESC`
    )
    .all();
  res.json({ reviews });
});

app.patch('/api/admin/reviews/:id', requireRole('admin'), (req, res) => {
  const { status } = req.body;
  const rev = db.prepare('SELECT provider_id FROM reviews WHERE id = ?').get(req.params.id) as { provider_id: string } | undefined;
  if (!rev) {
    res.status(404).json({ error: 'Avis introuvable.' });
    return;
  }
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status === 'hidden' ? 'hidden' : 'published', req.params.id);
  recalculateProviderRating(rev.provider_id);
  res.json({ ok: true });
});

app.delete('/api/admin/reviews/:id', requireRole('admin'), (req, res) => {
  const rev = db.prepare('SELECT provider_id FROM reviews WHERE id = ?').get(req.params.id) as { provider_id: string } | undefined;
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  if (rev) recalculateProviderRating(rev.provider_id);
  res.json({ ok: true });
});

app.put('/api/admin/site-content', requireRole('admin'), (req, res) => {
  const { content } = req.body as { content: SiteContent };
  if (!content) {
    res.status(400).json({ error: 'Contenu requis.' });
    return;
  }
  db.prepare(`UPDATE site_content SET value_json = ? WHERE key = 'main'`).run(JSON.stringify(content));
  res.json({ ok: true, content });
});

// ==========================================
// EVENT AI (GEMINI SERVER-SIDE)
// ==========================================
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message || !String(message).trim()) {
      res.status(400).json({ error: 'Message requis.' });
      return;
    }
    const result = await runEventAiAssistant(String(message), Array.isArray(history) ? history : [], context);
    res.json(result);
  } catch (err) {
    console.error('EVENT AI Error:', err);
    const errMsg = err instanceof Error ? err.message : 'Erreur lors de la consultation d\'EVENT AI.';
    res.status(500).json({ error: errMsg });
  }
});

// ==========================================
// VITE / STATIC SERVING ON PORT 3000
// ==========================================
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const distDir = path.resolve(process.cwd(), 'dist');

  if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EVENT PRO Casablanca server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
