import crypto from 'crypto';
import { db } from './db.ts';
import { hashPassword } from './auth.ts';
import type { SiteContent } from '../src/types.ts';

const IMG_HERO = '/src/assets/images/hero_wedding_casablanca_1794908654336.jpg';
const IMG_VENUE = '/src/assets/images/venue_palais_anfa_1794908654717.jpg';
const IMG_PHOTO = '/src/assets/images/photo_couple_editorial_1794908655309.jpg';
const IMG_CATERING = '/src/assets/images/catering_moroccan_gastronomy_1794908656156.jpg';
const IMG_DECOR = '/src/assets/images/decor_floral_luxury_1794908655561.jpg';
const IMG_DJ = '/src/assets/images/dj_gala_night_1794908656727.jpg';

export function seedDatabase(): void {
  const existingProviders = db.prepare('SELECT COUNT(*) as count FROM providers').get() as { count: number };
  if (existingProviders.count > 0) return;

  const now = new Date().toISOString();

  // Seed users (passwords hashed with scrypt, admin seeded from env or bootstrap config)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eventpro.ma';
  const adminPassword = process.env.ADMIN_PASSWORD || 'EventProAdmin!2026';

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('usr_admin_1', 'Direction EVENT PRO', adminEmail, '+212 522 00 11 22', hashPassword(adminPassword), 'admin', 'active', now);
  insertUser.run('usr_client_1', 'Salma Benjelloun', 'salma.client@casamail.ma', '+212 661 24 89 10', hashPassword('ClientPass2026!'), 'client', 'active', now);
  insertUser.run('usr_client_2', 'Youssef El Mansouri', 'youssef.entreprise@casacorp.ma', '+212 662 45 78 30', hashPassword('ClientPass2026!'), 'client', 'active', now);
  insertUser.run('usr_prov_1', 'Palais d\'Anfa Direction', 'contact@palaisanfa-casa.ma', '+212 522 39 10 45', hashPassword('ProviderPass2026!'), 'provider', 'active', now);
  insertUser.run('usr_prov_2', 'Studio Lumière Anfa', 'studio@lumiereanfa.ma', '+212 661 88 22 40', hashPassword('ProviderPass2026!'), 'provider', 'active', now);
  insertUser.run('usr_prov_3', 'Maison Palais Gourmet', 'devis@palaisgourmet.ma', '+212 522 94 12 60', hashPassword('ProviderPass2026!'), 'provider', 'active', now);
  insertUser.run('usr_prov_4', 'DJ Karim Sound Design', 'booking@djkarim.ma', '+212 663 19 44 55', hashPassword('ProviderPass2026!'), 'provider', 'active', now);
  insertUser.run('usr_prov_5', 'Atelier Floralia Californie', 'atelier@floralia-casa.ma', '+212 661 77 31 09', hashPassword('ProviderPass2026!'), 'provider', 'active', now);

  // Seed categories
  const insertCat = db.prepare(`
    INSERT INTO categories (id, slug, name, description, image) VALUES (?, ?, ?, ?, ?)
  `);
  const categories = [
    ['cat_1', 'salles', 'Salles de réception', 'Palais, villas avec jardins, hôtels 5 étoiles et espaces privés à Casablanca.', IMG_VENUE],
    ['cat_2', 'photographes', 'Photographes & Vidéastes', 'Reportages éditoriaux, films cinéma 4K, prises de vue drone et photobooth.', IMG_PHOTO],
    ['cat_3', 'traiteurs', 'Traiteurs', 'Haute gastronomie marocaine et internationale, buffets, cocktails et wedding cakes.', IMG_CATERING],
    ['cat_4', 'dj', 'DJ & Animation', 'DJ résidents, orchestres traditionnels, sonorisation, éclairage architectural et spectacles.', IMG_DJ],
    ['cat_5', 'decoration', 'Décoration', 'Scénographie florale, art de la table, arches cérémonielles et design d\'espaces.', IMG_DECOR],
    ['cat_6', 'organisation', 'Organisation complète', 'Wedding planners et chefs de projet dédiés pour une orchestration de A à Z.', IMG_HERO],
  ];
  for (const c of categories) insertCat.run(...c);

  // Seed 18 curated Casablanca providers across all categories and realistic neighborhoods
  const insertProv = db.prepare(`
    INSERT INTO providers (
      id, user_id, name, category_slug, sub_category, district, address, lat, lng,
      description, short_bio, price_from, price_unit, capacity_min, capacity_max,
      equipments_json, services_included_json, formulas_json, menus_json, options_json,
      gallery_json, video_url, rating, review_count, status, featured, phone, email, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const providersData = [
    // SALLES DE RÉCEPTION
    {
      id: 'prov_salle_1',
      userId: 'usr_prov_1',
      name: 'Palais d\'Anfa Réceptions',
      categorySlug: 'salles',
      subCategory: 'Salles de mariage',
      district: 'Anfa',
      address: '14 Boulevard d\'Anfa Supérieur, Quartier Anfa, Casablanca (Adresse fictive)',
      lat: 33.5912,
      lng: -7.6495,
      shortBio: 'Architecture néo-mauresque d\'exception avec lustres en cristal et jardins d\'apparat.',
      description: 'Situé au cœur d\'Anfa Supérieur, le Palais d\'Anfa offre deux salons modulables habillés de marbre de Carrare et de stucs ciselés, prolongés par un patio arboré idéal pour les cocktails de bienvenue.',
      priceFrom: 45000,
      priceUnit: 'par événement',
      capacityMin: 120,
      capacityMax: 550,
      equipments: ['Climatisation centralisée', 'Loge mariés privée', 'Parking voiturier 180 places', 'Cuisine traiteur équipée', 'Éclairage architectural LED', 'Scène modulable'],
      servicesIncluded: ['Agents d\'accueil et sécurité', 'Vestiaire surveillé', 'Groupe électrogène de secours', 'Nettoyage complet'],
      formulas: [
        { name: 'Location Salon Prestige', price: 45000, description: 'Accès au grand salon + patio cocktail jusqu\'à 03h00.', features: ['300 invités max', 'Voiturier inclus', 'Loge privée'] },
        { name: 'Privatisation Complète Palais & Jardins', price: 72000, description: 'Privatisation intégrale des espaces intérieurs et extérieurs.', features: ['550 invités max', 'Éclairage scénique', 'Suite préparatifs'] },
      ],
      menus: [],
      options: [{ name: 'Prolongation horaire jusqu\'à 05h00', price: 6500 }, { name: 'Tapis rouge & flambeaux d\'accueil', price: 3500 }],
      gallery: [IMG_VENUE, IMG_HERO, IMG_DECOR],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rating: 4.9,
      reviewCount: 48,
      status: 'approved',
      featured: 1,
      phone: '+212 522 39 10 45',
      email: 'contact@palaisanfa-casa.ma',
    },
    {
      id: 'prov_salle_2',
      userId: 'usr_prov_1',
      name: 'Villa Les Jardins de Californie',
      categorySlug: 'salles',
      subCategory: 'Jardins et espaces extérieurs',
      district: 'Californie',
      address: '88 Allée des Palmiers, Quartier Californie, Casablanca (Adresse fictive)',
      lat: 33.5418,
      lng: -7.6245,
      shortBio: 'Domaine verdoyant de 6 000 m² avec piscine miroir et verrière contemporaine.',
      description: 'Écrin botanique au calme absolu de Californie, parfait pour les mariages en plein air, fiançailles intimistes et réceptions estivales sous chapiteau vitré.',
      priceFrom: 32000,
      priceUnit: 'par événement',
      capacityMin: 80,
      capacityMax: 350,
      equipments: ['Jardin paysager', 'Piscine éclairée', 'Verrière climatisée', 'Espace cocktail', 'Parking privé'],
      servicesIncluded: ['Gardiennage', 'Éclairage jardin', 'Mobilier lounge terrasse'],
      formulas: [
        { name: 'Formule Garden Party', price: 32000, description: 'Jardin + verrière jusqu\'à 250 personnes.', features: ['Piscine sécurisée', 'Espace lounge'] },
        { name: 'Formule Grand Domaine', price: 48000, description: 'Capacité étendue avec pergola crystal.', features: ['350 personnes', 'Suite privée', 'Voiturier'] },
      ],
      menus: [],
      options: [{ name: 'Chauffages extérieurs design (lot de 8)', price: 2800 }],
      gallery: [IMG_DECOR, IMG_VENUE, IMG_HERO],
      videoUrl: '',
      rating: 4.8,
      reviewCount: 34,
      status: 'approved',
      featured: 1,
      phone: '+212 522 51 88 20',
      email: 'bonjour@jardins-californie.ma',
    },
    {
      id: 'prov_salle_3',
      userId: 'usr_prov_1',
      name: 'Hôtel Le Corniche Grand Ballroom',
      categorySlug: 'salles',
      subCategory: 'Hôtels',
      district: 'Ain Diab',
      address: 'Boulevard de la Corniche, Ain Diab, Casablanca (Adresse fictive)',
      lat: 33.5975,
      lng: -7.6745,
      shortBio: 'Vue panoramique sur l\'Atlantique et salle de bal 5 étoiles sans piliers.',
      description: 'Idéal pour les grands galas d\'entreprise, congrès internationaux et mariages prestigieux face à l\'océan Atlantique.',
      priceFrom: 58000,
      priceUnit: 'par événement',
      capacityMin: 150,
      capacityMax: 650,
      equipments: ['Système audiovisuel intégré', 'Écrans LED géants', 'Cabines de traduction', 'Terrasse face mer'],
      servicesIncluded: ['Régisseur technique', 'Suite nuptiale offerte (mariage)', 'Sécurité 24/7'],
      formulas: [
        { name: 'Conférence & Séminaire Journée', price: 38000, description: 'Équipement audiovisuel complet pour événements corporate.', features: ['Sonorisation Bose', '2 pauses café'] },
        { name: 'Gala & Mariage Royal', price: 58000, description: 'Ballroom complet avec terrasse vue mer.', features: ['Jusqu\'à 650 invités', 'Suite Océan incluse'] },
      ],
      menus: [],
      options: [{ name: 'Mur LED 6x3m haute définition', price: 9500 }],
      gallery: [IMG_HERO, IMG_VENUE, IMG_DJ],
      videoUrl: '',
      rating: 4.9,
      reviewCount: 52,
      status: 'approved',
      featured: 0,
      phone: '+212 522 79 44 00',
      email: 'events@lecorniche-casa.ma',
    },
    {
      id: 'prov_salle_4',
      userId: 'usr_prov_1',
      name: 'Domaine de Bouskoura Pavillon',
      categorySlug: 'salles',
      subCategory: 'Salles de fêtes',
      district: 'Bouskoura',
      address: 'Route de la Forêt Verte, Bouskoura, Casablanca (Adresse fictive)',
      lat: 33.4655,
      lng: -7.6380,
      shortBio: 'Pavillon architectural entouré de pins centenaires aux portes de Casablanca.',
      description: 'À 15 minutes du centre, un domaine d\'une rare sérénité alliant architecture contemporaine et grand parc boisé pour vos fêtes privées et lancements de produits.',
      priceFrom: 29000,
      priceUnit: 'par événement',
      capacityMin: 60,
      capacityMax: 320,
      equipments: ['Piste de danse parquet', 'Espace enfants sécurisé', 'Parking 200 voitures', 'Cuisine pro'],
      servicesIncluded: ['Coordination accueil', 'Éclairage d\'ambiance', 'Nettoyage'],
      formulas: [
        { name: 'Forfait Soirée Privée', price: 29000, description: 'Salle principale et terrasse forestière.', features: ['Jusqu\'à 200 invités', 'Parking inclus'] },
        { name: 'Forfait Prestige Forêt', price: 42000, description: 'Domaine privatisé sans limite sonore.', features: ['320 invités', 'Sonorisation de base'] },
      ],
      menus: [],
      options: [{ name: 'Navettes VIP depuis Maarif/Anfa', price: 4000 }],
      gallery: [IMG_VENUE, IMG_DECOR],
      videoUrl: '',
      rating: 4.7,
      reviewCount: 27,
      status: 'approved',
      featured: 0,
      phone: '+212 522 33 76 12',
      email: 'contact@domaine-bouskoura.ma',
    },
    {
      id: 'prov_salle_5',
      userId: 'usr_prov_1',
      name: 'Espace Gauthier Business & Conférences',
      categorySlug: 'salles',
      subCategory: 'Salles de conférence',
      district: 'Gauthier',
      address: '27 Rue Jean Jaurès, Quartier Gauthier, Casablanca (Adresse fictive)',
      lat: 33.5882,
      lng: -7.6318,
      shortBio: 'Auditorium high-tech et salons exécutifs au cœur du quartier d\'affaires.',
      description: 'Conçu pour les conférences, séminaires de direction, lancements de produits et cocktails corporate dans le triangle d\'or casablancais.',
      priceFrom: 18000,
      priceUnit: 'par journée',
      capacityMin: 30,
      capacityMax: 220,
      equipments: ['Fibre optique dédiée', 'Visioconférence 4K', '3 salles sous-commission', 'Système micro HF'],
      servicesIncluded: ['Support IT sur place', 'Accueil badgeage', 'Lounge VIP intervenants'],
      formulas: [
        { name: 'Demi-Journée Exécutive', price: 18000, description: 'Auditorium + salle cocktail.', features: ['150 places', 'Régie incluse'] },
        { name: 'Journée Complète Corporate', price: 26000, description: 'Accès complet + 3 salles atelier.', features: ['220 places', 'Streaming HD'] },
      ],
      menus: [],
      options: [{ name: 'Captation multicaméra conférence', price: 7500 }],
      gallery: [IMG_DJ, IMG_VENUE],
      videoUrl: '',
      rating: 4.8,
      reviewCount: 21,
      status: 'approved',
      featured: 0,
      phone: '+212 522 26 91 80',
      email: 'pro@espacegauthier.ma',
    },

    // PHOTOGRAPHES & VIDÉASTES
    {
      id: 'prov_photo_1',
      userId: 'usr_prov_2',
      name: 'Studio Lumière Anfa',
      categorySlug: 'photographes',
      subCategory: 'Photographie de mariage',
      district: 'Anfa',
      address: '5 Rue Ibnou Khalikane, Anfa, Casablanca (Adresse fictive)',
      lat: 33.5931,
      lng: -7.6410,
      shortBio: 'Photographie éditoriale de mariage & films cinéma 4K avec drone certifié.',
      description: 'Collectif de photographes d\'art et réalisateurs cinéma spécialisés dans les mariages haut de gamme à Casablanca. Rendu intemporel, lumière naturelle et narration émotionnelle.',
      priceFrom: 12000,
      priceUnit: 'par prestation',
      capacityMin: 1,
      capacityMax: 1000,
      equipments: ['Boîtiers Leica & Sony Alpha 1', 'Caméras RED Komodo 4K', 'Drone stabilisé DJI Inspire', 'Photobooth Miroir Design'],
      servicesIncluded: ['2 photographes seniors', 'Galerie privée en ligne HD', 'Livraison sous 15 jours', 'Album cuir fait main'],
      formulas: [
        { name: 'Reportage Photo Signature', price: 12000, description: 'Couverture complète des préparatifs à la pièce montée.', features: ['2 photographes', '600+ photos retouchées', 'Coffret USB bois'] },
        { name: 'Duo Photo + Film Cinéma 4K', price: 22000, description: 'Couverture complète photo + film long métrage et teaser.', features: ['2 photographes + 2 vidéastes', 'Plans drone', 'Teaser 48h'] },
      ],
      menus: [],
      options: [{ name: 'Photobooth Miroir illimité (4h)', price: 4500 }, { name: 'Séance Engagement Day-After', price: 3800 }],
      gallery: [IMG_PHOTO, IMG_HERO, IMG_DECOR],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rating: 4.9,
      reviewCount: 64,
      status: 'approved',
      featured: 1,
      phone: '+212 661 88 22 40',
      email: 'studio@lumiereanfa.ma',
    },
    {
      id: 'prov_photo_2',
      userId: 'usr_prov_2',
      name: 'Maison Cadre & Drone Maarif',
      categorySlug: 'photographes',
      subCategory: 'Vidéo cinéma et drone',
      district: 'Maarif',
      address: '112 Boulevard Zerktouni, Maarif, Casablanca (Adresse fictive)',
      lat: 33.5844,
      lng: -7.6341,
      shortBio: 'Production vidéo événementielle, conférences, anniversaires et shooting corporate.',
      description: 'Agence de production audiovisuelle casablancaise offrant des reportages dynamiques pour les lancements de marques, fiançailles, anniversaires et galas.',
      priceFrom: 8500,
      priceUnit: 'par prestation',
      capacityMin: 1,
      capacityMax: 800,
      equipments: ['Stabilisateur Ronin RS4', 'Drone FPV & Ciné', 'Studio mobile portrait', 'Éclairage Aputure'],
      servicesIncluded: ['Montage colorimétrique', 'Musique sous licence', 'Livraison format vertical & 16:9'],
      formulas: [
        { name: 'Pack Anniversaire / Fiançailles', price: 8500, description: '1 photographe + 1 vidéaste pendant 6h.', features: ['300 photos', 'Aftermovie 4 min'] },
        { name: 'Pack Corporate & Conférence', price: 14500, description: 'Captation complète + interviews dirigeants.', features: ['Diffusion express J+2', 'Drone extérieur'] },
      ],
      menus: [],
      options: [{ name: 'Borne 360° Vidéo Slow-Motion', price: 5000 }],
      gallery: [IMG_PHOTO, IMG_DJ],
      videoUrl: '',
      rating: 4.8,
      reviewCount: 39,
      status: 'approved',
      featured: 0,
      phone: '+212 664 12 90 15',
      email: 'contact@cadredrone.ma',
    },

    // TRAITEURS
    {
      id: 'prov_traiteur_1',
      userId: 'usr_prov_3',
      name: 'Maison Palais Gourmet',
      categorySlug: 'traiteurs',
      subCategory: 'Traiteur marocain',
      district: 'Oasis',
      address: '42 Rue Al Yamama, Quartier Oasis, Casablanca (Adresse fictive)',
      lat: 33.5622,
      lng: -7.6288,
      shortBio: 'Haute gastronomie marocaine et internationale, service à l\'assiette et wedding cakes.',
      description: 'Référence gastronomique à Casablanca depuis 18 ans. Maison Palais Gourmet sublime les réceptions grâce à ses brigades étoilées, ses arts de la table en porcelaine dorée et ses pâtisseries fines.',
      priceFrom: 480,
      priceUnit: 'par personne',
      capacityMin: 40,
      capacityMax: 800,
      equipments: ['Vaisselle Limoges & argenterie', 'Cuisines mobiles HACCP', 'Bars à cocktails sans alcool', 'Fontaines à thé'],
      servicesIncluded: ['Maîtres d\'hôtel en gants blancs', 'Nappage lin & serviettes brodées', 'Dégustation préalable pour 4 personnes'],
      formulas: [
        { name: 'Dîner Royal Marocain', price: 480, description: 'Pastilla fruits de mer, méchoui fondant, fruits de saison & thé à la menthe.', features: ['Min 50 invités', 'Service complet inclus'] },
        { name: 'Menu Fusion Gastronomique', price: 690, description: 'Cocktail dînatoire 14 pièces + Dîner servi 4 temps + Pièce montée.', features: ['Min 60 invités', 'Wedding cake inclus'] },
      ],
      menus: [
        { name: 'Menu Tradition & Prestige', pricePerPerson: 480, items: ['Assortiment briouates & chbakia fine', 'Pastilla Royale aux fruits de mer & safran', 'Épaule d\'agneau confite aux pruneaux & amandes', 'Corbeille de fruits sculptés & pâtisseries marocaines'] },
        { name: 'Menu International & Gala', pricePerPerson: 690, items: ['Velouté de homard & tartare de daurade', 'Filet de bœuf Rossini sauce truffe', 'Trio de mignardises françaises & wedding cake sur mesure', 'Atelier bar à thés & jus frais pressés'] },
        { name: 'Cocktail Dînatoire Corporate', pricePerPerson: 340, items: ['16 pièces salées chaudes et froides', 'Live cooking sushis & wok', '8 pièces sucrées macaron & verrines'] },
      ],
      options: [{ name: 'Atelier live sushis & sashimis', price: 120 }, { name: 'Wedding Cake 4 étages floral', price: 6500 }],
      gallery: [IMG_CATERING, IMG_HERO, IMG_VENUE],
      videoUrl: '',
      rating: 4.9,
      reviewCount: 78,
      status: 'approved',
      featured: 1,
      phone: '+212 522 94 12 60',
      email: 'devis@palaisgourmet.ma',
    },
    {
      id: 'prov_traiteur_2',
      userId: 'usr_prov_3',
      name: 'Atelier Chef Bennani Gastronomie',
      categorySlug: 'traiteurs',
      subCategory: 'Cuisine gastronomique',
      district: 'Bourgogne',
      address: '19 Rue de Tiznit, Bourgogne, Casablanca (Adresse fictive)',
      lat: 33.5960,
      lng: -7.6442,
      shortBio: 'Buffets contemporains, cocktails d\'entreprise et pâtisserie haute couture.',
      description: 'Cuisine créative de saison mettant à l\'honneur les produits du terroir marocain avec un dressage contemporain digne des plus grandes tables.',
      priceFrom: 350,
      priceUnit: 'par personne',
      capacityMin: 25,
      capacityMax: 450,
      equipments: ['Présentoirs marbre et laiton', 'Stand barista & matcha', 'Chariots chauffants'],
      servicesIncluded: ['Serveurs professionnels', 'Verrerie cristal', 'Gestion allergies'],
      formulas: [
        { name: 'Buffet Prestige', price: 350, description: 'Entrées variées, 2 plats signatures et buffet desserts.', features: ['Min 30 pers.', 'Vaisselle incluse'] },
        { name: 'Menu Dégustation Assis', price: 590, description: 'Service à l\'assiette 5 plats.', features: ['Min 40 pers.', 'Chef présent sur place'] },
      ],
      menus: [
        { name: 'Buffet Méditerranéen & Marocain', pricePerPerson: 350, items: ['Salades composées gastronomiques', 'Tagine de lotte aux épices douces', 'Suprême de volaille fermière aux morilles', 'Buffet de tartelettes & entremets'] },
      ],
      options: [{ name: 'Fontaine chocolat Valrhona', price: 3200 }],
      gallery: [IMG_CATERING, IMG_DECOR],
      videoUrl: '',
      rating: 4.8,
      reviewCount: 41,
      status: 'approved',
      featured: 0,
      phone: '+212 522 27 55 81',
      email: 'chef@atelierbennani.ma',
    },

    // DJ & ANIMATION
    {
      id: 'prov_dj_1',
      userId: 'usr_prov_4',
      name: 'DJ Karim & Sound Design',
      categorySlug: 'dj',
      subCategory: 'DJ professionnels',
      district: 'Ain Diab',
      address: 'Résidence Océane, Boulevard Biarritz, Ain Diab, Casablanca (Adresse fictive)',
      lat: 33.5955,
      lng: -7.6690,
      shortBio: 'DJ set éclectique, sonorisation L-Acoustics et éclairage architectural sur mesure.',
      description: 'Plus de 300 mariages et soirées corporate à Casablanca. DJ Karim allie répertoires oriental chic, chaâbi raffiné, deep house et classiques internationaux avec une régie son & lumière invisible et élégante.',
      priceFrom: 9000,
      priceUnit: 'par soirée',
      capacityMin: 30,
      capacityMax: 700,
      equipments: ['Sonorisation L-Acoustics', 'Console Pioneer CDJ-3000', '24 projecteurs LED sans fil', '4 jets d\'étincelles froides'],
      servicesIncluded: ['Installation 4h avant l\'événement', 'Micros HF Shure pour discours', 'Playlist personnalisée avec les clients'],
      formulas: [
        { name: 'Set DJ & Sonorisation Essentiel', price: 9000, description: 'Jusqu\'à 200 invités avec éclairage piste.', features: ['6h de prestation', 'Micros sans fil'] },
        { name: 'Production Scénique Complète', price: 16500, description: 'Son concert + éclairage architectural complet + étincelles froides.', features: ['Jusqu\'à 700 invités', 'Ingénieur lumière dédié'] },
      ],
      menus: [],
      options: [{ name: 'Saxophoniste live en duo avec DJ', price: 4500 }, { name: 'Fumée lourde ouverture de bal', price: 2500 }],
      gallery: [IMG_DJ, IMG_HERO],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      rating: 4.9,
      reviewCount: 57,
      status: 'approved',
      featured: 1,
      phone: '+212 663 19 44 55',
      email: 'booking@djkarim.ma',
    },
    {
      id: 'prov_dj_2',
      userId: 'usr_prov_4',
      name: 'Orchestre Al Andalous & Dakka Prestige',
      categorySlug: 'dj',
      subCategory: 'Musique traditionnelle marocaine',
      district: 'Maarif',
      address: '33 Rue d\'Alger, Maarif, Casablanca (Adresse fictive)',
      lat: 33.5810,
      lng: -7.6305,
      shortBio: 'Orchestre andalou, Issawa, Dakka Marrakchia et animation complète de mariage.',
      description: 'Ensemble de 12 musiciens virtuoses en tenues traditionnelles de gala pour sublimer les entrées des mariés, cérémonies de henné et soirées culturelles.',
      priceFrom: 14000,
      priceUnit: 'par soirée',
      capacityMin: 50,
      capacityMax: 800,
      equipments: ['Instruments traditionnels acoustiques', 'Sonorisation dédiée orchestre', 'Tenues caftans & jabador assortis'],
      servicesIncluded: ['Accueil Dakka Marrakchia', 'Set Tarab Al Andalous', 'Animation Chaâbi & Amaria'],
      formulas: [
        { name: 'Dakka Marrakchia Accueil (6 musiciens)', price: 6500, description: 'Animation d\'entrée et passages clés.', features: ['3 passages festifs', 'Tenues dorées'] },
        { name: 'Grand Orchestre 12 Musiciens + Dakka', price: 18000, description: 'Soirée complète du cocktail à l\'aube.', features: ['Répertoire varié', 'Sonorisation incluse'] },
      ],
      menus: [],
      options: [{ name: 'Troupe Gnawa fusion (5 artistes)', price: 5500 }],
      gallery: [IMG_DJ, IMG_HERO],
      videoUrl: '',
      rating: 4.9,
      reviewCount: 44,
      status: 'approved',
      featured: 0,
      phone: '+212 661 42 78 90',
      email: 'contact@alandalous-prestige.ma',
    },
    {
      id: 'prov_dj_3',
      userId: 'usr_prov_4',
      name: 'Studio Scène & Lumières Sidi Maarouf',
      categorySlug: 'dj',
      subCategory: 'Éclairage professionnel',
      district: 'Sidi Maarouf',
      address: 'Lotissement Technopark Avenue, Sidi Maarouf, Casablanca (Adresse fictive)',
      lat: 33.5320,
      lng: -7.6415,
      shortBio: 'Régie son, éclairage architectural, écrans LED et animations enfants encadrées.',
      description: 'Prestataire technique pour séminaires, spectacles d\'entreprise et fêtes familiales avec pôles d\'animation ludique pour enfants.',
      priceFrom: 7500,
      priceUnit: 'par prestation',
      capacityMin: 20,
      capacityMax: 600,
      equipments: ['Pont lumière motorisé', 'Écrans LED P2.6', 'Châteaux & ateliers enfants'],
      servicesIncluded: ['2 techniciens régie', 'Assurance RC événementielle'],
      formulas: [
        { name: 'Pack Son & Éclairage Conférence', price: 7500, description: 'Sonorisation claire et éclairage scène.', features: ['4 micros HF', 'Pupitre'] },
        { name: 'Pack Animation Enfants & Spectacle', price: 6000, description: '3 animateurs diplômés, magie et ateliers créatifs.', features: ['4h d\'animation', 'Matériel inclus'] },
      ],
      menus: [],
      options: [],
      gallery: [IMG_DJ],
      videoUrl: '',
      rating: 4.7,
      reviewCount: 19,
      status: 'approved',
      featured: 0,
      phone: '+212 522 97 30 11',
      email: 'technique@scenelumieres.ma',
    },

    // DÉCORATION
    {
      id: 'prov_decor_1',
      userId: 'usr_prov_5',
      name: 'Atelier Floralia Californie',
      categorySlug: 'decoration',
      subCategory: 'Décoration florale',
      district: 'Californie',
      address: '61 Boulevard de la Mecque, Californie, Casablanca (Adresse fictive)',
      lat: 33.5485,
      lng: -7.6190,
      shortBio: 'Architectes floraux : arches d\'orchidées, tables d\'honneur et scénographies sur mesure.',
      description: 'Maison de haute décoration florale et événementielle. Nous concevons des univers poétiques en fleurs fraîches importées (roses Austin, orchidées Phalaenopsis, pivoines) et mobilier précieux.',
      priceFrom: 18000,
      priceUnit: 'par événement',
      capacityMin: 20,
      capacityMax: 600,
      equipments: ['Structures arches dorées', 'Chandeliers cristal & laiton', 'Nappages velours & lin', 'Verrerie soufflée'],
      servicesIncluded: ['Planche d\'inspiration 3D', 'Montage & démontage complet', 'Fleurs fraîches 100% naturelles'],
      formulas: [
        { name: 'Scénographie Fiançailles / Intimiste', price: 18000, description: 'Arche florale, coin photo et 8 centres de table.', features: ['Jusqu\'à 80 invités', 'Bougies & chandeliers'] },
        { name: 'Haute Décoration Mariage Royal', price: 42000, description: 'Suspension florale, allée cérémonielle, 25 tables & espace mariés.', features: ['Design 3D sur mesure', 'Équipe de 8 fleuristes'] },
      ],
      menus: [],
      options: [{ name: 'Ciel étoilé de 400 bougies suspendues', price: 8500 }],
      gallery: [IMG_DECOR, IMG_HERO, IMG_VENUE],
      videoUrl: '',
      rating: 5.0,
      reviewCount: 51,
      status: 'approved',
      featured: 1,
      phone: '+212 661 77 31 09',
      email: 'atelier@floralia-casa.ma',
    },
    {
      id: 'prov_decor_2',
      userId: 'usr_prov_5',
      name: 'Maison Scénographie Anfa',
      categorySlug: 'decoration',
      subCategory: 'Décoration d\'événements d\'entreprise',
      district: 'Anfa',
      address: '9 Rue Socrate, Anfa, Casablanca (Adresse fictive)',
      lat: 33.5895,
      lng: -7.6550,
      shortBio: 'Décoration de galas, lancements de produits, scénographies de salles et anniversaires.',
      description: 'Studio de design spatial créant des décors architecturaux pour marques de luxe, galas caritatifs et anniversaires mémorables à Casablanca.',
      priceFrom: 15000,
      priceUnit: 'par événement',
      capacityMin: 30,
      capacityMax: 500,
      equipments: ['Mobilier design velours', 'Photocalls personnalisés', 'Signalétique laiton brossé'],
      servicesIncluded: ['Direction artistique', 'Installation nocturne possible', 'Démontage'],
      formulas: [
        { name: 'Pack Lancement & Photocall', price: 15000, description: 'Mur d\'image architectural, comptoir accueil et floral.', features: ['Impression grand format', 'Éclairage dédié'] },
        { name: 'Pack Gala Corporate Complet', price: 34000, description: 'Habillage complet salle, tables et scène.', features: ['Design personnalisé', 'Chef décorateur sur place'] },
      ],
      menus: [],
      options: [],
      gallery: [IMG_DECOR, IMG_DJ],
      videoUrl: '',
      rating: 4.8,
      reviewCount: 29,
      status: 'approved',
      featured: 0,
      phone: '+212 522 36 80 14',
      email: 'design@scenographie-anfa.ma',
    },

    // ORGANISATION COMPLÈTE
    {
      id: 'prov_org_1',
      userId: 'usr_prov_1',
      name: 'EVENT PRO Signature Concierge',
      categorySlug: 'organisation',
      subCategory: 'Organisation complète',
      district: 'Gauthier',
      address: '18 Boulevard Moulay Youssef, Gauthier, Casablanca (Adresse fictive)',
      lat: 33.5890,
      lng: -7.6280,
      shortBio: 'Wedding planners & chefs de projet seniors pour une orchestration clé en main.',
      description: 'Notre équipe d\'organisateurs certifiés pilote l\'intégralité de votre mariage, gala ou conférence à Casablanca : rétroplanning, gestion budgétaire, coordination des prestataires et régie complète le jour J.',
      priceFrom: 15000,
      priceUnit: 'par forfait',
      capacityMin: 20,
      capacityMax: 1000,
      equipments: ['Dossier de production digital', 'Équipe de 4 coordinateurs jour J', 'Talkies-walkies discrets'],
      servicesIncluded: ['Rétroplanning personnalisé', 'Négociation prestataires', 'Présence continue le jour J'],
      formulas: [
        { name: 'Formule Basic', price: 15000, description: 'Accompagnement simple, sélection de prestataires et conseils.', features: ['Sélection ciblée', '3 rendez-vous conseil'] },
        { name: 'Formule Premium', price: 32000, description: 'Organisation personnalisée, coordination et gestion du planning.', features: ['Suivi mensuel', 'Gestion planning complet'] },
        { name: 'Formule VIP', price: 58000, description: 'Organisation complète, décoration personnalisée et coordination jour J.', features: ['Accompagnement prioritaire', '3 coordinateurs jour J'] },
      ],
      menus: [],
      options: [],
      gallery: [IMG_HERO, IMG_VENUE, IMG_DECOR],
      videoUrl: '',
      rating: 5.0,
      reviewCount: 42,
      status: 'approved',
      featured: 1,
      phone: '+212 522 00 11 22',
      email: 'concierge@eventpro.ma',
    },
  ];

  for (const p of providersData) {
    insertProv.run(
      p.id,
      p.userId,
      p.name,
      p.categorySlug,
      p.subCategory,
      p.district,
      p.address,
      p.lat,
      p.lng,
      p.description,
      p.shortBio,
      p.priceFrom,
      p.priceUnit,
      p.capacityMin,
      p.capacityMax,
      JSON.stringify(p.equipments),
      JSON.stringify(p.servicesIncluded),
      JSON.stringify(p.formulas),
      JSON.stringify(p.menus),
      JSON.stringify(p.options),
      JSON.stringify(p.gallery),
      p.videoUrl,
      p.rating,
      p.reviewCount,
      p.status,
      p.featured,
      p.phone,
      p.email,
      now
    );
  }

  // Seed services table
  const insertService = db.prepare(`
    INSERT INTO services (id, provider_id, category_slug, title, description, price, price_unit, duration, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of providersData) {
    p.formulas.forEach((f, idx) => {
      insertService.run(
        `srv_${p.id}_${idx + 1}`,
        p.id,
        p.categorySlug,
        f.name,
        f.description,
        f.price,
        p.priceUnit,
        'Événement complet',
        1,
        now
      );
    });
  }

  // Seed initial bookings & availability
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, booking_number, client_id, client_name, client_email, client_phone,
      provider_id, provider_name, event_type, event_date, event_time, location,
      guests, formula_name, options_json, total_price, comments, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAvail = db.prepare(`
    INSERT OR IGNORE INTO availability (id, provider_id, event_date, status, booking_id) VALUES (?, ?, ?, ?, ?)
  `);

  const seededBookings = [
    {
      id: 'bk_1',
      num: 'EP-2026-1042',
      clientId: 'usr_client_1',
      clientName: 'Salma Benjelloun',
      clientEmail: 'salma.client@casamail.ma',
      clientPhone: '+212 661 24 89 10',
      providerId: 'prov_salle_1',
      providerName: 'Palais d\'Anfa Réceptions',
      eventType: 'Mariage',
      eventDate: '2026-12-19',
      eventTime: '19:30',
      location: 'Anfa, Casablanca',
      guests: 280,
      formulaName: 'Location Salon Prestige',
      options: ['Tapis rouge & flambeaux d\'accueil'],
      totalPrice: 48500,
      comments: 'Installation florale prévue à partir de 11h00.',
      status: 'Confirmée',
      createdAt: '2026-09-14T10:15:00.000Z',
    },
    {
      id: 'bk_2',
      num: 'EP-2026-1087',
      clientId: 'usr_client_1',
      clientName: 'Salma Benjelloun',
      clientEmail: 'salma.client@casamail.ma',
      clientPhone: '+212 661 24 89 10',
      providerId: 'prov_photo_1',
      providerName: 'Studio Lumière Anfa',
      eventType: 'Mariage',
      eventDate: '2026-12-19',
      eventTime: '15:00',
      location: 'Anfa, Casablanca',
      guests: 280,
      formulaName: 'Duo Photo + Film Cinéma 4K',
      options: ['Photobooth Miroir illimité (4h)'],
      totalPrice: 26500,
      comments: 'Besoin du teaser pour le dimanche suivant.',
      status: 'Confirmée',
      createdAt: '2026-09-22T14:30:00.000Z',
    },
    {
      id: 'bk_3',
      num: 'EP-2026-1115',
      clientId: 'usr_client_2',
      clientName: 'Youssef El Mansouri',
      clientEmail: 'youssef.entreprise@casacorp.ma',
      clientPhone: '+212 662 45 78 30',
      providerId: 'prov_salle_5',
      providerName: 'Espace Gauthier Business & Conférences',
      eventType: 'Conférence',
      eventDate: '2026-12-05',
      eventTime: '08:30',
      location: 'Gauthier, Casablanca',
      guests: 140,
      formulaName: 'Journée Complète Corporate',
      options: [],
      totalPrice: 26000,
      comments: 'Conférence annuelle secteur finance.',
      status: 'En attente',
      createdAt: '2026-10-08T09:00:00.000Z',
    },
    {
      id: 'bk_4',
      num: 'EP-2026-1140',
      clientId: 'usr_client_2',
      clientName: 'Youssef El Mansouri',
      clientEmail: 'youssef.entreprise@casacorp.ma',
      clientPhone: '+212 662 45 78 30',
      providerId: 'prov_traiteur_1',
      providerName: 'Maison Palais Gourmet',
      eventType: 'Événement professionnel',
      eventDate: '2026-11-28',
      eventTime: '19:00',
      location: 'Ain Diab, Casablanca',
      guests: 120,
      formulaName: 'Menu Fusion Gastronomique',
      options: [],
      totalPrice: 82800,
      comments: 'Dîner de gala de fin d\'année.',
      status: 'Terminée',
      createdAt: '2026-08-20T16:45:00.000Z',
    },
  ];

  for (const b of seededBookings) {
    insertBooking.run(
      b.id, b.num, b.clientId, b.clientName, b.clientEmail, b.clientPhone,
      b.providerId, b.providerName, b.eventType, b.eventDate, b.eventTime,
      b.location, b.guests, b.formulaName, JSON.stringify(b.options),
      b.totalPrice, b.comments, b.status, b.createdAt
    );
    if (b.status === 'Confirmée' || b.status === 'En attente') {
      insertAvail.run(`av_${b.id}`, b.providerId, b.eventDate, 'booked', b.id);
    }
  }

  // Seed initial reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, provider_id, user_id, author_name, rating, comment, event_type, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seededReviews = [
    ['rev_1', 'prov_salle_1', 'usr_client_1', 'Kenza & Mehdi Tazi', 5, 'Un cadre absolument majestueux à Anfa. Le service de voiturier et la coordination avec notre décorateur ont été irréprochables.', 'Mariage', 'published', '2026-10-01T12:00:00Z'],
    ['rev_2', 'prov_photo_1', 'usr_client_1', 'Nadia Chraïbi', 5, 'Des clichés d\'une sensibilité rare. Le film 4K avec prises de vue drone au coucher du soleil a ému toute la famille.', 'Mariage', 'published', '2026-10-10T15:20:00Z'],
    ['rev_3', 'prov_traiteur_1', 'usr_client_2', 'Amine Berrada', 5, 'Qualité gastronomique constante pour 350 convives. La pastilla aux fruits de mer et le service à l\'assiette ont fait l\'unanimité.', 'Gala d\'entreprise', 'published', '2026-10-18T18:00:00Z'],
    ['rev_4', 'prov_decor_1', 'usr_client_1', 'Siham & Omar Alami', 5, 'Atelier Floralia a transformé la verrière en un jardin d\'orchidées blanches féerique. Chaque détail respectait le plan 3D.', 'Fiançailles', 'published', '2026-10-25T11:30:00Z'],
    ['rev_5', 'prov_dj_1', 'usr_client_2', 'Rania Filali', 5, 'Transition fluide entre musique andalouse, chaâbi chic et deep house jusqu\'à 4h du matin. Sonorisation claire sans jamais saturer.', 'Anniversaire', 'published', '2026-11-02T09:40:00Z'],
  ];
  for (const r of seededReviews) insertReview.run(...r);

  // Seed initial quotes
  const insertQuote = db.prepare(`
    INSERT INTO quotes (
      id, quote_number, client_id, client_name, client_email, client_phone,
      provider_id, provider_name, event_type, event_date, guests, budget,
      message, reply_message, quoted_price, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQuote.run(
    'qt_1', 'DV-2026-301', 'usr_client_1', 'Salma Benjelloun', 'salma.client@casamail.ma', '+212 661 24 89 10',
    'prov_decor_1', 'Atelier Floralia Californie', 'Mariage', '2026-12-19', 280, 45000,
    'Nous souhaitons une arche d\'orchidées blanches et 22 centres de table avec bougies dorées.',
    'Bonjour Salma, nous serons ravis d\'habiller le Palais d\'Anfa. Notre proposition inclut l\'arche d\'honneur, 22 compositions hautes et les chandeliers.',
    39500, 'Répondu', '2026-10-15T11:00:00Z'
  );

  // Seed initial favorites & project
  db.prepare('INSERT INTO favorites (id, user_id, provider_id, created_at) VALUES (?, ?, ?, ?)').run(
    'fav_1', 'usr_client_1', 'prov_salle_1', now
  );
  db.prepare('INSERT INTO favorites (id, user_id, provider_id, created_at) VALUES (?, ?, ?, ?)').run(
    'fav_2', 'usr_client_1', 'prov_decor_1', now
  );

  db.prepare(`
    INSERT INTO event_projects (id, user_id, title, event_type, event_date, district, guests, budget, selected_services_json, selected_providers_json, total_cost, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'prj_1', 'usr_client_1', 'Mariage Salma & Karim — Décembre 2026', 'Mariage', '2026-12-19', 'Anfa', 280, 220000,
    JSON.stringify(['salles', 'photographes', 'traiteurs', 'decoration', 'dj']),
    JSON.stringify([
      { providerId: 'prov_salle_1', providerName: 'Palais d\'Anfa Réceptions', categorySlug: 'salles', price: 45000, formulaName: 'Location Salon Prestige' },
      { providerId: 'prov_photo_1', providerName: 'Studio Lumière Anfa', categorySlug: 'photographes', price: 22000, formulaName: 'Duo Photo + Film Cinéma 4K' },
      { providerId: 'prov_traiteur_1', providerName: 'Maison Palais Gourmet', categorySlug: 'traiteurs', price: 134400, formulaName: 'Dîner Royal Marocain (280 inv.)' },
    ]),
    201400, 'Sauvegardé', now
  );

  // Seed notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run('nt_1', 'usr_client_1', 'Réservation confirmée', 'Votre réservation EP-2026-1042 au Palais d\'Anfa Réceptions est confirmée.', 'booking', 0, now);
  insertNotif.run('nt_2', 'usr_client_1', 'Devis reçu', 'Atelier Floralia Californie a répondu à votre demande de devis DV-2026-301 (39 500 DH).', 'quote', 0, now);

  // Seed editable site content
  const defaultContent: SiteContent = {
    heroTitle: 'Organisez vos événements, nous créons vos plus beaux souvenirs.',
    heroSubtitle: 'Trouvez les meilleurs prestataires événementiels à Casablanca et organisez facilement vos événements avec EVENT PRO.',
    promoBanner: 'Saison 2026-2027 ouverte à Casablanca : profitez d\'un accompagnement personnalisé offert sur les réservations Event Builder.',
    whatsappNumber: '+212 661 00 11 22',
    whatsappPrefilledMessage:
      'Bonjour EVENT PRO Casablanca, je souhaite organiser un événement et recevoir des informations sur vos prestataires.',
    plannerPackages: [
      {
        id: 'basic',
        name: 'Formule Basic',
        subtitle: 'Pour les clients souhaitant cadrer leur projet avec les bons partenaires',
        price: 15000,
        features: [
          'Accompagnement simple et cadrage budgétaire',
          'Sélection sur mesure de prestataires vérifiés',
          '3 séances de conseils d\'organisation',
          'Vérification des disponibilités à Casablanca',
        ],
      },
      {
        id: 'premium',
        name: 'Formule Premium',
        subtitle: 'Pour une coordination fluide de l\'ensemble des prestataires',
        price: 32000,
        features: [
          'Organisation personnalisée de A à Z',
          'Coordination complète de tous les prestataires',
          'Gestion du planning et visites techniques',
          'Négociation tarifaire et suivi des contrats',
        ],
      },
      {
        id: 'vip',
        name: 'Formule VIP',
        subtitle: 'Direction artistique intégrale et sérénité absolue le jour J',
        price: 58000,
        features: [
          'Organisation complète clé en main',
          'Décoration personnalisée & planche 3D',
          'Coordination le jour J par 3 chefs de projet',
          'Accompagnement prioritaire 7j/7',
        ],
      },
    ],
    testimonials: [
      {
        id: 't1',
        author: 'Salma & Karim Benjelloun',
        role: 'Mariage au Palais d\'Anfa (300 invités)',
        eventType: 'Mariage',
        rating: 5,
        comment: 'Grâce à l\'Event Builder d\'EVENT PRO, nous avons composé notre budget en une soirée et réservé salle, traiteur et photographe sans aucun imprévu.',
      },
      {
        id: 't2',
        author: 'Youssef El Mansouri',
        role: 'Directeur Général, Atlas Advisory Casablanca',
        eventType: 'Conférence & Gala',
        rating: 5,
        comment: 'Une réactivité remarquable pour notre séminaire annuel à Gauthier. Les devis PDF et la transparence des tarifs en dirhams facilitent la validation interne.',
      },
      {
        id: 't3',
        author: 'Mouna Kettani',
        role: 'Réception privée à Californie',
        eventType: 'Fiançailles',
        rating: 5,
        comment: 'Chaque prestataire recommandé a dépassé nos attentes. Le suivi depuis l\'espace client apporte une vraie tranquillité d\'esprit.',
      },
    ],
    faqs: [
      {
        id: 'faq1',
        category: 'Réservation',
        question: 'Comment éviter les doubles réservations sur une même date ?',
        answer: 'Chaque réservation confirmée ou en cours bloque automatiquement la date dans le calendrier du prestataire. Notre système vérifie la disponibilité en temps réel avant toute validation.',
      },
      {
        id: 'faq2',
        category: 'Tarifs',
        question: 'Les tarifs affichés en DH sont-ils transparents ?',
        answer: 'Oui. Chaque prestataire indique son tarif de départ en Dirhams marocains (DH) et le détail de ses formules. Pour les demandes sur mesure, vous recevez un devis chiffré et téléchargeable en PDF.',
      },
      {
        id: 'faq3',
        category: 'Prestataires',
        question: 'Comment sont sélectionnés les professionnels sur EVENT PRO ?',
        answer: 'Tous les comptes prestataires sont vérifiés et validés manuellement par notre équipe administrative à Casablanca avant la publication de leurs prestations.',
      },
      {
        id: 'faq4',
        category: 'Annulation',
        question: 'Quelles sont les conditions d\'annulation d\'une réservation ?',
        answer: 'Vous pouvez annuler une réservation depuis votre espace client jusqu\'à 30 jours avant la date prévue selon les conditions définies dans notre charte d\'annulation.',
      },
    ],
    realizations: [
      {
        id: 'real1',
        title: 'Mariage Royal sous les Arches d\'Anfa',
        category: 'Mariage',
        district: 'Anfa',
        guests: 340,
        image: IMG_HERO,
        description: 'Dîner aux chandelles, orchidées blanches et orchestre andalou pour une réception inoubliable.',
      },
      {
        id: 'real2',
        title: 'Gala Annuel Finance & Tech',
        category: 'Événements professionnels',
        district: 'Ain Diab',
        guests: 220,
        image: IMG_DJ,
        description: 'Scénographie lumineuse, quatuor à cordes et DJ set élégant dans un patio architectural.',
      },
      {
        id: 'real3',
        title: 'Réception Florale aux Jardins de Californie',
        category: 'Fiançailles',
        district: 'Californie',
        guests: 140,
        image: IMG_DECOR,
        description: 'Arche florale monumentale en roses de jardin et dîner gastronomique sur mesure.',
      },
      {
        id: 'real4',
        title: 'Anniversaire Privé Haute Gastronomie',
        category: 'Anniversaires & Soirées privées',
        district: 'Oasis',
        guests: 90,
        image: IMG_CATERING,
        description: 'Buffet royal marocain et international accompagné d\'un wedding cake trois étages.',
      },
    ],
    partners: [
      { name: 'Palais d\'Anfa', sector: 'Hôtellerie & Réception', district: 'Anfa' },
      { name: 'Maison Palais Gourmet', sector: 'Haute Gastronomie', district: 'Oasis' },
      { name: 'Atelier Floralia', sector: 'Design Floral', district: 'Californie' },
      { name: 'Studio Lumière', sector: 'Cinéma & Photographie', district: 'Anfa' },
      { name: 'L-Acoustics Maroc Partner', sector: 'Ingénierie Sonore', district: 'Ain Diab' },
      { name: 'Casablanca Prestige Concierge', sector: 'Logistique VIP', district: 'Gauthier' },
    ],
  };

  db.prepare('INSERT INTO site_content (key, value_json) VALUES (?, ?)').run(
    'main',
    JSON.stringify(defaultContent)
  );
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}
