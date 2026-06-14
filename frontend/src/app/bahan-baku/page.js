"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "@/lib/api";

const SATUAN_OPTIONS = [
  "lembar",
  "meter",
  "kg",
  "gram",
  "buah",
  "set",
  "roll",
  "liter",
];

export default function BahanBakuPage() {
  const [bahanList, setBahanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStok, setShowStok] = useState(false);
  const [editData, setEditData] = useState(null);
  const [stokData, setStokData] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({
    nama: "",
    satuan: "",
    stok: "",
    stok_min: "",
    harga_beli: "",
  });
  const [formStok, setFormStok] = useState({ jumlah: "", jenis: "tambah" });

  useEffect(() => {
    let aktif = true;
    axios
      .get(`${API}/bahan-baku`)
      .then((res) => {
        if (aktif) setBahanList(res.data);
      })
      .catch(() => {
        if (aktif) alert("Gagal mengambil data bahan baku");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [refresh]);

  const triggerRefresh = () => setRefresh((n) => n + 1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTambah = () => {
    setEditData(null);
    setForm({ nama: "", satuan: "", stok: "", stok_min: "", harga_beli: "" });
    setShowForm(true);
  };

  const handleEdit = (bahan) => {
    setEditData(bahan);
    setForm({
      nama: bahan.nama,
      satuan: bahan.satuan,
      stok: bahan.stok,
      stok_min: bahan.stok_min,
      harga_beli: bahan.harga_beli,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (
      !form.nama ||
      !form.satuan ||
      form.stok === "" ||
      form.harga_beli === ""
    ) {
      alert("Semua field harus diisi");
      return;
    }
    const payload = {
      ...form,
      stok: parseFloat(form.stok),
      stok_min: parseFloat(form.stok_min || 0),
      harga_beli: parseFloat(form.harga_beli),
    };
    try {
      if (editData) {
        await axios.put(`${API}/bahan-baku/${editData.id}`, payload);
      } else {
        await axios.post(`${API}/bahan-baku`, payload);
      }
      setShowForm(false);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan bahan baku");
    }
  };

  const handleHapus = async (id) => {
    if (!confirm("Hapus bahan baku ini?")) return;
    try {
      await axios.delete(`${API}/bahan-baku/${id}`);
      triggerRefresh();
    } catch (err) {
      alert("Gagal menghapus bahan baku");
    }
  };

  const handleBukaStok = (bahan) => {
    setStokData(bahan);
    setFormStok({ jumlah: "", jenis: "tambah" });
    setShowStok(true);
  };

  const handleUpdateStok = async () => {
    if (!formStok.jumlah) {
      alert("Jumlah harus diisi");
      return;
    }
    try {
      await axios.post(`${API}/bahan-baku/${stokData.id}/stok`, {
        jumlah: parseFloat(formStok.jumlah),
        jenis: formStok.jenis,
      });
      setShowStok(false);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal update stok");
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const stokStatus = (bahan) => {
    if (bahan.stok === 0)
      return { label: "Habis", color: "bg-red-100 text-red-600" };
    if (bahan.stok <= bahan.stok_min)
      return { label: "Menipis", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Aman", color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Bahan Baku</h1>
        <button
          onClick={handleTambah}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-500 mt-10">Memuat data...</p>
      ) : bahanList.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Belum ada bahan baku</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bahanList.map((b) => {
            const status = stokStatus(b);
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-800">{b.nama}</h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Stok:{" "}
                      <span className="font-medium text-gray-700">
                        {b.stok} {b.satuan}
                      </span>
                      {b.stok_min > 0 && (
                        <span className="text-gray-400">
                          {" "}
                          · Min: {b.stok_min} {b.satuan}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Harga beli: {formatRupiah(b.harga_beli)} / {b.satuan}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => handleBukaStok(b)}
                      className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg font-medium"
                    >
                      Update Stok
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleHapus(b.id)}
                        className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {editData ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-gray-600">Nama Bahan</label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="cth: Kulit Sapi Pull Up"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Satuan</label>
                <select
                  name="satuan"
                  value={form.satuan}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                >
                  <option value="">Pilih satuan</option>
                  {SATUAN_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Stok Awal</label>
                  <input
                    name="stok"
                    type="number"
                    value={form.stok}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Stok Minimum</label>
                  <input
                    name="stok_min"
                    type="number"
                    value={form.stok_min}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Harga Beli per Satuan (Rp)
                </label>
                <input
                  name="harga_beli"
                  type="number"
                  value={form.harga_beli}
                  onChange={handleChange}
                  placeholder="cth: 150000"
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

      {/* Modal Update Stok */}
      {showStok && stokData && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h2 className="text-lg font-bold mb-1 text-gray-800">
              Update Stok
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {stokData.nama} · Stok saat ini: {stokData.stok} {stokData.satuan}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-gray-600">Jenis</label>
                <div className="flex gap-2 mt-1">
                  {["tambah", "kurang"].map((j) => (
                    <button
                      key={j}
                      onClick={() => setFormStok({ ...formStok, jenis: j })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                        formStok.jenis === j
                          ? j === "tambah"
                            ? "bg-green-600 text-white"
                            : "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Jumlah ({stokData.satuan})
                </label>
                <input
                  type="number"
                  value={formStok.jumlah}
                  onChange={(e) =>
                    setFormStok({ ...formStok, jumlah: e.target.value })
                  }
                  placeholder="cth: 5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowStok(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStok}
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
