from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Produk(Base):
    __tablename__ = "produk"

    kode        = Column(String, primary_key=True, index=True)
    nama        = Column(String, nullable=False)
    hpp         = Column(Float, nullable=False)
    harga_jual  = Column(Float, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

class Kas(Base):
    __tablename__ = "kas"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    tanggal    = Column(DateTime(timezone=True), nullable=False)
    keterangan = Column(String, nullable=False)
    kategori   = Column(String, nullable=False)
    jenis      = Column(String, nullable=False)
    jumlah     = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BahanBaku(Base):
    __tablename__ = "bahan_baku"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    nama       = Column(String, nullable=False)
    satuan     = Column(String, nullable=False)
    stok       = Column(Float, nullable=False, default=0)
    stok_min   = Column(Float, nullable=False, default=0)
    harga_beli = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Order(Base):
    __tablename__ = "order"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    nomor        = Column(String, nullable=False, unique=True)
    tanggal      = Column(DateTime(timezone=True), nullable=False)
    nama_pembeli = Column(String, nullable=False)
    channel      = Column(String, nullable=False)
    status       = Column(String, nullable=False, default="pending")
    catatan      = Column(String, nullable=True)
    total        = Column(Float, nullable=False, default=0)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete")

class OrderItem(Base):
    __tablename__ = "order_item"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    order_id    = Column(Integer, ForeignKey("order.id"), nullable=False)
    kode_produk = Column(String, ForeignKey("produk.kode"), nullable=False)
    nama_produk = Column(String, nullable=False)
    harga       = Column(Float, nullable=False)
    qty         = Column(Integer, nullable=False)
    subtotal    = Column(Float, nullable=False)

    order  = relationship("Order", back_populates="items")
    produk = relationship("Produk")

class KalkulasiHPP(Base):
    __tablename__ = "kalkulasi_hpp"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    nama       = Column(String, nullable=False)
    kode       = Column(String, nullable=False, unique=True)
    margin_pct = Column(Float, nullable=False, default=300)
    hpp        = Column(Float, nullable=False, default=0)
    harga_jual = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    komponen = relationship("KomponenHPP", back_populates="kalkulasi", cascade="all, delete")

class KomponenHPP(Base):
    __tablename__ = "komponen_hpp"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    kalkulasi_id  = Column(Integer, ForeignKey("kalkulasi_hpp.id"), nullable=False)
    nama_bahan    = Column(String, nullable=False)
    harga_belanja = Column(Float, nullable=False)
    jumlah_beli   = Column(Float, nullable=False)
    modal_pcs     = Column(Float, nullable=False)

    kalkulasi = relationship("KalkulasiHPP", back_populates="komponen")