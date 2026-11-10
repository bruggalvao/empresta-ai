import { createParamDecorator, type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest, AuthenticatedUser } from "./auth.guard.js";

// Reads the user set by AuthGuard. Never falls back to query, body or headers.
export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedUser => {
  const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  if (!auth) throw new UnauthorizedException("Token de acesso ausente.");
  return auth;
});
