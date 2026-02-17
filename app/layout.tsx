import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "sonner";

const soraLight = localFont({
  src: "../public/font/Sora-Light.ttf",
  variable: "--font-sora-light",
  weight: "300",
});

export const metadata: Metadata = {
  title: "Sistema POS Textil",
  description: "Sistema de punto de venta para negocio textil",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${soraLight.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster
            richColors
            expand={true}
              position="top-center"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
