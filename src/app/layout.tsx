import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hr-HR"><body>{children}</body></html>;
}
