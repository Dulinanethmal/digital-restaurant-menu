import { useEffect, useState } from "react";
import supabase from "./supabase";
import "./Admin.css"; 

import Orders from "./Orders";
import MenuItems from "./MenuItems";
import FoodForm from "./FoodForm";
import Customize from "./Customize";

export default function Admin() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "", error: false });

  useEffect(() => { 
      fetchOrders(); 
      fetchMenuItems(); 

      // Auto-refresh orders every 5 seconds
      const orderInterval = setInterval(() => {
        fetchOrders();
      }, 5000);

      return () => clearInterval(orderInterval);
  }, []);

  function showToast(msg, error = false) {
    setToast({ visible: true, msg, error });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  }

  async function fetchOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  }

  async function fetchMenuItems() {
    const { data } = await supabase.from("menu_items").select("*").order("name");
    setMenuItems(data || []);
  }

  // 🔥 UPDATED FUNCTION: Forces Supabase to confirm the update
  async function updateStatus(id, newStatus) {
    // 1. Instantly update UI so the app feels fast
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    // 2. Update Database AND ask it to return the updated row (.select())
    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id)
      .select(); 

    // 3. Catch silent failures (like RLS blocking the update)
    if (error || !data || data.length === 0) {
      console.error("Database Update Failed:", error);
      showToast("Database blocked the update! Please disable RLS in Supabase.", true);
      fetchOrders(); // Revert back to real database state
    } else {
      showToast(`Order marked as ${newStatus}`);
    }
  }

  async function handleAdd(fields) {
    setSaving(true);
    const { error } = await supabase.from("menu_items").insert([fields]);
    setSaving(false);
    if (error) { showToast("Failed to add: " + error.message, true); return; }
    showToast("Item added to menu!");
    setShowAddModal(false);
    fetchMenuItems();
    setTab("menu");
  }

  async function handleEdit(fields) {
    setSaving(true);
    const { error } = await supabase.from("menu_items").update(fields).eq("id", editItem.id);
    setSaving(false);
    if (error) { showToast("Failed to save: " + error.message, true); return; }
    showToast("Item updated!");
    setEditItem(null);
    fetchMenuItems();
  }

  async function deleteFood(id) {
    if (!window.confirm("Delete this menu item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    fetchMenuItems();
    showToast("Item deleted");
  }

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const preparingCount = orders.filter(o => o.status === "Preparing").length;
  const revenueAmount = orders.filter(o => o.status === "Served").reduce((sum, o) => sum + Number(o.total_amount), 0);

  const NAV = [
    { id: "orders", icon: "📦", label: "Orders", badge: pendingCount + preparingCount },
    { id: "menu",   icon: "🍽",  label: "Menu Items", badge: menuItems.length },
    { id: "customize", icon: "⚙️", label: "Customize Shop" }, 
  ];

  return (
    <>
      <div className={`toast${toast.visible ? " visible" : ""}`} style={{ background: toast.error ? "#DC2626" : "#2D7D46" }}>
        {toast.error ? "✗" : "✓"} {toast.msg}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Menu Item</div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <FoodForm onSave={handleAdd} onCancel={() => setShowAddModal(false)} saving={saving} />
          </div>
        </div>
      )}

      {editItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditItem(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit: {editItem.name}</div>
              <button className="modal-close" onClick={() => setEditItem(null)}>✕</button>
            </div>
            <FoodForm initial={editItem} onSave={handleEdit} onCancel={() => setEditItem(null)} saving={saving} />
          </div>
        </div>
      )}

      <div className="admin-layout">
        <div className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-tag">Admin Panel</div>
            <div className="sidebar-brand-name">Lumière & Co.</div>
            <div className="sidebar-brand-sub">Restaurant Management</div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
                {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="main-area">
          <div className="main-header">
            <div>
              <div className="page-title">
                {tab === "orders" ? "Orders" : tab === "menu" ? "Menu Items" : "Shop Customization"}
              </div>
              <div className="page-sub">
                {tab === "orders" ? `${orders.length} total orders` : tab === "menu" ? `${menuItems.length} items on menu` : "Update your store branding"}
              </div>
            </div>
            {tab !== "customize" && (
              <div className="header-actions">
                <button className="btn-ghost" onClick={() => { fetchOrders(); fetchMenuItems(); }}>↻ Refresh</button>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Item</button>
              </div>
            )}
          </div>

          <div className="main-content">
            {tab !== "customize" && (
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{orders.length}</div>
                  <div className="stat-sub">All time</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value" style={{ color: "#f4b400" }}>{pendingCount}</div>
                  <div className="stat-sub">Awaiting kitchen</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Preparing</div>
                  <div className="stat-value" style={{ color: "#3B82F6" }}>{preparingCount}</div>
                  <div className="stat-sub">In kitchen</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Revenue</div>
                  <div className="stat-value">${revenueAmount.toFixed(0)}</div>
                  <div className="stat-sub">From served orders</div>
                </div>
              </div>
            )}

            {/* ROUTING */}
            {tab === "orders" ? (
              <Orders orders={orders} updateStatus={updateStatus} />
            ) : tab === "menu" ? (
              <MenuItems 
                menuItems={menuItems} 
                setShowAddModal={setShowAddModal} 
                setEditItem={setEditItem} 
                deleteFood={deleteFood} 
              />
            ) : tab === "customize" ? (
              <Customize showToast={showToast} />
            ) : null}

          </div>
        </div>
      </div>
    </>
  );
}