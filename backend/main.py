from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERP Damaris API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
        "https://damaris-erp.vercel.app",],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SCHEMA ──────────────────────────────────────────

class ProdukSchema(BaseModel):
    kode:       str
    nama:       str
    hpp:        float
    harga_jual: float

    class Config:
        from_attributes = True

class KasSchema(BaseModel):
    tanggal:    str
    keterangan: str
    kategori:   str
    jenis:      str
    jumlah:     float

    class Config:
        from_attributes = True

class BahanBakuSchema(BaseModel):
    nama:       str
    satuan:     str
    stok:       float
    stok_min:   float
    harga_beli: float

    class Config:
        from_attributes = True

class UpdateStokSchema(BaseModel):
    jumlah: float
    jenis:  str

class OrderItemSchema(BaseModel):
    kode_produk: str
    nama_produk: str
    harga:       float
    qty:         int
    subtotal:    float

class OrderSchema(BaseModel):
    nomor:        str
    tanggal:      str
    nama_pembeli: str
    channel:      str
    status:       str
    catatan:      Optional[str] = None
    total:        float
    items:        List[OrderItemSchema]

class UpdateStatusSchema(BaseModel):
    status: str

# ── ENDPOINT UMUM ───────────────────────────────────

@app.get("/")
def root():
    return {"message": "ERP Damaris API berjalan!"}

# ── ENDPOINT PRODUK ─────────────────────────────────

@app.get("/produk")
def get_produk(db: Session = Depends(get_db)):
    return db.query(models.Produk).all()

@app.post("/produk")
def tambah_produk(produk: ProdukSchema, db: Session = Depends(get_db)):
    existing = db.query(models.Produk).filter(models.Produk.kode == produk.kode).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kode produk sudah ada")
    db_produk = models.Produk(**produk.model_dump())
    db.add(db_produk)
    db.commit()
    db.refresh(db_produk)
    return db_produk

@app.put("/produk/{kode}")
def update_produk(kode: str, produk: ProdukSchema, db: Session = Depends(get_db)):
    db_produk = db.query(models.Produk).filter(models.Produk.kode == kode).first()
    if not db_produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    for key, value in produk.model_dump().items():
        setattr(db_produk, key, value)
    db.commit()
    db.refresh(db_produk)
    return db_produk

@app.delete("/produk/{kode}")
def hapus_produk(kode: str, db: Session = Depends(get_db)):
    db_produk = db.query(models.Produk).filter(models.Produk.kode == kode).first()
    if not db_produk:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    db.delete(db_produk)
    db.commit()
    return {"message": f"Produk {kode} berhasil dihapus"}

# ── ENDPOINT KAS ────────────────────────────────────

@app.get("/kas/ringkasan")
def ringkasan_kas(db: Session = Depends(get_db)):
    semua  = db.query(models.Kas).all()
    masuk  = sum(k.jumlah for k in semua if k.jenis == "masuk")
    keluar = sum(k.jumlah for k in semua if k.jenis == "keluar")
    return {
        "total_masuk":  masuk,
        "total_keluar": keluar,
        "saldo":        masuk - keluar,
    }

@app.get("/kas")
def get_kas(db: Session = Depends(get_db)):
    return db.query(models.Kas).order_by(models.Kas.tanggal.desc()).all()

@app.post("/kas")
def tambah_kas(kas: KasSchema, db: Session = Depends(get_db)):
    db_kas = models.Kas(
        tanggal    = datetime.fromisoformat(kas.tanggal),
        keterangan = kas.keterangan,
        kategori   = kas.kategori,
        jenis      = kas.jenis,
        jumlah     = kas.jumlah,
    )
    db.add(db_kas)
    db.commit()
    db.refresh(db_kas)
    return db_kas

@app.put("/kas/{id}")
def update_kas(id: int, kas: KasSchema, db: Session = Depends(get_db)):
    db_kas = db.query(models.Kas).filter(models.Kas.id == id).first()
    if not db_kas:
        raise HTTPException(status_code=404, detail="Data kas tidak ditemukan")
    db_kas.tanggal    = datetime.fromisoformat(kas.tanggal)
    db_kas.keterangan = kas.keterangan
    db_kas.kategori   = kas.kategori
    db_kas.jenis      = kas.jenis
    db_kas.jumlah     = kas.jumlah
    db.commit()
    db.refresh(db_kas)
    return db_kas

@app.delete("/kas/{id}")
def hapus_kas(id: int, db: Session = Depends(get_db)):
    db_kas = db.query(models.Kas).filter(models.Kas.id == id).first()
    if not db_kas:
        raise HTTPException(status_code=404, detail="Data kas tidak ditemukan")
    db.delete(db_kas)
    db.commit()
    return {"message": f"Data kas {id} berhasil dihapus"}

# ── ENDPOINT BAHAN BAKU ─────────────────────────────

@app.get("/bahan-baku")
def get_bahan_baku(db: Session = Depends(get_db)):
    return db.query(models.BahanBaku).all()

@app.post("/bahan-baku")
def tambah_bahan_baku(bahan: BahanBakuSchema, db: Session = Depends(get_db)):
    db_bahan = models.BahanBaku(**bahan.model_dump())
    db.add(db_bahan)
    db.commit()
    db.refresh(db_bahan)
    return db_bahan

@app.put("/bahan-baku/{id}")
def update_bahan_baku(id: int, bahan: BahanBakuSchema, db: Session = Depends(get_db)):
    db_bahan = db.query(models.BahanBaku).filter(models.BahanBaku.id == id).first()
    if not db_bahan:
        raise HTTPException(status_code=404, detail="Bahan baku tidak ditemukan")
    for key, value in bahan.model_dump().items():
        setattr(db_bahan, key, value)
    db.commit()
    db.refresh(db_bahan)
    return db_bahan

@app.delete("/bahan-baku/{id}")
def hapus_bahan_baku(id: int, db: Session = Depends(get_db)):
    db_bahan = db.query(models.BahanBaku).filter(models.BahanBaku.id == id).first()
    if not db_bahan:
        raise HTTPException(status_code=404, detail="Bahan baku tidak ditemukan")
    db.delete(db_bahan)
    db.commit()
    return {"message": f"Bahan baku {id} berhasil dihapus"}

@app.post("/bahan-baku/{id}/stok")
def update_stok(id: int, data: UpdateStokSchema, db: Session = Depends(get_db)):
    db_bahan = db.query(models.BahanBaku).filter(models.BahanBaku.id == id).first()
    if not db_bahan:
        raise HTTPException(status_code=404, detail="Bahan baku tidak ditemukan")
    if data.jenis == "tambah":
        db_bahan.stok += data.jumlah
    elif data.jenis == "kurang":
        if db_bahan.stok < data.jumlah:
            raise HTTPException(status_code=400, detail="Stok tidak mencukupi")
        db_bahan.stok -= data.jumlah
    db.commit()
    db.refresh(db_bahan)
    return db_bahan

# ── ENDPOINT ORDER ──────────────────────────────────

@app.get("/order")
def get_order(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.tanggal.desc()).all()

@app.get("/order/{id}")
def get_order_detail(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).options(
        joinedload(models.Order.items)
    ).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return order

@app.post("/order")
def tambah_order(order: OrderSchema, db: Session = Depends(get_db)):
    db_order = models.Order(
        nomor        = order.nomor,
        tanggal      = datetime.fromisoformat(order.tanggal),
        nama_pembeli = order.nama_pembeli,
        channel      = order.channel,
        status       = order.status,
        catatan      = order.catatan,
        total        = order.total,
    )
    db.add(db_order)
    db.flush()
    for item in order.items:
        db_item = models.OrderItem(
            order_id    = db_order.id,
            kode_produk = item.kode_produk,
            nama_produk = item.nama_produk,
            harga       = item.harga,
            qty         = item.qty,
            subtotal    = item.subtotal,
        )
        db.add(db_item)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.patch("/order/{id}/status")
def update_status_order(id: int, data: UpdateStatusSchema, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order

@app.delete("/order/{id}")
def hapus_order(id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    db.delete(order)
    db.commit()
    return {"message": f"Order {id} berhasil dihapus"}

# ── SCHEMA HPP ──────────────────────────────────────

class KomponenHPPSchema(BaseModel):
    nama_bahan:    str
    harga_belanja: float
    jumlah_beli:   float
    modal_pcs:     float

class KalkulasiHPPSchema(BaseModel):
    nama:       str
    kode:       str
    margin_pct: float
    hpp:        float
    harga_jual: float
    komponen:   List[KomponenHPPSchema]

    class Config:
        from_attributes = True

# ── ENDPOINT HPP ────────────────────────────────────

@app.get("/hpp")
def get_hpp(db: Session = Depends(get_db)):
    return db.query(models.KalkulasiHPP).options(
        joinedload(models.KalkulasiHPP.komponen)
    ).all()

@app.get("/hpp/{id}")
def get_hpp_detail(id: int, db: Session = Depends(get_db)):
    hpp = db.query(models.KalkulasiHPP).options(
        joinedload(models.KalkulasiHPP.komponen)
    ).filter(models.KalkulasiHPP.id == id).first()
    if not hpp:
        raise HTTPException(status_code=404, detail="Kalkulasi tidak ditemukan")
    return hpp

@app.post("/hpp")
def simpan_hpp(data: KalkulasiHPPSchema, db: Session = Depends(get_db)):
    existing = db.query(models.KalkulasiHPP).filter(models.KalkulasiHPP.kode == data.kode).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kode produk sudah ada")

    db_hpp = models.KalkulasiHPP(
        nama       = data.nama,
        kode       = data.kode,
        margin_pct = data.margin_pct,
        hpp        = data.hpp,
        harga_jual = data.harga_jual,
    )
    db.add(db_hpp)
    db.flush()

    for k in data.komponen:
        db_k = models.KomponenHPP(
            kalkulasi_id  = db_hpp.id,
            nama_bahan    = k.nama_bahan,
            harga_belanja = k.harga_belanja,
            jumlah_beli   = k.jumlah_beli,
            modal_pcs     = k.modal_pcs,
        )
        db.add(db_k)

    # Otomatis buat produk baru
    db_produk = models.Produk(
        kode       = data.kode,
        nama       = data.nama,
        hpp        = data.hpp,
        harga_jual = data.harga_jual,
    )
    db.add(db_produk)
    db.commit()
    db.refresh(db_hpp)
    return db_hpp

@app.put("/hpp/{id}")
def update_hpp(id: int, data: KalkulasiHPPSchema, db: Session = Depends(get_db)):
    hpp = db.query(models.KalkulasiHPP).filter(models.KalkulasiHPP.id == id).first()
    if not hpp:
        raise HTTPException(status_code=404, detail="Kalkulasi tidak ditemukan")

    # Update kalkulasi
    hpp.nama       = data.nama
    hpp.margin_pct = data.margin_pct
    hpp.hpp        = data.hpp
    hpp.harga_jual = data.harga_jual

    # Hapus komponen lama, ganti dengan yang baru
    db.query(models.KomponenHPP).filter(models.KomponenHPP.kalkulasi_id == id).delete()
    for k in data.komponen:
        db_k = models.KomponenHPP(
            kalkulasi_id  = id,
            nama_bahan    = k.nama_bahan,
            harga_belanja = k.harga_belanja,
            jumlah_beli   = k.jumlah_beli,
            modal_pcs     = k.modal_pcs,
        )
        db.add(db_k)

    # Update produk terkait
    produk = db.query(models.Produk).filter(models.Produk.kode == hpp.kode).first()
    if produk:
        produk.nama       = data.nama
        produk.hpp        = data.hpp
        produk.harga_jual = data.harga_jual

    db.commit()
    db.refresh(hpp)
    return hpp

@app.delete("/hpp/{id}")
def hapus_hpp(id: int, db: Session = Depends(get_db)):
    hpp = db.query(models.KalkulasiHPP).filter(models.KalkulasiHPP.id == id).first()
    if not hpp:
        raise HTTPException(status_code=404, detail="Kalkulasi tidak ditemukan")
    db.delete(hpp)
    db.commit()
    return {"message": "Kalkulasi berhasil dihapus"}

# ── ENDPOINT DASHBOARD ──────────────────────────────

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    # Kas
    semua_kas  = db.query(models.Kas).all()
    total_masuk  = sum(k.jumlah for k in semua_kas if k.jenis == "masuk")
    total_keluar = sum(k.jumlah for k in semua_kas if k.jenis == "keluar")
    saldo        = total_masuk - total_keluar

    # Order
    semua_order = db.query(models.Order).all()
    order_pending  = sum(1 for o in semua_order if o.status == "pending")
    order_proses   = sum(1 for o in semua_order if o.status == "proses")
    order_selesai  = sum(1 for o in semua_order if o.status == "selesai")
    omset_selesai  = sum(o.total for o in semua_order if o.status == "selesai")

    # Bahan baku menipis
    semua_bahan   = db.query(models.BahanBaku).all()
    bahan_menipis = [
        {"id": b.id, "nama": b.nama, "stok": b.stok, "stok_min": b.stok_min, "satuan": b.satuan}
        for b in semua_bahan if b.stok <= b.stok_min
    ]

    # Produk
    total_produk = db.query(models.Produk).count()

    return {
        "kas": {
            "total_masuk":  total_masuk,
            "total_keluar": total_keluar,
            "saldo":        saldo,
        },
        "order": {
            "pending":       order_pending,
            "proses":        order_proses,
            "selesai":       order_selesai,
            "omset_selesai": omset_selesai,
        },
        "bahan_menipis": bahan_menipis,
        "total_produk":  total_produk,
    }