"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "@/lib/api";

const CHANNEL_OPTIONS = [
  "Tokopedia",
  "Shopee",
  "WhatsApp",
  "Instagram",
  "Langsung",
  "Lain-lain",
];
const STATUS_OPTIONS = ["pending", "proses", "selesai", "batal"];

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  proses: "bg-blue-100 text-blue-600",
  selesai: "bg-green-100 text-green-700",
  batal: "bg-red-100 text-red-500",
};

export default function OrderPage() {
  const [orderList, setOrderList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [filterStatus, setFilterStatus] = useState("semua");

  const [form, setForm] = useState({
    nomor: "",
    tanggal: "",
    nama_pembeli: "",
    channel: "",
    status: "pending",
    catatan: "",
    items: [],
  });

  useEffect(() => {
    let aktif = true;
    Promise.all([axios.get(`${API}/order`), axios.get(`${API}/produk`)])
      .then(([orderRes, produkRes]) => {
        if (aktif) {
          setOrderList(orderRes.data);
          setProdukList(produkRes.data);
        }
      })
      .catch(() => {
        if (aktif) alert("Gagal mengambil data");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [refresh]);

  const triggerRefresh = () => setRefresh((n) => n + 1);

  const generateNomor = () => {
    const now = new Date();
    const tgl = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 900) + 100;
    return `ORD-${tgl}-${rand}`;
  };

  const handleBukaForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      nomor: generateNomor(),
      tanggal: today,
      nama_pembeli: "",
      channel: "",
      status: "pending",
      catatan: "",
      items: [],
    });
    setShowForm(true);
  };

  const handleTambahItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { kode_produk: "", nama_produk: "", harga: 0, qty: 1, subtotal: 0 },
      ],
    }));
  };

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };

    if (field === "kode_produk") {
      const produk = produkList.find((p) => p.kode === value);
      if (produk) {
        items[index].nama_produk = produk.nama;
        items[index].harga = produk.harga_jual;
        items[index].subtotal = produk.harga_jual * items[index].qty;
      }
    }

    if (field === "qty") {
      items[index].subtotal = items[index].harga * parseInt(value || 0);
    }

    setForm((prev) => ({ ...prev, items }));
  };

  const handleHapusItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totalOrder = form.items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async () => {
    if (!form.nama_pembeli || !form.channel || form.items.length === 0) {
      alert("Nama pembeli, channel, dan minimal 1 produk harus diisi");
      return;
    }
    const payload = {
      ...form,
      total: totalOrder,
      items: form.items.map((item) => ({
        ...item,
        qty: parseInt(item.qty),
        subtotal: item.harga * parseInt(item.qty),
      })),
    };
    try {
      await axios.post(`${API}/order`, payload);
      setShowForm(false);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal menyimpan order");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/order/${id}/status`, { status });
      triggerRefresh();
    } catch (err) {
      alert("Gagal update status");
    }
  };

  const handleHapus = async (id) => {
    if (!confirm("Hapus order ini?")) return;
    try {
      await axios.delete(`${API}/order/${id}`);
      triggerRefresh();
    } catch (err) {
      alert("Gagal menghapus order");
    }
  };

  const handleDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/order/${id}`);
      setDetailData(res.data);
      setShowDetail(true);
    } catch (err) {
      alert("Gagal mengambil detail order");
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

  const filteredList = orderList.filter((o) =>
    filterStatus === "semua" ? true : o.status === filterStatus,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Order</h1>
        <button
          onClick={handleBukaForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Tambah
        </button>
      </div>

      {/* Filter Status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["semua", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              filterStatus === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List Order */}
      {loading ? (
        <p className="text-center text-gray-500 mt-10">Memuat data...</p>
      ) : filteredList.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">Belum ada order</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredList.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">
                      {o.nomor}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {o.nama_pembeli}
                  </p>
                  <p className="text-xs text-gray-400">
                    {o.channel} · {formatTanggal(o.tanggal)}
                  </p>
                </div>
                <p className="font-semibold text-blue-600">
                  {formatRupiah(o.total)}
                </p>
              </div>

              {/* Aksi */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => handleDetail(o.id)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg"
                >
                  Detail
                </button>
                {STATUS_OPTIONS.filter((s) => s !== o.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(o.id, s)}
                    className={`text-xs px-3 py-1 rounded-lg capitalize ${STATUS_COLOR[s]}`}
                  >
                    → {s}
                  </button>
                ))}
                <button
                  onClick={() => handleHapus(o.id)}
                  className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah Order */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              Tambah Order
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-gray-600">Nomor Order</label>
                <input
                  value={form.nomor}
                  onChange={(e) => setForm({ ...form, nomor: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Nama Pembeli</label>
                <input
                  value={form.nama_pembeli}
                  onChange={(e) =>
                    setForm({ ...form, nama_pembeli: e.target.value })
                  }
                  placeholder="cth: Budi Santoso"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Channel</label>
                <select
                  value={form.channel}
                  onChange={(e) =>
                    setForm({ ...form, channel: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm"
                >
                  <option value="">Pilih channel</option>
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-600">Produk</label>
                  <button
                    onClick={handleTambahItem}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg"
                  >
                    + Tambah Produk
                  </button>
                </div>
                {form.items.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Belum ada produk ditambahkan
                  </p>
                )}
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-100 rounded-lg p-3 mb-2"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400">
                        Produk {index + 1}
                      </span>
                      <button
                        onClick={() => handleHapusItem(index)}
                        className="text-xs text-red-500"
                      >
                        Hapus
                      </button>
                    </div>
                    <select
                      value={item.kode_produk}
                      onChange={(e) =>
                        handleItemChange(index, "kode_produk", e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 text-sm"
                    >
                      <option value="">Pilih produk</option>
                      {produkList.map((p) => (
                        <option key={p.kode} value={p.kode}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(index, "qty", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400">
                          Subtotal
                        </label>
                        <p className="text-sm font-medium text-gray-700 py-1.5">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {form.items.length > 0 && (
                <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">
                    Total
                  </span>
                  <span className="font-bold text-blue-600">
                    {formatRupiah(totalOrder)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">
                  Catatan (opsional)
                </label>
                <input
                  value={form.catatan}
                  onChange={(e) =>
                    setForm({ ...form, catatan: e.target.value })
                  }
                  placeholder="cth: Warna coklat, kirim bubble wrap"
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

      {/* Modal Detail Order */}
      {showDetail && detailData && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Detail Order
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  {detailData.nomor}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[detailData.status]}`}
              >
                {detailData.status}
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Pembeli</span>
                <span className="font-medium text-gray-600">
                  {detailData.nama_pembeli}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Channel</span>
                <span className="font-medium text-gray-600">
                  {detailData.channel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal</span>
                <span className="font-medium text-gray-600">
                  {formatTanggal(detailData.tanggal)}
                </span>
              </div>
              {detailData.catatan && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Catatan</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {detailData.catatan}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 mb-3">
              <p className="text-xs text-gray-400 mb-2">Produk</p>
              {detailData.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1.5 border-b border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-700">
                      {item.nama_produk}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatRupiah(item.harga)} × {item.qty}
                    </p>
                  </div>
                  <p className="font-medium text-gray-700">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3 mb-4">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-blue-600">
                {formatRupiah(detailData.total)}
              </span>
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
