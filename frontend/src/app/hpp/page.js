"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "@/lib/api";

const DEFAULT_KOMPONEN = [
  { nama_bahan: "Kulit", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
  { nama_bahan: "Kain", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
  { nama_bahan: "Jasa jahit", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
  { nama_bahan: "Iklan", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
  { nama_bahan: "Packaging", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
];

export default function HPPPage() {
  const [hppList, setHppList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const [form, setForm] = useState({
    nama: "",
    kode: "",
    margin_pct: 300,
    komponen: DEFAULT_KOMPONEN.map((k) => ({ ...k })),
  });

  useEffect(() => {
    let aktif = true;
    axios
      .get(`${API}/hpp`)
      .then((res) => {
        if (aktif) setHppList(res.data);
      })
      .catch(() => {
        if (aktif) alert("Gagal mengambil data HPP");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [refresh]);

  const triggerRefresh = () => setRefresh((n) => n + 1);

  const handleKomponenChange = (index, field, value) => {
    const komponen = [...form.komponen];
    komponen[index] = { ...komponen[index], [field]: parseFloat(value) || 0 };
    const { harga_belanja, jumlah_beli } = komponen[index];
    komponen[index].modal_pcs =
      jumlah_beli > 0 ? harga_belanja / jumlah_beli : 0;
    setForm((prev) => ({ ...prev, komponen }));
  };

  const handleNamaBahanChange = (index, value) => {
    const komponen = [...form.komponen];
    komponen[index] = { ...komponen[index], nama_bahan: value };
    setForm((prev) => ({ ...prev, komponen }));
  };

  const handleTambahBaris = () => {
    setForm((prev) => ({
      ...prev,
      komponen: [
        ...prev.komponen,
        { nama_bahan: "", harga_belanja: 0, jumlah_beli: 0, modal_pcs: 0 },
      ],
    }));
  };

  const handleHapusBaris = (index) => {
    setForm((prev) => ({
      ...prev,
      komponen: prev.komponen.filter((_, i) => i !== index),
    }));
  };

  const hpp = form.komponen.reduce((sum, k) => sum + k.modal_pcs, 0);
  const margin = hpp * (form.margin_pct / 100);
  const harga_jual = hpp + margin;

  const handleBukaForm = () => {
    setEditData(null);
    setForm({
      nama: "",
      kode: "",
      margin_pct: 300,
      komponen: DEFAULT_KOMPONEN.map((k) => ({ ...k })),
    });
    setShowForm(true);
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/hpp/${id}`);
      const data = res.data;
      setEditData(data);
      setForm({
        nama: data.nama,
        kode: data.kode,
        margin_pct: data.margin_pct,
        komponen: data.komponen.map((k) => ({
          nama_bahan: k.nama_bahan,
          harga_belanja: k.harga_belanja,
          jumlah_beli: k.jumlah_beli,
          modal_pcs: k.modal_pcs,
        })),
      });
      setShowForm(true);
    } catch (err) {
      alert("Gagal mengambil data kalkulasi");
    }
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.kode) {
      alert("Nama dan kode produk harus diisi");
      return;
    }
    const payload = {
      ...form,
      margin_pct: parseFloat(form.margin_pct),
      hpp,
      harga_jual,
      komponen: form.komponen.filter((k) => k.nama_bahan && k.modal_pcs > 0),
    };
    try {
      if (editData) {
        await axios.put(`${API}/hpp/${editData.id}`, payload);
        alert(`Kalkulasi & produk ${form.nama} berhasil diperbarui!`);
      } else {
        await axios.post(`${API}/hpp`, payload);
        alert(`Produk ${form.nama} berhasil dibuat dari kalkulasi HPP!`);
      }
      setShowForm(false);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan kalkulasi HPP");
    }
  };

  const handleDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/hpp/${id}`);
      setDetailData(res.data);
      setShowDetail(true);
    } catch (err) {
      alert("Gagal mengambil detail");
    }
  };

  const handleHapus = async (id) => {
    if (
      !confirm("Hapus kalkulasi ini? Produk terkait tidak akan ikut terhapus.")
    )
      return;
    try {
      await axios.delete(`${API}/hpp/${id}`);
      triggerRefresh();
    } catch (err) {
      alert("Gagal menghapus kalkulasi");
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Kalkulator HPP</h1>
        <button
          onClick={handleBukaForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Hitung HPP
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Memuat data...</p>
      ) : hppList.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">
          Belum ada kalkulasi HPP
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {hppList.map((h) => (
            <div
              key={h.id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-gray-400 font-mono">
                    {h.kode}
                  </span>
                  <h2 className="font-semibold text-gray-800 mt-0.5">
                    {h.nama}
                  </h2>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDetail(h.id)}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => handleEdit(h.id)}
                    className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleHapus(h.id)}
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
                    {formatRupiah(h.hpp)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Margin</p>
                  <p className="font-medium text-blue-600">{h.margin_pct}%</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Harga Jual</p>
                  <p className="font-medium text-green-600">
                    {formatRupiah(h.harga_jual)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {editData ? "Edit Kalkulasi HPP" : "Hitung HPP Produk"}
            </h2>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="text-sm text-gray-600">Nama Produk</label>
                <input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth: Tas Kulit Klasik"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Kode Produk</label>
                <input
                  value={form.kode}
                  disabled={!!editData}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  placeholder="cth: TAS-007"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Margin (%)</label>
                <input
                  type="number"
                  value={form.margin_pct}
                  onChange={(e) =>
                    setForm({ ...form, margin_pct: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Komponen Bahan Baku
                </p>
                <button
                  onClick={handleTambahBaris}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg"
                >
                  + Tambah Baris
                </button>
              </div>

              <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 mb-1 px-1">
                <span className="col-span-4">Nama Bahan</span>
                <span className="col-span-3">Harga Beli</span>
                <span className="col-span-2">Jml Prod yg dpt dibuat</span>
                <span className="col-span-2">Modal/pcs</span>
                <span className="col-span-1"></span>
              </div>

              {form.komponen.map((k, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-1 mb-1.5 items-center"
                >
                  <input
                    value={k.nama_bahan}
                    onChange={(e) =>
                      handleNamaBahanChange(index, e.target.value)
                    }
                    placeholder="Bahan"
                    className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    value={k.harga_belanja || ""}
                    onChange={(e) =>
                      handleKomponenChange(
                        index,
                        "harga_belanja",
                        e.target.value,
                      )
                    }
                    placeholder="0"
                    className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    value={k.jumlah_beli || ""}
                    onChange={(e) =>
                      handleKomponenChange(index, "jumlah_beli", e.target.value)
                    }
                    placeholder="0"
                    className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <p className="col-span-2 text-xs text-gray-700 font-medium px-1">
                    {k.modal_pcs > 0 ? formatRupiah(k.modal_pcs) : "-"}
                  </p>
                  <button
                    onClick={() => handleHapusBaris(index)}
                    className="col-span-1 text-red-400 text-xs text-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Hasil Kalkulasi
              </p>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">HPP</span>
                <span className="font-semibold text-gray-800">
                  {formatRupiah(hpp)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Margin ({form.margin_pct}%)
                </span>
                <span className="font-semibold text-gray-800">
                  {formatRupiah(margin)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-100 pt-2 mt-2">
                <span className="font-semibold text-gray-700">Harga Jual</span>
                <span className="font-bold text-green-600">
                  {formatRupiah(harga_jual)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
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
                {editData ? "Simpan Perubahan" : "Simpan & Buat Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {detailData.nama}
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  {detailData.kode}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 mb-1 px-1">
              <span className="col-span-5">Nama Bahan</span>
              <span className="col-span-3">Harga Beli</span>
              <span className="col-span-2">Jml prod yg dpt dibuat</span>
              <span className="col-span-2">Modal/pcs</span>
            </div>

            {detailData.komponen?.map((k, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-1 py-1.5 border-b border-gray-50 text-sm"
              >
                <span className="col-span-5 text-gray-800">{k.nama_bahan}</span>
                <span className="col-span-3 text-gray-500 text-xs">
                  {formatRupiah(k.harga_belanja)}
                </span>
                <span className="col-span-2 text-gray-500 text-xs">
                  {k.jumlah_beli}
                </span>
                <span className="col-span-2 text-gray-800 font-medium text-xs">
                  {formatRupiah(k.modal_pcs)}
                </span>
              </div>
            ))}

            <div className="bg-blue-50 rounded-xl p-4 mt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">HPP</span>
                <span className="font-semibold text-gray-800">
                  {formatRupiah(detailData.hpp)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  Margin ({detailData.margin_pct}%)
                </span>
                <span className="font-semibold text-gray-800">
                  {formatRupiah(detailData.hpp * (detailData.margin_pct / 100))}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-100 pt-2 mt-2">
                <span className="font-semibold text-gray-700">Harga Jual</span>
                <span className="font-bold text-green-600">
                  {formatRupiah(detailData.harga_jual)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
