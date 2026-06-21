import type { Metadata } from "next";
import { AcademicDataProvider } from "@/components/AcademicDataProvider";
import { CommunityAuthProvider } from "@/components/CommunityAuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carlos Fernando López Rengifo | Perfil académico",
  description:
    "Web academica con CV, cursos, publicaciones, linea del tiempo y administracion de archivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <CommunityAuthProvider>
          <AcademicDataProvider>{children}</AcademicDataProvider>
        </CommunityAuthProvider>
      </body>
    </html>
  );
}
