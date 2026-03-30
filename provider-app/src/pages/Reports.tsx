import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx-js-style"; // UPDATE: Menggunakan xlsx-js-style agar garis tabel muncul

import { Customer, Payment } from "../types/Customer";
import { getCustomers } from "../services/customerService";
import { getPayments } from "../services/paymentService";

const Reports = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterNama, setFilterNama] = useState("");
  const [filterWilayah, setFilterWilayah] = useState("");
  const [filterSektor, setFilterSektor] = useState("");
  const [filterBulan, setFilterBulan] = useState<number | "">("");
  const [filterTahun, setFilterTahun] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"lunas" | "belum" | "">("");

  // dropdown options
  const wilayahList = Array.from(new Set(customers.map(c => c.wilayah))).filter(w => w);
  const sektorList = Array.from(new Set(customers.map(c => c.sektor))).filter(s => s);
  const yearOptions = Array.from(new Set(payments.map(p => Number(p.tahun)))).sort();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('paymentsUpdated', handler);
    return () => window.removeEventListener('paymentsUpdated', handler);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getCustomers(), getPayments()]);
      setCustomers(c);
      setPayments(p);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    let data = customers.map((c) => {
      const payment = payments.find(
        (p) => p.customer_id === c.id &&
               (filterBulan === "" || p.bulan === filterBulan) &&
               (filterTahun === "" || p.tahun === filterTahun)
      );
      return { customer: c, payment };
    });

    if (filterNama) {
      data = data.filter((item) => item.customer.nama.toLowerCase().includes(filterNama.toLowerCase()));
    }
    if (filterWilayah) {
      data = data.filter((item) => item.customer.wilayah.toLowerCase().includes(filterWilayah.toLowerCase()));
    }
    if (filterSektor) {
      data = data.filter((item) => item.customer.sektor === filterSektor);
    }
    if (filterStatus) {
      if (filterStatus === "lunas") {
        data = data.filter((item) => item.payment && item.payment.status_bayar === "lunas");
      } else {
        data = data.filter((item) => !item.payment || item.payment.status_bayar === "belum");
      }
    }

    return data;
  };

  // Styles for UI
  const formControlHeight = '38px';
  const filterContainerStyle: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "20px" };
  const filterGroupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", flex: "1 1 180px" };
  const labelStyle: React.CSSProperties = { fontWeight: 500, fontSize: '14px', color: '#334155', marginBottom: '4px' };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "0 12px", height: formControlHeight, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: 'border-box', backgroundColor: '#fff', fontSize: '14px' };
  const buttonStyle: React.CSSProperties = { padding: "0 20px", height: formControlHeight, backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "14px", fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' };
  const tableThStyle: React.CSSProperties = { padding: "12px 10px", border: "1px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", color: "#64748b" };
  const tableTdStyle: React.CSSProperties = { padding: "12px 10px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#1e293b" };

  const exportToExcel = () => {
    const dataToExport = filteredData();
    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    // --- PREPARASI DATA JUDUL ---
    const wilayahTitle = filterWilayah ? filterWilayah.toUpperCase() : "SEMUA WILAYAH";
    const sektorTitle = filterSektor ? filterSektor.toUpperCase() : "SEMUA SEKTOR";
    const bulanTitle = filterBulan ? new Date(0, filterBulan - 1).toLocaleString("id-ID", { month: "long" }).toUpperCase() : "SEMUA BULAN";
    const tahunTitle = filterTahun || "SEMUA TAHUN";

    const title1 = "DATA PEMBAYARAN INTERNET MAJUIN";
    const title2 = `WILAYAH ${wilayahTitle} - SEKTOR ${sektorTitle} PERIODE ${bulanTitle} ${tahunTitle}`;

    // --- HEADER TABEL ---
    const tableHeader = [
      "No", "Nama", "Sektor", "Alamat", "BW (Paket)", "Harga", "Bayar (Status)", "Tanggal", "Metode", "Rek An (Atas Nama)"
    ];

    // --- MAPPING DATA ROWS & HITUNG TOTAL ---
    let totalHarga = 0;
    let totalBayarSum = 0;

    const dataRows = dataToExport.map((item, index) => {
      const { customer, payment } = item;
      const isLunas = payment?.status_bayar === "lunas";
      
      const hargaVal = Number(customer.harga || 0);
      const bayarVal = isLunas ? Number(payment?.total_bayar || 0) : 0;

      totalHarga += hargaVal;
      totalBayarSum += bayarVal;

      const formattedTanggal = payment?.tanggal_bayar 
        ? new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : "-";

      const alurMetode = payment?.metode_pembayaran === "Transfer" 
        ? `${payment.bank_pengirim || ''} - ${payment.bank_penerima || ''}`
        : (payment?.metode_pembayaran || "-");

      return [
        index + 1,
        customer.nama,
        customer.sektor || "-",
        customer.alamat || "-",
        customer.paket || "-",
        hargaVal,
        isLunas ? `Rp ${bayarVal.toLocaleString("id-ID")}` : "-",
        formattedTanggal,
        alurMetode,
        payment?.atas_nama_rekening ?? "-",
      ];
    });

    // --- BARIS TOTAL ---
    const totalRow = [
      "TOTAL", "", "", "", "", 
      totalHarga, 
      `Rp ${totalBayarSum.toLocaleString("id-ID")}`,
      "", "", ""
    ];

    const aoa = [
      [title1],
      [title2],
      [], // Pemisah baris 3
      tableHeader,
      ...dataRows,
      totalRow
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const lastColIndex = tableHeader.length - 1;

    // --- MERGE CELLS ---
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIndex } }, // Judul 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIndex } }, // Judul 2
      { s: { r: aoa.length - 1, c: 0 }, e: { r: aoa.length - 1, c: 4 } }, // Label TOTAL
    ];

    // --- STYLING BORDER & ALIGNMENT ---
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    for (let R = 0; R < aoa.length; R++) {
      for (let C = 0; C <= lastColIndex; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) {
            // Jika sel kosong/belum diinisialisasi dalam merge range, kita buat manual
            ws[cellAddress] = { t: 's', v: '' }; 
        }

        let cellStyle: any = {};

        if (R === 0) {
          // Judul Utama
          cellStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center", vertical: "center" } };
        } else if (R === 1) {
          // Sub Judul
          cellStyle = { font: { bold: false, sz: 11 }, alignment: { horizontal: "center", vertical: "center" } };
        } else if (R === 3) {
          // Header Tabel (Baris ke-4)
          cellStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E2EFDA" } }, // Warna background header sedikit hijau muda (opsional)
            border: borderStyle
          };
        } else if (R > 3) {
          // Isi Data & Baris Total
          cellStyle = { border: borderStyle, alignment: { vertical: "center" } };
          
          // Khusus Baris Total Paling Bawah
          if (R === aoa.length - 1) {
            cellStyle.font = { bold: true };
            if (C <= 4) cellStyle.alignment = { horizontal: "right", vertical: "center" };
          }
        }
        
        ws[cellAddress].s = cellStyle;
      }
    }

    // --- LEBAR KOLOM ---
    ws["!cols"] = [
      { wch: 4 },  // No
      { wch: 25 }, // Nama
      { wch: 15 }, // Sektor
      { wch: 30 }, // Alamat
      { wch: 15 }, // BW
      { wch: 12 }, // Harga
      { wch: 15 }, // Bayar
      { wch: 10 }, // Tanggal
      { wch: 22 }, // Metode
      { wch: 20 }, // Rek An
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    
    const fileName = `Laporan_Keuangan_WiFi_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const reportData = filteredData();
  const totalHargaSum = reportData.reduce((sum, item) => sum + (item.customer.harga || 0), 0);
  const totalBayarSum = reportData.reduce((sum, item) => sum + (item.payment?.status_bayar === 'lunas' ? (item.payment.total_bayar || 0) : 0), 0);

  return (
    <div>
      <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Laporan Pembayaran</h1>
        <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
          Kembali ke Dashboard
        </button>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h2>Filter Laporan</h2>
        <div style={filterContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Nama Pelanggan:</label>
            <input
              type="text"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Cari nama..."
              style={inputStyle}
            />
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Wilayah:</label>
            <select value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)} style={inputStyle}>
              <option value="">Semua Wilayah</option>
              {wilayahList.map((w) => (<option key={w} value={w}>{w}</option>))}
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Sektor:</label>
            <select value={filterSektor} onChange={(e) => setFilterSektor(e.target.value)} style={inputStyle}>
              <option value="">Semua Sektor</option>
              {sektorList.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Bulan:</label>
            <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value ? Number(e.target.value) : "")} style={inputStyle}>
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Tahun:</label>
            <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value ? Number(e.target.value) : "")} style={inputStyle}>
              <option value="">Semua Tahun</option>
              {yearOptions.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Status Pembayaran:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "lunas" | "belum" | "")} style={inputStyle}>
              <option value="">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="belum">Belum</option>
            </select>
          </div>
          <div style={{ marginLeft: "auto" }}>
             <button onClick={exportToExcel} style={buttonStyle}>
                Export ke Excel
             </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2>Data Laporan</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={tableThStyle}>No</th>
                  <th style={tableThStyle}>Nama</th>
                  <th style={tableThStyle}>Sektor</th>
                  <th style={tableThStyle}>Alamat</th>
                  <th style={tableThStyle}>BW (Paket)</th>
                  <th style={tableThStyle}>Harga</th>
                  <th style={tableThStyle}>Bayar (Status)</th>
                  <th style={tableThStyle}>Tanggal</th>
                  <th style={tableThStyle}>Metode</th>
                  <th style={tableThStyle}>Rek An</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => {
                  const { customer, payment } = item;
                  const isLunas = payment?.status_bayar === "lunas";
                  
                  const formattedTanggal = payment?.tanggal_bayar 
                    ? new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                    : "-";

                  const alurMetode = payment?.metode_pembayaran === "Transfer" 
                    ? `${payment.bank_pengirim || ''} ➔ ${payment.bank_penerima || ''}`
                    : (payment?.metode_pembayaran || "-");

                  return (
                    <tr key={`${customer.id}-${payment?.id || index}`}> 
                      <td style={{ ...tableTdStyle, textAlign: "center" }}>{index + 1}</td>
                      <td style={{ ...tableTdStyle, fontWeight: 600 }}>{customer.nama}</td>
                      <td style={tableTdStyle}>{customer.sektor || "-"}</td>
                      <td style={tableTdStyle}>{customer.alamat || "-"}</td>
                      <td style={tableTdStyle}>{customer.paket || "-"}</td>
                      <td style={tableTdStyle}>Rp {customer.harga.toLocaleString()}</td>
                      <td style={tableTdStyle}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: isLunas ? "#dcfce7" : "#fee2e2",
                          color: isLunas ? "#166534" : "#991b1b"
                        }}>
                          {isLunas ? `Rp ${payment?.total_bayar?.toLocaleString()}` : "Belum Bayar"}
                        </span>
                      </td>
                      <td style={tableTdStyle}>{formattedTanggal}</td>
                      <td style={tableTdStyle}>{alurMetode}</td>
                      <td style={tableTdStyle}>{payment?.atas_nama_rekening || "-"}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                  <td colSpan={5} style={{ ...tableTdStyle, textAlign: "right" }}>TOTAL</td>
                  <td style={tableTdStyle}>Rp {totalHargaSum.toLocaleString()}</td>
                  <td style={tableTdStyle}>Rp {totalBayarSum.toLocaleString()}</td>
                  <td colSpan={3} style={tableTdStyle}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Reports;