import { useEffect, useState } from "react";
import supabase from "./supabase";

export default function UserDashboard({ onBack }) {
  const [searchName, setSearchName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + 
           " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function fetchUserOrders(name) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .ilike("customer_name", name)
      .order("created_at", { ascending: false });

    if (!error) setUserOrders(data || []);
  }

  async function handleLogin() {
    if (!searchName.trim()) return alert("Please enter your name.");
    setLoading(true);
    
    await fetchUserOrders(searchName.trim());
    
    setLoading(false);
    setIsLoggedIn(true);
  }

  // 🔥 REALTIME LISTENER for the Dashboard list
  useEffect(() => {
    if (!isLoggedIn) return;

    const listSub = supabase
      .channel('user-dashboard-updates')
      .on('postgres', { event: '*', schema: 'public', table: 'orders' }, () => {
        // If ANY order changes, re-fetch this user's list so it updates instantly
        fetchUserOrders(searchName.trim());
      })
      .subscribe();

    return () => supabase.removeChannel(listSub);
  }, [isLoggedIn, searchName]);

  function handleLogout() {
    setIsLoggedIn(false);
    setSearchName("");
    setUserOrders([]);
  }

  const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = userOrders.length;

  return (
    <div style={{ flex: 1, backgroundColor: "var(--surface-color)", borderRadius: "var(--border-radius-lg)", padding: "30px", boxShadow: "var(--shadow-sm)" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", background: "none", cursor: "pointer", fontWeight: "600" }}>
          <span>←</span> Back to Menu
        </button>
        {isLoggedIn && (
          <button className="btn-ghost" onClick={handleLogout} style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.2)", background: "none", border: "1px solid", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
            Sign Out
          </button>
        )}
      </div>

      {!isLoggedIn ? (
        <div style={{ maxWidth: "400px", margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>👤</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", color: "var(--text-dark)", marginBottom: "8px" }}>
            Welcome Back
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Enter the exact name you used for your previous orders to view your history and live status.
          </p>
          
          <div className="input-group" style={{ flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="Enter your full name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #eaeaea", outline: "none" }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button className="btn-primary" style={{ width: "100%", padding: "14px", border: "none", borderRadius: "10px", backgroundColor: "var(--primary-gold)", color: "var(--text-dark)", fontWeight: "bold", cursor: "pointer" }} onClick={handleLogin} disabled={loading}>
              {loading ? "Searching..." : "View My Dashboard"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: "var(--text-dark)", marginBottom: "4px" }}>
            Hello, {searchName}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Here is your live tracking and dining history.</p>

          <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "600px", marginBottom: "40px" }}>
            <div className="stat-card" style={{ background: "#f8f8f8", padding: "20px", borderRadius: "12px", border: "1px solid #eaeaea" }}>
              <div className="stat-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Total Orders</div>
              <div className="stat-value" style={{ color: "var(--primary-gold)", fontSize: "2rem", fontWeight: "bold", fontFamily: "Georgia, serif" }}>{totalOrders}</div>
            </div>
            <div className="stat-card" style={{ background: "#f8f8f8", padding: "20px", borderRadius: "12px", border: "1px solid #eaeaea" }}>
              <div className="stat-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Total Spent</div>
              <div className="stat-value" style={{ fontSize: "2rem", fontWeight: "bold", fontFamily: "Georgia, serif", color: "var(--text-dark)" }}>${totalSpent.toFixed(2)}</div>
            </div>
          </div>

          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "var(--text-dark)", marginBottom: "16px" }}>
            Order History
          </h3>

          {userOrders.length === 0 ? (
            <div className="empty-state" style={{ background: "#f8f8f8", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
              <div className="empty-icon" style={{ fontSize: "2rem", marginBottom: "10px" }}>🍽️</div>
              <p>We couldn't find any past orders under this name.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {userOrders.map((order) => (
                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", border: "1px solid #eaeaea", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text-dark)", marginBottom: "4px" }}>
                      Order at Table {order.table_number}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-dark)", fontSize: "1.1rem" }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </div>
                    <div style={{ 
                      display: "inline-block", 
                      fontSize: "0.75rem", 
                      fontWeight: "600", 
                      padding: "4px 10px", 
                      borderRadius: "20px", 
                      marginTop: "6px",
                      backgroundColor: order.status === "Served" ? "rgba(34,197,94,0.1)" : "rgba(244, 180, 0, 0.1)",
                      color: order.status === "Served" ? "#16A34A" : "var(--primary-gold)"
                    }}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}