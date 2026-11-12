import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { BookOpen, LogOut, School, Share2, Check, Copy, ExternalLink, QrCode, X } from 'lucide-react';
import { QRCodeView } from './QRCodeView';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useLibrary();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;

  const isManager = currentUser.role === 'manager';
  const shareUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & EST USMBA Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
                <School className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">biblioEST</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    EST — USMBA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  {isManager ? "Espace Gestionnaire de Bibliothèque" : "Espace Consultation Étudiant"}
                </p>
              </div>
            </div>

            {/* Navigation & User status */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Bouton Partager */}
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Partager l'application à un ami"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Partager</span>
              </button>

              {/* User Profile Pill */}
              <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-full text-xs">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 leading-tight">
                    {currentUser.email}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isManager
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isManager ? 'Gérant' : 'Étudiant'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Changer de session / Déconnexion"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL DE PARTAGE */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Partager l'application
                  </h3>
                  <p className="text-xs text-slate-500">
                    biblioEST • École Supérieure de Technologie (USMBA)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Envoyez ce lien à votre ami pour qu'il puisse tester l'application sur son téléphone ou son ordinateur :
              </p>

              {/* URL d'accès direct */}
              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs text-slate-800 font-mono flex-1 outline-none px-2 select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Code pour scanner directement avec un smartphone */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Scanner avec un smartphone :
                </span>
                <QRCodeView value={shareUrl} size={150} />
                <span className="text-[11px] text-slate-400 mt-2">
                  Votre ami peut simplement viser ce code avec son appareil photo
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
