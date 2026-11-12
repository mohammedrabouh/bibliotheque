import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Book,
  Student,
  Loan,
  User,
  OverdueSeverity,
  EmailLog,
  Notification,
  PenaltyRule,
  BookCondition,
} from '../types';
import {
  INITIAL_BOOKS,
  INITIAL_STUDENTS,
  INITIAL_LOANS,
  INITIAL_CATEGORIES,
  INITIAL_NOTIFICATIONS,
  INSTITUTIONAL_PENALTY_RULES,
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
  penaltyRule: PenaltyRule;

  // Indicateurs calculés automatiquement à partir des données réelles
  totalBooksCount: number; // Nombre total de titres
  totalCopiesCount: number; // Nombre total d'exemplaires physiques
  availableCopiesCount: number; // Nombre d'exemplaires disponibles en rayon
  reservedCopiesCount: number; // Nombre d'exemplaires réservés (demandes acceptées)
  borrowedCopiesCount: number; // Nombre d'exemplaires empruntés (en circulation)
  unavailableCopiesCount: number; // Nombre d'exemplaires indisponibles (en réparation / endommagés)
  overdueLoansCount: number; // Nombre d'emprunts en retard
  pendingRequestsCount: number; // Nombre de demandes d'emprunt en attente
  returnsToProcessCount: number; // Nombre de retours à traiter (aujourd'hui ou en retard)

  // Listes filtrées
  overdueLoans: Loan[];
  loansDueToday: Loan[];
  pendingRequests: Loan[];
  acceptedRequestsWaitingHandover: Loan[];
  activeLoans: Loan[];

  // Gestion des livres et du stock (Gérant de bibliothèque)
  addBook: (newBook: Omit<Book, 'id' | 'availableCopies' | 'reservedCopies' | 'borrowedCopies' | 'unavailableCopies'>) => void;
  updateBook: (id: string, updatedFields: Partial<Book>) => void;
  deleteOrArchiveBook: (id: string) => void;
  addCategory: (categoryName: string) => void;
  repairDamagedBook: (bookId: string) => void; // Remettre un exemplaire réparé en rayon disponible

  // Gestion des demandes d'emprunt (Gérant)
  acceptLoanRequest: (loanId: string) => { success: boolean; error?: string };
  refuseLoanRequest: (loanId: string, reason?: string) => { success: boolean; error?: string };
  confirmPhysicalHandover: (loanId: string) => { success: boolean; error?: string }; // Remise physique du livre

  // Demande d'emprunt (Étudiant)
  requestBookLoan: (bookId: string) => { success: boolean; error?: string };

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

const STORAGE_KEY_BOOKS = 'biblioest_books_v5';
const STORAGE_KEY_CATEGORIES = 'biblioest_categories_v5';
const STORAGE_KEY_LOANS = 'biblioest_loans_v5';
const STORAGE_KEY_STUDENTS = 'biblioest_students_v5';
const STORAGE_KEY_NOTIFS = 'biblioest_notifs_v5';
const STORAGE_KEY_USER = 'biblioest_user_session_v5';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Date réelle du système dynamique
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

  const penaltyRule = INSTITUTIONAL_PENALTY_RULES;

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

  // Déconnexion qui ferme proprement la session côté serveur et client
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
  // - reservedCopies  : bloqué par une demande acceptée en attente de retrait
  // - borrowedCopies  : en possession physique de l'étudiant
  // - unavailableCopies: exemplaire endommagé en réparation
  // =========================================================================
  useEffect(() => {
    setBooks((prevBooks) => {
      let hasChanges = false;
      const updated = prevBooks.map((book) => {
        // 1. Emprunts actifs
        const borrowedCount = loans.filter(
          (l) => l.bookId === book.id && l.status === 'active'
        ).length;

        // 2. Demandes acceptées qui réservent un exemplaire
        const reservedCount = loans.filter(
          (l) => l.bookId === book.id && l.status === 'accepted'
        ).length;

        // 3. Exemplaires indisponibles (endommagés)
        const unavailableCount = book.unavailableCopies || 0;

        // 4. Exemplaires disponibles restants
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
  // CALCULS STATISTIQUES AUTOMATIQUES POUR LE GÉRANT DE BIBLIOTHÈQUE
  // Tous calculés dynamiquement à partir des données réelles (AUCUN CHIFFRE EN DUR)
  // =========================================================================
  const activeBooks = books.filter((b) => !b.isArchived);
  const totalBooksCount = activeBooks.length;
  const totalCopiesCount = activeBooks.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopiesCount = activeBooks.reduce((acc, b) => acc + b.availableCopies, 0);
  const reservedCopiesCount = activeBooks.reduce((acc, b) => acc + (b.reservedCopies || 0), 0);
  const borrowedCopiesCount = activeBooks.reduce((acc, b) => acc + b.borrowedCopies, 0);
  const unavailableCopiesCount = activeBooks.reduce((acc, b) => acc + (b.unavailableCopies || 0), 0);

  // 1. Demandes d'emprunt en attente
  const pendingRequests = loans.filter((l) => l.status === 'pending');
  const pendingRequestsCount = pendingRequests.length;

  // 2. Demandes acceptées en attente de remise physique (réservation active)
  const acceptedRequestsWaitingHandover = loans.filter((l) => l.status === 'accepted');

  // 3. Emprunts actifs
  const activeLoans = loans.filter((l) => l.status === 'active');

  // 4. Emprunts en retard calculés selon la date réelle du système
  const overdueLoans: Loan[] = loans
    .filter(
      (l) =>
        l.status === 'active' && calculateDaysOverdue(l.dueDate, systemDate) > 0
    )
    .map((l) => {
      const realDaysOverdue = calculateDaysOverdue(l.dueDate, systemDate);
      const severity = determineSeverity(realDaysOverdue);
      const penaltyFeeMad = realDaysOverdue * penaltyRule.feePerDayMad;
      const updated: Loan = {
        ...l,
        daysOverdue: realDaysOverdue,
        severity,
        penaltyFeeMad,
      };
      return updated;
    })
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));

  const overdueLoansCount = overdueLoans.length;

  // 5. Livres qui doivent être retournés AUJOURD'HUI (date réelle)
  const loansDueToday = loans.filter(
    (l) => l.status === 'active' && l.dueDate === systemDate
  );

  // 6. Retours à traiter (échéance aujourd'hui ou en retard)
  const returnsToProcessCount = loans.filter(
    (l) => l.status === 'active' && (l.dueDate === systemDate || calculateDaysOverdue(l.dueDate, systemDate) > 0)
  ).length;

  // Notification automatique de rappel par e-mail sans clic
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
        subject: "biblioEST : Rappel officiel de retard de restitution d'ouvrage",
        status: 'simulated_queued',
        provider: 'Simulation Queue (Service SMTP / Resend externe non connecté)',
        note: 'Généré automatiquement sans clic dès détection des retards.',
      };

      setEmailLogs((prev) => [autoLog, ...prev]);
      setAutomaticEmailNotification(
        `Système automatique : ${recipients.length} e-mail(s) de relance mis en file sans clic pour les retards en cours.`
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
        const reservedLoansForBook = loans.filter((l) => l.bookId === id && l.status === 'accepted').length;
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
  // GESTION DES DEMANDES D'EMPRUNT
  // =========================================================================
  // 1. Demande par l'étudiant
  const requestBookLoan = (bookId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'student') {
      return { success: false, error: 'Seul un étudiant connecté peut demander un emprunt.' };
    }

    const targetBook = books.find((b) => b.id === bookId && !b.isArchived);
    if (!targetBook) {
      return { success: false, error: 'Ouvrage introuvable.' };
    }

    if (targetBook.availableCopies <= 0) {
      return { success: false, error: "Aucun exemplaire n'est actuellement disponible en rayon (tous empruntés ou réservés)." };
    }

    // Vérifier limite stricte de 3 emprunts ou demandes
    const studentExistingLoans = loans.filter(
      (l) => l.studentId === currentUser.id && (l.status === 'active' || l.status === 'accepted' || l.status === 'pending')
    );

    if (studentExistingLoans.length >= 3) {
      return {
        success: false,
        error: `Limite atteinte : vous avez déjà ${studentExistingLoans.length} emprunt(s) ou demande(s) en cours (maximum 3 autorisés).`,
      };
    }

    // Vérifier si l'étudiant a déjà une demande en cours pour CE livre
    const alreadyRequested = loans.find(
      (l) => l.studentId === currentUser.id && l.bookId === bookId && (l.status === 'pending' || l.status === 'accepted' || l.status === 'active')
    );
    if (alreadyRequested) {
      return { success: false, error: "Vous avez déjà une demande ou un emprunt en cours pour cet ouvrage." };
    }

    const newLoanId = `DEM-EST-${Date.now().toString().slice(-4)}`;
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
      requestDate: systemDate,
      dueDate: returnDueDate,
      status: 'pending',
      daysOverdue: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);

    // Notification étudiant
    const newNotif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: currentUser.id,
      title: 'Demande d’emprunt enregistrée',
      message: `Votre demande pour « ${targetBook.title} » a été transmise au Gérant de bibliothèque.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'loan',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true };
  };

  // 2. Le Gérant accepte la demande (statut -> 'accepted')
  // CRITIQUE : Cette action RÉSERVE l'exemplaire pour éviter toute surréservation !
  const acceptLoanRequest = (loanId: string): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Demande introuvable.' };
    }

    if (targetLoan.status !== 'pending') {
      return { success: false, error: 'Cette demande a déjà été traitée.' };
    }

    const targetBook = books.find((b) => b.id === targetLoan.bookId);
    if (!targetBook || targetBook.availableCopies <= 0) {
      return {
        success: false,
        error: "Stock insuffisant : aucun exemplaire n'est actuellement disponible en rayon pour accepter cette demande.",
      };
    }

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'accepted' } : l))
    );

    // Notification à l'étudiant
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Demande d’emprunt acceptée ! (Exemplaire réservé)',
      message: `Votre demande pour « ${targetLoan.bookTitle} » a été acceptée. Un exemplaire vous est réservé au comptoir. Veuillez vous présenter à la bibliothèque pour la remise physique.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'loan',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // 3. Le Gérant refuse la demande
  const refuseLoanRequest = (loanId: string, reason?: string): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Demande introuvable.' };
    }

    if (targetLoan.status === 'active' || targetLoan.status === 'returned') {
      return { success: false, error: 'Impossible de refuser un emprunt déjà en cours ou retourné.' };
    }

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'refused', reportReason: reason } : l))
    );

    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Demande d’emprunt refusée',
      message: `Votre demande pour « ${targetLoan.bookTitle} » a été refusée par le Gérant${reason ? ' : ' + reason : '.'}`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'info',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // 4. Confirmation de la remise physique du livre à l'étudiant
  // L'emprunt devient alors réellement 'active', la date réelle de remise et l'échéance sont enregistrées
  const confirmPhysicalHandover = (loanId: string): { success: boolean; error?: string } => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, error: 'Emprunt introuvable.' };
    }

    if (targetLoan.status !== 'accepted') {
      return {
        success: false,
        error: "La remise physique nécessite que la demande ait d'abord été acceptée.",
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
      title: 'Emprunt confirmé (Remise physique effectuée)',
      message: `L'exemplaire de « ${targetLoan.bookTitle} » vous a été remis physiquement. Date limite de restitution : ${returnDueDate}.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'due',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // =========================================================================
  // GESTION DES RETOURS ET ÉTAT DES EXEMPLAIRES
  // Règles obligatoires :
  // - Bon état : redevient disponible (+1 available, -1 borrowed)
  // - Endommagé : marqué indisponible (+1 unavailable, -1 borrowed)
  // - Perdu : jamais ajouté au stock disponible (-1 borrowed, +1 lost)
  // - Empêche strictement de valider deux fois le retour d'un même exemplaire
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

    // Calcul pénalité additionnelle selon l'état
    let penaltyFeeMad = 0;
    if (condition === 'damaged') {
      penaltyFeeMad = penaltyRule.damagedBookFeeMad;
    } else if (condition === 'lost') {
      penaltyFeeMad = penaltyRule.lostBookFeeMad;
    }

    // Ajout éventuel du retard
    const overdueDays = calculateDaysOverdue(targetLoan.dueDate, systemDate);
    if (overdueDays > 0) {
      penaltyFeeMad += overdueDays * penaltyRule.feePerDayMad;
    }

    // Clôture définitive du prêt
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
              penaltyFeeMad,
            }
          : l
      )
    );

    // Ajustement de l'exemplaire selon son état
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== targetLoan.bookId) return b;
        if (condition === 'damaged') {
          return {
            ...b,
            unavailableCopies: (b.unavailableCopies || 0) + 1,
          };
        } else if (condition === 'lost') {
          return {
            ...b,
            lostCopies: (b.lostCopies || 0) + 1,
            totalCopies: Math.max(0, b.totalCopies - 1),
          };
        }
        return b;
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

    // Notification à l'étudiant
    const conditionLabel =
      condition === 'good'
        ? 'Bon état (conforme)'
        : condition === 'damaged'
        ? `Endommagé (Forfait réparation : ${penaltyRule.damagedBookFeeMad} MAD)`
        : `Déclaré perdu (Forfait remplacement : ${penaltyRule.lostBookFeeMad} MAD)`;

    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Restitution physique enregistrée',
      message: `Votre retour de « ${targetLoan.bookTitle} » a été validé. État constaté : ${conditionLabel}.`,
      createdAt: `${systemDate} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      read: false,
      type: 'return',
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  // Signalement d'un retard ou anomalie à l'administrateur
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
  // SCANNERS QR CODE
  // =========================================================================
  const processBorrowBookScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundBook = books.find(
      (b) => !b.isArchived && (b.id.toUpperCase() === cleanCode || b.isbn.toUpperCase() === cleanCode)
    );

    if (!foundBook) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `Exemplaire introuvable pour le code : "${qrCode}".`,
      }));
      return false;
    }

    if (foundBook.availableCopies <= 0) {
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
        error: `Carte étudiante introuvable pour le code : "${qrCode}".`,
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

    const activeStudentLoans = loans.filter(
      (l) => l.studentId === foundStudent.id && (l.status === 'active' || l.status === 'accepted')
    );

    if (activeStudentLoans.length >= 3) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `REFUS AUTOMATIQUE : L'étudiant(e) ${foundStudent.name} possède déjà ${activeStudentLoans.length} exemplaires empruntés ou acceptés (limite maximale : 3). L'emprunt est bloqué.`,
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
      requestDate: systemDate,
      borrowedDate: systemDate,
      dueDate,
      status: 'active', // Directement actif car remise physique effectuée au comptoir de scan
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
    processPhysicalReturn(matchingLoan.id, 'good', 'Restitution automatique par scan rapide');

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
        penaltyRule,
        totalBooksCount,
        totalCopiesCount,
        availableCopiesCount,
        reservedCopiesCount,
        borrowedCopiesCount,
        unavailableCopiesCount,
        overdueLoansCount,
        pendingRequestsCount,
        returnsToProcessCount,
        overdueLoans,
        loansDueToday,
        pendingRequests,
        acceptedRequestsWaitingHandover,
        activeLoans,
        addBook,
        updateBook,
        deleteOrArchiveBook,
        addCategory,
        repairDamagedBook,
        acceptLoanRequest,
        refuseLoanRequest,
        confirmPhysicalHandover,
        requestBookLoan,
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
