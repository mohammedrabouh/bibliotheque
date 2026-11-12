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
import { authenticateWithCredentials } from '../services/authService';

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
  login: (email: string, plainPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  books: Book[];
  categories: string[];
  students: Student[];
  loans: Loan[];
  notifications: Notification[];
  penaltyRule: PenaltyRule;
  
  // Indicateurs calculés automatiquement pour le Gérant de bibliothèque
  totalBooksCount: number; // Nombre total de titres
  totalCopiesCount: number; // Nombre total d'exemplaires physiques
  availableCopiesCount: number; // Nombre d'exemplaires disponibles
  borrowedCopiesCount: number; // Nombre d'exemplaires empruntés
  overdueLoansCount: number; // Nombre d'emprunts en retard
  pendingRequestsCount: number; // Nombre de demandes d'emprunt en attente
  returnsToProcessCount: number; // Nombre de retours à traiter
  
  // Listes filtrées
  overdueLoans: Loan[];
  loansDueToday: Loan[];
  pendingRequests: Loan[];
  acceptedRequestsWaitingHandover: Loan[];
  activeLoans: Loan[];
  
  // Gestion des livres (Gérant)
  addBook: (newBook: Omit<Book, 'id' | 'availableCopies' | 'borrowedCopies'>) => void;
  updateBook: (id: string, updatedFields: Partial<Book>) => void;
  deleteOrArchiveBook: (id: string) => void;
  addCategory: (categoryName: string) => void;
  
  // Gestion des demandes d'emprunt (Gérant)
  acceptLoanRequest: (loanId: string) => void;
  refuseLoanRequest: (loanId: string, reason?: string) => void;
  confirmPhysicalHandover: (loanId: string) => void; // Remise physique du livre
  
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

const STORAGE_KEY_BOOKS = 'biblioest_books_v4';
const STORAGE_KEY_CATEGORIES = 'biblioest_categories_v4';
const STORAGE_KEY_LOANS = 'biblioest_loans_v4';
const STORAGE_KEY_STUDENTS = 'biblioest_students_v4';
const STORAGE_KEY_NOTIFS = 'biblioest_notifs_v4';
const STORAGE_KEY_USER = 'biblioest_authenticated_user_v4';

export const TODAY_DATE = '2026-11-12';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session persistée : l'utilisateur reste connecté après actualisation
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

  // Authentification sécurisée par identifiant et mot de passe (hashé cryptographiquement)
  const login = async (
    email: string,
    plainPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await authenticateWithCredentials(email, plainPassword);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Identifiants invalides.' };
    }

    setCurrentUser(result.user);
    return { success: true };
  };

  // Déconnexion qui ferme proprement la session
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setSelectedBookForDetail(null);
    setSelectedOverdueLoan(null);
    setSelectedStudentProfile(null);
    hasAutoSentEmailsRef.current = false;
  };

  // RECALCUL STRICT ET AUTOMATIQUE DE LA COHÉRENCE DU STOCK
  // totalCopies = availableCopies + borrowedCopies
  // Seuls les emprunts 'active' occupent physiquement un exemplaire emprunté
  useEffect(() => {
    setBooks((prevBooks) => {
      let hasChanges = false;
      const updated = prevBooks.map((book) => {
        const activeCount = loans.filter(
          (l) => l.bookId === book.id && l.status === 'active'
        ).length;

        const calculatedAvailable = Math.max(0, book.totalCopies - activeCount);
        if (
          book.borrowedCopies !== activeCount ||
          book.availableCopies !== calculatedAvailable
        ) {
          hasChanges = true;
          return {
            ...book,
            borrowedCopies: activeCount,
            availableCopies: calculatedAvailable,
          };
        }
        return book;
      });

      return hasChanges ? updated : prevBooks;
    });
  }, [loans]);

  // CALCULS STATISTIQUES AUTOMATIQUES POUR LE GÉRANT DE BIBLIOTHÈQUE
  const activeBooks = books.filter((b) => !b.isArchived);
  const totalBooksCount = activeBooks.length;
  const totalCopiesCount = activeBooks.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopiesCount = activeBooks.reduce((acc, b) => acc + b.availableCopies, 0);
  const borrowedCopiesCount = activeBooks.reduce((acc, b) => acc + b.borrowedCopies, 0);

  // 1. Demandes d'emprunt en attente
  const pendingRequests = loans.filter((l) => l.status === 'pending');
  const pendingRequestsCount = pendingRequests.length;

  // 2. Demandes acceptées en attente de remise physique
  const acceptedRequestsWaitingHandover = loans.filter((l) => l.status === 'accepted');

  // 3. Emprunts actifs
  const activeLoans = loans.filter((l) => l.status === 'active');

  // 4. Emprunts en retard avec pénalités
  const overdueLoans: Loan[] = loans
    .filter((l) => l.status === 'active' && l.daysOverdue > 0)
    .map((l) => {
      let severity: OverdueSeverity = 'yellow';
      if (l.daysOverdue > 7) {
        severity = 'red';
      } else if (l.daysOverdue >= 4) {
        severity = 'orange';
      } else {
        severity = 'yellow';
      }
      const penaltyFeeMad = l.daysOverdue * penaltyRule.feePerDayMad;
      return { ...l, severity, penaltyFeeMad };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const overdueLoansCount = overdueLoans.length;

  // 5. Livres qui doivent être retournés aujourd'hui
  const loansDueToday = loans.filter(
    (l) => l.status === 'active' && l.dueDate === TODAY_DATE
  );

  // 6. Retours à traiter (livres échus aujourd'hui ou en retard)
  const returnsToProcessCount = loans.filter(
    (l) => l.status === 'active' && (l.dueDate === TODAY_DATE || l.daysOverdue > 0)
  ).length;

  // Envoi automatique de mail sans clic pour le Gérant dès la détection de retards
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
        id: `AUTO-LOG-${Date.now()}`,
        sentAt: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        recipientCount: recipients.length,
        recipients,
        subject: "biblioEST : Rappel officiel de retard de restitution d'ouvrage",
      };

      setEmailLogs((prev) => [autoLog, ...prev]);
      setAutomaticEmailNotification(
        `Système automatique : ${recipients.length} e-mail(s) de relance généré(s) sans clic pour les retards en cours.`
      );
    }
  }, [currentUser, overdueLoans]);

  const dismissAutoEmailNotification = () => {
    setAutomaticEmailNotification(null);
  };

  // =========================================================================
  // GESTION DES LIVRES (Gérant de bibliothèque)
  // =========================================================================
  const addBook = (newBookData: Omit<Book, 'id' | 'availableCopies' | 'borrowedCopies'>) => {
    const newId = `EST-LIV-${Date.now().toString().slice(-4)}`;
    const newBook: Book = {
      ...newBookData,
      id: newId,
      availableCopies: newBookData.totalCopies,
      borrowedCopies: 0,
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
        const available = Math.max(0, total - activeLoansForBook);

        return {
          ...b,
          ...updatedFields,
          totalCopies: total,
          borrowedCopies: activeLoansForBook,
          availableCopies: available,
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
  // Création par l'étudiant
  const requestBookLoan = (bookId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'student') {
      return { success: false, error: 'Seul un étudiant connecté peut demander un emprunt.' };
    }

    const targetBook = books.find((b) => b.id === bookId && !b.isArchived);
    if (!targetBook) {
      return { success: false, error: 'Ouvrage introuvable.' };
    }

    if (targetBook.availableCopies <= 0) {
      return { success: false, error: "Aucun exemplaire n'est actuellement disponible en rayon." };
    }

    // Vérifier limite stricte de 3 emprunts actifs ou acceptés
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
    const returnDueDate = new Date();
    returnDueDate.setDate(returnDueDate.getDate() + 14);

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
      requestDate: TODAY_DATE,
      dueDate: returnDueDate.toISOString().split('T')[0],
      status: 'pending',
      daysOverdue: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);

    // Ajouter notification pour l'étudiant
    const newNotif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: currentUser.id,
      title: 'Demande d’emprunt enregistrée',
      message: `Votre demande pour « ${targetBook.title} » a été transmise au Gérant de bibliothèque.`,
      createdAt: TODAY_DATE + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'loan',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true };
  };

  // Le Gérant accepte la demande (statut -> 'accepted')
  // Note : tant que la remise physique n'est pas faite, l'emprunt n'est PAS actif
  const acceptLoanRequest = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'accepted' } : l))
    );

    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      const notif: Notification = {
        id: `NOTIF-${Date.now()}`,
        userId: targetLoan.studentId,
        title: 'Demande d’emprunt acceptée !',
        message: `Votre demande pour « ${targetLoan.bookTitle} » a été acceptée. Veuillez vous présenter à la bibliothèque pour la remise physique du livre.`,
        createdAt: TODAY_DATE + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'loan',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Le Gérant refuse la demande
  const refuseLoanRequest = (loanId: string, reason?: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'refused', reportReason: reason } : l))
    );

    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      const notif: Notification = {
        id: `NOTIF-${Date.now()}`,
        userId: targetLoan.studentId,
        title: 'Demande d’emprunt refusée',
        message: `Votre demande pour « ${targetLoan.bookTitle} » a été refusée par le Gérant${reason ? ' : ' + reason : '.'}`,
        createdAt: TODAY_DATE + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'info',
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Confirmation de la remise physique du livre à l'étudiant
  // L'emprunt devient alors réellement 'active', la date d'emprunt réelle est enregistrée, et le stock est décrémenté
  const confirmPhysicalHandover = (loanId: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    const returnDueDate = new Date();
    returnDueDate.setDate(returnDueDate.getDate() + 14);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'active',
              borrowedDate: TODAY_DATE,
              dueDate: returnDueDate.toISOString().split('T')[0],
              daysOverdue: 0,
            }
          : l
      )
    );

    // Mettre à jour l'étudiant
    setStudents((prev) =>
      prev.map((s) =>
        s.id === targetLoan.studentId
          ? { ...s, activeLoanBookIds: [...s.activeLoanBookIds, targetLoan.bookId] }
          : s
      )
    );

    // Notification à l'étudiant
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Emprunt confirmé (Remise effectuée)',
      message: `L'exemplaire de « ${targetLoan.bookTitle} » vous a été remis physiquement. Date limite de restitution : ${returnDueDate.toISOString().split('T')[0]}.`,
      createdAt: TODAY_DATE + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'due',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // =========================================================================
  // GESTION DES RETOURS
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
      return { success: false, error: 'Cet exemplaire a déjà été retourné.' };
    }

    // Clôture propre
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'returned',
              returnDate: TODAY_DATE,
              condition,
              reportReason: notes,
              daysOverdue: 0,
            }
          : l
      )
    );

    // Retirer de la liste de l'étudiant
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

    // Notification
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      userId: targetLoan.studentId,
      title: 'Restitution confirmée',
      message: `Votre retour de « ${targetLoan.bookTitle} » a été validé (État : ${condition === 'good' ? 'Bon état' : condition === 'damaged' ? 'Endommagé' : 'Perdu'}).`,
      createdAt: TODAY_DATE + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

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
      requestDate: TODAY_DATE,
      borrowedDate: TODAY_DATE,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'active', // Directement actif car remise physique effectuée au comptoir
      daysOverdue: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === foundStudent.id
          ? { ...s, activeLoanBookIds: [...s.activeLoanBookIds, currentBook.id] }
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

    // Clôture automatique sans clic
    setLoans((prev) =>
      prev.map((l) =>
        l.id === matchingLoan.id
          ? {
              ...l,
              status: 'returned',
              returnDate: TODAY_DATE,
              condition: 'good',
              daysOverdue: 0,
            }
          : l
      )
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === foundStudent.id
          ? {
              ...s,
              activeLoanBookIds: s.activeLoanBookIds.filter((id) => id !== currentBook.id),
            }
          : s
      )
    );

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
        borrowedCopiesCount,
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
