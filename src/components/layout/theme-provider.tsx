"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/** La app es solo clara (papel editorial). La vista de escenario de los
 *  setlists aplica la clase .dark en su propio contenedor. */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      defaultTheme="light"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
