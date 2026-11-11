// GET /v1/me (spec login, plan "Contrato de API"). Hand-written until
// packages/api-contract exists.
export type Role = "EMPLOYEE" | "OPERATIONS";

export type Me = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  tenant: { slug: string; name: string };
};

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type FetchMe = (accessToken: string) => Promise<Me>;

export function createFetchMe(baseUrl: string | undefined = import.meta.env.VITE_API_URL): FetchMe {
  return async (accessToken) => {
    if (!baseUrl) throw new ApiError(0, "VITE_API_URL ausente");
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const problem = (await res.json().catch(() => null)) as { detail?: string } | null;
      throw new ApiError(res.status, problem?.detail ?? res.statusText);
    }
    return (await res.json()) as Me;
  };
}
