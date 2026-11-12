import React from 'react';
import { Loan, Book, Student } from '../types';
import { X, Clock, Mail, ShieldAlert, BookOpen, MapPin, User } from 'lucide-react';

interface OverdueDetailModalProps {
  loan: Loan;
  book?: Book;
  student?: Student;
  onClose: () => void;
}

export const OverdueDetailModal: React.FC<OverdueDetailModalProps> = ({
  loan,
  book,
  student,
  onClose,
}) => {
  const getSeverityBadge = () => {
    switch (loan.severity) {
      case 'yellow':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Jaune : Retard léger (1 à 3 jours)</span>
          </span>
        );
      case 'orange':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Orange : Retard moyen (4 à 7 jours)</span>
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Rouge : Retard élevé (+ de 7 jours)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">
              Détail du Retard de Restitution
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Degré de retard */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Niveau d'alerte :</span>
              <div className="mt-1">{getSeverityBadge()}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Dépassement :</span>
              <span className="text-base font-extrabold text-slate-900 flex items-center space-x-1 justify-end">
                <Clock className="w-4 h-4 text-rose-500 inline" />
                <span>{loan.daysOverdue} jour{loan.daysOverdue > 1 ? 's' : ''} de retard</span>
              </span>
            </div>
          </div>

          {/* DÉTAIL DE LA PERSONNE EN RETARD */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Personne en retard</span>
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start space-x-4">
              <img
                src={student?.avatar}
                alt={loan.studentName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-slate-900 text-base">{loan.studentName}</h5>
                <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{loan.studentEmail}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                    Carte : {loan.studentCardId}
                  </span>
                  {student?.activeLoanBookIds && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {student.activeLoanBookIds.length} prêt{student.activeLoanBookIds.length > 1 ? 's' : ''} en cours
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DÉTAIL DE L'EXEMPLAIRE EMPRUNTÉ */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Exemplaire emprunté</span>
            </h4>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-base">{loan.bookTitle}</h5>
                  <p className="text-xs text-slate-600">Auteur : {loan.bookAuthor}</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {loan.bookId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Emprunté le</span>
                  <span className="font-medium text-slate-800">{loan.borrowedDate}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Date limite prévue</span>
                  <span className="font-bold text-rose-600">{loan.dueDate}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Emplacement</span>
                  <span className="font-medium text-slate-800 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">{loan.bookShelf}</span>
                  </span>
                </div>
              </div>

              {book && (
                <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <span className="font-semibold block text-slate-700">ISBN : <span className="font-mono font-normal text-slate-500">{book.isbn}</span></span>
                  <p className="mt-1 text-slate-600 italic line-clamp-2">« {book.description} »</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
