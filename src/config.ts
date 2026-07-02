// Runtime configuration, driven by Vite env vars.
//
// VITE_USE_MOCK : 'false' to talk to the real backend; anything else (default)
//                 runs against the in-browser mock so the SPA works offline.
// VITE_API_BASE : base URL for the API. Empty = same origin (dev proxy / prod
//                 behind Cloudflare). Set to e.g. https://api.example.com if the
//                 BFF is on another origin.
// VITE_AUTH0_*       : Auth0 tenant settings (enables optional Sign in UI).
// VITE_AUTH_REQUIRED : 'true' to require login for API calls (future); default off.

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export const AUTH0_DOMAIN = (import.meta.env.VITE_AUTH0_DOMAIN ?? '').trim()
export const AUTH0_CLIENT_ID = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? '').trim()
export const AUTH0_AUDIENCE = (import.meta.env.VITE_AUTH0_AUDIENCE ?? '').trim()

/** Auth0 env vars present and not in mock mode — Sign in / Sign out UI is available. */
export const AUTH_CONFIGURED =
  !USE_MOCK && Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID && AUTH0_AUDIENCE)

/** Alias used by Header and other UI. */
export const AUTH_ENABLED = AUTH_CONFIGURED

/** When true, unauthenticated users cannot use protected features (enable later). */
export const AUTH_REQUIRED =
  AUTH_CONFIGURED && import.meta.env.VITE_AUTH_REQUIRED === 'true'

/** Umbrella portal (landing). Production: ai-forall.org */
export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL ?? 'https://ai-forall.org').replace(/\/$/, '')

/** Resolve a backend-relative file URL against API_BASE when set. */
export function resolveUrl(path: string): string {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  if (!API_BASE) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}
