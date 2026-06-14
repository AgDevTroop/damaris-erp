"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Produk", href: "/produk", icon: "🏷️" },
  { label: "Kas", href: "/kas", icon: "💰" },
  { label: "Bahan Baku", href: "/bahan-baku", icon: "🧵" },
  { label: "Order", href: "/order", icon: "📦" },
  { label: "HPP", href: "/hpp", icon: "🧮" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {menus.map((menu) => {
          const aktif = pathname === menu.href;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                aktif ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{menu.icon}</span>
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
