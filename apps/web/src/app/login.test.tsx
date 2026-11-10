// spec login: CA-1 to CA-5 and the interface side of CA-7.
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "../lib/api/me";
import { LOGIN_MESSAGES, NO_ACCESS_MESSAGE } from "../pages/messages";
import { FakeAuth, OPS, PROFESSOR, renderApp } from "../test/app";

async function fillAndSubmit(email: string, password: string) {
  fireEvent.input(await screen.findByLabelText("E-mail"), { target: { value: email } });
  fireEvent.input(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

const navbar = () => screen.getByRole("navigation", { name: "Principal" });

describe("login", () => {
  it("CA-1: o botão Entrar da landing leva a /entrar, com título, E-mail, Senha e Entrar, sem Entrar como Operações", async () => {
    const app = renderApp("/");
    fireEvent.click(screen.getByRole("link", { name: "Entrar" }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(app.path()).toBe("/entrar");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveAttribute("type", "submit");
    expect(screen.queryByText(/Entrar como Operações/i)).not.toBeInTheDocument();
  });

  it("CA-2: com conta válida vai para /inicio com nome, iniciais, papel, abas do papel e Sair", async () => {
    const app = renderApp("/entrar");
    await fillAndSubmit(PROFESSOR.email, "senha-certa");

    expect(await screen.findByRole("heading", { name: "Olá, Marcelo" })).toBeInTheDocument();
    expect(app.path()).toBe("/inicio");
    const nav = within(navbar());
    expect(nav.getByText("Marcelo Grilo")).toBeInTheDocument();
    expect(nav.getByText("MG")).toBeInTheDocument();
    expect(nav.getByText("Colaborador")).toBeInTheDocument();
    expect(nav.getAllByRole("button", { name: /Catálogo|Meus empréstimos|Operações|Equipamentos/ }).map((b) => b.textContent)).toEqual([
      "Catálogo",
      "Meus empréstimos",
    ]);
    expect(nav.getByRole("button", { name: "Sair" })).toBeEnabled();
  });

  it("CA-2: conta de Operações vê a etiqueta Operações e as quatro abas", async () => {
    renderApp("/entrar");
    await fillAndSubmit(OPS.email, "senha-ops");

    await screen.findByRole("heading", { name: "Olá, Camila" });
    const nav = within(navbar());
    expect(nav.getByText("CP")).toBeInTheDocument();
    expect(nav.getByText("Operações", { selector: "span" })).toBeInTheDocument();
    expect(nav.getAllByRole("button", { name: /Catálogo|Meus empréstimos|Operações|Equipamentos/ }).map((b) => b.textContent)).toEqual([
      "Catálogo",
      "Operações",
      "Equipamentos",
      "Meus empréstimos",
    ]);
  });

  it("CA-3: credencial recusada mostra a mensagem única, mantém o e-mail e limpa a senha", async () => {
    const app = renderApp("/entrar");
    await fillAndSubmit(PROFESSOR.email, "senha-errada");

    expect(await screen.findByRole("alert")).toHaveTextContent(LOGIN_MESSAGES.invalidCredentials);
    expect(screen.getByLabelText("E-mail")).toHaveValue(PROFESSOR.email);
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    expect(app.path()).toBe("/entrar");

    // An unknown e-mail gets exactly the same message.
    await fillAndSubmit("ninguem@empresa.test", "qualquer");
    await waitFor(() => expect(app.auth.signInCalls).toBe(2));
    expect(screen.getByRole("alert")).toHaveTextContent(LOGIN_MESSAGES.invalidCredentials);
  });

  it("CA-3: e-mail ou senha vazios dizem o que falta e não chamam o Auth", async () => {
    const app = renderApp("/entrar");
    await fillAndSubmit("", "");

    expect(await screen.findByText(LOGIN_MESSAGES.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(LOGIN_MESSAGES.passwordRequired)).toBeInTheDocument();

    await fillAndSubmit(PROFESSOR.email, "");
    expect(await screen.findByText(LOGIN_MESSAGES.passwordRequired)).toBeInTheDocument();
    expect(app.auth.signInCalls).toBe(0);
  });

  it("CA-4: sem sessão /inicio vai para /entrar; com sessão /entrar vai para /inicio; recarregar mantém a sessão", async () => {
    const anonymous = renderApp("/inicio");
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(anonymous.path()).toBe("/entrar");
    anonymous.unmount();

    const auth = new FakeAuth().signedInAs(PROFESSOR.email);
    const signedIn = renderApp("/entrar", { auth });
    expect(await screen.findByRole("heading", { name: "Olá, Marcelo" })).toBeInTheDocument();
    expect(signedIn.path()).toBe("/inicio");
    signedIn.unmount();

    // "Reload": a fresh app on /inicio reading the session the browser kept.
    const reloaded = renderApp("/inicio", { auth });
    expect(await screen.findByRole("heading", { name: "Olá, Marcelo" })).toBeInTheDocument();
    expect(reloaded.path()).toBe("/inicio");
  });

  it("CA-5: Sair encerra a sessão no Auth, leva a /entrar e /inicio volta a redirecionar", async () => {
    const auth = new FakeAuth().signedInAs(PROFESSOR.email);
    const app = renderApp("/inicio", { auth });
    fireEvent.click(await within(await screen.findByRole("navigation", { name: "Principal" })).findByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(auth.signOutCalls).toBe(1);
    expect(auth.session).toBeNull();
    expect(app.path()).toBe("/entrar");

    await act(() => app.router.navigate("/inicio"));
    await waitFor(() => expect(app.path()).toBe("/entrar"));
  });

  it("CA-7: conta sem acesso (403 em /v1/me) vê a mensagem no login e a sessão é encerrada", async () => {
    const auth = new FakeAuth({ "sem.vinculo@empresa.test": "senha" });
    const fetchMe = async () => {
      throw new ApiError(403, "A conta não tem vínculo com nenhum tenant.");
    };
    const app = renderApp("/entrar", { auth, fetchMe });
    await fillAndSubmit("sem.vinculo@empresa.test", "senha");

    expect(await screen.findByRole("alert")).toHaveTextContent(NO_ACCESS_MESSAGE);
    expect(auth.signOutCalls).toBe(1);
    expect(auth.session).toBeNull();
    expect(app.path()).toBe("/entrar");
  });
});
