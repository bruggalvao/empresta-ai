import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { jwtVerify } from "jose";
import { AUTH_SETTINGS, type AuthSettings } from "./auth.config.js";

export type AuthenticatedUser = { userId: string };
export type AuthenticatedRequest = Request & { auth?: AuthenticatedUser };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The identity of a request comes only from a verified Supabase access token:
// signature against the JWKS, issuer of this project, audience
// "authenticated", not expired. Nothing the client sends elsewhere counts.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SETTINGS) private readonly settings: AuthSettings) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) throw new UnauthorizedException("Token de acesso ausente.");

    const { issuer, audience } = this.settings.config();
    let sub: unknown;
    try {
      ({ payload: { sub } } = await jwtVerify(token, this.settings.keys(), {
        issuer,
        audience,
        algorithms: ["ES256"],
      }));
    } catch {
      throw new UnauthorizedException("Token de acesso inválido ou expirado.");
    }
    if (typeof sub !== "string" || !UUID.test(sub)) throw new UnauthorizedException("Token de acesso inválido ou expirado.");

    req.auth = { userId: sub };
    return true;
  }
}
