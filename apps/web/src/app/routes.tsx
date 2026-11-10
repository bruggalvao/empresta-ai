import { Navigate, type RouteObject } from "react-router";
import Home from "../pages/Home";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import { PublicOnly, RequireSession } from "./guards";

// spec login, decisões: / landing · /entrar login · /inicio protected.
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
    path: "/inicio",
    element: (
      <RequireSession>
        <Home />
      </RequireSession>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
