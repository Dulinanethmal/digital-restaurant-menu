import { useState } from "react";
import supabase from "./supabase";

export default function CheckoutModal({ order, onClose, onSuccess }) {
  const [method, setMethod] = useState("cash"); // 'cash' or 'card'
  const [tendered, setTendered] = useState("");
  const [loading, setLoading] = useState(false);

  // Safely calculate totals
  const totalAmount = Number(order.total_amount) || 0;
  const amountTendered = Number(tendered) || 0;
  const changeDue = amountTendered - totalAmount;

  async function handlePayment() {
    // Basic validation for cash
    if (method === "cash" && amountTendered < totalAmount) {
      alert("Amount tendered is less than the total bill!");
      return;
    }

    setLoading(true);

    try {
      // 1. Update the order in Supabase to mark it as Paid
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "Paid", 
          payment_method: method 
        })
        .eq("id", order.id);

      if (error) throw error;

      // 2. Success! Tell the dashboard to refresh
      onSuccess();
    } catch (error) {
      alert("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Checkout: Table {order.table_no || "Walk-in"}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.totalDisplay}>
            Total Due: ${totalAmount.toFixed(2)}
          </div>

          <div style={styles.methodToggle}>
            <button 
              style={method === "cash" ? styles.activeBtn : styles.inactiveBtn}
              onClick={() => setMethod("cash")}
            >
            Cash
            </button>
            <button 
              style={method === "card" ? styles.activeBtn : styles.inactiveBtn}
              onClick={() => setMethod("card")}
            >
              Card Terminal
            </button>
          </div>

          {/* CASH FLOW */}
          {method === "cash" && (
            <div style={styles.cashSection}>
              <label style={styles.label}>Amount Tendered by Customer ($):</label>
              <input 
                type="number" 
                style={styles.input} 
                value={tendered} 
                onChange={(e) => setTendered(e.target.value)} 
                placeholder="e.g. 50"
                autoFocus
              />
              
              <div style={styles.changeDisplay}>
                Change Due: <span style={{ color: changeDue >= 0 ? "#16a34a" : "#dc2626" }}>
                  ${changeDue > 0 ? changeDue.toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          )}

          {/* CARD FLOW */}
          {method === "card" && (
            <div style={styles.cardSection}>
              <p>1. Enter <b>${totalAmount.toFixed(2)}</b> into your physical card terminal.</p>
              <p>2. Ask the customer to tap or insert their card.</p>
              <p>3. Once the terminal prints "Approved", click confirm below.</p>
            </div>
          )}

        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button 
            onClick={handlePayment} 
            style={styles.confirmBtn}
            disabled={loading || (method === "cash" && changeDue < 0)}
          >
            {loading ? "Processing..." : `Confirm & Mark Paid`}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#fff", width: "100%", maxWidth: "450px", borderRadius: "12px", overflow: "hidden" },
  header: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer" },
  body: { padding: "20px" },
  totalDisplay: { fontSize: "24px", fontWeight: "bold", textAlign: "center", padding: "15px", background: "#f8f9fa", borderRadius: "8px", marginBottom: "20px" },
  methodToggle: { display: "flex", gap: "10px", marginBottom: "20px" },
  activeBtn: { flex: 1, padding: "12px", background: "#F4B400", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  inactiveBtn: { flex: 1, padding: "12px", background: "#eee", color: "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" },
  cashSection: { padding: "15px", border: "1px solid #eee", borderRadius: "8px" },
  cardSection: { padding: "15px", background: "#eff6ff", color: "#1e3a8a", borderRadius: "8px", border: "1px solid #bfdbfe", lineHeight: "1.6" },
  label: { display: "block", marginBottom: "8px", fontWeight: "bold" },
  input: { width: "100%", padding: "12px", fontSize: "18px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" },
  changeDisplay: { marginTop: "15px", fontSize: "18px", fontWeight: "bold" },
  footer: { padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: "10px" },
  cancelBtn: { flex: 1, padding: "12px", background: "transparent", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer" },
  confirmBtn: { flex: 2, padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }
};