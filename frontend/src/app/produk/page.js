"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "@/lib/api";

export default function ProdukPage() {
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    hpp: "",
    harga_jual: "",
  });

  // Ambil semua produk dari backend
  const fetchProduk = async () => {
    try {
      const res = await axios.get(`${API}/produk`);
      setProdukList(res.data);
    } catch (err) {
      alert("Gagal mengambil data produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduk();
  }, []);

  // Handle input form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Buka form tambah
  const handleTambah = () => {
    setEditData(null);
    setForm({ kode: "", nama: "", hpp: "", harga_jual: "" });
    setShowForm(true);
  };

  // Buka form edit
  const handleEdit = (produk) => {
    setEditData(produk);
    setForm({
      kode: produk.kode,
      nama: produk.nama,
      hpp: produk.hpp,
      harga_jual: produk.harga_jual,
    });
    setShowForm(true);
  };

  // Submit form tambah / edit
  const handleSubmit = async () => {
    const payload = {
      ...form,
      hpp: parseFloat(form.hpp),
      harga_jual: parseFloat(form.harga_jual),
    };
    try {
      if (editData) {
        await axios.put(`${API}/produk/${editData.kode}`, payload);
      } else {
        await axios.post(`${API}/produk`, payload);
      }
      setShowForm(false);
      fetchProduk();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan produk");
    }
  };

  // Hapus produk
  const handleHapus = async (kode) => {
    if (!confirm(`Hapus produk ${kode}?`)) return;
    try {
      await axios.delete(`${API}/produk/${kode}`);
      fetchProduk();
    } catch (err) {
      alert("Gagal menghapus produk");
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Manajemen Produk</h1>
        <button
          onClick={handleTambah}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah
        </button>
      </div>

      {/* List Produk */}
      {loading ? (
        <p className="text-center text-gray-500 mt-10">Memuat data...</p>
      ) : produkList.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Belum ada produk</p>
      ) : (
        <div className="flex flex-col gap-3">
          {produkList.map((p) => (
            <div
              key={p.kode}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-gray-400 font-mono">
                    {p.kode}
                  </span>
                  <h2 className="font-semibold text-gray-800 mt-0.5">
                    {p.nama}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleHapus(p.kode)}
                    className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">HPP</p>
                  <p className="font-medium text-gray-700">
                    {formatRupiah(p.hpp)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Harga Jual</p>
                  <p className="font-medium text-green-600">
                    {formatRupiah(p.harga_jual)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Margin</p>
                  <p className="font-medium text-blue-600">
                    {(((p.harga_jual - p.hpp) / p.hpp) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {editData ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-gray-600">Kode Produk</label>
                <input
                  name="kode"
                  value={form.kode}
                  onChange={handleChange}
                  disabled={!!editData}
                  placeholder="cth: TAS-001"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Nama Produk</label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="cth: Tas Kulit Medium"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">HPP (Rp)</label>
                <input
                  name="hpp"
                  type="number"
                  value={form.hpp}
                  onChange={handleChange}
                  placeholder="cth: 150000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Harga Jual (Rp)</label>
                <input
                  name="harga_jual"
                  type="number"
                  value={form.harga_jual}
                  onChange={handleChange}
                  placeholder="cth: 350000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
