import React, { useState } from 'react';
import { Book } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { ArrowLeft, BookOpen, MapPin, CheckCircle, AlertCircle, Info, BookmarkCheck, Check } from 'lucide-react';
import { QRCodeView } from './QRCodeView';

interface BookDetailPageProps {
  book: Book;
  onBack: () => void;
}

export const BookDetailPage: React.FC<BookDetailPageProps> = ({ book, onBack }) => {
  const { reserveBook, currentUser, loans } = useLibrary();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAvailable = book.availableCopies > 0;
  const isStudent = currentUser?.role === 'student';

  const alreadyReserved = loans.some(
    (l) => l.studentId === currentUser?.id && l.bookId === book.id && (l.status === 'reserved' || l.status === 'active')
  );

  const myActiveCount = loans.filter(
    (l) => l.studentId === currentUser?.id && (l.status === 'reserved' || l.status === 'active')
  ).length;

  const handleReserve = () => {
    setFeedback(null);
    const res = reserveBook(book.id);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Exemplaire réservé avec succès ! Rendez-vous au comptoir de la bibliothèque avec votre carte étudiante pour le récupérer.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || "Impossible de réserver cet ouvrage.",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Bouton de retour */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs transition-colors mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Retour au catalogue</span>
      </button>

      {/* Message de notification d'action */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-2xl shadow-sm border flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bannière de réservation directe */}
      <div className="mb-8 bg-blue-50/80 border border-blue-200 p-4 rounded-2xl shadow-xs">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wide">
              Réservation directe d'un exemplaire
            </h4>
            <p className="text-sm text-blue-900 mt-0.5">
              Si l'ouvrage est disponible, vous pouvez le <strong>réserver directement</strong>. L'exemplaire vous sera immédiatement mis de côté au comptoir. Présentez-vous ensuite à la bibliothèque avec votre carte étudiante pour la remise physique du livre par le gérant.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PAGE DE GARDE DE L'OUVRAGE (Col 1-5) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm">
            <div className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Page de garde de l'ouvrage</span>
            </div>

            {/* Page de garde stylisée */}
            <div className={`relative aspect-[1/1.45] w-full rounded-2xl bg-gradient-to-br ${book.coverColor} text-white shadow-2xl p-6 sm:p-8 flex flex-col justify-between border-4 border-amber-200/30 overflow-hidden`}>
              <div className="absolute inset-3 border border-white/20 rounded-xl pointer-events-none" />
              <div className="absolute inset-4 border border-dashed border-white/10 rounded-lg pointer-events-none" />

              {/* En-tête éditeur */}
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-200 font-serif">
                  {book.publisher}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white/90">
                  {book.publishedYear}
                </span>
              </div>

              {/* Titre & Auteur sur la page de garde */}
              <div className="relative z-10 my-auto text-center py-4">
                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-50 drop-shadow-md leading-tight mb-3">
                  {book.title}
                </h1>
                <div className="w-12 h-0.5 bg-amber-400/80 mx-auto mb-3" />
                <p className="text-sm sm:text-base font-serif text-amber-100/90 italic tracking-wide">
                  {book.author}
                </p>
              </div>

              {/* Bas de page de garde */}
              <div className="relative z-10 flex items-end justify-between pt-4 border-t border-white/15 text-[11px] text-white/80">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-amber-200/70">Année d'édition</span>
                  <span className="font-mono">{book.publishedYear}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-amber-200/70">ISBN</span>
                  <span className="block font-mono text-[10px]">{book.isbn}</span>
                </div>
              </div>
            </div>

            {/* QR Code de l'exemplaire & Cote de rangement */}
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Emplacement en bibliothèque :</span>
                <span className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{book.shelfLocation}</span>
                </span>
              </div>
              <QRCodeView value={book.id} size={64} label={book.id} />
            </div>
          </div>
        </div>

        {/* DÉTAILS, SOMMAIRE & ACTION DE RÉSERVATION (Col 6-12) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Titre, Auteur & Disponibilité */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {book.title}
                </h2>
                <p className="text-base text-slate-600 mt-1">
                  Par <span className="font-semibold text-slate-800">{book.author}</span>
                </p>
              </div>

              {/* Badge de disponibilité */}
              <div className="text-right">
                {isAvailable ? (
                  <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Disponible ({book.availableCopies} sur {book.totalCopies})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Indisponible (0/{book.totalCopies} en rayon)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de réservation directe pour l'étudiant */}
            {isStudent && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">
                    {alreadyReserved
                      ? "Vous avez déjà une réservation ou un emprunt pour ce livre"
                      : isAvailable
                      ? "Exemplaire prêt à être mis de côté pour vous"
                      : "Aucun exemplaire libre actuellement"}
                  </span>
                </div>

                <button
                  onClick={handleReserve}
                  disabled={!isAvailable || alreadyReserved || myActiveCount >= 3}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>
                    {alreadyReserved
                      ? "Déjà réservé"
                      : !isAvailable
                      ? "Indisponible"
                      : myActiveCount >= 3
                      ? "Quota de 3 atteint"
                      : "Réserver cet ouvrage"}
                  </span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Éditeur</span>
                <span className="font-semibold text-slate-800">{book.publisher}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Année d'édition</span>
                <span className="font-semibold text-slate-800">{book.publishedYear}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Emplacement</span>
                <span className="font-semibold text-slate-800">{book.shelfLocation}</span>
              </div>
            </div>
          </div>

          {/* PETIT RÉSUMÉ */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Petit Résumé</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-serif">
              {book.summary}
            </p>
          </div>

          {/* PETIT SOMMAIRE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Petit Sommaire</span>
            </h3>
            <ul className="space-y-2">
              {book.tableOfContents.map((chapter, idx) => (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-slate-700 flex items-start space-x-3 py-1 border-b border-slate-100 last:border-0"
                >
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="leading-snug">{chapter}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
