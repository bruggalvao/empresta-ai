// Accounts live in Supabase Auth, outside Postgres tables Prisma manages.
// The seed talks to it through this interface so tests can use a fake.

import { createClient } from "@supabase/supabase-js";

export interface AuthAdmin {
  findUserIdByEmail(email: string): Promise<string | null>;
  createUser(input: { email: string; password: string; emailConfirmed: true }): Promise<string>;
}

export function supabaseAuthAdmin(url: string, serviceRoleKey: string): AuthAdmin {
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.admin;

  return {
    // The Admin API has no lookup by e-mail; page through the users.
    async findUserIdByEmail(email) {
      const target = email.toLowerCase();
      const perPage = 1000;
      for (let page = 1; ; page++) {
        const { data, error } = await admin.listUsers({ page, perPage });
        if (error) throw new Error(`Supabase Auth (listUsers): ${error.message}`);
        const found = data.users.find((u) => u.email?.toLowerCase() === target);
        if (found) return found.id;
        if (data.users.length < perPage) return null;
      }
    },
    async createUser({ email, password, emailConfirmed }) {
      const { data, error } = await admin.createUser({ email, password, email_confirm: emailConfirmed });
      if (error || !data.user) throw new Error(`Supabase Auth (createUser): ${error?.message ?? "sem usuário"}`);
      return data.user.id;
    },
  };
}
