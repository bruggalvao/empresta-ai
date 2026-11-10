import { Navigate, type RouteObject } from "react-router";
import Catalog from "../pages/Catalog";
import Home from "../pages/Home";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import MyLoans from "../pages/MyLoans";
import AppLayout from "./AppLayout";
import { PublicOnly, RequireSession } from "./guards";

// spec login: / landing · /entrar login · /inicio protected.
// spec solicitar-emprestimo: /catalogo and /meus-emprestimos in the same layout.
export const routes: RouteObject[] = [
  { path: "/", element: <Landing /> },
  {
    path: "/entrar",
    element: (
      <PublicOnly>
        <Login />
      </PublicOnly>
    ),
  },
  {
    element: (
      <RequireSession>
        <AppLayout />
      </RequireSession>
    ),
    children: [
      { path: "/inicio", element: <Home /> },
      { path: "/catalogo", element: <Catalog /> },
      { path: "/meus-emprestimos", element: <MyLoans /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
