import "react";

// Configures the colors for the status badges
const STATUS_CONFIG = {
  Pending:   { color: "#f4b400", bg: "rgba(244, 180, 0, 0.12)"  },
  Preparing: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  Ready:     { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)"  },
  Served:    { color: "#22C55E", bg: "rgba(34,197,94,0.12)"   },
};

// Formats the Supabase timestamp into a readable 12-hour time
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Orders({ orders, updateStatus }) {
  // Split orders into two lists based on whether they are finished
  const liveOrders = orders.filter(o => o.status !== "Served");
  const completedOrders = orders.filter(o => o.status === "Served");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* ── LIVE ORDERS CARD ── */}
      <div className="section-card" style={{ marginBottom: 0 }}>
        <div className="section-head">
          <div>
            <div className="section-title">Live Orders</div>
            <div className="section-sub">Update status as orders progress through the kitchen</div>
          </div>
        </div>
        <div className="orders-list">
          {liveOrders.length === 0 ? (
            <div className="empty-state">
              <div></div>
              No live orders right now.
            </div>
          ) : liveOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            // Calculate absolute order number so it stays the same when moved to completed
            const orderNumber = orders.length - orders.findIndex(o => o.id === order.id);

            return (
              <div className="order-row" key={order.id}>
                <div className="order-num">#{orderNumber}</div>
                
                <div className="order-info">
                  <div className="order-customer">{order.customer_name}</div>
                  <div className="order-meta">
                    <span>Table {order.table_number}</span>
                    {order.notes && <span>📝 {order.notes}</span>}
                  </div>
                </div>
                
                <div className="status-pill" style={{ color: cfg.color, background: cfg.bg }}>
                  {order.status}
                </div>
                
                <div className="order-amount">
                  ${Number(order.total_amount).toFixed(2)}
                  <div className="order-time">{formatTime(order.created_at)}</div>
                </div>
                
                <div className="status-actions">
                  {order.status === "Pending" && (
                    <button className="status-btn" style={{ borderColor: "#f4b400", color: "#f4b400" }}
                      onClick={() => updateStatus(order.id, "Preparing")}>
                      Start Preparing
                    </button>
                  )}
                  {order.status === "Preparing" && (
                    <button className="status-btn" style={{ borderColor: "#8B5CF6", color: "#8B5CF6" }}
                      onClick={() => updateStatus(order.id, "Ready")}>
                      Mark Ready
                    </button>
                  )}
                  {order.status === "Ready" && (
                    <button className="status-btn" style={{ borderColor: "#22C55E", color: "#22C55E" }}
                      onClick={() => updateStatus(order.id, "Served")}>
                      Mark Served
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COMPLETED ORDERS CARD ── */}
      <div className="section-card" style={{ marginBottom: 0 }}>
        <div className="section-head">
          <div>
            <div className="section-title">Completed Orders</div>
            <div className="section-sub">Orders that have been successfully served</div>
          </div>
        </div>
        <div className="orders-list">
          {completedOrders.length === 0 ? (
            <div className="empty-state">
              <div></div>
              No completed orders yet.
            </div>
          ) : completedOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Served;
            const orderNumber = orders.length - orders.findIndex(o => o.id === order.id);

            return (
              // Slight transparency to make them look "archived"
              <div className="order-row" key={order.id} style={{ opacity: 0.65 }}>
                <div className="order-num">#{orderNumber}</div>
                
                <div className="order-info">
                  <div className="order-customer">{order.customer_name}</div>
                  <div className="order-meta">
                    <span>Table {order.table_number}</span>
                    {order.notes && <span>📝 {order.notes}</span>}
                  </div>
                </div>
                
                <div className="status-pill" style={{ color: cfg.color, background: cfg.bg }}>
                  {order.status}
                </div>
                
                <div className="order-amount">
                  ${Number(order.total_amount).toFixed(2)}
                  <div className="order-time">{formatTime(order.created_at)}</div>
                </div>
                
                <div className="status-actions">
                  <span className="served-label">✓ Served</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}