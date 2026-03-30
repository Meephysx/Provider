import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Customer, Payment } from "../types/Customer";
import { getCustomers, deleteCustomer, subscribeToCustomers } from "../services/customerService";
import { getPayments, subscribeToPayments } from "../services/paymentService";
import CustomerForm from "../components/CustomerForm";
import CustomerTable from "../components/CustomerTable";
import PaymentForm from "../components/PaymentForm";

const Customers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State untuk form
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isPaymentFormVisible, setIsPaymentFormVisible] = useState(false); // State baru untuk Payment Form

  // Filtering states
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterWilayah, setFilterWilayah] = useState("");
  const [filterSektor, setFilterSektor] = useState("");
  const [filterStatusBayar, setFilterStatusBayar] = useState("");

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    // Subscribe to real-time updates for customers
    const unsubscribeCustomers = subscribeToCustomers((customers) => {
      setCustomers(customers);
    });

    // Subscribe to real-time updates for payments
    const unsubscribePayments = subscribeToPayments((payments) => {
      setPayments(payments);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCustomers();
      unsubscribePayments();
    };
  }, []);

  useEffect(() => {
    const handler = () => {};
    window.addEventListener('paymentsUpdated', handler);
    return () => window.removeEventListener('paymentsUpdated', handler);
  }, []);

  // if navigated here with editId state, open form when data available
  useEffect(() => {
    if (location.state && (location.state as any).editId) {
      const id = (location.state as any).editId as string;
      const cust = customers.find(c => c.id === id);
      if (cust) {
        setEditingCustomer(cust);
        setIsFormVisible(true);
        setIsPaymentFormVisible(false);
        // Bersihkan state navigasi agar tidak trigger berulang kali
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, customers, navigate, location.pathname]);

  const handleSave = () => {
    setEditingCustomer(null);
    setIsFormVisible(false);
  };

  const handlePaymentUpdate = () => {
    setIsPaymentFormVisible(false); // Tutup form setelah simpan
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormVisible(true);
    setIsPaymentFormVisible(false);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm("Yakin ingin menghapus customer ini?")) return;
    
    try {
      await deleteCustomer(customer.id!);
      setCustomers(customers.filter(c => c.id !== customer.id));
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Gagal menghapus customer");
    }
  };

  // Handler untuk membuka form
  const openCustomerForm = () => {
    setEditingCustomer(null);
    setIsFormVisible(true);
    setIsPaymentFormVisible(false);
  };

  const openPaymentForm = () => {
    setIsPaymentFormVisible(true);
    setIsFormVisible(false);
  };

  const closeModal = () => {
    setIsFormVisible(false);
    setIsPaymentFormVisible(false);
    setEditingCustomer(null);
  };

  // Filtering logic
  const filteredCustomers = customers.filter((customer) => {
    const payment = payments.find(
      (p) => p.customer_id === customer.id && p.bulan === currentMonth && p.tahun === filterTahun
    );
    const paymentStatus = payment ? payment.status_bayar : "belum";

    const matchesWilayah = !filterWilayah || customer.wilayah === filterWilayah;
    const matchesSektor = !filterSektor || customer.sektor === filterSektor;
    const matchesStatusBayar = !filterStatusBayar || paymentStatus === filterStatusBayar;

    return matchesWilayah && matchesSektor && matchesStatusBayar;
  });

  const uniqueWilayah = [...new Set(customers.map(c => c.wilayah))];
  const uniqueSektor = [...new Set(customers.map(c => c.sektor).filter(Boolean))];

  return (
    <div>
      <div style={{ padding: "20px" }}>
        <button 
          onClick={() => navigate("/dashboard")}
          style={styles.backButton}
        >
          ← Kembali ke Dashboard
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "10px" }}>
          <h1 style={{ color: "#0f172a", margin: 0 }}>Manajemen Pelanggan</h1>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={openPaymentForm} style={styles.secondaryBtn}>
              💳 Update Pembayaran
            </button>
            <button onClick={openCustomerForm} style={styles.primaryBtn}>
              + Tambah Pelanggan
            </button>
          </div>
        </div>

        {/* Modal Overlay untuk Form */}
        {(isFormVisible || isPaymentFormVisible) && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                <button onClick={closeModal} style={styles.closeBtn}>
                  ✕ Tutup Form
                </button>
              </div>
              
              {isFormVisible && (
                <CustomerForm 
                  onSave={handleSave} 
                  onCancel={closeModal}
                  initialData={editingCustomer} 
                />
              )}
              
              {isPaymentFormVisible && (
                <PaymentForm 
                  customers={customers} 
                  payments={payments} 
                  onSave={handlePaymentUpdate} 
                  onClose={closeModal} 
                />
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={styles.filterContainer}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter Tahun:</label>
            <select
              style={styles.filterSelect}
              value={filterTahun}
              onChange={(e) => setFilterTahun(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter Wilayah:</label>
            <select
              style={styles.filterSelect}
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value)}
            >
              <option value="">Semua Wilayah</option>
              {uniqueWilayah.map((wilayah) => (
                <option key={wilayah} value={wilayah}>
                  {wilayah}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter Sektor:</label>
            <select
              style={styles.filterSelect}
              value={filterSektor}
              onChange={(e) => setFilterSektor(e.target.value)}
            >
              <option value="">Semua Sektor</option>
              {uniqueSektor.map((sektor) => (
                <option key={sektor} value={sektor}>
                  {sektor}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Filter Status Bayar:</label>
            <select
              style={styles.filterSelect}
              value={filterStatusBayar}
              onChange={(e) => setFilterStatusBayar(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="belum">Belum Bayar</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            payments={payments}
            currentMonth={currentMonth}
            currentYear={filterTahun}
            onDelete={handleDeleteCustomer}
            onEdit={handleEditCustomer}
            onStatusToggle={() => {}}
          />
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backButton: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "14px",
  },
  primaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  filterContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  // Style baru untuk Modal Overlay
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Latar belakang gelap transparan
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Memastikan selalu di paling depan
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "transparent", 
    width: "100%",
    maxWidth: "800px",
    maxHeight: "90vh",
    overflowY: "auto", // Bisa di-scroll jika form panjang
    borderRadius: "16px",
  },
  closeBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  }
};

export default Customers;