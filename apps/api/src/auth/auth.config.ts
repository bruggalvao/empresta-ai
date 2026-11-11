import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

// ADR 001 §2.7: the API validates Supabase access tokens against the
// project's public keys (JWKS). The project signs with ES256 (checked on the
// public JWKS, 2026-11-10); SUPABASE_JWT_SECRET is not used.
export const AUTH_SETTINGS = Symbol("AUTH_SETTINGS");

export type AuthConfig = { issuer: string; audience: string };
export type AuthSettings = { config(): AuthConfig; keys(): JWTVerifyGetKey };

export function authConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const base = env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("SUPABASE_URL ausente: a API não consegue validar tokens");
  return { issuer: `${base}/auth/v1`, audience: "authenticated" };
}

// Read on the first authenticated request, not at boot, so the app (and
// /v1/health) starts without Supabase settings. The remote key set caches
// the JWKS between requests.
export function authSettingsFromEnv(env: NodeJS.ProcessEnv = process.env): AuthSettings {
  let config: AuthConfig | undefined;
  let keys: JWTVerifyGetKey | undefined;
  return {
    config: () => (config ??= authConfigFromEnv(env)),
    keys: () =>
      (keys ??= createRemoteJWKSet(
        new URL(env.SUPABASE_JWKS_URL || `${authConfigFromEnv(env).issuer}/.well-known/jwks.json`),
      )),
  };
}
