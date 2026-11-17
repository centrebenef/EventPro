import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { Booking, CategorySlug, EventProject } from '../types.ts';

export const CASABLANCA_DISTRICTS = [
  'Anfa',
  'Maarif',
  'Ain Diab',
  'Californie',
  'Bouskoura',
  'Sidi Maarouf',
  'Bourgogne',
  'Oasis',
  'Gauthier',
] as const;

export const EVENT_TYPES = [
  'Mariage',
  'Fiançailles',
  'Anniversaire',
  'Baptême',
  'Soirée privée',
  'Conférence',
  'Séminaire',
  'Lancement de produit',
  'Événement professionnel',
] as const;

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  salles: 'Salles de réception',
  photographes: 'Photographes & Vidéastes',
  traiteurs: 'Traiteurs',
  dj: 'DJ & Animation',
  decoration: 'Décoration',
  organisation: 'Organisation complète',
};

export function formatDH(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} DH`;
}

export function generateProjectQuotePdf(project: {
  title: string;
  eventType: string;
  eventDate: string;
  district: string;
  guests: number;
  budget: number;
  selectedProviders: Array<{
    providerName: string;
    categorySlug: CategorySlug;
    price: number;
    formulaName?: string;
  }>;
  totalCost: number;
  clientName?: string;
}): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(21, 21, 21);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(201, 164, 92);
  doc.setFontSize(22);
  doc.text('EVENT PRO', 16, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Chaque événement mérite d'être exceptionnel — Casablanca, Maroc", 16, 26);
  doc.text(`Devis estimatif généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 16, 18, { align: 'right' });

  // Project details
  doc.setTextColor(21, 21, 21);
  doc.setFontSize(15);
  doc.text(project.title || 'Projet Événementiel EVENT PRO', 16, 52);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Type d'événement : ${project.eventType}`, 16, 62);
  doc.text(`Date souhaitée : ${project.eventDate || 'À définir'}`, 16, 69);
  doc.text(`Lieu : ${project.district}, Casablanca`, 16, 76);
  doc.text(`Nombre d'invités : ${project.guests} personnes`, 110, 62);
  doc.text(`Budget cible : ${formatDH(project.budget)}`, 110, 69);
  if (project.clientName) {
    doc.text(`Client : ${project.clientName}`, 110, 76);
  }

  // Table header
  let y = 90;
  doc.setFillColor(247, 244, 239);
  doc.rect(16, y, pageWidth - 32, 10, 'F');
  doc.setTextColor(21, 21, 21);
  doc.setFontSize(9);
  doc.text('CATÉGORIE', 20, y + 6.5);
  doc.text('PRESTATAIRE & FORMULE', 68, y + 6.5);
  doc.text('MONTANT (DH)', pageWidth - 20, y + 6.5, { align: 'right' });

  y += 16;
  project.selectedProviders.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setTextColor(119, 119, 119);
    doc.text(CATEGORY_LABELS[item.categorySlug] || item.categorySlug, 20, y);
    doc.setTextColor(21, 21, 21);
    const label = item.formulaName ? `${item.providerName} (${item.formulaName})` : item.providerName;
    doc.text(label.slice(0, 48), 68, y);
    doc.text(formatDH(item.price), pageWidth - 20, y, { align: 'right' });
    doc.setDrawColor(230, 226, 218);
    doc.line(16, y + 3, pageWidth - 16, y + 3);
    y += 10;
  });

  // Summary totals
  y += 8;
  doc.setFillColor(21, 21, 21);
  doc.rect(16, y, pageWidth - 32, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TOTAL ESTIMÉ DES PRESTATIONS :', 22, y + 10);
  doc.setTextColor(201, 164, 92);
  doc.setFontSize(13);
  doc.text(formatDH(project.totalCost), pageWidth - 22, y + 10, { align: 'right' });
  doc.setTextColor(210, 210, 210);
  doc.setFontSize(9);
  const remaining = project.budget - project.totalCost;
  doc.text(
    `Solde par rapport au budget global : ${remaining >= 0 ? '+' : ''}${formatDH(remaining)}`,
    22,
    y + 18
  );

  // Footer
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(
    'Document estimatif non contractuel généré par EVENT PRO Casablanca — 18 Bd Moulay Youssef, Gauthier, Casablanca.',
    16,
    285
  );

  doc.save(`EVENT-PRO-Devis-${(project.eventType || 'Evenement').replace(/\s+/g, '-')}.pdf`);
}

export function exportBookingsExcel(bookings: Booking[]): void {
  const rows = bookings.map((b) => ({
    'Numéro': b.bookingNumber,
    'Client': b.clientName,
    'Email': b.clientEmail,
    'Téléphone': b.clientPhone,
    'Prestataire': b.providerName,
    'Type': b.eventType,
    'Date': b.eventDate,
    'Heure': b.eventTime,
    'Lieu': b.location,
    'Invités': b.guests,
    'Formule': b.formulaName,
    'Total (DH)': b.totalPrice,
    'Statut': b.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Réservations EVENT PRO');
  XLSX.writeFile(wb, `EVENT-PRO-Reservations-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAdminReportPdf(
  bookings: Booking[],
  kpis: {
    clientsCount: number;
    providersCount: number;
    bookingsCount: number;
    estimatedRevenue: number;
  }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(21, 21, 21);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(201, 164, 92);
  doc.setFontSize(18);
  doc.text('EVENT PRO — RAPPORT EXÉCUTIF', 16, 17);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Casablanca, Maroc — Édité le ${new Date().toLocaleDateString('fr-FR')}`, 16, 25);

  doc.setTextColor(21, 21, 21);
  doc.setFontSize(11);
  doc.text(`Clients inscrits : ${kpis.clientsCount}`, 16, 48);
  doc.text(`Prestataires actifs : ${kpis.providersCount}`, 80, 48);
  doc.text(`Réservations : ${kpis.bookingsCount}`, 145, 48);
  doc.text(`Chiffre d'affaires estimé : ${formatDH(kpis.estimatedRevenue)}`, 16, 56);

  let y = 72;
  doc.setFillColor(247, 244, 239);
  doc.rect(16, y, pageWidth - 32, 9, 'F');
  doc.setFontSize(8.5);
  doc.text('NUMÉRO', 18, y + 6);
  doc.text('CLIENT', 48, y + 6);
  doc.text('PRESTATAIRE', 90, y + 6);
  doc.text('DATE', 142, y + 6);
  doc.text('STATUT', 166, y + 6);
  doc.text('TOTAL', pageWidth - 18, y + 6, { align: 'right' });

  y += 14;
  bookings.slice(0, 28).forEach((b) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.text(b.bookingNumber, 18, y);
    doc.text(b.clientName.slice(0, 20), 48, y);
    doc.text(b.providerName.slice(0, 24), 90, y);
    doc.text(b.eventDate, 142, y);
    doc.text(b.status, 166, y);
    doc.text(formatDH(b.totalPrice), pageWidth - 18, y, { align: 'right' });
    y += 7;
  });

  doc.save(`EVENT-PRO-Rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSavedProjectPdf(project: EventProject, clientName?: string): void {
  generateProjectQuotePdf({
    title: project.title,
    eventType: project.eventType,
    eventDate: project.eventDate,
    district: project.district,
    guests: project.guests,
    budget: project.budget,
    selectedProviders: project.selectedProviders,
    totalCost: project.totalCost,
    clientName,
  });
}
