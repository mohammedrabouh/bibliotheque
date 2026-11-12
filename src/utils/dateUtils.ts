/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilitaires de manipulation de dates sécurisés et sans décalage de fuseau horaire.
 * Utilise la date réelle du système pour toutes les opérations.
 */

/**
 * Formate un objet Date en chaîne ISO 'YYYY-MM-DD'
 */
export const formatYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Retourne la date réelle du système sous forme 'YYYY-MM-DD'
 */
export const getSystemToday = (): string => {
  return formatYMD(new Date());
};

/**
 * Ajoute ou soustrait un nombre de jours à une date 'YYYY-MM-DD'
 * Utilise UTC pour éviter tout problème d'heure d'été / hiver ou de fuseau horaire
 */
export const addDays = (baseYmd: string, days: number): string => {
  if (!baseYmd) return getSystemToday();
  const parts = baseYmd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return getSystemToday();
  }
  const [y, m, d] = parts;
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  
  const resY = utcDate.getUTCFullYear();
  const resM = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
};

/**
 * Calcule la différence exacte en jours entre deux dates (d2 - d1)
 */
export const calculateDaysDifference = (fromYmd: string, toYmd: string): number => {
  try {
    const p1 = fromYmd.split('-').map(Number);
    const p2 = toYmd.split('-').map(Number);
    if (p1.length !== 3 || p2.length !== 3) return 0;
    
    const utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
    const utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
    const diffMs = utc2 - utc1;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Calcule le nombre de jours de retard réels par rapport à aujourd'hui
 * Retourne 0 si l'échéance n'est pas dépassée
 */
export const calculateDaysOverdue = (dueYmd: string, todayYmd: string = getSystemToday()): number => {
  const diff = calculateDaysDifference(dueYmd, todayYmd);
  return diff > 0 ? diff : 0;
};

/**
 * Détermine le degré de retard selon la règle de l'EST USMBA :
 * - Jaune : retard léger (1 à 3 jours)
 * - Orange : retard moyen (4 à 7 jours)
 * - Rouge : retard élevé (> 7 jours)
 */
export const determineSeverity = (daysOverdue: number): 'yellow' | 'orange' | 'red' => {
  if (daysOverdue > 7) return 'red';
  if (daysOverdue >= 4) return 'orange';
  return 'yellow';
};

/**
 * Formate une date pour l'affichage en français (ex: "12 nov. 2026")
 */
export const formatDisplayDate = (ymd: string): string => {
  if (!ymd) return '-';
  try {
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return ymd;
  }
};
