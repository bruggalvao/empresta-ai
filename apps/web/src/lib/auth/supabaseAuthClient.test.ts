// spec login, CA-3 and CA-5: how supabase-js answers are mapped.
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createSupabaseAuthClient } from "./supabaseAuthClient";

function clientReturning(result: unknown, signOut = vi.fn(async () => ({ error: null }))) {
  const auth = { signInWithPassword: vi.fn(async () => result), signOut };
  return { client: { auth } as unknown as SupabaseClient, auth };
}

describe("createSupabaseAuthClient", () => {
  it("CA-3: e-mail inexistente e senha errada (invalid_credentials, 400) viram a mesma recusa", async () => {
    for (const error of [{ code: "invalid_credentials", status: 400 }, { status: 400 }]) {
      const { client } = clientReturning({ data: { session: null }, error });
      expect(await createSupabaseAuthClient(() => client).signIn("a@b.test", "x")).toEqual({
        ok: false,
        reason: "invalid_credentials",
      });
    }
  });

  it("CA-3: falha que não é de credencial (rede, 5xx) não é dita como senha errada", async () => {
    const { client } = clientReturning({ data: { session: null }, error: { code: "unexpected_failure", status: 500 } });
    expect(await createSupabaseAuthClient(() => client).signIn("a@b.test", "x")).toEqual({ ok: false, reason: "unavailable" });

    const broken = { auth: { signInWithPassword: vi.fn(async () => Promise.reject(new TypeError("fetch failed"))) } };
    expect(await createSupabaseAuthClient(() => broken as unknown as SupabaseClient).signIn("a@b.test", "x")).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("CA-3: e-mail e senha vão para signInWithPassword e a sessão volta com o access token", async () => {
    const { client, auth } = clientReturning({
      data: { session: { access_token: "jwt", user: { email: "a@b.test" } } },
      error: null,
    });
    expect(await createSupabaseAuthClient(() => client).signIn("a@b.test", "segredo")).toEqual({
      ok: true,
      session: { accessToken: "jwt", email: "a@b.test" },
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.test", password: "segredo" });
  });

  it("CA-5: Sair chama signOut do Supabase", async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    const { client } = clientReturning({}, signOut);
    await createSupabaseAuthClient(() => client).signOut();
    expect(signOut).toHaveBeenCalledOnce();
  });
});
