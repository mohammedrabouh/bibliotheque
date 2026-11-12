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
  publishedYear: number;
  publisher: string;
  shelfLocation: string; // ex: "Rayon A-04"
  totalCopies: number;
  availableCopies: number;
  coverImage: string;
  coverColor: string;
  summary: string; // Petit résumé
  tableOfContents: string[]; // Petit sommaire
  description: string;
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
  borrowedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string;
  status: 'active' | 'returned' | 'cancelled';
  daysOverdue: number; // 0 if not overdue
  severity?: OverdueSeverity;
}

export interface EmailLog {
  id: string;
  sentAt: string;
  recipientCount: number;
  recipients: string[];
  subject: string;
}
