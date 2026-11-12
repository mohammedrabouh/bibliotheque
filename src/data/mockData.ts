import { Book, Student, Loan, Notification, PenaltyRule, User } from '../types';
import { getSystemToday, addDays, calculateDaysOverdue, determineSeverity } from '../utils/dateUtils';

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

export const INITIAL_CATEGORIES = [
  'Littérature classique',
  'Romans & Fiction',
  'Sciences & Informatique',
  'Histoire & Essais',
  'Philosophie & Pensée',
  'Économie & Gestion',
];

// Ouvrages réels de référence avec suivi strict des 4 états de stock physique :
// totalCopies = availableCopies + reservedCopies + borrowedCopies + unavailableCopies
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
    availableCopies: 1, // 4 - (1 emprunté + 1 réservé + 1 indisponible) = 1
    reservedCopies: 1, // Réservé pour la demande acceptée de Salma
    borrowedCopies: 1, // Détenu par Mehdi
    unavailableCopies: 1, // 1 exemplaire en atelier de reliure (endommagé)
    lostCopies: 0,
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
    availableCopies: 1, // 3 - (2 empruntés) = 1
    reservedCopies: 0,
    borrowedCopies: 2, // Yassine et Alexandre
    unavailableCopies: 0,
    lostCopies: 0,
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
    availableCopies: 1, // 3 - (1 emprunté Mehdi + 1 réservé) = 1
    reservedCopies: 1,
    borrowedCopies: 1,
    unavailableCopies: 0,
    lostCopies: 0,
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
      "Chapitres 9 à 15 : Le périple cosmique",
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
    availableCopies: 1, // 2 - (1 emprunté Alexandre) = 1
    reservedCopies: 0,
    borrowedCopies: 1,
    unavailableCopies: 0,
    lostCopies: 0,
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
      "Deuxième Partie — Chapitre 12 : Les préparatifs de fuite et la lettre de rupture",
      "Troisième Partie — Chapitres 1 à 5 : Les retrouvailles avec Léon à l'opéra de Rouen",
      "Troisième Partie — Chapitre 8 : L'étau des dettes de Lheureux et le dénouement",
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
    availableCopies: 4, // Tous en rayon
    reservedCopies: 0,
    borrowedCopies: 0,
    unavailableCopies: 0,
    lostCopies: 0,
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

// Empreintes cryptographiques SHA-256 exactes des comptes de démonstration :
// - Étudiants ('etudiant2026') -> '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24'
// - Gérant ('gerant2026')     -> '201e98dde9dfe48c9e32c2eb652eb1cbf87381164674233aa0e00014089078dd'
export const STUDENT_PASSWORD_HASH = '0a9b858a7ceba0d0c4a7c44de830fa72d6cc9b6ef8f582aa18d6baf2c5dc5a24';
export const MANAGER_PASSWORD_HASH = '201e98dde9dfe48c9e32c2eb652eb1cbf87381164674233aa0e00014089078dd';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'EST-2024-012',
    studentCardId: 'CARD-EST-2024-012',
    name: 'Yassine Benali',
    email: 'yassine.benali@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-102'],
    passwordHash: STUDENT_PASSWORD_HASH,
  },
  {
    id: 'EST-2024-045',
    studentCardId: 'CARD-EST-2024-045',
    name: 'Salma El Amrani',
    email: 'salma.elamrani@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: [],
    passwordHash: STUDENT_PASSWORD_HASH,
  },
  {
    id: 'EST-2024-089',
    studentCardId: 'CARD-EST-2024-089',
    name: 'Mehdi Chraibi',
    email: 'mehdi.chraibi@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-101', 'EST-LIV-103'],
    passwordHash: STUDENT_PASSWORD_HASH,
  },
  {
    id: 'EST-2024-110',
    studentCardId: 'CARD-EST-2024-110',
    name: 'Alexandre Fontaine',
    email: 'alexandre.fontaine@usmba.ac.ma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    activeLoanBookIds: ['EST-LIV-102', 'EST-LIV-104'],
    passwordHash: STUDENT_PASSWORD_HASH,
  },
];

export const INITIAL_MANAGER: User = {
  id: 'MGR-EST-01',
  name: 'Karim Tazi',
  email: 'rabohr417@gmail.com',
  role: 'manager',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  passwordHash: MANAGER_PASSWORD_HASH,
};

export const INITIAL_USERS: User[] = [
  ...INITIAL_STUDENTS.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: 'student' as const,
    studentCardId: s.studentCardId,
    avatar: s.avatar,
    passwordHash: s.passwordHash,
  })),
  INITIAL_MANAGER,
];

/**
 * Génère des emprunts d'exemples initiaux dynamiquement calés sur la date réelle du système
 * Cela garantit que les tests de retards (Jaune, Orange, Rouge) et les échéances du jour
 * sont TOUJOURS vivants et cohérents quelle que soit la date à laquelle l'application est exécutée.
 */
export const createInitialLoans = (): Loan[] => {
  const today = getSystemToday();

  // Retard léger (Jaune: 2 jours) -> Échéance il y a 2 jours
  const yellowDue = addDays(today, -2);
  const yellowOverdue = calculateDaysOverdue(yellowDue, today);

  // Retard moyen (Orange: 5 jours) -> Échéance il y a 5 jours
  const orangeDue = addDays(today, -5);
  const orangeOverdue = calculateDaysOverdue(orangeDue, today);

  // Retard élevé (Rouge: 11 jours) -> Échéance il y a 11 jours
  const redDue = addDays(today, -11);
  const redOverdue = calculateDaysOverdue(redDue, today);

  // Échéance aujourd'hui (0 jour) -> Doit être retourné AUJOURD'HUI
  const dueToday = today;

  // Échéance future (+12 jours)
  const futureDue = addDays(today, 12);

  return [
    // 1. Demande en attente (Demandée hier par Yassine pour Sapiens)
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
      requestDate: addDays(today, -1),
      dueDate: addDays(today, 13),
      status: 'pending',
      daysOverdue: 0,
    },
    // 2. Demande acceptée (En attente de remise physique au comptoir par le Gérant)
    // Réserve un exemplaire de L'Étranger
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
      requestDate: addDays(today, -2),
      dueDate: addDays(today, 12),
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
      requestDate: addDays(today, -17),
      borrowedDate: addDays(today, -16),
      dueDate: yellowDue,
      status: 'active',
      daysOverdue: yellowOverdue,
      severity: determineSeverity(yellowOverdue),
      penaltyFeeMad: yellowOverdue * 5,
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
      requestDate: addDays(today, -20),
      borrowedDate: addDays(today, -19),
      dueDate: orangeDue,
      status: 'active',
      daysOverdue: orangeOverdue,
      severity: determineSeverity(orangeOverdue),
      penaltyFeeMad: orangeOverdue * 5,
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
      requestDate: addDays(today, -26),
      borrowedDate: addDays(today, -25),
      dueDate: redDue,
      status: 'active',
      daysOverdue: redOverdue,
      severity: determineSeverity(redOverdue),
      penaltyFeeMad: redOverdue * 5,
    },
    // 6. Emprunt dont l'échéance de retour est AUJOURD'HUI
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
      requestDate: addDays(today, -14),
      borrowedDate: addDays(today, -14),
      dueDate: dueToday,
      status: 'active',
      daysOverdue: 0,
    },
    // 7. Emprunt actif normal en cours
    {
      id: 'EMPR-EST-906',
      bookId: 'EST-LIV-102',
      bookTitle: '1984',
      bookAuthor: 'George Orwell',
      bookShelf: 'Rayon R-02',
      studentId: 'EST-2024-110',
      studentName: 'Alexandre Fontaine',
      studentEmail: 'alexandre.fontaine@usmba.ac.ma',
      studentCardId: 'CARD-EST-2024-110',
      requestDate: addDays(today, -2),
      borrowedDate: addDays(today, -2),
      dueDate: futureDue,
      status: 'active',
      daysOverdue: 0,
    },
    // 8. Emprunt retourné avec succès
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
      requestDate: addDays(today, -18),
      borrowedDate: addDays(today, -17),
      dueDate: addDays(today, -3),
      returnDate: addDays(today, -4),
      status: 'returned',
      condition: 'good',
      daysOverdue: 0,
    },
  ];
};

export const INITIAL_LOANS: Loan[] = createInitialLoans();

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF-01',
    userId: 'EST-2024-012',
    title: 'Rappel d’échéance',
    message: 'Votre emprunt de « 1984 » est arrivé à échéance. Merci de le restituer à la bibliothèque.',
    createdAt: `${getSystemToday()} 09:00`,
    read: false,
    type: 'overdue',
  },
  {
    id: 'NOTIF-02',
    userId: 'EST-2024-012',
    title: 'Demande d’emprunt enregistrée',
    message: 'Votre demande pour « Sapiens » est en cours de traitement par le Gérant de bibliothèque.',
    createdAt: `${getSystemToday()} 14:30`,
    read: true,
    type: 'loan',
  },
  {
    id: 'NOTIF-03',
    userId: 'EST-2024-045',
    title: 'Demande acceptée !',
    message: 'Votre demande pour « L\'Étranger » a été acceptée. Présentez-vous à la bibliothèque pour la remise physique.',
    createdAt: `${getSystemToday()} 16:00`,
    read: false,
    type: 'loan',
  },
];
