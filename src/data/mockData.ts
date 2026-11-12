import { Book, Student, Loan, User, Notification, PenaltyRule } from '../types';

// Règles institutionnelles de pénalités définies par l'administration (non modifiables par le Gérant)
export const INSTITUTIONAL_PENALTY_RULES: PenaltyRule = {
  id: 'REGLE-USMBA-2026',
  name: "Règlement Intérieur de la Bibliothèque Universitaire EST-USMBA",
  feePerDayMad: 5, // 5 MAD par jour de retard constaté au-delà du délai
  gracePeriodDays: 0,
  damagedBookFeeMad: 50, // Forfait réparation / reliure
  lostBookFeeMad: 150, // Rachat et frais de traitement
  definedBy: "Direction des Affaires Académiques & Administration Centrale",
  effectiveDate: "2026-09-01",
};

export interface TestAccountCredential {
  email: string;
  passwordHash: string; // Hash SHA-256
  user: User;
}

// Les comptes de test sont conservés EN INTERNE uniquement (non exposés dans l'interface)
// Hash SHA-256 de "etudiant2026" : "90ca74bf74534cf5e2972ebffbc5e18237cb420b9e89d81997327ad748c03525"
// Hash SHA-256 de "gerant2026"   : "c6a287dd47596c56b7df08960fa7933979eafe586e969a531cfb36ecb0d62d26"
export const INTERNAL_TEST_CREDENTIALS: TestAccountCredential[] = [
  {
    email: 'yassine.benali@usmba.ac.ma',
    passwordHash: '90ca74bf74534cf5e2972ebffbc5e18237cb420b9e89d81997327ad748c03525', // 'etudiant2026'
    user: {
      id: 'EST-2024-012',
      name: 'Yassine Benali',
      email: 'yassine.benali@usmba.ac.ma',
      role: 'student',
      studentCardId: 'CARD-EST-2024-012',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    email: 'salma.elamrani@usmba.ac.ma',
    passwordHash: '90ca74bf74534cf5e2972ebffbc5e18237cb420b9e89d81997327ad748c03525', // 'etudiant2026'
    user: {
      id: 'EST-2024-045',
      name: 'Salma El Amrani',
      email: 'salma.elamrani@usmba.ac.ma',
      role: 'student',
      studentCardId: 'CARD-EST-2024-045',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    email: 'mehdi.chraibi@usmba.ac.ma',
    passwordHash: '90ca74bf74534cf5e2972ebffbc5e18237cb420b9e89d81997327ad748c03525', // 'etudiant2026'
    user: {
      id: 'EST-2024-089',
      name: 'Mehdi Chraibi',
      email: 'mehdi.chraibi@usmba.ac.ma',
      role: 'student',
      studentCardId: 'CARD-EST-2024-089',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    email: 'alexandre.fontaine@usmba.ac.ma',
    passwordHash: '90ca74bf74534cf5e2972ebffbc5e18237cb420b9e89d81997327ad748c03525', // 'etudiant2026'
    user: {
      id: 'EST-2024-110',
      name: 'Alexandre Fontaine',
      email: 'alexandre.fontaine@usmba.ac.ma',
      role: 'student',
      studentCardId: 'CARD-EST-2024-110',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    email: 'rabohr417@gmail.com',
    passwordHash: 'c6a287dd47596c56b7df08960fa7933979eafe586e969a531cfb36ecb0d62d26', // 'gerant2026'
    user: {
      id: 'MGR-EST-01',
      name: 'Karim Tazi',
      email: 'rabohr417@gmail.com',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  },
];

export const INITIAL_CATEGORIES = [
  'Littérature classique',
  'Romans & Fiction',
  'Sciences & Informatique',
  'Histoire & Essais',
  'Philosophie & Pensée',
  'Économie & Gestion',
];

// Vrais ouvrages réels de référence
export const INITIAL_BOOKS: Book[] = [
  {
    id: 'EST-LIV-101',
    isbn: '978-2070360024',
    title: "L'Étranger",
    author: 'Albert Camus',
    category: 'Littérature classique',
    publishedYear: 1942,
    publisher: 'Éditions Gallimard (Collection Folio)',
    shelfLocation: 'Rayon L-04',
    totalCopies: 4,
    availableCopies: 2,
    borrowedCopies: 2,
    coverColor: 'from-amber-700 via-amber-900 to-stone-950',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    description: "Chef-d'œuvre de la littérature mondiale récompensé par le Prix Nobel.",
    summary: "Dans l'Algérie des années 1930, Meursault reçoit un télégramme lui annonçant la mort de sa mère à l'hospice de Marengo. Sans verser de larmes et sans manifester l'affliction attendue par la société, il retourne à sa vie quotidienne. Quelques jours plus tard, entraîné dans un différend sur une plage baignée d'un soleil accablant, il tire sur un homme. Lors de son procès, la justice s'intéresse moins à l'homicide qu'à sa froideur émotionnelle et à son incapacité de feindre.",
    tableOfContents: [
      "Première Partie — Chapitre 1 : L'enterrement à l'hospice de Marengo",
      "Première Partie — Chapitre 2 : La baignade avec Marie et la comédie dominicale",
      "Première Partie — Chapitre 3 : La rencontre avec Raymond Sintès",
      "Première Partie — Chapitre 4 : Le week-end à la mer",
      "Première Partie — Chapitre 5 : La proposition de promotion et l'engagement",
      "Première Partie — Chapitre 6 : Le soleil sur la plage et les cinq coups de revolver",
      "Deuxième Partie — Chapitre 1 : L'instruction judiciaire et le juge au crucifix",
      "Deuxième Partie — Chapitre 2 : L'emprisonnement et les souvenirs",
      "Deuxième Partie — Chapitre 3 : Les plaidoiries devant la cour d'assises",
      "Deuxième Partie — Chapitre 4 : La sentence et la condamnation à mort",
      "Deuxième Partie — Chapitre 5 : L'aumônier et la tendre indifférence du monde",
    ],
    isArchived: false,
  },
  {
    id: 'EST-LIV-102',
    isbn: '978-2070368228',
    title: '1984',
    author: 'George Orwell',
    category: 'Romans & Fiction',
    publishedYear: 1949,
    publisher: 'Gallimard (Du monde entier)',
    shelfLocation: 'Rayon R-02',
    totalCopies: 3,
    availableCopies: 1,
    borrowedCopies: 2,
    coverColor: 'from-rose-950 via-zinc-900 to-black',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
    description: "Le roman d'anticipation dystopique le plus influent du XXe siècle.",
    summary: "À Londres, chef-lieu de la province d'Océania, la population vit sous la surveillance impitoyable de Big Brother et du Parti Unique. Winston Smith, employé modèle au Ministère de la Vérité, passe ses journées à réécrire l'histoire passée pour la rendre conforme à la propagande du pouvoir. Conscient de l'horreur de cette société totalitaire régie par le Novlangue et la Police de la Pensée, il commence secrètement à tenir un journal intime prohibé.",
    tableOfContents: [
      "Partie I — Le télécran, la Minute de la Haine et le carnet clandestin",
      "Partie I — Le Ministère de la Vérité et la manipulation des archives",
      "Partie I — La vie des Proles et l'espoir d'une révolte",
      "Partie II — La clairière secrète et la rencontre amoureuse avec Julia",
      "Partie II — La chambre au-dessus du magasin de brocante de M. Charrington",
      "Partie II — Le manifeste interdit d'Emmanuel Goldstein",
      "Partie III — L'arrestation et le Ministère de l'Amour",
      "Partie III — L'interrogatoire d'O'Brien et la métamorphose psychologique",
      "Partie III — La salle 101, la défaite finale et la victoire de Big Brother",
      "Annexe — Les principes linguistiques fondamentaux du Novlangue",
    ],
    isArchived: false,
  },
  {
    id: 'EST-LIV-103',
    isbn: '978-2253006329',
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    category: 'Philosophie & Pensée',
    publishedYear: 1943,
    publisher: 'Le Livre de Poche',
    shelfLocation: 'Rayon C-01',
    totalCopies: 3,
    availableCopies: 0,
    borrowedCopies: 3,
    coverColor: 'from-blue-900 via-sky-950 to-indigo-950',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    description: "Conte poétique et universel traduit dans plus de 500 langues.",
    summary: "Un aviateur contraint d'atterrir d'urgence dans l'immensité du désert du Sahara fait la rencontre extraordinaire d'un petit garçon venu d'une minuscule planète, l'astéroïde B 612. Au fil des confidences, le voyageur découvre les pérégrinations du Petit Prince de planète en planète, son amour pour une rose vaniteuse, et la sagesse inoubliable que lui enseigne le renard apprivoisé : l'essentiel est invisible pour les yeux.",
    tableOfContents: [
      "Chapitre 1 : Le serpent boa digérant un éléphant et les grandes personnes",
      "Chapitre 2 : La panne dans le Sahara : « S'il vous plaît... dessine-moi un mouton ! »",
      "Chapitre 3 : L'astéroïde B 612 et le mystère de l'arrivée",
      "Chapitre 4 : La découverte de l'astronome turc et les chiffres des adultes",
      "Chapitre 5 : Le drame des graines de baobabs géants",
      "Chapitre 6 : Les couchers de soleil quand on a de la peine",
      "Chapitre 7 : Les épines de la fleur et les larmes",
      "Chapitre 8 : L'éclosion de la rose orgueilleuse",
      "Chapitres 9 à 15 : Le périple cosmique : le roi sans sujets, le vaniteux, le buveur, l'homme d'affaires, l'allumeur de réverbères et le géographe",
      "Chapitre 21 : L'apprivoisement du renard et le secret du cœur",
      "Chapitre 26 : Le puits, le poison du serpent et le retour vers les étoiles",
    ],
    isArchived: false,
  },
  {
    id: 'EST-LIV-104',
    isbn: '978-2253004226',
    title: 'Madame Bovary',
    author: 'Gustave Flaubert',
    category: 'Littérature classique',
    publishedYear: 1857,
    publisher: 'Le Livre de Poche Classiques',
    shelfLocation: 'Rayon L-02',
    totalCopies: 2,
    availableCopies: 1,
    borrowedCopies: 1,
    coverColor: 'from-purple-900 via-slate-900 to-indigo-950',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80',
    description: "Le chef-d'œuvre du réalisme psychologique sur les désillusions provinciales.",
    summary: "Emma Rouault, fille de paysan élevée au couvent au milieu des lectures romantiques exaltées, épouse Charles Bovary, un officier de santé doux mais dépourvu d'ambition. Très vite déçue par la monotonie de sa vie conjugale à Tostes puis à Yonville-l'Abbaye, Emma aspire à une existence passionnée et fastueuse. Pour tromper son ennui, elle se jette dans des amours coupables avec Rodolphe puis Léon, et s'endette sans compter auprès du marchand Lheureux.",
    tableOfContents: [
      "Première Partie — Chapitre 1 : La jeunesse et les débuts professionnels de Charles Bovary",
      "Première Partie — Chapitre 2 : La rencontre à la ferme des Bertaux et le mariage",
      "Première Partie — Chapitre 6 : L'éducation romanesque d'Emma au couvent",
      "Première Partie — Chapitre 8 : Le bal étincelant au château de la Vaubyessard",
      "Deuxième Partie — Chapitre 1 : L'installation à Yonville-l'Abbaye et M. Homais",
      "Deuxième Partie — Chapitre 2 : La complicité naissante avec le clerc Léon Dupuis",
      "Deuxième Partie — Chapitre 7 : La rencontre de Rodolphe Boulanger aux Comices agricoles",
      "Deuxième Partie — Chapitre 9 : La passion galopante en forêt et la dérive sentimentale",
      "Deuxième Partie — Chapitre 12 : Les préparatifs de fuite et la lettre de rupture dans le panier d'abricots",
      "Troisième Partie — Chapitres 1 à 5 : Les retrouvailles avec Léon à l'opéra de Rouen",
      "Troisième Partie — Chapitre 8 : L'étau des dettes de Lheureux, l'arsenic chez Homais et le dénouement",
    ],
    isArchived: false,
  },
  {
    id: 'EST-LIV-105',
    isbn: '978-2226257017',
    title: 'Sapiens : Une brève histoire de l’humanité',
    author: 'Yuval Noah Harari',
    category: 'Histoire & Essais',
    publishedYear: 2014,
    publisher: 'Éditions Albin Michel',
    shelfLocation: 'Rayon H-01',
    totalCopies: 4,
    availableCopies: 3,
    borrowedCopies: 1,
    coverColor: 'from-amber-900 via-stone-900 to-black',
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
    description: "Fresque historique monumentale devenue un phénomène éditorial mondial.",
    summary: "Il y a 100 000 ans, la Terre était habitée par au moins six espèces différentes d'hominidés. Aujourd'hui, il n'en reste qu'une seule : Homo sapiens. Comment une espèce d'animaux insignifiants d'Afrique orientale est-elle parvenue à conquérir la planète entière, à bâtir des empires, inventer la monnaie et explorer l'espace ? À travers les révolutions cognitive, agricole et scientifique, Harari réécrit l'épopée fascinante de notre espèce.",
    tableOfContents: [
      "Partie 1 : La Révolution Cognitive (L'apparition du langage et le pouvoir des fictions collectives)",
      "Partie 1 : Un jour dans la vie d'Adam et Ève chez les chasseurs-cueilleurs",
      "Partie 2 : La Révolution Agricole (Le plus grand piège de l'histoire humaine)",
      "Partie 2 : Bâtir des pyramides : les ordres imaginés et l'écriture comptable",
      "Partie 3 : L'Unification de l'Humanité (La monnaie universelle, les grands empires et les religions)",
      "Partie 4 : La Révolution Scientifique (La découverte de l'ignorance et l'alliance avec le capital)",
      "Partie 4 : La fin d'Homo Sapiens : vers les cyborgs et l'intelligence artificielle",
    ],
    isArchived: false,
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'EST-2024-012',
    studentCardId: 'CARD-EST-2024-012',
    name: 'Yassine Benali',
    email: 'yassine.benali@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-101'],
  },
  {
    id: 'EST-2024-045',
    studentCardId: 'CARD-EST-2024-045',
    name: 'Salma El Amrani',
    email: 'salma.elamrani@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-102'],
  },
  {
    id: 'EST-2024-089',
    studentCardId: 'CARD-EST-2024-089',
    name: 'Mehdi Chraibi',
    email: 'mehdi.chraibi@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-103'],
  },
  {
    id: 'EST-2024-110',
    studentCardId: 'CARD-EST-2024-110',
    name: 'Alexandre Fontaine',
    email: 'alexandre.fontaine@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-101', 'EST-LIV-102', 'EST-LIV-104'],
  },
];

// Date de référence actuelle : 2026-11-12
// Prêts avec tous les statuts requis : 'pending', 'accepted', 'active', 'returned', 'refused'
export const INITIAL_LOANS: Loan[] = [
  // 1. Demande en attente (Demandée par Yassine pour Sapiens)
  {
    id: 'DEM-EST-101',
    bookId: 'EST-LIV-105',
    bookTitle: 'Sapiens : Une brève histoire de l’humanité',
    bookAuthor: 'Yuval Noah Harari',
    bookShelf: 'Rayon H-01',
    studentId: 'EST-2024-012',
    studentName: 'Yassine Benali',
    studentEmail: 'yassine.benali@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-012',
    requestDate: '2026-11-11',
    dueDate: '2026-11-25',
    status: 'pending',
    daysOverdue: 0,
  },
  // 2. Demande acceptée (En attente de remise physique par le Gérant)
  {
    id: 'DEM-EST-102',
    bookId: 'EST-LIV-101',
    bookTitle: "L'Étranger",
    bookAuthor: 'Albert Camus',
    bookShelf: 'Rayon L-04',
    studentId: 'EST-2024-045',
    studentName: 'Salma El Amrani',
    studentEmail: 'salma.elamrani@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-045',
    requestDate: '2026-11-10',
    dueDate: '2026-11-24',
    status: 'accepted',
    daysOverdue: 0,
  },
  // 3. Emprunt actif en retard léger (Jaune: 2 jours de retard = 2j x 5 MAD = 10 MAD)
  {
    id: 'EMPR-EST-902',
    bookId: 'EST-LIV-102',
    bookTitle: '1984',
    bookAuthor: 'George Orwell',
    bookShelf: 'Rayon R-02',
    studentId: 'EST-2024-012',
    studentName: 'Yassine Benali',
    studentEmail: 'yassine.benali@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-012',
    requestDate: '2026-10-24',
    borrowedDate: '2026-10-25',
    dueDate: '2026-11-10', // En retard de 2 jours (au 2026-11-12)
    status: 'active',
    daysOverdue: 2,
    severity: 'yellow',
    penaltyFeeMad: 10,
  },
  // 4. Emprunt actif en retard moyen (Orange: 5 jours de retard = 5j x 5 MAD = 25 MAD)
  {
    id: 'EMPR-EST-903',
    bookId: 'EST-LIV-103',
    bookTitle: 'Le Petit Prince',
    bookAuthor: 'Antoine de Saint-Exupéry',
    bookShelf: 'Rayon C-01',
    studentId: 'EST-2024-089',
    studentName: 'Mehdi Chraibi',
    studentEmail: 'mehdi.chraibi@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-089',
    requestDate: '2026-10-20',
    borrowedDate: '2026-10-21',
    dueDate: '2026-11-07', // En retard de 5 jours
    status: 'active',
    daysOverdue: 5,
    severity: 'orange',
    penaltyFeeMad: 25,
  },
  // 5. Emprunt actif en retard élevé (Rouge: 11 jours de retard = 11j x 5 MAD = 55 MAD)
  {
    id: 'EMPR-EST-904',
    bookId: 'EST-LIV-104',
    bookTitle: 'Madame Bovary',
    bookAuthor: 'Gustave Flaubert',
    bookShelf: 'Rayon L-02',
    studentId: 'EST-2024-110',
    studentName: 'Alexandre Fontaine',
    studentEmail: 'alexandre.fontaine@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-110',
    requestDate: '2026-10-14',
    borrowedDate: '2026-10-15',
    dueDate: '2026-11-01', // En retard de 11 jours
    status: 'active',
    daysOverdue: 11,
    severity: 'red',
    penaltyFeeMad: 55,
  },
  // 6. Emprunt actif normal (non en retard)
  {
    id: 'EMPR-EST-905',
    bookId: 'EST-LIV-101',
    bookTitle: "L'Étranger",
    bookAuthor: 'Albert Camus',
    bookShelf: 'Rayon L-04',
    studentId: 'EST-2024-089',
    studentName: 'Mehdi Chraibi',
    studentEmail: 'mehdi.chraibi@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-089',
    requestDate: '2026-11-05',
    borrowedDate: '2026-11-06',
    dueDate: '2026-11-20', // Échéance future
    status: 'active',
    daysOverdue: 0,
  },
  // 7. Emprunt retourné avec succès
  {
    id: 'EMPR-EST-890',
    bookId: 'EST-LIV-105',
    bookTitle: 'Sapiens : Une brève histoire de l’humanité',
    bookAuthor: 'Yuval Noah Harari',
    bookShelf: 'Rayon H-01',
    studentId: 'EST-2024-045',
    studentName: 'Salma El Amrani',
    studentEmail: 'salma.elamrani@usmba.ac.ma',
    studentCardId: 'CARD-EST-2024-045',
    requestDate: '2026-10-10',
    borrowedDate: '2026-10-11',
    dueDate: '2026-10-25',
    returnDate: '2026-10-24',
    status: 'returned',
    condition: 'good',
    daysOverdue: 0,
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF-01',
    userId: 'EST-2024-012',
    title: 'Rappel d’échéance',
    message: 'Votre emprunt de « 1984 » est arrivé à échéance le 10/11/2026. Merci de le restituer à la bibliothèque.',
    createdAt: '2026-11-10 09:00',
    read: false,
    type: 'overdue',
  },
  {
    id: 'NOTIF-02',
    userId: 'EST-2024-012',
    title: 'Demande d’emprunt enregistrée',
    message: 'Votre demande pour « Sapiens » est en cours de traitement par le Gérant de bibliothèque.',
    createdAt: '2026-11-11 14:30',
    read: true,
    type: 'loan',
  },
  {
    id: 'NOTIF-03',
    userId: 'EST-2024-045',
    title: 'Demande acceptée !',
    message: 'Votre demande pour « L\'Étranger » a été acceptée. Présentez-vous à la bibliothèque pour la remise physique.',
    createdAt: '2026-11-10 16:00',
    read: false,
    type: 'loan',
  },
];
