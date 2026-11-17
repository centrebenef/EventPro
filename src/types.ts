export type UserRole = 'client' | 'provider' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type CategorySlug =
  | 'salles'
  | 'photographes'
  | 'traiteurs'
  | 'dj'
  | 'decoration'
  | 'organisation';

export type BookingStatus =
  | 'En attente'
  | 'Confirmée'
  | 'Refusée'
  | 'Annulée'
  | 'Terminée';

export type QuoteStatus = 'En attente' | 'Répondu' | 'Accepté' | 'Archivé';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface ProviderFormula {
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface ProviderMenu {
  name: string;
  pricePerPerson: number;
  items: string[];
}

export interface ProviderOption {
  name: string;
  price: number;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  categorySlug: CategorySlug;
  subCategory: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  shortBio: string;
  priceFrom: number;
  priceUnit: string;
  capacityMin: number;
  capacityMax: number;
  equipments: string[];
  servicesIncluded: string[];
  formulas: ProviderFormula[];
  menus: ProviderMenu[];
  options: ProviderOption[];
  gallery: string[];
  videoUrl: string;
  rating: number;
  reviewCount: number;
  status: 'approved' | 'pending' | 'suspended';
  featured: boolean;
  phone: string;
  email: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  providerId: string;
  providerName?: string;
  categorySlug: CategorySlug;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  duration: string;
  active: boolean;
  createdAt: string;
}

export interface AvailabilityEntry {
  id: string;
  providerId: string;
  eventDate: string;
  status: 'booked' | 'blocked';
  bookingId?: string | null;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  providerId: string;
  providerName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  guests: number;
  formulaName: string;
  options: string[];
  totalPrice: number;
  comments: string;
  status: BookingStatus;
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  providerId: string;
  providerName: string;
  eventType: string;
  eventDate: string;
  guests: number;
  budget: number;
  message: string;
  replyMessage: string;
  quotedPrice: number;
  status: QuoteStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  providerId: string;
  providerName?: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  eventType: string;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface EventBuilderSelectedProvider {
  providerId: string;
  providerName: string;
  categorySlug: CategorySlug;
  price: number;
  formulaName?: string;
}

export interface EventProject {
  id: string;
  userId: string;
  title: string;
  eventType: string;
  eventDate: string;
  district: string;
  guests: number;
  budget: number;
  selectedServices: CategorySlug[];
  selectedProviders: EventBuilderSelectedProvider[];
  totalCost: number;
  status: 'Brouillon' | 'Sauvegardé' | 'Demande envoyée';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'quote' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface PlannerPackage {
  id: 'basic' | 'premium' | 'vip';
  name: string;
  subtitle: string;
  price: number;
  features: string[];
}

export interface RealizationItem {
  id: string;
  title: string;
  category: string;
  district: string;
  guests: number;
  image: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  eventType: string;
  rating: number;
  comment: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  promoBanner: string;
  whatsappNumber?: string;
  whatsappPrefilledMessage?: string;
  plannerPackages: PlannerPackage[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  realizations: RealizationItem[];
  partners: { name: string; sector: string; district: string }[];
}

export type AppPage =
  | 'home'
  | 'prestations'
  | 'salles'
  | 'photographes'
  | 'traiteurs'
  | 'dj'
  | 'decoration'
  | 'organisation'
  | 'realisations'
  | 'event-builder'
  | 'carte'
  | 'about'
  | 'contact'
  | 'partenaires'
  | 'faq'
  | 'cgu'
  | 'confidentialite'
  | 'annulation'
  | 'client-dashboard'
  | 'provider-dashboard'
  | 'admin-dashboard';
