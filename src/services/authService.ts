/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service d'authentification biblioEST.
 * 
 * Architecture sécurisée :
 * 1. Mode Serveur Principal : Interroge les routes d'API sécurisées Express (/api/auth/login, /api/auth/me, /api/auth/logout).
 *    - Les mots de passe et les empreintes sont vérifiés côté serveur uniquement.
 *    - Gestion de session avec tokens aléatoires sécurisés et rate-limiting anti-bruteforce.
 * 2. Mode Démonstration Locale de Secours : Si le serveur n'est pas joignable (ex: aperçu statique),
 *    signale explicitement que le mode actuel est une démonstration locale non sécurisée pour la production.
 */

import { User } from '../types';
import { INITIAL_USERS } from '../data/mockData';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  authMode?: 'server' | 'local_demo';
}

const TOKEN_STORAGE_KEY = 'biblioest_auth_token_v5';

export function getStoredAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeStoredAuthToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Calcule l'empreinte cryptographique SHA-256 d'une chaîne
 */
export async function computeSHA256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

/**
 * Authentification principale via le backend Express avec repli comparatif SHA-256
 */
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

  // 1. Tentative d'authentification réelle auprès du serveur Express
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, password: plainPassword }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.user) {
      if (data.token) {
        setStoredAuthToken(data.token);
      }
      return {
        success: true,
        user: data.user,
        token: data.token,
        authMode: 'server',
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        error: data.error || 'Trop de tentatives de connexion échouées. Compte temporairement verrouillé.',
      };
    }

    if (response.status === 401 || response.status === 400 || (!data.success && data.error)) {
      return {
        success: false,
        error: data.error || 'Identifiant ou mot de passe incorrect.',
      };
    }
  } catch (netErr) {
    console.warn('[biblioEST] Serveur non joignable pour /api/auth/login, bascule sur vérification locale:', netErr);
  }

  // 2. Mode Démonstration Locale de Secours (Clairement identifié comme NON sécurisé pour la production)
  // Calcul et comparaison réelle de l'empreinte SHA-256 avec INITIAL_USERS de mockData.ts
  const inputHash = await computeSHA256(plainPassword);
  const matchedUser = INITIAL_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (!matchedUser) {
    return {
      success: false,
      error: "Aucun compte correspondant à cette adresse e-mail n'a été trouvé.",
    };
  }

  if (matchedUser.passwordHash !== inputHash) {
    return {
      success: false,
      error: "Mot de passe incorrect pour cette adresse.",
    };
  }

  return {
    success: true,
    user: matchedUser,
    authMode: 'local_demo',
  };
}

/**
 * Vérifie si la session actuelle est toujours valide auprès du serveur
 */
export async function checkServerSession(): Promise<User | null> {
  const token = getStoredAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return data.user;
      }
    }
  } catch {
    // Échec réseau
  }
  return null;
}

/**
 * Ferme la session sur le serveur et nettoie le stockage client
 */
export async function logoutSession(): Promise<void> {
  const token = getStoredAuthToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignorer
    }
  }
  removeStoredAuthToken();
}
