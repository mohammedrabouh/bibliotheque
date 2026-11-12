import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { INITIAL_PRESET_USERS } from '../data/mockData';
import { User } from '../types';
import {
  School,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const MandatorySessionLogin: React.FC = () => {
  const { loginWithSession } = useLibrary();

  // Mode de connexion : 'google' (via compte Google / sessions détectées) ou 'credentials' (Email & mot de passe)
  const [authMethod, setAuthMethod] = useState<'google' | 'credentials'>('google');

  // État du flux Google (simulation de fenêtre de sélection de compte et redirection Google)
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<User | null>(null);
  const [isGoogleProcessing, setIsGoogleProcessing] = useState(false);

  // Formulaire manuel Login / Password
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation et connexion par Google
  const handleGoogleAccountClick = (user: User) => {
    setSelectedGoogleAccount(user);
    setIsGoogleProcessing(true);

    // Simulation du temps de validation d'authentification Google OAuth
    setTimeout(() => {
      setIsGoogleProcessing(false);
      loginWithSession(user);
    }, 900);
  };

  // Validation et connexion par Email & Mot de passe
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setFormError("Veuillez saisir votre adresse e-mail.");
      return;
    }

    if (!passwordInput.trim()) {
      setFormError("Veuillez saisir votre mot de passe.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Vérification si étudiant (@usmba.ac.ma)
      if (cleanEmail.endsWith('@usmba.ac.ma')) {
        const studentUser = INITIAL_PRESET_USERS.students.find(
          (s) => s.email.toLowerCase() === cleanEmail
        );

        if (studentUser) {
          loginWithSession(studentUser);
        } else {
          // Création dynamique d'un compte étudiant valide
          const derivedName = cleanEmail
            .split('@')[0]
            .split('.')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

          const customStudent: User = {
            id: `EST-${Date.now().toString().slice(-4)}`,
            name: derivedName || 'Étudiant EST',
            email: cleanEmail,
            role: 'student',
            studentCardId: `CARD-EST-${Date.now().toString().slice(-4)}`,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          };
          loginWithSession(customStudent);
        }
        setIsSubmitting(false);
        return;
      }

      // 2. Vérification si gérant (@gmail.com)
      if (cleanEmail.endsWith('@gmail.com')) {
        loginWithSession({
          ...INITIAL_PRESET_USERS.manager,
          email: cleanEmail,
        });
        setIsSubmitting(false);
        return;
      }

      // Erreur de domaine
      setFormError(
        "Adresse non reconnue : l'étudiant doit utiliser son e-mail académique (@usmba.ac.ma) et le gérant son adresse personnelle (@gmail.com)."
      );
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-150 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* USMBA & EST Header */}
        <div className="flex items-center space-x-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                biblioEST
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                EST — USMBA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              École Supérieure de Technologie • Université Sidi Mohamed Ben Abdellah
            </p>
          </div>
        </div>

        {/* Choix de la méthode d'authentification : Google OU Login/Password */}
        <div className="mb-6">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setAuthMethod('google');
                setFormError(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                authMethod === 'google'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {/* Google G Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Via Google</span>
            </button>

            <button
              onClick={() => {
                setAuthMethod('credentials');
                setFormError(null);
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                authMethod === 'credentials'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-slate-700" />
              <span>Login & Password</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MÉTHODE 1 : CONNEXION VIA GOOGLE (avec passerelle d'autorisation)      */}
        {/* ===================================================================== */}
        {authMethod === 'google' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-1">
                Authentification Google Workspace for Education
              </span>
              <span>
                Sélectionnez votre compte Google pour vous authentifier. Après validation auprès des serveurs Google, votre espace s'ouvrira automatiquement.
              </span>
            </div>

            {/* État de chargement / Redirection en cours */}
            {isGoogleProcessing && selectedGoogleAccount ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3 animate-in fade-in">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <span className="font-bold text-sm text-blue-900 block">
                    Authentification avec Google en cours...
                  </span>
                  <span className="text-xs font-mono text-blue-700">
                    {selectedGoogleAccount.email}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Vérification du compte et chargement de votre espace personnalisé...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Comptes Google détectés :
                </span>

                {/* Comptes étudiants USMBA */}
                {INITIAL_PRESET_USERS.students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleGoogleAccountClick(student)}
                    className="w-full text-left p-3 rounded-2xl bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 group-hover:ring-blue-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 truncate">
                            {student.name}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md">
                            Étudiant
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500 block truncate">
                          {student.email}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}

                {/* Compte gérant personnel */}
                <button
                  onClick={() => handleGoogleAccountClick(INITIAL_PRESET_USERS.manager)}
                  className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white hover:from-slate-850 hover:to-indigo-900 border border-slate-800 transition-all flex items-center justify-between group shadow-md cursor-pointer mt-1"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <img
                      src={INITIAL_PRESET_USERS.manager.avatar}
                      alt={INITIAL_PRESET_USERS.manager.name}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-white group-hover:text-blue-200 truncate">
                          {INITIAL_PRESET_USERS.manager.name}
                        </span>
                        <span className="text-[10px] bg-indigo-500/40 text-indigo-200 font-bold px-1.5 py-0.5 rounded-md">
                          Gérant
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-300 block truncate">
                        {INITIAL_PRESET_USERS.manager.email}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* MÉTHODE 2 : CONNEXION VIA LOGIN ET PASSWORD                          */}
        {/* ===================================================================== */}
        {authMethod === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Identifiant / Adresse E-mail :
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nom.prenom@usmba.ac.ma ou gérant@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 block">
                Étudiant : <strong className="text-blue-700">@usmba.ac.ma</strong> · Gérant : <strong className="text-slate-800">@gmail.com</strong>
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Mot de passe :
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Quick credentials fill shortcuts for testing */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Remplissage rapide (Test) :
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('yassine.benali@usmba.ac.ma');
                    setPasswordInput('etudiant2026');
                    setFormError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Étudiant USMBA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('rabohr417@gmail.com');
                    setPasswordInput('gerant2026');
                    setFormError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Gérant Gmail
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Vérification des identifiants...</span>
              ) : (
                <>
                  <span>Se connecter et ouvrir mon espace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>biblioEST • Authentification Sécurisée</span>
          <span>EST USMBA</span>
        </div>
      </div>
    </div>
  );
};
