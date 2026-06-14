import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "ERP Damaris",
  description: "Sistem ERP untuk bisnis tas dan dompet kulit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <main className="pb-16">{children}</main>
        <Navbar />
      </body>
    </html>
  );
}
