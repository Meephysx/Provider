import React from "react";

interface DashboardCardsProps {
  totalCustomers: number;
  totalLunas: number;
  totalBelum: number;
  totalPendapatan: number;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({
  totalCustomers,
  totalLunas,
  totalBelum,
  totalPendapatan,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3>Total Pelanggan</h3>
        <p>{totalCustomers}</p>
      </div>
      <div style={styles.card}>
        <h3>Total Lunas</h3>
        <p>{totalLunas}</p>
      </div>
      <div style={styles.card}>
        <h3>Total Belum Bayar</h3>
        <p>{totalBelum}</p>
      </div>
      <div style={styles.card}>
        <h3>Total Pendapatan</h3>
        <p>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(totalPendapatan)}</p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
};

export default DashboardCards;
