import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Customer, Payment } from "../types/Customer";
import { getCustomers, deleteCustomer } from "../services/customerService";
import { getPayments } from "../services/paymentService";
import CustomerForm from "../components/CustomerForm";
import CustomerTable from "../components/CustomerTable";
import PaymentForm from "../components/PaymentForm";

const Customers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Filtering states
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterWilayah, setFilterWilayah] = useState("");
  const [filterStatusBayar, setFilterStatusBayar] = useState("");

  const currentMonth = new Date().getMonth() + 1;

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('paymentsUpdated', handler);
    return () => window.removeEventListener('paymentsUpdated', handler);
  }, [loadData]);

  // if navigated here with editId state, open form when data available
  useEffect(() => {
    if (location.state && (location.state as any).editId) {
      const id = (location.state as any).editId as string;
      const cust = customers.find(c => c.id === id);
      if (cust) {
        setEditingCustomer(cust);
        setIsFormVisible(true);
      }
    }
  }, [location.state, customers]);
  const handleSave = () => {
    loadData();
    setEditingCustomer(null);
    setIsFormVisible(false);
  };

  const handlePaymentUpdate = () => {
    loadData(); // Reload payments
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormVisible(true);
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

  // Filtering logic
  const filteredCustomers = customers.filter((customer) => {
    const payment = payments.find(
      (p) => p.customer_id === customer.id && p.bulan === currentMonth && p.tahun === filterTahun
    );
    const paymentStatus = payment ? payment.status_bayar : "belum";

    const matchesWilayah = !filterWilayah || customer.wilayah === filterWilayah;
    const matchesStatusBayar = !filterStatusBayar || paymentStatus === filterStatusBayar;

    return matchesWilayah && matchesStatusBayar;
  });

  const uniqueWilayah = [...new Set(customers.map(c => c.wilayah))];

  return (
    <div>
      
      <div style={{ padding: "20px" }}>
        <button 
          onClick={() => navigate("/dashboard")}
          style={styles.backButton}
      >
        ← Kembali ke Dashboard
      </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ marginBottom: "30px", color: "#0f172a" }}>Manajemen Pelanggan</h1>
          {!isFormVisible && (
            <button onClick={() => { setEditingCustomer(null); setIsFormVisible(true); }} style={styles.primaryBtn}>
              + Tambah Pelanggan
            </button>
          )}
        </div>

      {/* Add/Edit Customer Form */}
      {isFormVisible && (
        <CustomerForm onSave={handleSave} initialData={editingCustomer} />
      )}

      {/* Payment Form */}
      <PaymentForm customers={customers} onSave={handlePaymentUpdate} />

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
          onEdit={handleEditCustomer}          onStatusToggle={loadData}        />
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
    padding: "12px 20px",
    backgroundColor: "#3b82f6",
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
};

export default Customers;