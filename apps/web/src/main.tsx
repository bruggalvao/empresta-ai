import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "./app/routes";
import { SessionProvider } from "./app/session";
import "./index.css";
import { createFetchMe } from "./lib/api/me";
import { createSupabaseAuthClient } from "./lib/auth/supabaseAuthClient";
import { getSupabase } from "./lib/supabaseClient";

const services = { auth: createSupabaseAuthClient(getSupabase), fetchMe: createFetchMe() };
const queryClient = new QueryClient();
const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider services={services}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
);
