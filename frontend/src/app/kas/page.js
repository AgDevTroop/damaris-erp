"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "@/lib/api";

const KATEGORI_KELUAR = [
  "Bahan Baku",
  "Operasional",
  "Gaji",
  "Peralatan",
  "Lain-lain",
];
const KATEGORI_MASUK = ["Penjualan", "Modal", "Pinjaman", "Lain-lain"];

export default function KasPage() {
  const [kasList, setKasList] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState("semua");
  const [form, setForm] = useState({
    tanggal: "",
    keterangan: "",
    kategori: "",
    jenis: "keluar",
    jumlah: "",
  });

  useEffect(() => {
    let aktif = true;
    Promise.all([axios.get(`${API}/kas`), axios.get(`${API}/kas/ringkasan`)])
      .then(([kasRes, ringkasanRes]) => {
        if (aktif) {
          setKasList(kasRes.data);
          setRingkasan(ringkasanRes.data);
        }
      })
      .catch(() => {
        if (aktif) alert("Gagal mengambil data kas");
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
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "jenis") updated.kategori = "";
    setForm(updated);
  };

  const handleTambah = () => {
    setEditData(null);
    const today = new Date().toISOString().split("T")[0];
    setForm({
      tanggal: today,
      keterangan: "",
      kategori: "",
      jenis: "keluar",
      jumlah: "",
    });
    setShowForm(true);
  };

  const handleEdit = (kas) => {
    setEditData(kas);
    setForm({
      tanggal: kas.tanggal.split("T")[0],
      keterangan: kas.keterangan,
      kategori: kas.kategori,
      jenis: kas.jenis,
      jumlah: kas.jumlah,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.tanggal || !form.keterangan || !form.kategori || !form.jumlah) {
      alert("Semua field harus diisi");
      return;
    }
    const payload = { ...form, jumlah: parseFloat(form.jumlah) };
    try {
      if (editData) {
        await axios.put(`${API}/kas/${editData.id}`, payload);
      } else {
        await axios.post(`${API}/kas`, payload);
      }
      setShowForm(false);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan data kas");
    }
  };

  const handleHapus = async (id) => {
    if (!confirm("Hapus data kas ini?")) return;
    try {
      await axios.delete(`${API}/kas/${id}`);
      triggerRefresh();
    } catch (err) {
      alert("Gagal menghapus data kas");
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  const formatTanggal = (str) =>
    new Date(str).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const filteredList = kasList.filter((k) =>
    filter === "semua" ? true : k.jenis === filter,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Kas</h1>
        <button
          onClick={handleTambah}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah
        </button>
      </div>

      {/* Ringkasan */}
      {ringkasan && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Masuk</p>
            <p className="font-semibold text-green-600 text-sm mt-0.5">
              {formatRupiah(ringkasan.total_masuk)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Keluar</p>
            <p className="font-semibold text-red-500 text-sm mt-0.5">
              {formatRupiah(ringkasan.total_keluar)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400">Saldo</p>
            <p
              className={`font-semibold text-sm mt-0.5 ${ringkasan.saldo >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              {formatRupiah(ringkasan.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["semua", "masuk", "keluar"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List Kas */}
      {loading ? (
        <p className="text-center text-gray-500 mt-10">Memuat data...</p>
      ) : filteredList.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Belum ada data</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredList.map((k) => (
            <div
              key={k.id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        k.jenis === "masuk"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {k.jenis}
                    </span>
                    <span className="text-xs text-gray-400">{k.kategori}</span>
                  </div>
                  <p className="font-medium text-gray-800 mt-1">
                    {k.keterangan}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTanggal(k.tanggal)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p
                    className={`font-semibold ${k.jenis === "masuk" ? "text-green-600" : "text-red-500"}`}
                  >
                    {k.jenis === "masuk" ? "+" : "-"}
                    {formatRupiah(k.jumlah)}
                  </p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button
                      onClick={() => handleEdit(k)}
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleHapus(k.id)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded"
                    >
                      Hapus
                    </button>
                  </div>
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
              {editData ? "Edit Kas" : "Tambah Kas"}
            </h2>
            <div className="flex flex-col gap-3">
              {/* Jenis */}
              <div>
                <label className="text-sm text-gray-600">Jenis</label>
                <div className="flex gap-2 mt-1">
                  {["keluar", "masuk"].map((j) => (
                    <button
                      key={j}
                      onClick={() =>
                        setForm({ ...form, jenis: j, kategori: "" })
                      }
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                        form.jenis === j
                          ? j === "masuk"
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
              {/* Tanggal */}
              <div>
                <label className="text-sm text-gray-600">Tanggal</label>
                <input
                  name="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              {/* Keterangan */}
              <div>
                <label className="text-sm text-gray-600">Keterangan</label>
                <input
                  name="keterangan"
                  value={form.keterangan}
                  onChange={handleChange}
                  placeholder="cth: Beli kulit sapi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              {/* Kategori */}
              <div>
                <label className="text-sm text-gray-600">Kategori</label>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                >
                  <option value="">Pilih kategori</option>
                  {(form.jenis === "keluar"
                    ? KATEGORI_KELUAR
                    : KATEGORI_MASUK
                  ).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              {/* Jumlah */}
              <div>
                <label className="text-sm text-gray-600">Jumlah (Rp)</label>
                <input
                  name="jumlah"
                  type="number"
                  value={form.jumlah}
                  onChange={handleChange}
                  placeholder="cth: 50000"
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
