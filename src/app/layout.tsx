import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { appName } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${appName} · Politička slika Hrvatske`,
    template: `%s | ${appName}`,
  },
  description:
    "Neovisan pregled hrvatskih javnih podataka, institucija i političkog sustava s datiranim izvorima i jasno naznačenim nedostupnim podacima.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hr-HR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
