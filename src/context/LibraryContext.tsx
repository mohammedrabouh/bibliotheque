import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Book,
  Student,
  Loan,
  User,
  EmailLog,
  Notification,
  BookCondition,
} from '../types';
import {
  INITIAL_BOOKS,
  INITIAL_STUDENTS,
  INITIAL_LOANS,
  INITIAL_CATEGORIES,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  authenticateWithCredentials,
  checkServerSession,
  logoutSession,
} from '../services/authService';
import {
  getSystemToday,
  addDays,
  calculateDaysOverdue,
  determineSeverity,
} from '../utils/dateUtils';

interface ScanBorrowState {
  scannedBook: Book | null;
  scannedStudent: Student | null;
  error: string | null;
  successLoan: Loan | null;
  lastCancelledLoan: Loan | null;
}

interface ScanReturnState {
  scannedBook: Book | null;
  scannedStudent: Student | null;
  error: string | null;
  successReturn: { loan: Loan; book: Book; student: Student } | null;
}

export interface LibraryContextType {
  currentUser: User | null;
  authMode: 'server' | 'local_demo';
  systemDate: string; // Date réelle du système (YYYY-MM-DD)
  login: (email: string, plainPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  books: Book[];
  categories: string[];
  students: Student[];
  loans: Loan[];
  notifications: Notification[];

  // Indicateurs calculés automatiquement à partir des données réelles
  totalBooksCount: number; // Nombre total de titres
  totalCopiesCount: number; // Nombre total d'exemplaires physiques
  availableCopiesCount: number; // Nombre d'exemplaires disponibles en rayon
  reservedCopiesCount: number; // Nombre d'exemplaires réservés (en attente de retrait)
  borrowedCopiesCount: number; // Nombre d'exemplaires empruntés (en circulation)
  unavailableCopiesCount: number; // Nombre d'exemplaires indisponibles (en réparation)
  overdueLoansCount: number; // Nombre d'emprunts en retard
  reservedLoansCount: number; // Nombre de réservations en cours
  returnsToProcessCount: number; // Nombre de retours à traiter (aujourd'hui ou en retard)

  // Listes filtrées
  overdueLoans: Loan[];
  loansDueToday: Loan[];
  reservedLoans: Loan[];
  activeLoans: Loan[];

  // Gestion des livres et du stock (Gérant de bibliothèque)
  addBook: (newBook: Omit<Book, 'id' | 'availableCopies' | 'reservedCopies' | 'borrowedCopies' | 'unavailableCopies'>) => void;
  updateBook: (id: string, updatedFields: Partial<Book>) => void;
  deleteOrArchiveBook: (id: string) => void;
  addCategory: (categoryName: string) => void;
  repairDamagedBook: (bookId: string) => void; // Remettre un exemplaire réparé en rayon disponible

  // Système de réservation directe (Étudiant & Gérant)
  reserveBook: (bookId: string) => { success: boolean; error?: string };
  cancelReservation: (loanId: string) => { success: boolean; error?: string };
  confirmPhysicalHandover: (loanId: string) => { success: boolean; error?: string }; // Remise physique du livre

  // Gestion des retours (Gérant)
  processPhysicalReturn: (
    loanId: string,
    condition: BookCondition,
    notes?: string
  ) => { success: boolean; error?: string };

  // Signalement à l'administrateur
  reportOverdueToAdmin: (loanId: string, reason: string) => void;

  // Notifications étudiant
  markNotificationAsRead: (notificationId: string) => void;

  // Scanner QR code (Gérant)
  scanBorrowState: ScanBorrowState;
  scanReturnState: ScanReturnState;
  processBorrowBookScan: (qrCode: string) => boolean;
  processBorrowStudentScan: (qrCode: string) => boolean;
  resetBorrowScan: () => void;
  cancelLoan: (loanId: string) => void;
  processReturnBookScan: (qrCode: string) => boolean;
  processReturnStudentScan: (qrCode: string) => boolean;
  resetReturnScan: () => void;

  // Fiches sélectionnées
  selectedBookForDetail: Book | null;
  setSelectedBookForDetail: (book: Book | null) => void;
  selectedOverdueLoan: Loan | null;
  setSelectedOverdueLoan: (loan: Loan | null) => void;
  selectedStudentProfile: Student | null;
  setSelectedStudentProfile: (student: Student | null) => void;

  // Logs & notifications automatiques
  emailLogs: EmailLog[];
  automaticEmailNotification: string | null;
  dismissAutoEmailNotification: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY_BOOKS = 'biblioest_books_v6';
const STORAGE_KEY_CATEGORIES = 'biblioest_categories_v6';
const STORAGE_KEY_LOANS = 'biblioest_loans_v6';
const STORAGE_KEY_STUDENTS = 'biblioest_students_v6';
const STORAGE_KEY_NOTIFS = 'biblioest_notifs_v6';
const STORAGE_KEY_USER = 'biblioest_user_session_v6';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemDate = getSystemToday();
  const [authMode, setAuthMode] = useState<'server' | 'local_demo'>('server');

  // Session utilisateur
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.role) {
          return parsed;
        }
      } catch (e) {
        console.error('Erreur lecture session:', e);
      }
    }
    return null;
  });

  // Vérification de session auprès du serveur au montage
  useEffect(() => {
    checkServerSession().then((serverUser) => {
      if (serverUser) {
        setCurrentUser(serverUser);
        setAuthMode('server');
      }
    }).catch(() => {});
  }, []);

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CATEGORIES;
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BOOKS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_STUDENTS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOANS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LOANS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [selectedOverdueLoan, setSelectedOverdueLoan] = useState<Loan | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);

  // Scanners
  const [scanBorrowState, setScanBorrowState] = useState<ScanBorrowState>({
    scannedBook: null,
    scannedStudent: null,
    error: null,
    successLoan: null,
    lastCancelledLoan: null,
  });

  const [scanReturnState, setScanReturnState] = useState<ScanReturnState>({
    scannedBook: null,
    scannedStudent: null,
    error: null,
    successReturn: null,
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [automaticEmailNotification, setAutomaticEmailNotification] = useState<string | null>(null);
  const hasAutoSentEmailsRef = useRef<boolean>(false);

  // Synchronisation localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  // Authentification
  const login = async (
    email: string,
    plainPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await authenticateWithCredentials(email, plainPassword);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Identifiants invalides.' };
    }

    setCurrentUser(result.user);
    setAuthMode(result.authMode || 'server');
    return { success: true };
  };

  const logout = () => {
    logoutSession().catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setSelectedBookForDetail(null);
    setSelectedOverdueLoan(null);
    setSelectedStudentProfile(null);
    hasAutoSentEmailsRef.current = false;
  };

  // =========================================================================
  // GARANTIE STRICTE DE LA COHÉRENCE DU STOCK (RECALCUL AUTOMATIQUE)
  // totalCopies = availableCopies + reservedCopies + borrowedCopies + unavailableCopies
  // - availableCopies : en rayon prêt à être réservé ou emprunté
  // - reservedCopies  : bloqué par une réservation directe en attente de retrait
  // - borrowedCopies  : en possession physique de l'étudiant
  // - unavailableCopies: exemplaire endommagé en réparation
  // =========================================================================
  useEffect(() => {
    setBooks((prevBooks) => {
      let hasChanges = false;
      const updated = prevBooks.map((book) => {
        const borrowedCount = loans.filter(
          (l) => l.bookId === book.id && l.status === 'active'
        ).length;

        const reservedCount = loans.filter(
          (l) => l.bookId === book.id && l.status === 'reserved'
        ).length;

        const unavailableCount = book.unavailableCopies || 0;

        const calculatedAvailable = Math.max(
          0,
          book.totalCopies - borrowedCount - reservedCount - unavailableCount
        );

        if (
          book.borrowedCopies !== borrowedCount ||
          book.reservedCopies !== reservedCount ||
          book.availableCopies !== calculatedAvailable
        ) {
          hasChanges = true;
          return {
            ...book,
            borrowedCopies: borrowedCount,
            reservedCopies: reservedCount,
            availableCopies: calculatedAvailable,
          };
        }
        return book;
      });

      return hasChanges ? updated : prevBooks;
    });
  }, [loans]);

  // =========================================================================
  // CALCULS STATISTIQUES AUTOMATIQUES POUR LE GÉRANT
  // =========================================================================
  const activeBooks = books.filter((b) => !b.isArchived);
  const totalBooksCount = activeBooks.length;
  const totalCopiesCount = activeBooks.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopiesCount = activeBooks.reduce((acc, b) => acc + b.availableCopies, 0);
  const reservedCopiesCount = activeBooks.reduce((acc, b) => acc + (b.reservedCopies || 0), 0);
  const borrowedCopiesCount = activeBooks.reduce((acc, b) => acc + b.borrowedCopies, 0);
  const unavailableCopiesCount = activeBooks.reduce((acc, b) => acc + (b.unavailableCopies || 0), 0);

  // 1. Réservations en attente de retrait physique au comptoir
  const reservedLoans = loans.filter((l) => l.status === 'reserved');
  const reservedLoansCount = reservedLoans.length;

  // 2. Emprunts actifs
  const activeLoans = loans.filter((l) => l.status === 'active');

  // 3. Emprunts en retard calculés selon la date réelle du système (SANS calcul financier)
  const overdueLoans: Loan[] = loans
    .filter(
      (l) =>
        l.status === 'active' && calculateDaysOverdue(l.dueDate, systemDate) > 0
    )
    .map((l) => {
      const realDaysOverdue = calculateDaysOverdue(l.dueDate, systemDate);
      const severity = determineSeverity(realDaysOverdue);
      const updated: Loan = {
        ...l,
        daysOverdue: realDaysOverdue,
        severity,
      };
      return updated;
    })
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));

  const overdueLoansCount = overdueLoans.length;

  // 4. Livres qui doivent être retournés AUJOURD'HUI
  const loansDueToday = loans.filter(
    (l) => l.status === 'active' && l.dueDate === systemDate
  );

  // 5. Retours à traiter
  const returnsToProcessCount = loans.filter(
    (l) => l.status === 'active' && (l.dueDate === systemDate || calculateDaysOverdue(l.dueDate, systemDate) > 0)
  ).length;

  // Notification automatique de rappel courtois sans clic
  useEffect(() => {
    if (
      currentUser?.role === 'manager' &&
      overdueLoans.length > 0 &&
      !hasAutoSentEmailsRef.current
    ) {
      hasAutoSentEmailsRef.current = true;

      const recipientSet = new Set<string>();
      overdueLoans.forEach((l) => recipientSet.add(l.studentEmail));
      const recipients = Array.from(recipientSet);

      const autoLog: EmailLog = {
        id: `EMAIL-AUTO-${Date.now()}`,
        sentAt: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        recipientCount: recipients.length,
        recipients,
        subject: "biblioEST : Rappel de courtoisie pour la restitution d'ouvrage",
        status: 'simulated_queued',
        provider: 'Système interne biblioEST',
        note: 'Notification automatique mise en file pour inviter les étudiants concernés à rapporter les ouvrages.',
      };

      setEmailLogs((prev) => [autoLog, ...prev]);
      setAutomaticEmailNotification(
        `Système automatique : ${recipients.length} message(s) de rappel mis en file pour les retards en cours.`
      );
    }
  }, [currentUser, overdueLoans]);

  const dismissAutoEmailNotification = () => {
    setAutomaticEmailNotification(null);
  };

  // =========================================================================
  // GESTION DES LIVRES (Gérant de bibliothèque)
  // =========================================================================
  const addBook = (
    newBookData: Omit<Book, 'id' | 'availableCopies' | 'reservedCopies' | 'borrowedCopies' | 'unavailableCopies'>
  ) => {
    const newId = `EST-LIV-${Date.now().toString().slice(-4)}`;
    const newBook: Book = {
      ...newBookData,
      id: newId,
      availableCopies: newBookData.totalCopies,
      reservedCopies: 0,
      borrowedCopies: 0,
      unavailableCopies: 0,
      lostCopies: 0,
      isArchived: false,
    };
    setBooks((prev) => [newBook, ...prev]);
  };

  const updateBook = (id: string, updatedFields: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const total = updatedFields.totalCopies !== undefined ? updatedFields.totalCopies : b.totalCopies;
        const activeLoansForBook = loans.filter((l) => l.bookId === id && l.status === 'active').length;
        const reservedLoansForBook = loans.filter((l) => l.bookId === id && l.status === 'reserved').length;
        const unavailable = updatedFields.unavailableCopies !== undefined ? updatedFields.unavailableCopies : (b.unavailableCopies || 0);

        const available = Math.max(0, total - activeLoansForBook - reservedLoansForBook - unavailable);

        return {
          ...b,
          ...updatedFields,
          totalCopies: total,
          borrowedCopies: activeLoansForBook,
          reservedCopies: reservedLoansForBook,
          unavailableCopies: unavailable,
          availableCopies: available,
        };
      })
    );
  };

  const repairDamagedBook = (bookId: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const curUnavailable = b.unavailableCopies || 0;
        if (curUnavailable <= 0) return b;

        return {
          ...b,
          unavailableCopies: curUnavailable - 1,
          availableCopies: b.availableCopies + 1,
        };
      })
    );
  };

  const deleteOrArchiveBook = (id: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isArchived: true } : b))
    );
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
  };

  // =========================================================================
  // SYSTÈME DE RÉSERVATION DIRECTE (SANS DEMANDES EN ATTENTE)
  // L'étudiant réserve directement l'ouvrage disponible.
  // Le stock disponible est décrémenté immédiatement (disponible -1, réservé +1).
  // La réservation ne devient un emprunt effectif qu'après remise physique par le gérant.
  // =========================================================================
  const reserveBook = (bookId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'student') {
      return { success: false, error: 'Seul un étudiant connecté peut réserver un ouvrage.' };
    }

    const targetBook = books.find((b) => b.id === bookId && !b.isArchived);
    if (!targetBook) {
      return { success: false, error: 'Ouvrage introuvable au catalogue.' };
    }

    // Vérification stricte et immédiate de la disponibilité
    if (targetBook.availableCopies <= 0) {
      return {
        success: false,
        error: "Cet ouvrage n'est plus disponible : tous les exemplaires sont actuellement réservés ou empruntés.",
      };
    }

    // Vérifier limite stricte de 3 emprunts ou réservations
    const studentExistingLoans = loans.filter(
      (l) => l.studentId === currentUser.id && (l.status === 'active' || l.status === 'reserved')
    );

    if (studentExistingLoans.length >= 3) {
      return {
        success: false,
        error: `Quota maximal atteint : vous avez déjà ${studentExistingLoans.length} réservation(s) ou emprunt(s) en cours (maximum 3 autorisés).`,
      };
    }

    // Vérifier si l'étudiant a déjà une réservation ou un emprunt pour cet ouvrage
    const alreadyReserved = loans.find(
      (l) => l.studentId === currentUser.id && l.bookId === bookId && (l.status === 'reserved' || l.status === 'active')
    );
    if (alreadyReserved) {
      return {
        success: false,
        error: "Vous avez déjà une réservation ou un emprunt en cours pour cet ouvrage.",
      };
    }

    const newLoanId = `RES-EST-${Date.now().toString().slice(-4)}`;
    const returnDueDate = addDays(systemDate, 14);

    const newLoan: Loan = {
      id: newLoanId,
      bookId: targetBook.id,
      bookTitle: targetBook.title,
      bookAuthor: targetBook.author,
      bookShelf: targetBook.shelfLocation,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentCardId: currentUser.studentCardId || 'CARD-EST',
      reservationDate: systemDate,
      requestDate: systemDate,
      dueDate: returnDueDate,
      status: 'reserved',
      daysOverdue: 0,
    };

    // Mise à jour immédiate et atomique du stock
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              availableCopies: Math.max(0, b.availableCopies - 1),
              reservedCopies: (b.reservedCopies || 0) + 1,
            }
          : b
      )
    );

    setLoans((prev) => [newLoan, ...prev]);

    // Notification immédiate à l'étudiant
    const newNotif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: currentUser.id,
      title: 'Réservation confirmée !',
      message: `Votre exemplaire de « ${targetBook.title} » est réservé. Veuillez vous présenter au comptoir de la bibliothèque avec votre carte étudiante pour la remise physique.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'reservation',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true };
  };

  // Annulation d'une réservation (par l'étudiant ou le gérant)
  const cancelReservation = (loanId: string): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Réservation introuvable.' };
    }

    if (targetLoan.status !== 'reserved') {
      return { success: false, error: 'Seule une réservation en attente de retrait peut être annulée.' };
    }

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'cancelled' } : l))
    );

    // Réintégration immédiate de l'exemplaire au stock disponible
    setBooks((prev) =>
      prev.map((b) =>
        b.id === targetLoan.bookId
          ? {
              ...b,
              reservedCopies: Math.max(0, (b.reservedCopies || 0) - 1),
              availableCopies: b.availableCopies + 1,
            }
          : b
      )
    );

    return { success: true };
  };

  // Confirmation de la remise physique de l'ouvrage par le Gérant
  // La réservation passe alors en emprunt effectif 'active'
  const confirmPhysicalHandover = (loanId: string): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Réservation introuvable.' };
    }

    if (targetLoan.status !== 'reserved') {
      return {
        success: false,
        error: "La remise physique s'applique uniquement à un ouvrage préalablement réservé.",
      };
    }

    const returnDueDate = addDays(systemDate, 14);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'active',
              borrowedDate: systemDate,
              dueDate: returnDueDate,
              daysOverdue: 0,
            }
          : l
      )
    );

    // Mettre à jour la fiche de l'étudiant
    setStudents((prev) =>
      prev.map((s) =>
        s.id === targetLoan.studentId
          ? { ...s, activeLoanBookIds: Array.from(new Set([...s.activeLoanBookIds, targetLoan.bookId])) }
          : s
      )
    );

    // Notification à l'étudiant
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Emprunt actif confirmé (Remise physique effectuée)',
      message: `L'ouvrage « ${targetLoan.bookTitle} » vous a été remis en main propre. Date limite de restitution : ${returnDueDate}.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'loan',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // =========================================================================
  // GESTION DES RETOURS PHYSIQUES (SANS FRAIS NI PÉNALITÉS FINANCIÈRES)
  // - Bon état   : redevient disponible (+1 available, -1 borrowed)
  // - Endommagé  : marqué indisponible pour réparation (+1 unavailable, -1 borrowed)
  // - Perdu      : sorti du stock disponible (-1 borrowed, +1 lost, -1 total)
  // =========================================================================
  const processPhysicalReturn = (
    loanId: string,
    condition: BookCondition,
    notes?: string
  ): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Emprunt introuvable.' };
    }

    if (targetLoan.status === 'returned') {
      return {
        success: false,
        error: `Cet exemplaire a déjà été retourné le ${targetLoan.returnDate || 'précédemment'}. Un retour ne peut pas être enregistré deux fois.`,
      };
    }

    // Clôture définitive du prêt (sans aucune pénalité financière)
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'returned',
              returnDate: systemDate,
              condition,
              reportReason: notes,
              daysOverdue: 0,
            }
          : l
      )
    );

    // Ajustement physique de l'exemplaire selon son état
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== targetLoan.bookId) return b;
        if (condition === 'damaged') {
          return {
            ...b,
            borrowedCopies: Math.max(0, b.borrowedCopies - 1),
            unavailableCopies: (b.unavailableCopies || 0) + 1,
          };
        } else if (condition === 'lost') {
          return {
            ...b,
            borrowedCopies: Math.max(0, b.borrowedCopies - 1),
            lostCopies: (b.lostCopies || 0) + 1,
            totalCopies: Math.max(0, b.totalCopies - 1),
          };
        } else {
          // Bon état : retourne en rayon disponible
          return {
            ...b,
            borrowedCopies: Math.max(0, b.borrowedCopies - 1),
            availableCopies: b.availableCopies + 1,
          };
        }
      })
    );

    // Retirer de la liste des prêts actifs de l'étudiant
    setStudents((prev) =>
      prev.map((s) =>
        s.id === targetLoan.studentId
          ? {
              ...s,
              activeLoanBookIds: s.activeLoanBookIds.filter((id) => id !== targetLoan.bookId),
            }
          : s
      )
    );

    const conditionLabel =
      condition === 'good'
        ? 'Bon état (conforme et réintégré en rayon)'
        : condition === 'damaged'
        ? 'Endommagé (transmis en atelier de reliure/réparation)'
        : 'Déclaré perdu (enregistré pour remplacement)';

    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Restitution physique validée',
      message: `Votre retour de « ${targetLoan.bookTitle} » a été enregistré. Constat : ${conditionLabel}.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'return',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // Signalement à l'administration
  const reportOverdueToAdmin = (loanId: string, reason: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? { ...l, reportedToAdmin: true, reportReason: reason }
          : l
      )
    );
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  // =========================================================================
  // SCANNERS QR CODE (Comptoir Gérant)
  // =========================================================================
  const processBorrowBookScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundBook = books.find(
      (b) => !b.isArchived && (b.id.toUpperCase() === cleanCode || b.isbn.toUpperCase() === cleanCode)
    );

    if (!foundBook) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `Exemplaire introuvable pour le code scanné : "${qrCode}".`,
      }));
      return false;
    }

    if (foundBook.availableCopies <= 0 && foundBook.reservedCopies <= 0) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `L'ouvrage "${foundBook.title}" n'a aucun exemplaire disponible en rayon actuellement.`,
      }));
      return false;
    }

    setScanBorrowState((prev) => ({
      ...prev,
      scannedBook: foundBook,
      error: null,
    }));
    return true;
  };

  const processBorrowStudentScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundStudent = students.find(
      (s) =>
        s.id.toUpperCase() === cleanCode ||
        s.studentCardId.toUpperCase() === cleanCode ||
        s.email.toUpperCase() === cleanCode
    );

    if (!foundStudent) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `Carte étudiante introuvable pour le code scanné : "${qrCode}".`,
      }));
      return false;
    }

    const currentBook = scanBorrowState.scannedBook;
    if (!currentBook) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: "Veuillez d'abord scanner le QR code de l'exemplaire.",
      }));
      return false;
    }

    // Cas 1 : L'étudiant avait déjà une réservation pour cet ouvrage
    const existingReservation = loans.find(
      (l) => l.bookId === currentBook.id && l.studentId === foundStudent.id && l.status === 'reserved'
    );

    if (existingReservation) {
      confirmPhysicalHandover(existingReservation.id);

      const activeLoan: Loan = {
        ...existingReservation,
        status: 'active',
        borrowedDate: systemDate,
        dueDate: addDays(systemDate, 14),
      };

      setScanBorrowState({
        scannedBook: null,
        scannedStudent: null,
        error: null,
        successLoan: activeLoan,
        lastCancelledLoan: null,
      });
      return true;
    }

    // Cas 2 : Emprunt direct au comptoir sans réservation préalable
    if (currentBook.availableCopies <= 0) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `Aucun exemplaire libre en rayon pour "${currentBook.title}". Les exemplaires restants sont déjà réservés.`,
      }));
      return false;
    }

    const activeStudentLoans = loans.filter(
      (l) => l.studentId === foundStudent.id && (l.status === 'active' || l.status === 'reserved')
    );

    if (activeStudentLoans.length >= 3) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `LIMITE ATTEINTE : L'étudiant(e) ${foundStudent.name} possède déjà ${activeStudentLoans.length} exemplaires empruntés ou réservés (maximum : 3). L'emprunt est bloqué.`,
        scannedStudent: null,
      }));
      return false;
    }

    const dueDate = addDays(systemDate, 14);
    const newLoanId = `EMPR-EST-${Date.now().toString().slice(-4)}`;
    const newLoan: Loan = {
      id: newLoanId,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      bookAuthor: currentBook.author,
      bookShelf: currentBook.shelfLocation,
      studentId: foundStudent.id,
      studentName: foundStudent.name,
      studentEmail: foundStudent.email,
      studentCardId: foundStudent.studentCardId,
      reservationDate: systemDate,
      requestDate: systemDate,
      borrowedDate: systemDate,
      dueDate,
      status: 'active',
      daysOverdue: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === foundStudent.id
          ? { ...s, activeLoanBookIds: Array.from(new Set([...s.activeLoanBookIds, currentBook.id])) }
          : s
      )
    );

    setScanBorrowState({
      scannedBook: null,
      scannedStudent: null,
      error: null,
      successLoan: newLoan,
      lastCancelledLoan: null,
    });

    return true;
  };

  const resetBorrowScan = () => {
    setScanBorrowState({
      scannedBook: null,
      scannedStudent: null,
      error: null,
      successLoan: null,
      lastCancelledLoan: null,
    });
  };

  const cancelLoan = (loanId: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'cancelled' } : l))
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === targetLoan.studentId
          ? {
              ...s,
              activeLoanBookIds: s.activeLoanBookIds.filter((id) => id !== targetLoan.bookId),
            }
          : s
      )
    );

    setScanBorrowState((prev) => ({
      ...prev,
      successLoan: null,
      lastCancelledLoan: targetLoan,
    }));
  };

  const processReturnBookScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundBook = books.find(
      (b) => b.id.toUpperCase() === cleanCode || b.isbn.toUpperCase() === cleanCode
    );

    if (!foundBook) {
      setScanReturnState((prev) => ({
        ...prev,
        error: `Ouvrage introuvable pour le code : "${qrCode}".`,
      }));
      return false;
    }

    const activeLoanForBook = loans.find(
      (l) => l.bookId === foundBook.id && l.status === 'active'
    );

    if (!activeLoanForBook) {
      setScanReturnState((prev) => ({
        ...prev,
        error: `Attention : Aucun exemplaire de l'ouvrage "${foundBook.title}" n'est actuellement marqué comme emprunté actif.`,
      }));
      return false;
    }

    setScanReturnState((prev) => ({
      ...prev,
      scannedBook: foundBook,
      error: null,
    }));
    return true;
  };

  const processReturnStudentScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundStudent = students.find(
      (s) =>
        s.id.toUpperCase() === cleanCode ||
        s.studentCardId.toUpperCase() === cleanCode ||
        s.email.toUpperCase() === cleanCode
    );

    if (!foundStudent) {
      setScanReturnState((prev) => ({
        ...prev,
        error: `Carte étudiante introuvable pour le code : "${qrCode}".`,
      }));
      return false;
    }

    const currentBook = scanReturnState.scannedBook;
    if (!currentBook) {
      setScanReturnState((prev) => ({
        ...prev,
        error: "Veuillez d'abord scanner le QR code de l'exemplaire restitué.",
      }));
      return false;
    }

    const matchingLoan = loans.find(
      (l) =>
        l.bookId === currentBook.id &&
        l.studentId === foundStudent.id &&
        l.status === 'active'
    );

    if (!matchingLoan) {
      setScanReturnState((prev) => ({
        ...prev,
        error: `L'étudiant(e) ${foundStudent.name} n'a pas d'emprunt actif enregistré pour l'ouvrage "${currentBook.title}".`,
      }));
      return false;
    }

    // Clôture automatique sans clic (Bon état par défaut au poste rapide)
    processPhysicalReturn(matchingLoan.id, 'good', 'Restitution par scan au comptoir');

    setScanReturnState({
      scannedBook: null,
      scannedStudent: null,
      error: null,
      successReturn: {
        loan: matchingLoan,
        book: currentBook,
        student: foundStudent,
      },
    });

    return true;
  };

  const resetReturnScan = () => {
    setScanReturnState({
      scannedBook: null,
      scannedStudent: null,
      error: null,
      successReturn: null,
    });
  };

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        authMode,
        systemDate,
        login,
        logout,
        books,
        categories,
        students,
        loans,
        notifications,
        totalBooksCount,
        totalCopiesCount,
        availableCopiesCount,
        reservedCopiesCount,
        borrowedCopiesCount,
        unavailableCopiesCount,
        overdueLoansCount,
        reservedLoansCount,
        returnsToProcessCount,
        overdueLoans,
        loansDueToday,
        reservedLoans,
        activeLoans,
        addBook,
        updateBook,
        deleteOrArchiveBook,
        addCategory,
        repairDamagedBook,
        reserveBook,
        cancelReservation,
        confirmPhysicalHandover,
        processPhysicalReturn,
        reportOverdueToAdmin,
        markNotificationAsRead,
        scanBorrowState,
        scanReturnState,
        processBorrowBookScan,
        processBorrowStudentScan,
        resetBorrowScan,
        cancelLoan,
        processReturnBookScan,
        processReturnStudentScan,
        resetReturnScan,
        selectedBookForDetail,
        setSelectedBookForDetail,
        selectedOverdueLoan,
        setSelectedOverdueLoan,
        selectedStudentProfile,
        setSelectedStudentProfile,
        emailLogs,
        automaticEmailNotification,
        dismissAutoEmailNotification,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
