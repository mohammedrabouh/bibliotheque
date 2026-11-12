import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  BookOpen,
  LayoutDashboard,
  QrCode,
  Users,
  Package,
  CalendarCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Mail,
  ShieldAlert,
  ArrowRight,
  Send,
  FileText,
  BadgeAlert,
  Wrench,
  BookmarkCheck,
  ShieldCheck,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import { BorrowReturnStation } from './BorrowReturnStation';
import { OverdueDetailModal } from './OverdueDetailModal';
import { Book, BookCondition, Loan, OverdueSeverity } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

export const ManagerDashboard: React.FC = () => {
  const {
    books,
    categories,
    students,
    loans,
    systemDate,
    authMode,
    // Indicateurs calculés automatiquement à partir des données réelles
    totalBooksCount,
    totalCopiesCount,
    availableCopiesCount,
    reservedCopiesCount,
    borrowedCopiesCount,
    unavailableCopiesCount,
    overdueLoansCount,
    reservedLoansCount,
    returnsToProcessCount,
    // Listes filtrées
    overdueLoans,
    loansDueToday,
    reservedLoans,
    activeLoans,
    // Actions Gérant
    addBook,
    updateBook,
    deleteOrArchiveBook,
    addCategory,
    repairDamagedBook,
    confirmPhysicalHandover,
    cancelReservation,
    processPhysicalReturn,
    reportOverdueToAdmin,
    // Fiches
    selectedOverdueLoan,
    setSelectedOverdueLoan,
    selectedStudentProfile,
    setSelectedStudentProfile,
    // Auto emails
    emailLogs,
    automaticEmailNotification,
    dismissAutoEmailNotification,
  } = useLibrary();

  // Navigation onglets Gérant de bibliothèque
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'books' | 'reservations' | 'returns' | 'scanner' | 'students'
  >('dashboard');

  // Filtre sévérité des retards
  const [severityFilter, setSeverityFilter] = useState<'all' | OverdueSeverity>('all');

  // État formulaire nouveau livre
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: categories[0] || 'Informatique',
    publishedYear: 2024,
    publisher: 'Dunod',
    isbn: '',
    shelfLocation: 'Rayon A-1',
    description: '',
    summary: 'Présentation générale des principes et méthodes...',
    tableOfContents: ['Introduction générale', 'Concepts fondamentaux', 'Études de cas'],
    totalCopies: 3,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    coverColor: 'from-blue-600 to-indigo-800',
  });

  // Recherche dans la gestion des livres
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedBookCategoryFilter, setSelectedBookCategoryFilter] = useState<string>('all');

  // Modal de retour manuel
  const [returnModalLoan, setReturnModalLoan] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good');
  const [returnNotes, setReturnNotes] = useState('');

  // Modal de signalement administrateur
  const [reportModalLoan, setReportModalLoan] = useState<Loan | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Toast feedback
  const [managerActionFeedback, setManagerActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setManagerActionFeedback(msg);
    setTimeout(() => setManagerActionFeedback(null), 4000);
  };

  // Filtrage des retards
  const filteredOverdueLoans = overdueLoans.filter((l) => {
    if (severityFilter === 'all') return true;
    return l.severity === severityFilter;
  });

  const yellowLoans = overdueLoans.filter((l) => l.severity === 'yellow');
  const orangeLoans = overdueLoans.filter((l) => l.severity === 'orange');
  const redLoans = overdueLoans.filter((l) => l.severity === 'red');

  // Filtrage des livres pour l'onglet gestion
  const filteredBooksList = books
    .filter((b) => !b.isArchived)
    .filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.shelfLocation.toLowerCase().includes(bookSearchQuery.toLowerCase());
      const matchesCat =
        selectedBookCategoryFilter === 'all' || b.category === selectedBookCategoryFilter;
      return matchesSearch && matchesCat;
    });

  // Soumission formulaire livre
  const handleBookFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.isbn) {
      alert('Veuillez remplir au moins le titre, l’auteur et l’ISBN.');
      return;
    }

    if (editingBook) {
      updateBook(editingBook.id, {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        publishedYear: Number(bookForm.publishedYear),
        publisher: bookForm.publisher,
        isbn: bookForm.isbn,
        shelfLocation: bookForm.shelfLocation,
        description: bookForm.description,
        totalCopies: Number(bookForm.totalCopies),
      });
      showFeedback(`L'ouvrage « ${bookForm.title} » a été mis à jour avec succès.`);
    } else {
      addBook({
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        publishedYear: Number(bookForm.publishedYear),
        publisher: bookForm.publisher,
        isbn: bookForm.isbn,
        shelfLocation: bookForm.shelfLocation,
        description: bookForm.description,
        summary: bookForm.summary,
        tableOfContents: bookForm.tableOfContents,
        totalCopies: Number(bookForm.totalCopies),
        coverImage: bookForm.coverImage,
        coverColor: bookForm.coverColor,
      });
      showFeedback(`L'ouvrage « ${bookForm.title} » a été ajouté au catalogue.`);
    }

    setShowAddBookModal(false);
    setEditingBook(null);
  };

  const openEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      publishedYear: book.publishedYear,
      publisher: book.publisher,
      isbn: book.isbn,
      shelfLocation: book.shelfLocation,
      description: book.description,
      summary: book.summary,
      tableOfContents: book.tableOfContents,
      totalCopies: book.totalCopies,
      coverImage: book.coverImage,
      coverColor: book.coverColor,
    });
    setShowAddBookModal(true);
  };

  // Traitement retour physique
  const handleConfirmReturn = () => {
    if (!returnModalLoan) return;
    const res = processPhysicalReturn(returnModalLoan.id, returnCondition, returnNotes);
    if (res.success) {
      showFeedback(`Restitution de « ${returnModalLoan.bookTitle} » enregistrée avec succès.`);
    } else {
      alert(res.error || 'Erreur lors du retour.');
    }
    setReturnModalLoan(null);
    setReturnCondition('good');
    setReturnNotes('');
  };

  // Traitement signalement admin
  const handleConfirmReport = () => {
    if (!reportModalLoan) return;
    reportOverdueToAdmin(reportModalLoan.id, reportReason || 'Signalement officiel pour retard persistant.');
    showFeedback(`Le retard de ${reportModalLoan.studentName} a été transmis à la direction.`);
    setReportModalLoan(null);
    setReportReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-20">
      {/* Toast Feedback */}
      {managerActionFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs sm:text-sm font-bold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{managerActionFeedback}</span>
        </div>
      )}

      {/* Alerte e-mail automatique */}
      {automaticEmailNotification && (
        <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-200 shrink-0" />
            <span className="font-semibold">{automaticEmailNotification}</span>
          </div>
          <button
            onClick={dismissAutoEmailNotification}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête Gérant */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Espace Gestionnaire
            </span>
            <span className="text-xs text-slate-400 font-mono">EST USMBA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Tableau de Bord — Gérant de Bibliothèque
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision du catalogue, réservations d'exemplaires, remises physiques et retours.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingBook(null);
              setBookForm({
                title: '',
                author: '',
                category: categories[0] || 'Informatique',
                publishedYear: 2024,
                publisher: 'Dunod',
                isbn: '',
                shelfLocation: 'Rayon A-1',
                description: '',
                summary: '',
                tableOfContents: [],
                totalCopies: 3,
                coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
                coverColor: 'from-blue-600 to-indigo-800',
              });
              setShowAddBookModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un livre</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Poste de Scan QR</span>
          </button>
        </div>
      </div>

      {/* Barre de navigation des onglets */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Vue d'ensemble & Retards ({overdueLoansCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'books'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Livres & Stock ({totalBooksCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Réservations ({reservedLoans.length})</span>
          {reservedLoans.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Retours ({returnsToProcessCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'scanner'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Poste de Scan Caméra</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Étudiants ({students.length})</span>
        </button>
      </div>

      {/* CARTES STATISTIQUES DES 4 ÉTATS STRICTS DU STOCK */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Titres inscrits */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Titres au total
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalBooksCount}
          </span>
          <span className="text-[10px] text-slate-400">Catalogue actif</span>
        </div>

        {/* 2. Volume physique total */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Total exemplaires
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalCopiesCount}
          </span>
          <span className="text-[10px] text-slate-400">Parc physique</span>
        </div>

        {/* 3. Disponibles en rayon */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
            Disponibles rayon
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {availableCopiesCount}
          </span>
          <span className="text-[10px] text-emerald-700">Prêts à être réservés</span>
        </div>

        {/* 4. Réservés au comptoir */}
        <div className="bg-white p-4 rounded-3xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">
            Réservés comptoir
          </span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {reservedCopiesCount}
          </span>
          <span className="text-[10px] text-indigo-700">En attente de retrait</span>
        </div>

        {/* 5. Empruntés en circulation */}
        <div className="bg-white p-4 rounded-3xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">
            Emprunts actifs
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {borrowedCopiesCount}
          </span>
          <span className="text-[10px] text-blue-700">En circulation</span>
        </div>

        {/* 6. Indisponibles (en atelier) */}
        <div className="bg-white p-4 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            Indisponibles
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {unavailableCopiesCount}
          </span>
          <span className="text-[10px] text-amber-700">En réparation</span>
        </div>
      </div>

      {/* Barre de cohérence du stock */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">Équilibre physique du stock :</span>
          <span className="font-mono text-slate-700">
            Total ({totalCopiesCount}) = Rayon ({availableCopiesCount}) + Réservés ({reservedCopiesCount}) + Empruntés ({borrowedCopiesCount}) + Réparation ({unavailableCopiesCount})
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
          Stock cohérent
        </span>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : DASHBOARD STATISTIQUES & RETARDS                               */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* SECTION : ÉCHÉANCES DU JOUR (DATE RÉELLE DU SYSTÈME) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Exemplaires dont l'échéance de retour est AUJOURD'HUI ({loansDueToday.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date du système : <strong className="text-blue-700">{formatDisplayDate(systemDate)}</strong>
                  </p>
                </div>
              </div>
              <span className="text-xs bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
                {loansDueToday.length} restitution(s) attendue(s)
              </span>
            </div>

            {loansDueToday.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                Aucun retour programmé précisément pour la date d'aujourd'hui.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {loansDueToday.map((loan) => (
                  <div
                    key={loan.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm block sm:inline">
                        « {loan.bookTitle} »
                      </span>
                      <span className="text-slate-500 sm:ml-2">par {loan.bookAuthor}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600">
                      <span>
                        Emprunteur : <strong>{loan.studentName}</strong> ({loan.studentEmail})
                      </span>
                      <button
                        onClick={() => setReturnModalLoan(loan)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg cursor-pointer"
                      >
                        Enregistrer retour
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3 DEGRÉS D'ALERTE DE RETARD (JAUNE, ORANGE, ROUGE) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Jaune : 1 à 3 jours */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'yellow' ? 'all' : 'yellow')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                severityFilter === 'yellow'
                  ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                  : 'bg-amber-50/70 border-amber-200 hover:border-amber-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Retard léger (Jaune)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-amber-950 mt-1.5 block">
                    {yellowLoans.length}
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    1 à 3 jours de retard • Suivi préventif
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-950 flex items-center justify-center font-black text-xs">
                  JAUNE
                </div>
              </div>
            </div>

            {/* Orange : 4 à 7 jours */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'orange' ? 'all' : 'orange')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                severityFilter === 'orange'
                  ? 'bg-orange-100/80 border-orange-500 ring-2 ring-orange-400/40 shadow-md'
                  : 'bg-orange-50/70 border-orange-200 hover:border-orange-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                      Retard moyen (Orange)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-orange-950 mt-1.5 block">
                    {orangeLoans.length}
                  </span>
                  <span className="text-xs text-orange-800 font-medium">
                    4 à 7 jours de retard • Relance recommandée
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-200/80 text-orange-950 flex items-center justify-center font-black text-xs">
                  ORANGE
                </div>
              </div>
            </div>

            {/* Rouge : Plus de 7 jours */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'red' ? 'all' : 'red')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                severityFilter === 'red'
                  ? 'bg-rose-100/80 border-rose-500 ring-2 ring-rose-400/40 shadow-md'
                  : 'bg-rose-50/70 border-rose-200 hover:border-rose-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Retard élevé (Rouge)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-rose-950 mt-1.5 block">
                    {redLoans.length}
                  </span>
                  <span className="text-xs text-rose-800 font-medium">
                    &gt; 7 jours • Signalement requis
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-200/80 text-rose-950 flex items-center justify-center font-black text-xs">
                  ROUGE
                </div>
              </div>
            </div>
          </div>

          {/* LISTE DÉTAILLÉE DES EMPRUNTS EN RETARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Étudiants en retard de restitution ({filteredOverdueLoans.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Calculé dynamiquement selon la date réelle ({systemDate}).
                </p>
              </div>

              {severityFilter !== 'all' && (
                <button
                  onClick={() => setSeverityFilter('all')}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Afficher tous les retards ({overdueLoans.length})
                </button>
              )}
            </div>

            {filteredOverdueLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucun emprunt en retard dans cette catégorie.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOverdueLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                          loan.severity === 'red'
                            ? 'bg-rose-500 animate-pulse'
                            : loan.severity === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-amber-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {loan.studentName}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({loan.studentEmail})
                          </span>
                          {loan.reportedToAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Signalé à la direction
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                          <span className="font-bold text-slate-900">« {loan.bookTitle} »</span>
                          <span className="text-slate-400">·</span>
                          <span>Échéance prévue : {formatDisplayDate(loan.dueDate)}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-bold text-rose-700">
                            {loan.daysOverdue} jour{loan.daysOverdue > 1 ? 's' : ''} de dépassement
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedOverdueLoan(loan)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Voir fiche
                      </button>

                      <button
                        onClick={() => setReturnModalLoan(loan)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Réceptionner
                      </button>

                      <button
                        onClick={() => {
                          setReportModalLoan(loan);
                          setReportReason(`Retard constaté de ${loan.daysOverdue} jours non régularisé.`);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                        title="Signaler à l'administrateur"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : LIVRES & GESTION DU STOCK                                      */}
      {/* ========================================================================= */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          {/* Barre recherche & filtre catégorie */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                placeholder="Filtrer par titre, auteur, cote de rangement..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden"
              />
            </div>

            <select
              value={selectedBookCategoryFilter}
              onChange={(e) => setSelectedBookCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tableau des livres */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredBooksList.map((book) => (
                <div
                  key={book.id}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-3 h-12 rounded-full bg-gradient-to-b ${book.coverColor} shrink-0`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {book.title}
                        </span>
                        <span className="text-slate-500">de {book.author}</span>
                      </div>
                      <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 text-[11px]">
                        <span className="font-mono text-slate-600">{book.id}</span>
                        <span>·</span>
                        <span>{book.category}</span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">Cote : {book.shelfLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de stock des 4 états */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                      {book.availableCopies} dispo(s)
                    </span>
                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold">
                      {book.reservedCopies || 0} réservé(s)
                    </span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
                      {book.borrowedCopies} emprunté(s)
                    </span>
                    {(book.unavailableCopies || 0) > 0 && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1">
                        <Wrench className="w-3 h-3 text-amber-600" />
                        <span>{book.unavailableCopies} réparation</span>
                      </span>
                    )}

                    {/* Actions sur le livre */}
                    <div className="flex items-center space-x-1 ml-2">
                      {(book.unavailableCopies || 0) > 0 && (
                        <button
                          onClick={() => {
                            repairDamagedBook(book.id);
                            showFeedback(`Exemplaire de « ${book.title} » réparé et remis en rayon.`);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Remettre un exemplaire réparé en rayon"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => openEditBook(book)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Modifier l'ouvrage"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Archiver « ${book.title} » du catalogue ?`)) {
                            deleteOrArchiveBook(book.id);
                            showFeedback(`« ${book.title} » a été archivé.`);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Archiver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : RÉSERVATIONS EN COURS (SYSTÈME DIRECT SANS DEMANDES EN ATTENTE) */}
      {/* ========================================================================= */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Réservations d'exemplaires en cours ({reservedLoans.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Les étudiants ont réservé ces exemplaires en ligne. Le stock disponible a été décrémenté. Confirmez la remise physique du livre dès que l'étudiant se présente au comptoir.
                </p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1 rounded-full border border-indigo-200">
                {reservedLoans.length} à délivrer
              </span>
            </div>

            {reservedLoans.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                Aucune réservation d'exemplaire en attente de retrait.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reservedLoans.map((resLoan) => (
                  <div
                    key={resLoan.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 p-3 rounded-2xl transition-colors"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        « {resLoan.bookTitle} »
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Étudiant : <strong>{resLoan.studentName}</strong> ({resLoan.studentEmail}) • Carte : <span className="font-mono">{resLoan.studentCardId}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                        <span>Réservé le : {formatDisplayDate(resLoan.reservationDate || resLoan.requestDate || '')}</span>
                        <span>·</span>
                        <span className="font-bold text-slate-700">Emplacement : {resLoan.bookShelf}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Confirmation de remise physique */}
                      <button
                        onClick={() => {
                          const res = confirmPhysicalHandover(resLoan.id);
                          if (res.success) {
                            showFeedback(`Remise physique validée pour ${resLoan.studentName}. L'emprunt est désormais actif.`);
                          } else {
                            alert(res.error || "Erreur de remise physique.");
                          }
                        }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
                      >
                        <Package className="w-4 h-4" />
                        <span>Confirmer la remise physique du livre</span>
                      </button>

                      {/* Annuler la réservation */}
                      <button
                        onClick={() => {
                          if (confirm(`Annuler la réservation de « ${resLoan.bookTitle} » pour ${resLoan.studentName} ? L'exemplaire retournera en rayon disponible.`)) {
                            cancelReservation(resLoan.id);
                            showFeedback(`Réservation annulée. L'exemplaire est de nouveau disponible.`);
                          }
                        }}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold rounded-xl transition-colors cursor-pointer"
                        title="Annuler la réservation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : GESTION DES RETOURS PHYSIQUES (SANS FRAIS NI PÉNALITÉS)         */}
      {/* ========================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Traitement des Retours Physiques d'Exemplaires
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Règle stricte : un exemplaire en bon état redevient immédiatement disponible en rayon (+1). Un exemplaire endommagé est orienté en réparation. Un exemplaire perdu est sorti du stock.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">
                Emprunts actifs en circulation ({activeLoans.length})
              </span>
              <span className="text-xs text-slate-500">
                Prévention stricte des doubles retours
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">
                      « {loan.bookTitle} »
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Emprunté par <strong>{loan.studentName}</strong> ({loan.studentEmail}) • Carte : {loan.studentCardId}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span>Date de remise : {formatDisplayDate(loan.borrowedDate || loan.reservationDate || '')}</span>
                      <span>·</span>
                      <span className={loan.daysOverdue > 0 ? 'text-rose-600 font-bold' : ''}>
                        Date limite : {formatDisplayDate(loan.dueDate)} {loan.daysOverdue > 0 ? `(${loan.daysOverdue}j de retard)` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReturnModalLoan(loan)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enregistrer la réception physique</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 5 : POSTE DE SCAN QR                                               */}
      {/* ========================================================================= */}
      {activeTab === 'scanner' && <BorrowReturnStation />}

      {/* ========================================================================= */}
      {/* ONGLET 6 : PROFILS DES ÉTUDIANTS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Fiches des Étudiants Inscrits
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi des emprunts actifs et réservations (maximum : 3 ouvrages par étudiant).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const activeCount = student.activeLoanBookIds.length;
              const studentLoans = loans.filter(
                (l) => l.studentId === student.id && l.status === 'active'
              );
              const studentReservations = loans.filter(
                (l) => l.studentId === student.id && l.status === 'reserved'
              );

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-base text-slate-900 truncate">
                          {student.name}
                        </h4>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            activeCount >= 3
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {activeCount}/3 empruntés
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 block">
                        {student.email}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 block">
                      Emprunts et réservations en cours :
                    </span>
                    {studentLoans.length === 0 && studentReservations.length === 0 ? (
                      <span className="text-slate-400 italic">Aucun ouvrage en cours</span>
                    ) : (
                      <ul className="space-y-1">
                        {studentReservations.map((r) => (
                          <li key={r.id} className="text-indigo-700 font-semibold flex items-center space-x-1">
                            <span>📌 Réservé : « {r.bookTitle} »</span>
                          </li>
                        ))}
                        {studentLoans.map((l) => (
                          <li key={l.id} className="text-slate-800 flex items-center justify-between">
                            <span>« {l.bookTitle} »</span>
                            <span className={l.daysOverdue > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                              {l.daysOverdue > 0 ? `${l.daysOverdue}j retard` : 'En cours'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION DE LIVRE */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingBook ? 'Modifier l’ouvrage' : 'Ajouter un nouvel ouvrage'}
              </h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre de l'ouvrage * :</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Ex: Programmation Web Avancée"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auteur * :</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Ex: Pr. A. Bennani"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ISBN * :</label>
                  <input
                    type="text"
                    required
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    placeholder="978-2..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie :</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emplacement en rayon :</label>
                  <input
                    type="text"
                    value={bookForm.shelfLocation}
                    onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                    placeholder="Rayon A-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume total d'exemplaires :</label>
                  <input
                    type="number"
                    min="1"
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Année d'édition :</label>
                  <input
                    type="number"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({ ...bookForm, publishedYear: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description courte :</label>
                <textarea
                  rows={2}
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  placeholder="Bref descriptif pédagogique..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {editingBook ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RÉCEPTION DE RETOUR PHYSIQUE (CONTRÔLE D'ÉTAT SANS CALCUL FINANCIER) */}
      {returnModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Réception physique d'un exemplaire
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Vérifiez l'état physique du livre restitué par <strong>{returnModalLoan.studentName}</strong>.
            </p>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block">« {returnModalLoan.bookTitle} »</span>
                <span className="text-slate-500 block">ID : {returnModalLoan.bookId} • Cote : {returnModalLoan.bookShelf}</span>
              </div>

              <label className="font-bold text-slate-700 block">Constat de l'état physique :</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReturnCondition('good')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    returnCondition === 'good'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Bon état</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReturnCondition('damaged')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    returnCondition === 'damaged'
                      ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Wrench className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                  <span>Endommagé</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReturnCondition('lost')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    returnCondition === 'lost'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <span>Perdu</span>
                </button>
              </div>

              {returnCondition === 'good' && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  L'exemplaire sera immédiatement <strong>reclassé en rayon disponible (+1 stock)</strong>.
                </div>
              )}

              {returnCondition === 'damaged' && (
                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-900">
                  L'exemplaire sera marqué <strong>indisponible pour réparation</strong> (retiré du stock disponible en rayon).
                </div>
              )}

              {returnCondition === 'lost' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
                  L'exemplaire sera déclaré <strong>perdu</strong> (décompté du parc d'exemplaires).
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Observations ou notes :</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Ex: Retour en bon état..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturnModalLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Valider la restitution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SIGNALEMENT ADMINISTRATEUR */}
      {reportModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Signaler un retard persistant à l'administration
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Transmission du dossier pour l'étudiant(e) <strong>{reportModalLoan.studentName}</strong> ({reportModalLoan.studentEmail}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif du signalement :</label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReportModalLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReport}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Transmettre le signalement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL D'UN RETARD SÉLECTIONNÉ */}
      {selectedOverdueLoan && (
        <OverdueDetailModal
          loan={selectedOverdueLoan}
          book={books.find((b) => b.id === selectedOverdueLoan.bookId)}
          student={students.find((s) => s.id === selectedOverdueLoan.studentId)}
          onClose={() => setSelectedOverdueLoan(null)}
        />
      )}
    </div>
  );
};
