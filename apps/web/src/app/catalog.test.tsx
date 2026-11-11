// spec solicitar-emprestimo: CA-7 to CA-12 (interface).
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { addDays, formatDate, saoPauloDate } from "../lib/dates";
import { FakeApi, FakeAuth, ITEMS, OPS, PROFESSOR, renderApp } from "../test/app";

const signedIn = (email = PROFESSOR.email) => new FakeAuth().signedInAs(email);
const card = (name: string) => screen.getByRole("article", { name });
const cardNames = () => screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"));
const navbar = () => within(screen.getByRole("navigation", { name: "Principal" }));

async function openCatalog(api = new FakeApi(), email = PROFESSOR.email) {
  const app = renderApp("/catalogo", { auth: signedIn(email), api });
  await screen.findByRole("heading", { name: "Catálogo" });
  return app;
}

describe("catálogo", () => {
  it("CA-7: cada item com foto pela biblioteca (com crédito), categoria, nome, patrimônio, pill, detalhe e botão; contagem de disponíveis", async () => {
    const api = new FakeApi().lend(PROFESSOR.email, 2, 5).lend("outra@empresa.test", 3, 7);
    await openCatalog(api);

    expect(screen.getByText("2 de 5 equipamentos disponíveis agora")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pixabay" })).toHaveAttribute("href", "https://pixabay.com/");

    const free = within(card("Notebook 14 polegadas"));
    expect(free.getByRole("img", { name: "Notebook 14 polegadas" })).toHaveAttribute("src", expect.stringMatching(/\/storage\/v1\/object\/public\/equipamentos\/TI-0001\.jpg$/));
    expect(free.getByText("Notebook")).toBeInTheDocument();
    expect(free.getByText("TI-0001")).toBeInTheDocument();
    expect(free.getByText("Disponível")).toBeInTheDocument();
    expect(free.getByText("Pronto para retirada no balcão")).toBeInTheDocument();
    expect(free.getByRole("button", { name: "Solicitar" })).toBeEnabled();

    const mine = within(card("Monitor 24 polegadas"));
    expect(mine.getByText("Emprestado")).toBeInTheDocument();
    expect(mine.getByText(`Com você · devolver até ${formatDate(addDays(saoPauloDate(), 5))}`)).toBeInTheDocument();
    expect(mine.getByRole("button", { name: "Está com você" })).toBeDisabled();

    const others = within(card("Cabo HDMI 2 m"));
    expect(others.getByText("Emprestado no momento")).toBeInTheDocument();
    expect(others.getByRole("button", { name: "Emprestado" })).toBeDisabled();
    expect(card("Cabo HDMI 2 m").textContent).not.toMatch(/outra@|devolver até/);

    const maintenance = within(card("Notebook 15 polegadas"));
    expect(maintenance.getByText("Em manutenção")).toBeInTheDocument();
    expect(maintenance.getByText("Teclado com defeito")).toBeInTheDocument();
    expect(maintenance.getByRole("button", { name: "Indisponível" })).toBeDisabled();
  });

  it("CA-8: com 3 itens em aberto, os disponíveis mostram Limite de 3 itens, desabilitado", async () => {
    const api = new FakeApi().lend(PROFESSOR.email, 1).lend(PROFESSOR.email, 2).lend(PROFESSOR.email, 3);
    await openCatalog(api);

    for (const name of ["Webcam Full HD"]) {
      expect(within(card(name)).getByRole("button", { name: "Limite de 3 itens" })).toBeDisabled();
    }
    expect(screen.queryByRole("button", { name: "Solicitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("CA-8: com item em atraso, os botões ficam Bloqueado por atraso e o banner leva a Meus empréstimos", async () => {
    const api = new FakeApi().lend(PROFESSOR.email, 2, -1);
    const app = await openCatalog(api);

    expect(within(card("Monitor 24 polegadas")).getByText("Em atraso")).toBeInTheDocument();
    for (const name of ["Notebook 14 polegadas", "Cabo HDMI 2 m", "Webcam Full HD"]) {
      expect(within(card(name)).getByRole("button", { name: "Bloqueado por atraso" })).toBeDisabled();
    }
    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent(/atraso/);
    fireEvent.click(within(banner).getByRole("link", { name: "Ver meus empréstimos" }));
    await screen.findByRole("heading", { name: "Meus empréstimos" });
    expect(app.path()).toBe("/meus-emprestimos");
  });

  it("CA-9: Solicitar abre o modal com Devolver até; Confirmar cria, mostra toast, o item vira Está com você e entra em Meus empréstimos", async () => {
    const api = new FakeApi();
    const app = await openCatalog(api);
    fireEvent.click(within(card("Webcam Full HD")).getByRole("button", { name: "Solicitar" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Solicitar empréstimo" }));
    const due = formatDate(addDays(saoPauloDate(), 14));
    expect(dialog.getByText("Webcam Full HD · TI-0005")).toBeInTheDocument();
    expect(dialog.getByText("Devolver até").nextSibling).toHaveTextContent(due);

    fireEvent.click(dialog.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("status")).toHaveTextContent(`Empréstimo registrado: devolver Webcam Full HD até ${due}.`);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.requests).toEqual([ITEMS[4].id]);
    expect(await within(card("Webcam Full HD")).findByRole("button", { name: "Está com você" })).toBeDisabled();
    expect(screen.getByText("3 de 5 equipamentos disponíveis agora")).toBeInTheDocument();

    fireEvent.click(navbar().getByRole("link", { name: "Meus empréstimos" }));
    expect(await screen.findByText("Webcam Full HD")).toBeInTheDocument();
    expect(app.path()).toBe("/meus-emprestimos");
  });

  it("CA-9: Cancelar, clique fora e Esc fecham sem criar", async () => {
    const api = new FakeApi();
    await openCatalog(api);
    const ask = () => fireEvent.click(within(card("Notebook 14 polegadas")).getByRole("button", { name: "Solicitar" }));

    ask();
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    ask();
    fireEvent.click(within(await screen.findByRole("dialog")).getByText(/registrado na hora/)); // inside: stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("dialog-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    ask();
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(api.requests).toEqual([]);
    expect(within(card("Notebook 14 polegadas")).getByRole("button", { name: "Solicitar" })).toBeEnabled();
  });

  it("CA-9: se a API recusar, o modal mostra o motivo e o catálogo é atualizado", async () => {
    const api = new FakeApi();
    await openCatalog(api);
    fireEvent.click(within(card("Cabo HDMI 2 m")).getByRole("button", { name: "Solicitar" }));
    // Someone else got it first.
    api.lend("outra@empresa.test", 3).refuseNext(409, "already_loaned", "Este equipamento já está emprestado.");
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Confirmar" }));

    expect(await within(screen.getByRole("dialog")).findByRole("alert")).toHaveTextContent("Este equipamento já está emprestado.");
    expect(await within(card("Cabo HDMI 2 m")).findByRole("button", { name: "Emprestado" })).toBeDisabled();
  });

  it("CA-10: Operações vê o catálogo sem botão de solicitar e sem a aba Meus empréstimos", async () => {
    const app = await openCatalog(new FakeApi().lend(PROFESSOR.email, 1), OPS.email);

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(5);
    for (const c of cards) expect(within(c).queryAllByRole("button")).toEqual([]);
    expect(screen.queryByRole("button", { name: "Solicitar" })).not.toBeInTheDocument();
    expect(navbar().queryByRole("link", { name: "Meus empréstimos" })).not.toBeInTheDocument();

    await app.router.navigate("/meus-emprestimos");
    await waitFor(() => expect(app.path()).toBe("/catalogo"));
  });

  it("CA-11: busca por nome e patrimônio sem diferenciar maiúsculas, a cada tecla, e filtros exclusivos que combinam com a busca", async () => {
    await openCatalog(new FakeApi().lend("outra@empresa.test", 1));
    const search = screen.getByRole("searchbox", { name: "Buscar por nome ou patrimônio" });

    fireEvent.change(search, { target: { value: "NOTEBOOK" } });
    expect(cardNames()).toEqual(["Notebook 14 polegadas", "Notebook 15 polegadas"]);
    fireEvent.change(search, { target: { value: "ti-0005" } });
    expect(cardNames()).toEqual(["Webcam Full HD"]);
    fireEvent.change(search, { target: { value: "" } });
    expect(cardNames()).toHaveLength(5);

    const chip = (label: string) => screen.getByRole("button", { name: label });
    fireEvent.click(chip("Disponíveis"));
    expect(chip("Disponíveis")).toHaveAttribute("aria-pressed", "true");
    expect(chip("Todos")).toHaveAttribute("aria-pressed", "false");
    expect(cardNames()).toEqual(["Monitor 24 polegadas", "Cabo HDMI 2 m", "Webcam Full HD"]);
    fireEvent.click(chip("Emprestados"));
    expect(cardNames()).toEqual(["Notebook 14 polegadas"]);
    fireEvent.click(chip("Em manutenção"));
    expect(cardNames()).toEqual(["Notebook 15 polegadas"]);

    fireEvent.change(search, { target: { value: "monitor" } });
    expect(screen.queryAllByRole("article")).toEqual([]);
    expect(screen.getByText("Nenhum equipamento encontrado.")).toBeInTheDocument();
    fireEvent.click(chip("Todos"));
    expect(cardNames()).toEqual(["Monitor 24 polegadas"]);
  });
});

describe("meus empréstimos", () => {
  it("CA-12: contagem, barra de 3 traços e uma linha por empréstimo com retirada, devolução e pill", async () => {
    const api = new FakeApi().lend(PROFESSOR.email, 2, 5).lend(PROFESSOR.email, 5, -2).lend("outra@empresa.test", 1);
    renderApp("/meus-emprestimos", { auth: signedIn(), api });

    expect(await screen.findByText("2 de 3 itens em seu nome · prazo padrão de 14 dias")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2 de 3 itens em uso" }).children).toHaveLength(3);

    const rows = within(screen.getByRole("list", { name: "Empréstimos em aberto" })).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    const today = formatDate(saoPauloDate());
    expect(rows[0]).toHaveTextContent("Monitor 24 polegadas");
    expect(rows[0]).toHaveTextContent("TI-0002");
    expect(rows[0]).toHaveTextContent(`Retirada${today}`);
    expect(rows[0]).toHaveTextContent(`Devolver até${formatDate(addDays(saoPauloDate(), 5))}`);
    expect(within(rows[0]).getByText("Emprestado")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Em atraso")).toBeInTheDocument();
    expect(screen.queryByText("Notebook 14 polegadas")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Devolver/ })).not.toBeInTheDocument();
  });

  it("CA-12: sem empréstimos mostra o estado vazio com Ir ao catálogo", async () => {
    const app = renderApp("/meus-emprestimos", { auth: signedIn(), api: new FakeApi() });
    expect(await screen.findByText("Você não está com nenhum equipamento.")).toBeInTheDocument();
    expect(screen.getByText("0 de 3 itens em seu nome · prazo padrão de 14 dias")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Ir ao catálogo" }));
    await screen.findByRole("heading", { name: "Catálogo" });
    expect(app.path()).toBe("/catalogo");
  });
});
