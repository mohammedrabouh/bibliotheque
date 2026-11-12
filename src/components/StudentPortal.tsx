import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types';
import {
  Search,
  BookOpen,
  CheckCircle,
  XCircle,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  School,
  QrCode,
  Info,
} from 'lucide-react';
import { BookDetailPage } from './BookDetailPage';
import { QRCodeView } from './QRCodeView';

export const StudentPortal: React.FC = () => {
  const { books, currentUser, selectedBookForDetail, setSelectedBookForDetail } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [showStudentCardModal, setShowStudentCardModal] = useState(false);

  // Si un livre est sélectionné pour affichage de la page dédiée
  if (selectedBookForDetail) {
    return (
      <BookDetailPage
        book={selectedBookForDetail}
        onBack={() => setSelectedBookForDetail(null)}
      />
    );
  }

  // Filtrage des ouvrages réels (titre, auteur, cote, ISBN)
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAvailability = filterOnlyAvailable ? book.availableCopies > 0 : true;

    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-16">
      {/* En-tête Espace Étudiant épuré (pas de filières ni noms de modules) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Espace Étudiant • EST USMBA
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Catalogue des Ouvrages de la Bibliothèque
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les livres disponibles, leur auteur, année d'édition, résumé et sommaire.
          </p>
        </div>

        {currentUser?.studentCardId && (
          <button
            onClick={() => setShowStudentCardModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Ma Carte Étudiant ({currentUser.studentCardId})</span>
          </button>
        )}
      </div>

      {/* Rappel des modalités d'emprunt (pas de réservation en ligne) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start space-x-3 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Modalités de retrait :</strong> Il n'y a pas de réservation en ligne. L'étudiant doit se présenter physiquement à la bibliothèque de l'école muni de sa carte d'étudiant pour récupérer son exemplaire.
        </div>
      </div>

      {/* Modal carte étudiant */}
      {showStudentCardModal && currentUser?.studentCardId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
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
                Présentez ce QR code au gérant de la bibliothèque pour emprunter ou rendre votre ouvrage.
              </p>
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

      {/* Barre de recherche et filtre de disponibilité */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un ouvrage par titre, auteur, cote ou ISBN..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
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

        <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 select-none shrink-0">
          <input
            type="checkbox"
            checked={filterOnlyAvailable}
            onChange={(e) => setFilterOnlyAvailable(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
          />
          <span>Disponibles en rayon uniquement</span>
        </label>
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
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
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
                        <span>Édition {book.publishedYear}</span>
                        <span>·</span>
                        <span>{book.publisher}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-500">{book.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disponibilité */}
                  <div className="flex items-center space-x-3 shrink-0 ml-3">
                    {isAvailable ? (
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Auteur(s)</span>
                        <span className="font-bold text-slate-900">{book.author}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Année d'édition</span>
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
                      <span className="text-[11px] text-amber-800 font-medium">
                        Rendez-vous à la bibliothèque de l'école pour récupérer cet exemplaire.
                      </span>

                      <button
                        onClick={() => setSelectedBookForDetail(book)}
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors group cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Plus de détails</span>
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
  );
};
