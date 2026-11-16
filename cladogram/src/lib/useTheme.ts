"use client";

import { useEffect, useState } from "react";
import { getTheme, onThemeChange, type Theme } from "./theme";

/** The theme as React state: "dark" on the server and the first render, then the real value. */
export function useTheme(): Theme {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => {
    setT(getTheme());
    return onThemeChange(setT);
  }, []);
  return t;
}
