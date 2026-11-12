export type Role = 'student' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentCardId?: string;
  avatar?: string;
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
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number; // Exemplaires empruntés
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
}

export type OverdueSeverity = 'yellow' | 'orange' | 'red';

// Statuts d'emprunt : en attente, acceptée, active, retournée, refusée
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
  requestDate: string; // Date de la demande initiale
  borrowedDate?: string; // Date réelle d'emprunt (lors de la remise physique)
  dueDate: string; // Date limite de retour
  returnDate?: string; // Date réelle de restitution
  status: LoanStatus;
  daysOverdue: number; // 0 if not overdue
  severity?: OverdueSeverity;
  penaltyFeeMad?: number; // Pénalité en Dirhams fixée par les règles admin (ex: 5 MAD/jour)
  condition?: BookCondition; // État vérifié au retour
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
}

// Règles institutionnelles de pénalités définies par l'administration (lecture seule pour le Gérant)
export interface PenaltyRule {
  id: string;
  name: string;
  feePerDayMad: number; // Montant officiel par jour de retard fixé par l'administration
  gracePeriodDays: number;
  damagedBookFeeMad: number;
  lostBookFeeMad: number;
  definedBy: string; // 'Administration Centrale - EST USMBA'
  effectiveDate: string;
}
