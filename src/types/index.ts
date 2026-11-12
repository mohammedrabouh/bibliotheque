export type Role = 'student' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentCardId?: string;
  avatar?: string;
  passwordHash?: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string; // Gérer les catégories
  publishedYear: number;
  publisher: string;
  shelfLocation: string; // ex: "Rayon A-04"
  totalCopies: number; // Volume total d'exemplaires achetés / inscrits
  availableCopies: number; // Exemplaires physiquement en rayon prêts à l'emprunt
  reservedCopies: number; // Exemplaires réservés (demandes acceptées en attente de retrait)
  borrowedCopies: number; // Exemplaires actuellement détenus par des étudiants
  unavailableCopies: number; // Exemplaires endommagés / en réhabilitation (non disponibles)
  lostCopies?: number; // Exemplaires déclarés perdus
  coverImage: string;
  coverColor: string;
  summary: string; // Petit résumé
  tableOfContents: string[]; // Petit sommaire
  description: string;
  isArchived?: boolean; // Supprimer ou archiver un livre
}

export interface Student {
  id: string;
  studentCardId: string;
  name: string;
  email: string; // *.@usmba.ac.ma
  avatar: string;
  activeLoanBookIds: string[];
  passwordHash?: string;
}

export type OverdueSeverity = 'yellow' | 'orange' | 'red';

// Statuts d'emprunt stricts :
// 1. 'pending'   : Demande d'emprunt envoyée par l'étudiant
// 2. 'accepted'  : Demande acceptée par le gérant (réserve un exemplaire, non encore actif)
// 3. 'active'    : Emprunt effectif après remise physique du livre
// 4. 'returned'  : Exemplaire retourné et contrôlé
// 5. 'refused'   : Demande refusée avec motif
// 6. 'cancelled' : Emprunt annulé en cas d'erreur de manipulation
export type LoanStatus = 'pending' | 'accepted' | 'active' | 'returned' | 'refused' | 'cancelled';

export type BookCondition = 'good' | 'damaged' | 'lost';

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookShelf: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCardId: string;
  requestDate: string; // Date de la demande initiale (YYYY-MM-DD)
  borrowedDate?: string; // Date réelle d'emprunt (lors de la remise physique)
  dueDate: string; // Date limite de retour calculée
  returnDate?: string; // Date réelle de restitution
  status: LoanStatus;
  daysOverdue: number; // 0 si non échu
  severity?: OverdueSeverity;
  penaltyFeeMad?: number; // Pénalité en Dirhams fixée par les règles admin (ex: 5 MAD/jour)
  condition?: BookCondition; // État vérifié au retour (bon état, endommagé, perdu)
  reportedToAdmin?: boolean; // Signalé à l'administrateur
  reportReason?: string; // Motif de signalement
}

export interface Notification {
  id: string;
  userId: string; // Destinataire (étudiant ou gérant)
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'loan' | 'due' | 'overdue' | 'return' | 'info';
}

export interface EmailLog {
  id: string;
  sentAt: string;
  recipientCount: number;
  recipients: string[];
  subject: string;
  status: 'simulated_queued' | 'sent';
  provider: string;
  note: string;
}

// Règles institutionnelles de pénalités définies par l'administration (lecture seule pour le Gérant)
export interface PenaltyRule {
  id: string;
  name: string;
  feePerDayMad: number; // 5 MAD par jour de retard fixé par l'administration
  gracePeriodDays: number;
  damagedBookFeeMad: number; // 50 MAD forfait réparation
  lostBookFeeMad: number; // 150 MAD forfait rachat
  definedBy: string; // 'Administration Centrale - EST USMBA'
  effectiveDate: string;
}
