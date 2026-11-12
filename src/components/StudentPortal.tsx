import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
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
  AlertTriangle,
  BookmarkCheck,
  Check,
  AlertCircle,
  Bell,
  Undo2,
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
    reserveBook,
    cancelReservation,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my-loans' | 'my-notifs'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [showStudentCardModal, setShowStudentCardModal] = useState(false);

  // Messages de retour d'action
  const [reservationFeedback, setReservationFeedback] = useState<{
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

  // Filtrage des emprunts et réservations personnels de l'étudiant connecté
  const myLoans = loans.filter((l) => l.studentId === currentUser?.id);
  const myActiveOrReservedCount = myLoans.filter(
    (l) => l.status === 'active' || l.status === 'reserved'
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

  const handleReserve = (bookId: string) => {
    setReservationFeedback(null);
    const res = reserveBook(bookId);
    if (res.success) {
      setReservationFeedback({
        type: 'success',
        message:
          "Réservation enregistrée avec succès ! Un exemplaire vous est immédiatement réservé au comptoir. Rendez-vous à la bibliothèque pour le récupérer.",
      });
      setTimeout(() => setReservationFeedback(null), 6000);
    } else {
      setReservationFeedback({
        type: 'error',
        message: res.error || "Impossible de réserver cet ouvrage.",
      });
      setTimeout(() => setReservationFeedback(null), 6000);
    }
  };

  const handleCancelReservation = (loanId: string) => {
    const res = cancelReservation(loanId);
    if (res.success) {
      setReservationFeedback({
        type: 'success',
        message: "Votre réservation a été annulée. L'exemplaire a été réintégré en rayon disponible.",
      });
      setTimeout(() => setReservationFeedback(null), 5000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-20">
      {/* Toast Feedback de réservation */}
      {reservationFeedback && (
        <div
          className={`p-4 rounded-2xl shadow-lg border flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top ${
            reservationFeedback.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {reservationFeedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-200 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{reservationFeedback.message}</span>
          </div>
          <button
            onClick={() => setReservationFeedback(null)}
            className="text-xs text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* En-tête Espace Étudiant */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Espace Étudiant
            </span>
            <span className="text-xs text-slate-400 font-mono">EST USMBA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Catalogue des Ouvrages & Mes Emprunts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les ouvrages en rayon, réservez directement un livre disponible et suivez vos retraits et restitutions.
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
          <span>Mes Emprunts & Réservations ({myLoans.length})</span>
          {myActiveOrReservedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {myActiveOrReservedCount}/3
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

      {/* Bannière explicative : réservation directe et retrait physique */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex items-start space-x-3 shadow-2xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Fonctionnement des réservations :</strong> Réservez directement tout ouvrage disponible en rayon d'un simple clic. L'exemplaire est réservé pour vous au comptoir. Présentez-vous ensuite à la bibliothèque avec votre carte d'étudiant pour la <strong>remise physique du livre</strong>. L'emprunt effectif démarre uniquement lorsque le gérant vous remet l'ouvrage. Limite maximale : <strong>3 ouvrages</strong> simultanés par étudiant.
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
              Cliquez sur un ouvrage pour le consulter et réserver
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
                const alreadyReserved = myLoans.some(
                  (l) =>
                    l.bookId === book.id &&
                    (l.status === 'reserved' || l.status === 'active')
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

                      {/* Disponibilité & badge */}
                      <div className="flex items-center space-x-3 shrink-0 ml-3">
                        {alreadyReserved ? (
                          <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Réservé / Emprunté par vous</span>
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
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Disponibilité</span>
                            <span className="font-bold text-slate-900">
                              {book.availableCopies} en rayon / {book.totalCopies} total
                            </span>
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
                          {/* Bouton de réservation directe */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleReserve(book.id)}
                              disabled={!isAvailable || alreadyReserved || myActiveOrReservedCount >= 3}
                              className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                                alreadyReserved
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200 cursor-not-allowed opacity-80'
                                  : !isAvailable
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : myActiveOrReservedCount >= 3
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>
                                {alreadyReserved
                                  ? "Déjà réservé par vous"
                                  : !isAvailable
                                  ? "Indisponible"
                                  : myActiveOrReservedCount >= 3
                                  ? "Quota de 3 atteint"
                                  : "Réserver"}
                              </span>
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedBookForDetail(book)}
                            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors group cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Voir la fiche complète</span>
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
      {/* ONGLET 2 : MES EMPRUNTS & RÉSERVATIONS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'my-loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Mes Emprunts & Réservations ({myLoans.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez vos ouvrages réservés à retirer au comptoir et vos emprunts en cours.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
              <span className="text-slate-500">Quota actif :</span>
              <strong className="text-slate-900 font-extrabold">{myActiveOrReservedCount} / 3 maximum</strong>
            </div>
          </div>

          {myLoans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
              <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Aucun emprunt ni réservation</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Vous n'avez pas de livre réservé ou emprunté. Parcourez le catalogue pour réserver un ouvrage disponible.
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
                      <span>Réservé le : {formatDisplayDate(loan.reservationDate || loan.requestDate || systemDate)}</span>
                      {loan.borrowedDate && (
                        <>
                          <span>·</span>
                          <span>Remis le : {formatDisplayDate(loan.borrowedDate || '')}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-bold text-slate-800">
                        Date limite : {formatDisplayDate(loan.dueDate)}
                      </span>
                    </div>

                    {loan.daysOverdue > 0 && loan.status === 'active' && (
                      <div className="mt-1.5 text-rose-700 font-bold flex items-center space-x-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>En retard de {loan.daysOverdue} jour(s) — Merci de restituer l'ouvrage à la bibliothèque.</span>
                      </div>
                    )}
                  </div>

                  {/* Statut & Action */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {loan.status === 'reserved' && (
                      <>
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Réservé • À retirer au comptoir</span>
                        </span>

                        <button
                          onClick={() => handleCancelReservation(loan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Annuler la réservation"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {loan.status === 'active' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Emprunt actif (Remis en main propre)</span>
                      </span>
                    )}

                    {loan.status === 'returned' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Restitué le {formatDisplayDate(loan.returnDate || systemDate)}</span>
                      </span>
                    )}

                    {loan.status === 'cancelled' && (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span>Annulé</span>
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
              Mes Notifications ({myNotifications.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des confirmations de réservation, remises d'ouvrages et rappels.
            </p>
          </div>

          <div className="space-y-2.5">
            {myNotifications.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-xs text-slate-400">
                Aucune notification pour votre compte.
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
                Présentez ce QR code au Gérant de bibliothèque pour retirer vos réservations ou restituer vos exemplaires.
              </p>
              <div className="mt-2 text-[11px] font-bold text-slate-500">
                Ouvrages actifs/réservés : {myActiveOrReservedCount} / 3 autorisés
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
