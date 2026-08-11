import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabase";
import CheckoutModal from "./CheckoutModal";

export default function CashierDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const navigate = useNavigate();

  // Get the shop_id from the session
  const sessionData = JSON.parse(localStorage.getItem("custom_session") || "{}");
  const shopId = sessionData.shop_id;

  useEffect(() => {
    if (!shopId) {
      navigate("/login");
      return;
    }
    fetchUnpaidOrders();

    // Refresh automatically every 5 seconds to catch new orders from the kitchen
    const interval = setInterval(fetchUnpaidOrders, 5000);
    return () => clearInterval(interval);
  }, [shopId]);

  async function fetchUnpaidOrders() {
    // Fetch orders that belong to this shop and are NOT marked as 'Paid'
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("shop_id", shopId)
      .neq("status", "Paid")
      .order("created_at", { ascending: false });

    if (!error) {
      setOrders(data || []);
    }
    setLoading(false);
  }

  function handlePaymentSuccess() {
    setSelectedOrder(null); 
    fetchUnpaidOrders();   
  }

  const handleLogout = () => {
    localStorage.removeItem("custom_session");
    supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading register...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #eee" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Cashier Register</h1>
          <p style={{ margin: 0, color: "#666" }}>Process payments for Dine-in and Walk-in orders.</p>
        </div>
        <button onClick={handleLogout} style={{ padding: "10px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Log Out
        </button>
      </div>

      {/* ORDERS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {orders.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "50px", textAlign: "center", background: "#f8f9fa", borderRadius: "12px", color: "#666" }}>
            No unpaid orders right now.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>Table {order.table_no || "Walk-in"}</span>
                <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                  {order.status}
                </span>
              </div>
              
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#111", marginBottom: "20px" }}>
                ${Number(order.total_amount).toFixed(2)}
              </div>
              
              <button 
                onClick={() => setSelectedOrder(order)}
                style={{ width: "100%", padding: "12px", background: "#F4B400", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
              >
                Process Payment
              </button>
            </div>
          ))
        )}
      </div>

      {/* POP-UP CHECKOUT MODAL */}
      {selectedOrder && (
        <CheckoutModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}

    </div>
  );
}