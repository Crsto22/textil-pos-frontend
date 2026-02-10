import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "sonner";

const soraExtraLight = localFont({
  src: "../public/font/Sora-ExtraLight.ttf",
  variable: "--font-sora-extralight",
  weight: "200",
});

const soraSemiBold = localFont({
  src: "../public/font/Sora-SemiBold.ttf",
  variable: "--font-sora-semibold",
  weight: "600",
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
      <body
        className={`${soraExtraLight.variable} ${soraSemiBold.variable} antialiased`}
      >
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
