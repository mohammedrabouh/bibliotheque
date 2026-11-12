import React from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { ManagerDashboard } from './components/ManagerDashboard';
import { MandatorySessionLogin } from './components/MandatorySessionLogin';

const MainContent: React.FC = () => {
  const { currentUser } = useLibrary();

  // Connexion préalable obligatoire
  if (!currentUser) {
    return <MandatorySessionLogin />;
  }

  // Si l'utilisateur est un étudiant : affichage direct de l'espace étudiant (plus de vue globale générique)
  if (currentUser.role === 'student') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <StudentPortal />
        </main>
      </div>
    );
  }

  // Si l'utilisateur est un gérant : affichage direct de l'espace gérant
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <ManagerDashboard />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainContent />
    </LibraryProvider>
  );
}
