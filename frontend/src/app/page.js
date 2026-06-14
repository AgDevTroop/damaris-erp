"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import API from "@/lib/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    axios
      .get(`${API}/dashboard`)
      .then((res) => {
        if (aktif) setData(res.data);
      })
      .catch(() => {
        if (aktif) alert("Gagal mengambil data dashboard");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Memuat dashboard...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ERP Damaris</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Ringkasan bisnis hari ini
        </p>
      </div>

      {/* Saldo Kas */}
      <div className="bg-blue-600 rounded-2xl p-5 mb-4 text-white">
        <p className="text-sm text-blue-200">Saldo Kas</p>
        <p className="text-3xl font-bold mt-1">
          {formatRupiah(data.kas.saldo)}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs text-blue-200">Masuk</p>
            <p className="text-sm font-semibold">
              {formatRupiah(data.kas.total_masuk)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Keluar</p>
            <p className="text-sm font-semibold">
              {formatRupiah(data.kas.total_keluar)}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Order */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Order</p>
          <Link href="/order" className="text-xs text-blue-600">
            Lihat semua →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-500 mt-0.5">
              {data.order.pending}
            </p>
            <p className="text-xs text-gray-400">order menunggu</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Diproses</p>
            <p className="text-2xl font-bold text-blue-500 mt-0.5">
              {data.order.proses}
            </p>
            <p className="text-xs text-gray-400">sedang dikerjakan</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Selesai</p>
            <p className="text-2xl font-bold text-green-600 mt-0.5">
              {data.order.selesai}
            </p>
            <p className="text-xs text-gray-400">order selesai</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Omset</p>
            <p className="text-lg font-bold text-green-600 mt-0.5">
              {formatRupiah(data.order.omset_selesai)}
            </p>
            <p className="text-xs text-gray-400">dari order selesai</p>
          </div>
        </div>
      </div>

      {/* Peringatan Stok Menipis */}
      {data.bahan_menipis.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-gray-700">
              ⚠️ Stok Menipis
            </p>
            <Link href="/bahan-baku" className="text-xs text-blue-600">
              Kelola →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {data.bahan_menipis.map((b) => (
              <div
                key={b.id}
                className="bg-red-50 border border-red-100 rounded-xl p-3 flex justify-between items-center"
              >
                <p className="text-sm font-medium text-red-700">{b.nama}</p>
                <p className="text-xs text-red-500">
                  {b.stok === 0 ? "Habis" : `Sisa ${b.stok} ${b.satuan}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortcut Menu */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Menu</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "Produk",
              href: "/produk",
              icon: "🏷️",
              desc: `${data.total_produk} produk`,
            },
            { label: "Kas", href: "/kas", icon: "💰", desc: "Catat transaksi" },
            {
              label: "Bahan Baku",
              href: "/bahan-baku",
              icon: "🧵",
              desc: "Kelola stok",
            },
            {
              label: "Order",
              href: "/order",
              icon: "📦",
              desc: "Kelola pesanan",
            },
            {
              label: "Kalkulator HPP",
              href: "/hpp",
              icon: "🧮",
              desc: "Hitung HPP",
            },
          ].map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <span className="text-2xl">{menu.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {menu.label}
                </p>
                <p className="text-xs text-gray-400">{menu.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
