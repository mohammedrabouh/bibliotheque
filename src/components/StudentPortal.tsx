import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Loan } from '../types';
import {
  Search,
  BookOpen,
  CheckCircle,
  XCircle,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  QrCode,
  Info,
  Clock,
  Calendar,
  AlertTriangle,
  BookmarkCheck,
  Check,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { BookDetailPage } from './BookDetailPage';
import { QRCodeView } from './QRCodeView';
import { formatDisplayDate } from '../utils/dateUtils';

export const StudentPortal: React.FC = () => {
  const {
    books,
    loans,
    notifications,
    currentUser,
    systemDate,
    selectedBookForDetail,
    setSelectedBookForDetail,
    requestBookLoan,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my-loans' | 'my-notifs'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [showStudentCardModal, setShowStudentCardModal] = useState(false);

  // Messages de retour d'action (demande d'emprunt)
  const [requestFeedback, setRequestFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Si un livre est sélectionné pour affichage de la page dédiée complète
  if (selectedBookForDetail) {
    return (
      <BookDetailPage
        book={selectedBookForDetail}
        onBack={() => setSelectedBookForDetail(null)}
      />
    );
  }

  // Filtrage des emprunts personnels de l'étudiant connecté (Strictement aucun accès aux autres)
  const myLoans = loans.filter((l) => l.studentId === currentUser?.id);
  const myActiveOrPendingCount = myLoans.filter(
    (l) => l.status === 'active' || l.status === 'accepted' || l.status === 'pending'
  ).length;

  const myNotifications = notifications.filter((n) => n.userId === currentUser?.id);

  // Filtrage du catalogue des ouvrages
  const availableCategories = Array.from(new Set(books.map((b) => b.category)));

  const filteredBooks = books
    .filter((b) => !b.isArchived)
    .filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAvailability = filterOnlyAvailable ? book.availableCopies > 0 : true;
      const matchesCategory =
        selectedCategory === 'all' || book.category === selectedCategory;

      return matchesSearch && matchesAvailability && matchesCategory;
    });

  const handleRequestLoan = (bookId: string) => {
    setRequestFeedback(null);
    const res = requestBookLoan(bookId);
    if (res.success) {
      setRequestFeedback({
        type: 'success',
        message:
          "Votre demande d'emprunt a été enregistrée avec succès ! Le Gérant de bibliothèque l'examinera dans les plus brefs délais.",
      });
      setTimeout(() => setRequestFeedback(null), 6000);
    } else {
      setRequestFeedback({
        type: 'error',
        message: res.error || "Impossible d'effectuer la demande d'emprunt.",
      });
      setTimeout(() => setRequestFeedback(null), 6000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-20">
      {/* Toast Feedback d'emprunt */}
      {requestFeedback && (
        <div
          className={`p-4 rounded-2xl shadow-lg border flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top ${
            requestFeedback.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {requestFeedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-200 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{requestFeedback.message}</span>
          </div>
          <button
            onClick={() => setRequestFeedback(null)}
            className="text-xs text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête Espace Étudiant épuré (pas de filières ni noms de modules) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Espace Consultation Étudiant
            </span>
            <span className="text-xs text-slate-400 font-mono">EST USMBA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Catalogue des Ouvrages & Mes Emprunts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les livres disponibles, demandez un emprunt et suivez vos échéances de restitution.
          </p>
        </div>

        {/* Bouton Carte Étudiant */}
        {currentUser?.studentCardId && (
          <button
            onClick={() => setShowStudentCardModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Ma Carte Étudiant ({currentUser.studentCardId})</span>
          </button>
        )}
      </div>

      {/* Navigation par onglets Étudiant */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catalogue des Ouvrages ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-loans')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'my-loans'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Mes Emprunts & Demandes ({myLoans.length})</span>
          {myActiveOrPendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {myActiveOrPendingCount}/3
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-notifs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'my-notifs'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Mes Notifications ({myNotifications.length})</span>
        </button>
      </div>

      {/* Rappel des modalités : pas de réservation en ligne, retrait physique au comptoir */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex items-start space-x-3 shadow-2xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Modalités d'emprunt à l'EST USMBA :</strong> Après acceptation de votre demande, présentez-vous à la bibliothèque muni de votre carte d'étudiant pour la remise physique du livre par le Gérant de bibliothèque. Chaque étudiant peut emprunter un maximum de <strong>3 exemplaires</strong> simultanément.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : CATALOGUE DES LIVRES                                           */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, auteur, cote, ISBN ou catégorie..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5"
              >
                <option value="all">Toutes les catégories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={filterOnlyAvailable}
                  onChange={(e) => setFilterOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                />
                <span className="hidden sm:inline">Disponibles uniquement</span>
                <span className="sm:hidden">Disponibles</span>
              </label>
            </div>
          </div>

          {/* Compteur de résultats */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700">
              {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? 's' : ''} au catalogue
            </span>
            <span className="italic">
              Cliquez sur une barre pour l'expandre
            </span>
          </div>

          {/* Liste des ouvrages en barres compactes */}
          <div className="space-y-3">
            {filteredBooks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Aucun ouvrage trouvé</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Aucun résultat ne correspond à votre recherche "{searchQuery}". Essayez un autre mot-clé.
                </p>
              </div>
            ) : (
              filteredBooks.map((book) => {
                const isExpanded = expandedBookId === book.id;
                const isAvailable = book.availableCopies > 0;
                const alreadyRequested = myLoans.some(
                  (l) =>
                    l.bookId === book.id &&
                    (l.status === 'pending' || l.status === 'accepted' || l.status === 'active')
                );

                return (
                  <div
                    key={book.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* BARRE COMPACTE */}
                    <div
                      onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                      className="p-4 sm:px-5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-slate-50/70"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className={`w-2.5 h-10 rounded-full bg-gradient-to-b ${book.coverColor} shrink-0`} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2">
                            <span className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                              {book.title}
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                              de {book.author}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {book.category}
                            </span>
                            <span>·</span>
                            <span>Édition {book.publishedYear}</span>
                            <span>·</span>
                            <span>{book.publisher}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-500">{book.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Disponibilité & indicateur de demande en cours */}
                      <div className="flex items-center space-x-3 shrink-0 ml-3">
                        {alreadyRequested ? (
                          <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">En cours chez vous</span>
                          </span>
                        ) : isAvailable ? (
                          <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Disponible</span>
                            <span>({book.availableCopies}/{book.totalCopies})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Indisponible</span>
                          </span>
                        )}

                        <div className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CONTENU EXPANSÉ */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/80 text-xs text-slate-600 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Auteur(s)</span>
                            <span className="font-bold text-slate-900">{book.author}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Catégorie</span>
                            <span className="font-bold text-slate-900">{book.category}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Année & Éditeur</span>
                            <span className="font-bold text-slate-900">{book.publishedYear} ({book.publisher})</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Cote de rayon</span>
                            <span className="font-bold text-slate-900 flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{book.shelfLocation}</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 italic line-clamp-2">
                          « {book.description} »
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                          {/* Bouton Demander l'emprunt */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRequestLoan(book.id)}
                              disabled={!isAvailable || alreadyRequested || myActiveOrPendingCount >= 3}
                              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>
                                {alreadyRequested
                                  ? "Demande déjà enregistrée"
                                  : !isAvailable
                                  ? "Aucun exemplaire dispo"
                                  : myActiveOrPendingCount >= 3
                                  ? "Limite de 3 atteinte"
                                  : "Demander l'emprunt"}
                              </span>
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedBookForDetail(book)}
                            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors group cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Plus de détails (Sommaire & Résumé)</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : MES EMPRUNTS & DEMANDES (Visibilité uniquement personnelle)     */}
      {/* ========================================================================= */}
      {activeTab === 'my-loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Mes Emprunts & Demandes en cours ({myLoans.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez en direct la validation de vos demandes et la date de retour prévue.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
              <span className="text-slate-500">Quota d'emprunts :</span>
              <strong className="text-slate-900 font-extrabold">{myActiveOrPendingCount} / 3 maximum</strong>
            </div>
          </div>

          {myLoans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
              <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Aucun emprunt enregistré</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Vous n'avez pas d'emprunt ni de demande en cours. Consultez le catalogue pour sélectionner un ouvrage.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        « {loan.bookTitle} »
                      </span>
                      <span className="text-slate-500">de {loan.bookAuthor}</span>
                    </div>

                    <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 text-[11px]">
                      <span>Cote : <strong>{loan.bookShelf}</strong></span>
                      <span>·</span>
                      <span>Date demande : {formatDisplayDate(loan.requestDate || systemDate)}</span>
                      {loan.borrowedDate && (
                        <>
                          <span>·</span>
                          <span>Remis le : {formatDisplayDate(loan.borrowedDate)}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-bold text-slate-800">
                        Date limite : {formatDisplayDate(loan.dueDate)}
                      </span>
                    </div>

                    {loan.daysOverdue > 0 && loan.status === 'active' && (
                      <div className="mt-1 text-rose-700 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>En retard de {loan.daysOverdue} jour(s) — Pénalité applicable : {loan.daysOverdue * 5} MAD</span>
                      </div>
                    )}
                  </div>

                  {/* Badge de statut */}
                  <div className="shrink-0 self-end sm:self-center">
                    {loan.status === 'pending' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Demande en attente de validation</span>
                      </span>
                    )}

                    {loan.status === 'accepted' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>Accepté • Présentez-vous à la bibliothèque</span>
                      </span>
                    )}

                    {loan.status === 'active' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Emprunt actif en votre possession</span>
                      </span>
                    )}

                    {loan.status === 'returned' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Restitué le {formatDisplayDate(loan.returnDate || systemDate)}</span>
                      </span>
                    )}

                    {loan.status === 'refused' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refusé {loan.reportReason ? `(${loan.reportReason})` : ''}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : MES NOTIFICATIONS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'my-notifs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Mes Notifications Personnelles ({myNotifications.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des alertes sur vos demandes, acceptations et rappels d'échéance.
            </p>
          </div>

          <div className="space-y-2.5">
            {myNotifications.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-xs text-slate-400">
                Aucune notification enregistrée pour votre compte.
              </div>
            ) : (
              myNotifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.createdAt}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL QR CODE DE CARTE ÉTUDIANT */}
      {showStudentCardModal && currentUser?.studentCardId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{currentUser.name}</h4>
                  <span className="text-xs text-slate-500 font-mono block">{currentUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setShowStudentCardModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center">
              <QRCodeView value={currentUser.studentCardId} size={150} label={currentUser.studentCardId} />
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Présentez ce QR code au Gérant de bibliothèque pour emprunter ou restituer vos exemplaires.
              </p>
              <div className="mt-2 text-[11px] font-bold text-slate-500">
                Emprunts actifs : {myActiveOrPendingCount} / 3 autorisés
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowStudentCardModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
