import React, { useState } from 'react';
import { useLibrary, TODAY_DATE } from '../context/LibraryContext';
import {
  Clock,
  Mail,
  QrCode,
  LayoutDashboard,
  Eye,
  CheckCircle2,
  Package,
  CalendarCheck,
  AlertOctagon,
  Users,
  Send,
  Zap,
} from 'lucide-react';
import { BorrowReturnStation } from './BorrowReturnStation';
import { OverdueDetailModal } from './OverdueDetailModal';
import { OverdueSeverity } from '../types';

export const ManagerDashboard: React.FC = () => {
  const {
    books,
    students,
    loans,
    overdueLoans,
    loansDueToday,
    totalBooksBrought,
    selectedOverdueLoan,
    setSelectedOverdueLoan,
    selectedStudentProfile,
    setSelectedStudentProfile,
    emailLogs,
    automaticEmailNotification,
    dismissAutoEmailNotification,
  } = useLibrary();

  const [activeManagerTab, setActiveManagerTab] = useState<'dashboard' | 'scanner' | 'students'>('dashboard');
  const [severityFilter, setSeverityFilter] = useState<'all' | OverdueSeverity>('all');

  // Statistiques des 3 degrés de retard :
  // Jaune : retard léger (1 à 3 jours)
  // Orange : retard moyen (4 à 7 jours)
  // Rouge : retard élevé (plus de 7 jours)
  const yellowLoans = overdueLoans.filter((l) => l.severity === 'yellow');
  const orangeLoans = overdueLoans.filter((l) => l.severity === 'orange');
  const redLoans = overdueLoans.filter((l) => l.severity === 'red');

  const totalOverdueCount = overdueLoans.length;

  const filteredOverdueLoans = overdueLoans.filter((loan) => {
    if (severityFilter === 'all') return true;
    return loan.severity === severityFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-16">
      {/* Toast d'envoi automatique de mail sans clic */}
      {automaticEmailNotification && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-xl border border-blue-400/30 flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                Envoi de mail automatique sans clic effectué
              </h4>
              <p className="text-xs text-blue-200 mt-0.5">
                {automaticEmailNotification}
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

      {/* En-tête Gérant & Sélecteur d'onglets de gestion */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
            Espace Gérant de Bibliothèque
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Tableau de Bord & Suivi des Retours
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des livres apportés, des échéances du jour et des retards avec codes couleurs.
          </p>
        </div>

        {/* Tab switch : Dashboard, Poste de Scan, Profils Étudiants */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 flex-wrap gap-1">
          <button
            onClick={() => setActiveManagerTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeManagerTab === 'dashboard'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Retards</span>
          </button>

          <button
            onClick={() => setActiveManagerTab('scanner')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeManagerTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Poste de Scan (Emprunt/Retour)</span>
          </button>

          <button
            onClick={() => setActiveManagerTab('students')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeManagerTab === 'students'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Profils Étudiants ({students.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : DASHBOARD STATISTIQUES                                         */}
      {/* - Combien de livres sont apportés                                         */}
      {/* - Les livres qui doivent retourner aujourd'hui                           */}
      {/* - Voir qui n'ont pas remis les livres (retards avec couleurs)             */}
      {/* - Envoi automatique de mail sans clic                                     */}
      {/* ========================================================================= */}
      {activeManagerTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STATS PRINCIPALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Combien de livres sont apportés */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  Livres apportés (Total)
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {totalBooksBrought}
                </span>
                <span className="text-[11px] text-slate-500">
                  {books.length} titres réels
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Livres qui doivent retourner aujourd'hui */}
            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-900 font-bold uppercase tracking-wider block">
                  À retourner aujourd'hui
                </span>
                <span className="text-3xl font-black text-blue-700 mt-1 block">
                  {loansDueToday.length}
                </span>
                <span className="text-[11px] text-blue-800">
                  Échéance : {TODAY_DATE}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Retards globaux (qui n'ont pas remis les livres) */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-900 font-bold uppercase tracking-wider block">
                  Non remis dans les délais
                </span>
                <span className="text-3xl font-black text-rose-600 mt-1 block">
                  {totalOverdueCount}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">
                  Retards actifs
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Disponibles en rayon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  Disponibles en rayon
                </span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">
                  {books.reduce((acc, b) => acc + b.availableCopies, 0)}
                </span>
                <span className="text-[11px] text-slate-500">
                  En stock prêt pour prêt
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* SECTION : LIVRES QUI DOIVENT RETOURNER AUJOURD'HUI */}
          {loansDueToday.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Exemplaires dont l'échéance de retour est AUJOURD'HUI ({loansDueToday.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  Date : {TODAY_DATE}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {loansDueToday.map((loan) => (
                  <div key={loan.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">« {loan.bookTitle} »</span>
                      <span className="text-slate-500 ml-2">par {loan.bookAuthor}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600">
                      <span>Emprunteur : <strong>{loan.studentName}</strong> ({loan.studentEmail})</span>
                      <button
                        onClick={() => setSelectedOverdueLoan(loan)}
                        className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        Voir fiche
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3 DEGRÉS DE RETARD AFFICHÉS AVEC DES COULEURS (Jaune, Orange, Rouge) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Jaune : Retard léger (1 à 3 jours) */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'yellow' ? 'all' : 'yellow')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                severityFilter === 'yellow'
                  ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                  : 'bg-amber-50/70 border-amber-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Retard léger (Jaune)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-amber-950 mt-1 block">
                    {yellowLoans.length}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium">
                    1 à 3 jours de retard
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                  JAUNE
                </div>
              </div>
            </div>

            {/* Orange : Retard moyen (4 à 7 jours) */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'orange' ? 'all' : 'orange')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                severityFilter === 'orange'
                  ? 'bg-orange-100/70 border-orange-500 ring-2 ring-orange-400/40 shadow-md'
                  : 'bg-orange-50/70 border-orange-200 hover:border-orange-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                      Retard moyen (Orange)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-orange-950 mt-1 block">
                    {orangeLoans.length}
                  </span>
                  <span className="text-[11px] text-orange-800 font-medium">
                    4 à 7 jours de retard
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-200 text-orange-900 flex items-center justify-center font-bold text-xs">
                  ORANGE
                </div>
              </div>
            </div>

            {/* Rouge : Retard élevé (+ de 7 jours) */}
            <div
              onClick={() => setSeverityFilter(severityFilter === 'red' ? 'all' : 'red')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                severityFilter === 'red'
                  ? 'bg-rose-100/70 border-rose-500 ring-2 ring-rose-400/40 shadow-md'
                  : 'bg-rose-50/70 border-rose-200 hover:border-rose-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Retard élevé (Rouge)
                    </span>
                  </div>
                  <span className="text-3xl font-black text-rose-950 mt-1 block">
                    {redLoans.length}
                  </span>
                  <span className="text-[11px] text-rose-800 font-medium">
                    + de 7 jours de retard
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-xs">
                  ROUGE
                </div>
              </div>
            </div>
          </div>

          {/* BANDEAU ENVOI AUTOMATIQUE DES MAILS SANS CLIC */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>Service d'envoi automatique de mails actif</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Relance automatique des retards sans aucun clic
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Le système biblioEST détecte les retards et expédie automatiquement les courriels de relance aux étudiants dès l'ouverture de l'espace gérant.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700 py-2 px-3.5 rounded-xl shrink-0">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>{emailLogs.length} vague{emailLogs.length > 1 ? 's' : ''} automatique{emailLogs.length > 1 ? 's' : ''} expédiée{emailLogs.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* LISTE DÉTAILLÉE DES ÉTUDIANTS QUI N'ONT PAS REMIS LES LIVRES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Étudiants en retard de remise d'exemplaires ({filteredOverdueLoans.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Cliquez sur un étudiant pour ouvrir le détail complet de sa fiche et du livre emprunté.
                </p>
              </div>

              {/* Filtres par sévérité */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                <button
                  onClick={() => setSeverityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    severityFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous ({totalOverdueCount})
                </button>
                <button
                  onClick={() => setSeverityFilter('yellow')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    severityFilter === 'yellow'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Jaune ({yellowLoans.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('orange')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    severityFilter === 'orange'
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                  }`}
                >
                  Orange ({orangeLoans.length})
                </button>
                <button
                  onClick={() => setSeverityFilter('red')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    severityFilter === 'red'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Rouge ({redLoans.length})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredOverdueLoans.map((loan) => {
                const student = students.find((s) => s.id === loan.studentId);
                const book = books.find((b) => b.id === loan.bookId);

                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedOverdueLoan(loan)}
                    className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <img
                        src={student?.avatar}
                        alt={loan.studentName}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {loan.studentName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {loan.studentEmail}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span className="font-bold text-slate-800">
                            « {loan.bookTitle} »
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{loan.bookAuthor}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400 font-mono">Carte : {loan.studentCardId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      {loan.severity === 'yellow' && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Jaune : {loan.daysOverdue}j retard</span>
                        </span>
                      )}
                      {loan.severity === 'orange' && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          <span>Orange : {loan.daysOverdue}j retard</span>
                        </span>
                      )}
                      {loan.severity === 'red' && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                          <span>Rouge : {loan.daysOverdue}j retard</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOverdueLoan(loan);
                        }}
                        className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Détail</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : POSTE DE SCAN D'EMPRUNT ET RETOUR AUTOMATIQUE                  */}
      {/* ========================================================================= */}
      {activeManagerTab === 'scanner' && (
        <BorrowReturnStation />
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : PROFIL DES ÉTUDIANTS                                           */}
      {/* ========================================================================= */}
      {activeManagerTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Profils des Étudiants Inscrits
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi des coordonnées, cartes d'étudiant et exemplaires actuellement empruntés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const activeCount = student.activeLoanBookIds.length;
              const studentLoans = loans.filter((l) => l.studentId === student.id && l.status === 'active');

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-4"
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

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase">
                      Exemplaires actuellement en cours d'emprunt :
                    </span>
                    {studentLoans.length === 0 ? (
                      <span className="text-slate-400 italic">Aucun livre emprunté pour le moment.</span>
                    ) : (
                      studentLoans.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-slate-800">
                          <span className="truncate pr-2">· {l.bookTitle}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            Échéance : {l.dueDate}
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

      {/* MODAL QR CODE DE CARTE ÉTUDIANT */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedStudentProfile.avatar}
                  alt={selectedStudentProfile.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{selectedStudentProfile.name}</h4>
                  <span className="text-xs text-slate-500 font-mono block">{selectedStudentProfile.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-800 block mb-2">
                  Code Carte : {selectedStudentProfile.studentCardId}
                </span>
                <div className="text-xs text-slate-500">
                  Prêts actifs : {selectedStudentProfile.activeLoanBookIds.length} / 3 maximum
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
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
