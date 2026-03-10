export interface Customer {
  id?: string;
  nama: string;
  alamat: string;
  wilayah: string;
  paket: string;
  harga: number;
  status: "aktif" | "berhenti";
  tahunMulai: number;
  no_hp?: string;
  createdAt: Date;
}

export interface Payment {
  id?: string;
  customer_id: string;
  bulan: number;
  tahun: number;
  periode?: string;
  status_bayar: "lunas" | "belum";
  metode_pembayaran?: "Tunai" | "Transfer" | "QRIS";
  atas_nama_rekening?: string;
  bank?: string;
  tanggal_bayar: Date | null;
  total_bayar?: number;
  denda?: number;
  created_at?: Date;
  updated_at?: Date;
}