import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book, Student, Loan, User, OverdueSeverity, EmailLog } from '../types';
import { INITIAL_BOOKS, INITIAL_STUDENTS, INITIAL_LOANS } from '../data/mockData';

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

interface LibraryContextType {
  currentUser: User | null;
  loginWithSession: (user: User) => void;
  logout: () => void;
  books: Book[];
  students: Student[];
  loans: Loan[];
  overdueLoans: Loan[];
  loansDueToday: Loan[];
  totalBooksBrought: number;
  scanBorrowState: ScanBorrowState;
  scanReturnState: ScanReturnState;
  selectedBookForDetail: Book | null;
  setSelectedBookForDetail: (book: Book | null) => void;
  selectedOverdueLoan: Loan | null;
  setSelectedOverdueLoan: (loan: Loan | null) => void;
  selectedStudentProfile: Student | null;
  setSelectedStudentProfile: (student: Student | null) => void;
  
  // Emprunt
  processBorrowBookScan: (qrCode: string) => boolean;
  processBorrowStudentScan: (qrCode: string) => boolean;
  resetBorrowScan: () => void;
  cancelLoan: (loanId: string) => void;
  
  // Retour 100% automatique sans clic
  processReturnBookScan: (qrCode: string) => boolean;
  processReturnStudentScan: (qrCode: string) => boolean;
  resetReturnScan: () => void;
  
  // Relances automatiques sans clic
  emailLogs: EmailLog[];
  automaticEmailNotification: string | null;
  dismissAutoEmailNotification: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY_BOOKS = 'biblioest_books_v3';
const STORAGE_KEY_LOANS = 'biblioest_loans_v3';
const STORAGE_KEY_STUDENTS = 'biblioest_students_v3';
const STORAGE_KEY_USER = 'biblioest_current_user_v3';

export const TODAY_DATE = '2026-11-10';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
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

  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [selectedOverdueLoan, setSelectedOverdueLoan] = useState<Loan | null>(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Student | null>(null);

  // Scan Emprunt
  const [scanBorrowState, setScanBorrowState] = useState<ScanBorrowState>({
    scannedBook: null,
    scannedStudent: null,
    error: null,
    successLoan: null,
    lastCancelledLoan: null,
  });

  // Scan Retour
  const [scanReturnState, setScanReturnState] = useState<ScanReturnState>({
    scannedBook: null,
    scannedStudent: null,
    error: null,
    successReturn: null,
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [automaticEmailNotification, setAutomaticEmailNotification] = useState<string | null>(null);
  const hasAutoSentEmailsRef = useRef<boolean>(false);

  // Sauvegarde
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  const loginWithSession = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedBookForDetail(null);
    setSelectedOverdueLoan(null);
    setSelectedStudentProfile(null);
    hasAutoSentEmailsRef.current = false;
  };

  // Statistiques
  const totalBooksBrought = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const loansDueToday = loans.filter((l) => l.status === 'active' && l.dueDate === TODAY_DATE);

  // Retards stricts avec classification par sévérité (3 degrés)
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
      return { ...l, severity };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // ENVOI AUTOMATIQUE DES MAILS DE RELANCE SANS AUCUN CLIC DÈS L'ARRIVÉE DU GÉRANT
  useEffect(() => {
    if (currentUser?.role === 'manager' && overdueLoans.length > 0 && !hasAutoSentEmailsRef.current) {
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
        subject: "biblioEST : Relance automatique de retard de restitution d'ouvrage",
      };

      setEmailLogs((prev) => [autoLog, ...prev]);
      setAutomaticEmailNotification(
        `Système automatique : ${recipients.length} e-mails de rappel ont été générés et expédiés automatiquement sans clic aux étudiants en retard de restitution.`
      );
    }
  }, [currentUser, overdueLoans]);

  const dismissAutoEmailNotification = () => {
    setAutomaticEmailNotification(null);
  };

  // PROCESSUS D'EMPRUNT
  const processBorrowBookScan = (qrCode: string): boolean => {
    const cleanCode = qrCode.trim().toUpperCase();
    const foundBook = books.find(
      (b) => b.id.toUpperCase() === cleanCode || b.isbn.toUpperCase() === cleanCode
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
      (l) => l.studentId === foundStudent.id && l.status === 'active'
    );

    if (activeStudentLoans.length >= 3) {
      setScanBorrowState((prev) => ({
        ...prev,
        error: `REFUS AUTOMATIQUE : L'étudiant(e) ${foundStudent.name} possède déjà ${activeStudentLoans.length} exemplaires empruntés (limite maximale : 3). L'emprunt est bloqué.`,
        scannedStudent: null,
      }));
      return false;
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

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
      borrowedDate: TODAY_DATE,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'active',
      daysOverdue: 0,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setBooks((prev) =>
      prev.map((b) => (b.id === currentBook.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );
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

    setBooks((prev) =>
      prev.map((b) =>
        b.id === targetLoan.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b
      )
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
      error: null,
    }));
  };

  // PROCESSUS DE RETOUR 100% SANS CLIC
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
        error: `Attention : Aucun exemplaire de l'ouvrage "${foundBook.title}" n'est actuellement marqué comme emprunté.`,
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

    // CLÔTURE ET STOCK +1 SANS CLIC
    setLoans((prev) =>
      prev.map((l) =>
        l.id === matchingLoan.id
          ? {
              ...l,
              status: 'returned',
              returnDate: TODAY_DATE,
              daysOverdue: 0,
            }
          : l
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id === currentBook.id ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b
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
        loginWithSession,
        logout,
        books,
        students,
        loans,
        overdueLoans,
        loansDueToday,
        totalBooksBrought,
        scanBorrowState,
        scanReturnState,
        selectedBookForDetail,
        setSelectedBookForDetail,
        selectedOverdueLoan,
        setSelectedOverdueLoan,
        selectedStudentProfile,
        setSelectedStudentProfile,
        processBorrowBookScan,
        processBorrowStudentScan,
        resetBorrowScan,
        cancelLoan,
        processReturnBookScan,
        processReturnStudentScan,
        resetReturnScan,
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
