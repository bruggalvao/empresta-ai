import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

type ConnectionStatus = "checking" | "ok" | "error";

function App() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
        } else {
          setStatus("ok");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>empresta.ai</h1>
      <p>Controle de empréstimo de equipamentos internos.</p>

      <section aria-live="polite">
        <h2>Status da conexão com o Supabase</h2>
        {status === "checking" && <p>Verificando...</p>}
        {status === "ok" && <p>✅ Conectado com sucesso.</p>}
        {status === "error" && <p>❌ Falha na conexão: {errorMessage}</p>}
      </section>
    </main>
  );
}

export default App;
