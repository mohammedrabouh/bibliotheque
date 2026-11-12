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
  category: string;
  publishedYear: number;
  publisher: string;
  shelfLocation: string; // ex: "Rayon A-04"
  totalCopies: number; // Volume total d'exemplaires inscrits
  availableCopies: number; // Exemplaires physiquement en rayon prêts à la réservation/emprunt
  reservedCopies: number; // Exemplaires réservés en attente de retrait par l'étudiant
  borrowedCopies: number; // Exemplaires actuellement détenus par des étudiants
  unavailableCopies: number; // Exemplaires endommagés / en réparation (non disponibles)
  lostCopies?: number; // Exemplaires déclarés perdus
  coverImage: string;
  coverColor: string;
  summary: string;
  tableOfContents: string[];
  description: string;
  isArchived?: boolean;
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

// Statuts de prêt et réservation :
// 1. 'reserved'  : Ouvrage réservé directement par l'étudiant, exemplaire mis de côté au comptoir
// 2. 'active'    : Emprunt effectif après confirmation de la remise physique du livre
// 3. 'returned'  : Exemplaire retourné et contrôlé
// 4. 'cancelled' : Réservation ou emprunt annulé
export type LoanStatus = 'reserved' | 'active' | 'returned' | 'cancelled';

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
  reservationDate: string; // Date de la réservation directe (YYYY-MM-DD)
  requestDate?: string; // Compatibilité affichage
  borrowedDate?: string; // Date réelle d'emprunt (remise physique de l'ouvrage)
  dueDate: string; // Date limite de retour
  returnDate?: string; // Date réelle de restitution
  status: LoanStatus;
  daysOverdue: number; // 0 si non échu
  severity?: OverdueSeverity;
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
  type: 'reservation' | 'loan' | 'due' | 'overdue' | 'return' | 'info';
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
