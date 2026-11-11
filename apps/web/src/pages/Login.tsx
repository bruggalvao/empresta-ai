import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";
import { useSession } from "../app/session-context";
import { Brand } from "../components/Brand";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { LOGIN_MESSAGES } from "./messages";

const schema = z.object({
  email: z.string().trim().min(1, LOGIN_MESSAGES.emailRequired).pipe(z.email(LOGIN_MESSAGES.emailInvalid)),
  password: z.string().min(1, LOGIN_MESSAGES.passwordRequired),
});
type LoginForm = z.infer<typeof schema>;

const STATS = [
  { value: "3", label: "itens por pessoa" },
  { value: "14", label: "dias de prazo" },
  { value: "0", label: "linhas para preencher" },
];

// LAYOUT §5.1, without the "Entrar como Operações" button: the role comes
// from the account's membership (spec login, decisões).
export default function Login() {
  const { signIn, notice } = useSession();
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFailure(null);
    const result = await signIn(email, password);
    if (!result.ok) {
      setValue("password", "");
      setFailure(result.reason === "invalid_credentials" ? LOGIN_MESSAGES.invalidCredentials : LOGIN_MESSAGES.unavailable);
    }
    // On success the session changes and the route sends the person to /inicio.
  });

  const alert = failure ?? notice;

  return (
    <main className="grid min-h-[820px] min-h-svh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#1b1f2e,#161826_60%)] px-14 py-16 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-[120px] size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(47_184_172/0.16),transparent)]"
        />
        <Link to="/" aria-label="empresta.ai, início" className="relative">
          <Brand size="md" />
        </Link>
        <div className="relative flex flex-col gap-6">
          <h1 className="text-[44px]">
            Saiba o que está disponível
            <br />e quem está com o quê.
          </h1>
          <p className="max-w-[48ch] text-base text-text/60">
            Retirada e devolução de equipamentos de TI registradas na hora, sem planilha compartilhada.
          </p>
          <dl className="grid grid-cols-3 gap-4 border-t border-divider pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="order-2 text-[12.5px] text-text/55">{stat.label}</dt>
                <dd className="order-1 text-[30px] font-semibold leading-none text-accent">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs text-text/40">Operações · TI interno</p>
      </section>

      <section className="flex items-center justify-center px-6 py-16 lg:px-14">
        <div className="flex w-full max-w-[340px] flex-col gap-6">
          <div className="lg:hidden">
            <Brand size="md" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-[26px]">Entrar</h2>
            <p className="text-[14px] text-text/55">Use o e-mail e a senha da sua conta.</p>
          </div>

          {alert ? (
            <p role="alert" className="rounded-md border border-[#7a3b3b] bg-[rgb(122_59_59/0.14)] px-3 py-2 text-[13px] text-status-late-fg">
              {alert}
            </p>
          ) : null}

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <Field
              label="Senha"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" block size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p className="text-[12.5px] text-text/45">Cada pessoa vê apenas os próprios empréstimos.</p>
        </div>
      </section>
    </main>
  );
}
