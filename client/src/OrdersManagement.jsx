import { useEffect, useState } from "react";
import supabase from "./supabase";

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");

  // 1. Get the current logged-in restaurant's shop_id from the session
  const session = JSON.parse(localStorage.getItem("custom_session") || "{}");
  const shopId = session.shop_id;

  useEffect(() => {
    if (!shopId) {
      console.error("No shop ID found in session.");
      setLoading(false);
      return;
    }

    fetchOrders();
    
    // 2. SECURE REALTIME: Only listen for new orders that belong to THIS shop
    const channel = supabase.channel(`realtime-orders-${shopId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${shopId}` // Stops other restaurants' orders from appearing here
      }, fetchOrders)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [shopId]);

  async function fetchOrders() {
    // 3. SECURE FETCH: Only grab orders for this specific shop
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("shop_id", shopId) // Locks the data down
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching orders:", error);
    }
    
    setOrders(data || []);
    setLoading(false);
  }

  // Derived Stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'Completed').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
    revenue: orders.filter(o => o.status === 'Served' || o.status === 'Completed').reduce((sum, o) => sum + Number(o.total_amount), 0)
  };

  const filteredOrders = orders.filter(o => 
    (filter === "All" || o.status === filter) &&
    (o.id.toString().includes(search) || o.table_number.toString().includes(search))
  );

  return (
    <div className="admin-page">
    
      <div className="stats-row">
        {[
          { label: "Total Orders", val: stats.total },
          { label: "Active", val: stats.active },
          { label: "Completed", val: stats.completed },
          { label: "Cancelled", val: stats.cancelled },
          { label: "Today's Revenue", val: `$${stats.revenue.toFixed(0)}` }
        ].map((s, i) => (
          <div key={i} className="stat-card"><span>{s.label}</span><h3>{s.val}</h3></div>
        ))}
      </div>

      {/* Controls */}
      <div className="orders-filters">
        <input placeholder="Search ID/Table..." onChange={(e) => setSearch(e.target.value)} className="field-input" />
        <div className="tab-group">
          {["All", "New", "Preparing", "Ready", "Served", "Completed", "Cancelled"].map(t => (
            <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
           <p style={{ padding: "20px" }}>Loading orders...</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Table</th><th>Total</th><th>Status</th><th>Time</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No orders found</td>
                </tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0,6)}</td>
                    <td>Table {o.table_number}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleTimeString()}</td>
                    <td><button className="btn-ghost" onClick={() => setSelectedOrder(o)}>View Details</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} fetchOrders={fetchOrders} />}
    </div>
  );
}

function OrderDetails({ order, onClose, fetchOrders }) {
  const items = Array.isArray(order?.items) ? order.items : [];

  // Added functional Cancel logic
  async function handleCancelOrder() {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    const { error } = await supabase
      .from("orders")
      .update({ status: "Cancelled" })
      .eq("id", order.id);
      
    if (error) {
      alert("Failed to cancel order: " + error.message);
    } else {
      fetchOrders(); // Refresh the list
      onClose(); // Close the modal
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-drawer" onClick={e => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
          <div>
            <h3 style={{ margin: "0 0 5px 0" }}>Order Details #{order?.id?.toString().slice(0, 6)}</h3>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
              Table: {order?.table_number || "N/A"} | Payment: {order?.payment_status || "Pending"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #ccc", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}>✕</button>
        </div>
        
        <div className="modal-body">
          {/* Items Table */}
          <table className="items-preview-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th style={{ textAlign: "left", padding: "8px 0", color: "#666" }}>Item</th>
                <th style={{ textAlign: "center", padding: "8px 0", color: "#666" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "8px 0", color: "#666" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f9f9f9" }}>
                    <td style={{ padding: "10px 0" }}>{item.name}</td>
                    <td style={{ textAlign: "center", padding: "10px 0" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "10px 0" }}>
                      ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#999" }}>No items found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Total */}
          <div className="order-summary-footer" style={{ borderTop: "2px solid #eee", paddingTop: "15px", marginBottom: "20px" }}>
            <div className="total-row" style={{ display: "flex", justifyContent: "space-between", fontSize: "18px" }}>
              <span>Grand Total</span> 
              <strong>${Number(order?.total_amount || 0).toFixed(2)}</strong>
            </div>
          </div>

          {/* Activity Timeline (Matching your image design) */}
          <div className="timeline-container" style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#111" }}>Activity Timeline</h4>
            
            <div style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "14px", color: "#444" }}>
              Order Placed — {order?.created_at ? new Date(order.created_at).toLocaleTimeString() : "N/A"}
            </div>
            
            {order?.status !== "New" && order?.status !== "Pending" && (
              <div style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "14px", color: "#444" }}>
                Status changed to {order.status}
              </div>
            )}
         
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions" style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => window.print()} 
            style={{ padding: "10px 20px", background: "#f4b400", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
          >
            Print Receipt
          </button>
          {order?.status !== "Cancelled" && (
            <button 
              onClick={handleCancelOrder} 
              style={{ padding: "10px 20px", background: "transparent", color: "#333", border: "1px solid #999", borderRadius: "4px", cursor: "pointer" }}
            >
              Cancel Order
            </button>
          )}
        </div>

      </div>
    </div>
  );
}