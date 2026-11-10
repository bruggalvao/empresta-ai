import { useOutletContext } from "react-router";
import type { Me } from "../lib/api/types";

/** The signed-in person, provided by AppLayout to every screen inside it. */
export const useMe = () => useOutletContext<Me>();
