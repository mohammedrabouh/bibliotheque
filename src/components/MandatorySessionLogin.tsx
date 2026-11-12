import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  School,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Info,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const MandatorySessionLogin: React.FC = () => {
  const { login, authMode } = useLibrary();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchitectureNotice, setShowArchitectureNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput;

    if (!cleanEmail) {
      setFormError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError("Format d'adresse e-mail invalide (ex: nom.prenom@usmba.ac.ma).");
      return;
    }

    if (!cleanPassword) {
      setFormError("Veuillez saisir votre mot de passe.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(cleanEmail, cleanPassword);
      if (!result.success) {
        setFormError(result.error || "Identifiants incorrects. Veuillez vérifier vos accès.");
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "Une erreur est survenue lors de la communication avec le serveur d'authentification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header USMBA & EST */}
        <div className="flex items-center space-x-3.5 mb-5 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                biblioEST
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                EST USMBA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bibliothèque Universitaire • École Supérieure de Technologie
            </p>
          </div>
        </div>

        {/* Titre & Statut de sécurité réel */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Connexion au portail
            </h2>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Contrôle serveur actif</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authentification institutionnelle avec protection anti-bruteforce (limite de 5 tentatives).
          </p>
        </div>

        {/* Message d'erreur */}
        {formError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        {/* Formulaire de connexion sécurisé */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Adresse e-mail autorisée
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setFormError(null);
                }}
                placeholder="prenom.nom@usmba.ac.ma ou email@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Étudiants : <strong className="text-blue-700 font-semibold">@usmba.ac.ma</strong></span>
              <span>Gérant : <strong className="text-slate-800 font-semibold">@gmail.com</strong></span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setFormError(null);
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Vérification sur le serveur en cours...</span>
              </div>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Se connecter et ouvrir mon espace</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Note informative d'architecture et de sécurité pour la soutenance */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowArchitectureNotice(!showArchitectureNotice)}
            className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center space-x-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Architecture de sécurité & Intégration</span>
            </span>
            <span className="text-[10px] text-blue-600 font-bold">
              {showArchitectureNotice ? "Masquer" : "Détails techniques"}
            </span>
          </button>

          {showArchitectureNotice && (
            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-2 animate-in fade-in">
              <p>
                <strong>Sécurité actuelle :</strong> Vérification d'authentification sur serveur Node.js/Express (`/api/auth/login`), tokens cryptographiques 256 bits, protection contre les attaques par force brute (verrouillage automatique après 5 tentatives).
              </p>
              <p className="text-slate-500">
                <strong>Pour la mise en production à grande échelle :</strong> Connecter une base relationnelle PostgreSQL / Supabase ou Firebase Auth avec hachage Argon2id/Bcrypt et configuration de cookies HttpOnly Secure signés.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Sécurité biblioEST vérifiée</span>
          </span>
          <span>EST USMBA</span>
        </div>
      </div>
    </div>
  );
};
