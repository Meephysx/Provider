export interface Customer {
  id?: string;
  nama: string;
  no_hp: string;
  wilayah: string;
  sektor: string;
  alamat: string;
  bandwidth: string;
  paket: string;
  harga: number;
  status: string;
  tahun_mulai: number;
  created_at: any;
  updated_at: any;
}

export interface Payment {
  id?: string;
  customer_id: string;
  periode: string;
  bulan: number;
  tahun: number;
  total_bayar: number;
  denda?: number;
  metode_pembayaran: string;
  bank?: string; // Untuk kompatibilitas
  bank_pengirim?: string;
  bank_penerima?: string;
  atas_nama_rekening: string;
  status_bayar: "belum" | "lunas";
  jatuh_tempo: Date;
  tanggal_bayar: Date | null;
  created_at: Date;
  updated_at: Date;
}
  
  export interface PaymentWithCustomer extends Payment {
    customer: Customer;
  }
  