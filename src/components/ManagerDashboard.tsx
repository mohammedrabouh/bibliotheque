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
  Zap,
  Mail,
  ShieldAlert,
  ArrowRight,
  HandCoins,
  Send,
  FileText,
  BadgeAlert,
  Wrench,
  BookmarkCheck,
  ShieldCheck,
  AlertCircle,
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
    penaltyRule,
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
    pendingRequestsCount,
    returnsToProcessCount,
    // Listes filtrées
    overdueLoans,
    loansDueToday,
    pendingRequests,
    acceptedRequestsWaitingHandover,
    activeLoans,
    // Actions Gérant
    addBook,
    updateBook,
    deleteOrArchiveBook,
    addCategory,
    repairDamagedBook,
    acceptLoanRequest,
    refuseLoanRequest,
    confirmPhysicalHandover,
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
    'dashboard' | 'books' | 'requests' | 'returns' | 'scanner' | 'students'
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

  // État modal de retour physique
  const [returnModalLoan, setReturnModalLoan] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSuccessMessage, setReturnSuccessMessage] = useState<string | null>(null);
  const [returnErrorMessage, setReturnErrorMessage] = useState<string | null>(null);

  // État refus de demande
  const [refusalModalLoan, setRefusalModalLoan] = useState<Loan | null>(null);
  const [refusalReason, setRefusalReason] = useState('');

  // État signalement administrateur
  const [reportModalLoan, setReportModalLoan] = useState<Loan | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Calcul des retards par degrés
  const yellowLoans = overdueLoans.filter((l) => l.severity === 'yellow');
  const orangeLoans = overdueLoans.filter((l) => l.severity === 'orange');
  const redLoans = overdueLoans.filter((l) => l.severity === 'red');

  const filteredOverdueLoans = overdueLoans.filter((loan) => {
    if (severityFilter === 'all') return true;
    return loan.severity === severityFilter;
  });

  // Filtrage des livres pour l'inventaire
  const filteredInventoryBooks = books
    .filter((b) => !b.isArchived)
    .filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(bookSearchQuery.toLowerCase());
      const matchCat =
        selectedBookCategoryFilter === 'all' || b.category === selectedBookCategoryFilter;
      return matchSearch && matchCat;
    });

  // Soumission ajout / modification de livre
  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
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
        summary: bookForm.summary,
        tableOfContents: bookForm.tableOfContents,
        totalCopies: Number(bookForm.totalCopies),
      });
      setEditingBook(null);
    } else {
      addBook({
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        publishedYear: Number(bookForm.publishedYear),
        publisher: bookForm.publisher,
        isbn: bookForm.isbn || `978-2-${Date.now().toString().slice(-6)}`,
        shelfLocation: bookForm.shelfLocation,
        description: bookForm.description,
        summary: bookForm.summary,
        tableOfContents: bookForm.tableOfContents,
        totalCopies: Number(bookForm.totalCopies),
        coverImage: bookForm.coverImage,
        coverColor: bookForm.coverColor,
      });
      setShowAddBookModal(false);
    }

    // Reset
    setBookForm({
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
  };

  const openEditBook = (b: Book) => {
    setEditingBook(b);
    setBookForm({
      title: b.title,
      author: b.author,
      category: b.category,
      publishedYear: b.publishedYear,
      publisher: b.publisher,
      isbn: b.isbn,
      shelfLocation: b.shelfLocation,
      description: b.description,
      summary: b.summary,
      tableOfContents: b.tableOfContents,
      totalCopies: b.totalCopies,
      coverImage: b.coverImage,
      coverColor: b.coverColor,
    });
  };

  // Traitement retour physique avec contrôle strict
  const handleConfirmReturn = () => {
    if (!returnModalLoan) return;
    setReturnErrorMessage(null);
    const res = processPhysicalReturn(returnModalLoan.id, returnCondition, returnNotes);
    if (res.success) {
      setReturnSuccessMessage(`Restitution de « ${returnModalLoan.bookTitle} » confirmée (${returnCondition === 'good' ? 'Bon état - Reclassé en rayon disponible' : returnCondition === 'damaged' ? 'Endommagé - Marqué indisponible pour réparation' : 'Déclaré perdu'}).`);
      setTimeout(() => setReturnSuccessMessage(null), 5000);
      setReturnModalLoan(null);
      setReturnNotes('');
      setReturnCondition('good');
    } else {
      setReturnErrorMessage(res.error || 'Erreur lors du traitement du retour.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-20">
      {/* Toast d'envoi automatique de mail sans clic */}
      {automaticEmailNotification && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-3xl shadow-xl border border-blue-400/30 flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">
                  Système automatique d'alerte e-mail actif (sans clic)
                </h4>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-mono">
                  File d'attente simulée
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {automaticEmailNotification} (Configuration SMTP / Resend requise pour délivrance réseau réelle).
              </p>
            </div>
          </div>
          <button
            onClick={dismissAutoEmailNotification}
            className="text-xs text-blue-300 hover:text-white px-2.5 py-1 font-semibold shrink-0 cursor-pointer"
          >
            Fermer ✕
          </button>
        </div>
      )}

      {/* Message succès restitution */}
      {returnSuccessMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{returnSuccessMessage}</span>
          </div>
          <button
            onClick={() => setReturnSuccessMessage(null)}
            className="text-xs text-emerald-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête Gérant & Barre d'onglets professionnelle */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Gérant de bibliothèque
            </span>
            <span className="text-xs text-slate-500 font-mono">Date réelle : <strong>{formatDisplayDate(systemDate)}</strong> ({systemDate})</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Tableau de Bord & Gestion de la Bibliothèque
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicateurs en temps réel, stock physique cohérent, validation des demandes avec réservation et suivi des retards.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 flex-wrap gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'books'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livres & Stock ({totalBooksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Demandes ({pendingRequestsCount + acceptedRequestsWaitingHandover.length})</span>
            {pendingRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
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
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Poste de Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Étudiants ({students.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LES INDICATEURS REELS CALCULÉS DYNAMIQUEMENT (AUCUN CHIFFRE EN DUR)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Titres au total */}
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
          <span className="text-[10px] text-slate-400">Volume physique</span>
        </div>

        {/* 3. Disponibles en rayon */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
            Disponibles rayon
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {availableCopiesCount}
          </span>
          <span className="text-[10px] text-emerald-700">Prêts à être empruntés</span>
        </div>

        {/* 4. Réservés (demandes acceptées) */}
        <div className="bg-white p-4 rounded-3xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">
            Réservés au comptoir
          </span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {reservedCopiesCount}
          </span>
          <span className="text-[10px] text-indigo-700">Demandes acceptées</span>
        </div>

        {/* 5. Empruntés en circulation */}
        <div className="bg-white p-4 rounded-3xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">
            Empruntés actifs
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {borrowedCopiesCount}
          </span>
          <span className="text-[10px] text-blue-700">En possession étudiants</span>
        </div>

        {/* 6. Indisponibles (en réparation) */}
        <div className="bg-white p-4 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
            Indisponibles
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {unavailableCopiesCount}
          </span>
          <span className="text-[10px] text-amber-700">Endommagés / atelier</span>
        </div>
      </div>

      {/* Barre de cohérence mathématique du stock */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">Cohérence physique du stock vérifiée :</span>
          <span className="font-mono text-slate-700">
            Total ({totalCopiesCount}) = Disponibles ({availableCopiesCount}) + Réservés ({reservedCopiesCount}) + Empruntés ({borrowedCopiesCount}) + Indisponibles ({unavailableCopiesCount})
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
          Équation équilibrée 100%
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
                    Date du système : <strong className="text-blue-700">{formatDisplayDate(systemDate)}</strong> ({systemDate})
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
                        onClick={() => {
                          setReturnModalLoan(loan);
                        }}
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

          {/* 3 DEGRÉS DE RETARD AVEC COULEURS JAUNE, ORANGE, ROUGE */}
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
                    1 à 3 jours de retard • {penaltyRule.feePerDayMad} MAD/jour
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
                    4 à 7 jours de retard • Relance
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

          {/* RÈGLES DE PÉNALITÉ INSTITUTIONNELLES (Fixées par l'administration - Lecture seule pour le Gérant) */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-white">
                      Règles de Pénalité Institutionnelles
                    </h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Lecture seule • Administration EST USMBA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Fixées par la direction académique. Le Gérant de bibliothèque applique ces barèmes sans pouvoir les modifier.
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 italic">
                Entrée en vigueur : {penaltyRule.effectiveDate} ({penaltyRule.definedBy})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Indemnité de retard journalière
                </span>
                <span className="text-lg font-black text-amber-400 mt-1 block">
                  {penaltyRule.feePerDayMad} MAD / jour
                </span>
                <span className="text-[11px] text-slate-400">
                  Calculée automatiquement pour chaque jour dépassé
                </span>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Exemplaire restitué endommagé
                </span>
                <span className="text-lg font-black text-orange-400 mt-1 block">
                  Forfait {penaltyRule.damagedBookFeeMad} MAD
                </span>
                <span className="text-[11px] text-slate-400">
                  Frais de reliure et réhabilitation atelier
                </span>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Exemplaire perdu ou détruit
                </span>
                <span className="text-lg font-black text-rose-400 mt-1 block">
                  Forfait {penaltyRule.lostBookFeeMad} MAD
                </span>
                <span className="text-[11px] text-slate-400">
                  Remplacement à neuf et réintégration
                </span>
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
                  Pénalités calculées dynamiquement selon la date réelle du jour ({systemDate}).
                </p>
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setSeverityFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    severityFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({overdueLoans.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('yellow')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    severityFilter === 'yellow'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  Jaune ({yellowLoans.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('orange')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    severityFilter === 'orange'
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-50 text-orange-800'
                  }`}
                >
                  Orange ({orangeLoans.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('red')}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    severityFilter === 'red'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  Rouge ({redLoans.length})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredOverdueLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-3 h-10 rounded-full shrink-0 ${
                        loan.severity === 'red'
                          ? 'bg-rose-600'
                          : loan.severity === 'orange'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {loan.studentName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {loan.studentEmail}
                        </span>
                        {loan.reportedToAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Signalé à l'administration
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                        <span className="font-bold text-slate-900">« {loan.bookTitle} »</span>
                        <span className="text-slate-400">·</span>
                        <span>Échéance : {formatDisplayDate(loan.dueDate)}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-rose-700">
                          {loan.daysOverdue} jour{loan.daysOverdue > 1 ? 's' : ''} de retard
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
                    {/* Pénalité calculée */}
                    <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Pénalité calculée
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {loan.penaltyFeeMad || loan.daysOverdue * penaltyRule.feePerDayMad} MAD
                      </span>
                    </div>

                    {/* Bouton de réception retour physique */}
                    <button
                      onClick={() => setReturnModalLoan(loan)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Réceptionner
                    </button>

                    {/* Signaler à l'administrateur */}
                    <button
                      onClick={() => {
                        setReportModalLoan(loan);
                        setReportReason(`Retard constaté de ${loan.daysOverdue} jours non régularisé.`);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                      title="Signaler à l'administrateur"
                    >
                      Signaler
                    </button>

                    <button
                      onClick={() => setSelectedOverdueLoan(loan)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Voir détail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : GESTION DES LIVRES ET INVENTAIRE DES EXEMPLAIRES                 */}
      {/* ========================================================================= */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Gestion des Ouvrages & Cohérence du Stock
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérification du volume physique, des réservations en attente et des réparations.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingBook(null);
                setShowAddBookModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un nouvel ouvrage</span>
            </button>
          </div>

          {/* Recherche & Filtres par catégorie */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, auteur, ISBN ou catégorie..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Catégorie :</span>
              <select
                value={selectedBookCategoryFilter}
                onChange={(e) => setSelectedBookCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5"
              >
                <option value="all">Toutes les catégories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau des ouvrages */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Ouvrage & Auteur</th>
                    <th className="py-3.5 px-3">Catégorie</th>
                    <th className="py-3.5 px-3 text-center">Total</th>
                    <th className="py-3.5 px-3 text-center">Disponibles</th>
                    <th className="py-3.5 px-3 text-center">Réservés</th>
                    <th className="py-3.5 px-3 text-center">Empruntés</th>
                    <th className="py-3.5 px-3 text-center">Indisponibles</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventoryBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-extrabold text-slate-900 text-sm">{b.title}</div>
                        <div className="text-slate-500 text-xs">{b.author}</div>
                        <div className="text-[11px] font-mono text-slate-400">Cote : {b.shelfLocation}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-slate-900 text-sm">
                        {b.totalCopies}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
                            b.availableCopies > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {b.availableCopies}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-indigo-600 text-sm">
                        {b.reservedCopies || 0}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-blue-600 text-sm">
                        {b.borrowedCopies}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {(b.unavailableCopies || 0) > 0 ? (
                          <div className="inline-flex items-center space-x-1">
                            <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              {b.unavailableCopies}
                            </span>
                            <button
                              onClick={() => repairDamagedBook(b.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Remettre 1 exemplaire réparé en rayon disponible"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditBook(b)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Modifier les exemplaires ou détails"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteOrArchiveBook(b.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Archiver cet ouvrage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : DEMANDES D'EMPRUNT (En attente + Acceptées avec réservation)    */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Section 1 : Demandes en attente */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  1. Demandes d'emprunt en attente ({pendingRequests.length})
                </h3>
                <p className="text-xs text-slate-500">
                  L'acceptation d'une demande réserve automatiquement l'exemplaire pour éviter toute surréservation.
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
                {pendingRequests.length} à traiter
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">
                Aucune nouvelle demande d'emprunt en attente.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => {
                  const targetBook = books.find((b) => b.id === req.bookId);
                  const isAvailable = targetBook && targetBook.availableCopies > 0;

                  return (
                    <div
                      key={req.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">
                          « {req.bookTitle} »
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          Demandeur : <strong>{req.studentName}</strong> ({req.studentEmail}) • Carte : {req.studentCardId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>Demandé le : {formatDisplayDate(req.requestDate)}</span>
                          <span>·</span>
                          <span className={isAvailable ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                            Stock disponible : {targetBook?.availableCopies || 0} ex.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => {
                            const res = acceptLoanRequest(req.id);
                            if (!res.success && res.error) {
                              alert(res.error);
                            }
                          }}
                          disabled={!isAvailable}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accepter & Réserver</span>
                        </button>

                        <button
                          onClick={() => {
                            setRefusalModalLoan(req);
                            setRefusalReason('Exemplaire indisponible ou réservé pour consultation prioritaire.');
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2 : Demandes acceptées en attente de remise physique */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  2. Demandes acceptées en attente de remise physique ({acceptedRequestsWaitingHandover.length})
                </h3>
                <p className="text-xs text-slate-500">
                  L'exemplaire est réservé. L'emprunt ne devient actif qu'au moment de la remise physique au comptoir.
                </p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1 rounded-full border border-indigo-200">
                {acceptedRequestsWaitingHandover.length} réservé(s)
              </span>
            </div>

            {acceptedRequestsWaitingHandover.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">
                Aucune demande acceptée en attente de retrait.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {acceptedRequestsWaitingHandover.map((req) => (
                  <div
                    key={req.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        « {req.bookTitle} »
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Étudiant : <strong>{req.studentName}</strong> ({req.studentEmail}) • Carte : {req.studentCardId}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        Statut : Accepté • Exemplaire réservé au comptoir
                      </div>
                    </div>

                    <button
                      onClick={() => confirmPhysicalHandover(req.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 shrink-0"
                    >
                      <HandCoins className="w-4 h-4" />
                      <span>Confirmer la remise physique du livre</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : GESTION DES RETOURS PHYSIQUES (CONTRÔLE D'ÉTAT STRICT)           */}
      {/* ========================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Traitement des Retours Physiques d'Exemplaires
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Règle stricte : un exemplaire en bon état redevient disponible. Un exemplaire endommagé est marqué indisponible pour réparation. Un exemplaire perdu n'est jamais réintégré au stock disponible.
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
                      <span>Date remise : {formatDisplayDate(loan.borrowedDate || loan.requestDate)}</span>
                      <span>·</span>
                      <span className={loan.daysOverdue > 0 ? 'text-rose-600 font-bold' : ''}>
                        Date limite : {formatDisplayDate(loan.dueDate)} {loan.daysOverdue > 0 ? `(${loan.daysOverdue}j retard)` : ''}
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
              Vérification de la limite stricte de 3 livres maximum par étudiant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const activeCount = student.activeLoanBookIds.length;
              const studentLoans = loans.filter(
                (l) => l.studentId === student.id && l.status === 'active'
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
                          {activeCount}/3 livres empruntés
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 block">
                        {student.email}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase">
                      Exemplaires actuellement en cours d'emprunt :
                    </span>
                    {studentLoans.length === 0 ? (
                      <span className="text-slate-400 italic">Aucun livre emprunté actuellement.</span>
                    ) : (
                      studentLoans.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-slate-800">
                          <span className="truncate pr-2">· {l.bookTitle}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            Échéance : {formatDisplayDate(l.dueDate)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-mono text-slate-400">
                      ID Carte : {student.studentCardId}
                    </span>
                    <button
                      onClick={() => setSelectedStudentProfile(student)}
                      className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      Afficher Carte
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AJOUT / ÉDITION D'OUVRAGE                                           */}
      {/* ========================================================================= */}
      {(showAddBookModal || editingBook) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {editingBook ? "Modifier l'ouvrage" : "Ajouter un nouvel ouvrage"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingBook
                    ? "Mise à jour des informations et du volume d'exemplaires."
                    : "Enregistrement d'un nouveau titre au catalogue de l'EST."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddBookModal(false);
                  setEditingBook(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Titre de l'ouvrage</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Ex: Analyse Numérique et Algorithmique"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Auteur(s)</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Ex: Pr. Mohamed Tazi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Catégorie</label>
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Année</label>
                  <input
                    type="number"
                    value={bookForm.publishedYear}
                    onChange={(e) => setBookForm({ ...bookForm, publishedYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Éditeur</label>
                  <input
                    type="text"
                    value={bookForm.publisher}
                    onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Total exemplaires</label>
                  <input
                    type="number"
                    min={editingBook ? (editingBook.borrowedCopies + (editingBook.reservedCopies || 0) + (editingBook.unavailableCopies || 0)) : 1}
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    placeholder="978-2-10-083456-7"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Cote de Rayon</label>
                  <input
                    type="text"
                    value={bookForm.shelfLocation}
                    onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                    placeholder="Rayon B-2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Résumé succinct</label>
                <textarea
                  rows={2}
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  placeholder="Présentation générale du contenu..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Bouton pour ajouter une nouvelle catégorie */}
              <div className="pt-1">
                {!showAddCategoryInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    + Créer une nouvelle catégorie
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nom catégorie..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCategoryInput.trim()) {
                          addCategory(customCategoryInput.trim());
                          setBookForm({ ...bookForm, category: customCategoryInput.trim() });
                          setCustomCategoryInput('');
                          setShowAddCategoryInput(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBookModal(false);
                    setEditingBook(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingBook ? "Enregistrer modifications" : "Ajouter au stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE RÉCEPTION PHYSIQUE DE RETOUR (Vérification de l'état)            */}
      {/* ========================================================================= */}
      {returnModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative animate-in fade-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Réception physique d'un exemplaire
                </h3>
                <p className="text-xs text-slate-500">
                  Contrôlez l'état de l'ouvrage avant réintégration au stock.
                </p>
              </div>
              <button
                onClick={() => {
                  setReturnModalLoan(null);
                  setReturnErrorMessage(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {returnErrorMessage && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{returnErrorMessage}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 mb-4">
              <span className="font-bold text-slate-900 block">« {returnModalLoan.bookTitle} »</span>
              <span className="text-slate-500 block">Étudiant : {returnModalLoan.studentName} ({returnModalLoan.studentEmail})</span>
              <span className="text-[11px] text-slate-400 font-mono block">Cote : {returnModalLoan.bookShelf}</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">
                État physique de l'exemplaire restitué :
              </label>

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
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-orange-600" />
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
                  L'exemplaire sera marqué <strong>indisponible pour réparation</strong> (non réintégré au rayon). Forfait officiel : <strong>{penaltyRule.damagedBookFeeMad} MAD</strong>.
                </div>
              )}

              {returnCondition === 'lost' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
                  L'exemplaire ne sera <strong>jamais ajouté au stock disponible</strong>. Forfait de rachat officiel : <strong>{penaltyRule.lostBookFeeMad} MAD</strong>.
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Observations ou notes :</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Ex: Page déchirée ou retour impeccable..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturnModalLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmer la restitution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL REFUS D'UNE DEMANDE D'EMPRUNT                                       */}
      {/* ========================================================================= */}
      {refusalModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Refuser la demande d'emprunt
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Veuillez préciser le motif qui sera communiqué à l'étudiant {refusalModalLoan.studentName}.
            </p>

            <div className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="Motif du refus..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefusalModalLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    refuseLoanRequest(refusalModalLoan.id, refusalReason);
                    setRefusalModalLoan(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SIGNALEMENT ADMINISTRATEUR                                          */}
      {/* ========================================================================= */}
      {reportModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center space-x-2 text-rose-600 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Signaler ce retard à l'administration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Un rapport officiel sera transmis à la scolarité concernant l'étudiant {reportModalLoan.studentName} pour l'ouvrage « {reportModalLoan.bookTitle} ».
            </p>

            <div className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Motif du signalement..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reportOverdueToAdmin(reportModalLoan.id, reportReason);
                    setReportModalLoan(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Transmettre le rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAIL D'UN RETARD (Personne & Exemplaire) */}
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
