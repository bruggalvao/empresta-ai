import { type Api, ApiError } from "./types";

// Calls the API with the Supabase access token as Bearer (ADR 001 §2.7).
// Errors arrive as Problem Details; `detail` and `reason` are kept.
export function createApi(baseUrl: string | undefined = import.meta.env.VITE_API_URL): Api {
  async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
    if (!baseUrl) throw new ApiError(0, "VITE_API_URL ausente");
    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      });
    } catch {
      throw new ApiError(0, "Não foi possível falar com o servidor. Tente de novo em instantes.");
    }
    if (!res.ok) {
      const problem = (await res.json().catch(() => null)) as { detail?: string; reason?: string } | null;
      throw new ApiError(res.status, problem?.detail ?? res.statusText, problem?.reason);
    }
    return (await res.json()) as T;
  }

  return {
    me: (token) => call(token, "/me"),
    equipment: (token) => call(token, "/equipment"),
    myLoans: (token) => call(token, "/loans/mine"),
    requestLoan: (token, equipmentId) => call(token, "/loans", { method: "POST", body: JSON.stringify({ equipmentId }) }),
  };
}
