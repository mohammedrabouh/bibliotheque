/**
 * Service d'authentification cryptographique côté client
 * - Calcule le hash SHA-256 standard via Web Crypto API natif (subtle.digest).
 * - Ne stocke JAMAIS les mots de passe en clair dans le code ou dans le localStorage.
 * - Vérifie l'identité réelle en comparant les empreintes cryptographiques avec les comptes internes autorisés.
 */

import { INTERNAL_TEST_CREDENTIALS } from '../data/mockData';
import { User } from '../types';

export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function authenticateWithCredentials(
  email: string,
  plainPassword: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return { success: false, error: 'Veuillez saisir votre adresse e-mail.' };
  }

  if (!plainPassword) {
    return { success: false, error: 'Veuillez saisir votre mot de passe.' };
  }

  const computedHash = await hashPassword(plainPassword);

  // Recherche dans les comptes internes autorisés
  const matchedAccount = INTERNAL_TEST_CREDENTIALS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail
  );

  if (!matchedAccount) {
    return {
      success: false,
      error: 'Identifiant introuvable. Seuls les comptes académiques (@usmba.ac.ma) et le Gérant (@gmail.com) enregistrés sont autorisés.',
    };
  }

  if (matchedAccount.passwordHash !== computedHash) {
    return {
      success: false,
      error: 'Mot de passe incorrect. Veuillez vérifier votre saisie.',
    };
  }

  return {
    success: true,
    user: matchedAccount.user,
  };
}
