import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabase"; // Kept for Auth and Real-time channels
import "./Admin.css";

import Orders from "./Orders";
import MenuItems from "./MenuItems";
import FoodForm from "./FoodForm";
import Customize from "./Customize";
import QRCode from "./QRCode";
import PaymentSettings from "./PaymentSettings";
import OrdersManagement from "./OrdersManagement";
import ReportsAnalytics from "./ReportsAnalytics";
import Profile from "./Profile";
import StaffManagement from "./StaffManagement";
import CashierDashboard from "./CashierDashboard";

// Base URL for your new FastAPI server
const API_BASE = "http://127.0.0.1:8000/api";

export default function Admin() {
  const navigate = useNavigate();

  // --- STATE ---
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "", error: false });

  // SECURITY & TENANT STATE
  const [authLoading, setAuthLoading] = useState(true);
  const [shopId, setShopId] = useState(null);

  // Shop Settings State
  const [shopSettings, setShopSettings] = useState({
    shop_name: "Loading...",
    description: "",
    logo_url: ""
  });

  // 1. AUTHENTICATION CHECK
  useEffect(() => {
    const sessionData = localStorage.getItem("custom_session");
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      setShopId(parsedData.shop_id);
      setAuthLoading(false);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // 2. DATA FETCHING 
  useEffect(() => {
    if (!shopId) return;

    fetchOrders();
    fetchMenuItems();
    fetchShopSettings();

    const orderInterval = setInterval(() => {
      fetchOrders();
    }, 5000);

    // Keep Supabase Real-time for live settings updates!
    const settingsSub = supabase
      .channel('admin-shop-settings')
      .on('postgres', { event: '*', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` }, () => {
        fetchShopSettings();
      })
      .subscribe();

    return () => {
      clearInterval(orderInterval);
      supabase.removeChannel(settingsSub);
    };
  }, [shopId]);

  // --- QUERIES USING FASTAPI ---
  async function fetchShopSettings() {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setShopSettings(data);
      }
    } catch (err) {
      console.error("Error fetching shop settings:", err);
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders?shop_id=${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }

  async function fetchMenuItems() {
    try {
      const res = await fetch(`${API_BASE}/menu-items?shop_id=${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data || []);
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
    }
  }

  function showToast(msg, error = false) {
    setToast({ visible: true, msg, error });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 4000);
  }

  // --- ACTIONS USING FASTAPI ---
  async function updateStatus(id, newStatus) {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update order");

      showToast(`Order marked as ${newStatus}`);
    } catch (error) {
      showToast("Failed to update order", true);
      fetchOrders(); // Revert on failure
    }
  }

  async function handleAdd(fields) {
    setSaving(true);
    const payload = { ...fields, shop_id: shopId };

    try {
      const res = await fetch(`${API_BASE}/menu-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error adding item");
      }

      showToast("Item added to menu!");
      setShowAddModal(false);
      fetchMenuItems();
      setTab("menu");
    } catch (error) {
      showToast("Failed to add: " + error.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(fields) {
    setSaving(true);
    const payload = { ...fields, shop_id: shopId }; // Schema requires shop_id

    try {
      const res = await fetch(`${API_BASE}/menu-items/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error updating item");
      }

      showToast("Item updated!");
      setEditItem(null);
      fetchMenuItems();
    } catch (error) {
      showToast("Failed to save: " + error.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFood(id) {
    if (!window.confirm("Delete this menu item?")) return;

    try {
      const res = await fetch(`${API_BASE}/menu-items/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete item");

      fetchMenuItems();
      showToast("Item deleted");
    } catch (error) {
      showToast("Failed to delete", true);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("custom_session");
    supabase.auth.signOut(); // Keep this logic for secure auth clearance
    navigate("/login");
  };

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: 'white' }}><h2>Loading dashboard...</h2></div>;
  }

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const preparingCount = orders.filter(o => o.status === "Preparing").length;
  const revenueAmount = orders.filter(o => o.status === "Served").reduce((sum, o) => sum + Number(o.total_amount), 0);

  const NAV = [
    { id: "orders", label: "Orders", badge: pendingCount + preparingCount },
    { id: "cashier", label: "Cashier POS" },
    { id: "menu", label: "Menu Items", badge: menuItems.length },
    { id: "qrcode", label: "QR Generator" },
    { id: "orders-management", label: "Orders Management" },
    { id: "payment", label: "Payment Settings" },
    { id: "staff", label: "Staff Management" },
    { id: "customize", label: "Customize Shop" },
    { id: "reports", label: "Reports & Analytics" },
    { id: "profile", label: "Profile" }
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
            <div className="sidebar-brand-name">{shopSettings.shop_name}</div>
            <div className="sidebar-brand-sub">Restaurant Management</div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                <span className="nav-icon"></span>
                {n.label}
                {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', padding: '20px' }}>
            <button onClick={handleLogout} className="btn-danger-outline" style={{ width: '100%', padding: '10px' }}>
              Log Out
            </button>
          </div>
        </div>

        <div className="main-area">
          <div className="main-header">
            <div>
              <div className="page-title">
                {tab === "orders" ? "Live Orders"
                  : tab === "cashier" ? "Cashier Register"
                    : tab === "orders-management" ? "Orders Management"
                      : tab === "menu" ? "Menu Items"
                        : tab === "qrcode" ? "QR Generator"
                          : tab === "payment" ? "Payment Settings"
                            : tab === "staff" ? "Staff Management"
                              : tab === "reports" ? "Reports & Analytics"
                                : tab === "profile" ? "Profile"
                                  : "Shop Customization"}
              </div>
              <div className="page-sub">
                {tab === "orders" ? `${orders.length} total orders`
                  : tab === "cashier" ? "Process payments for Dine-in and Walk-in orders"
                    : tab === "orders-management" ? "Manage and track order history"
                      : tab === "menu" ? `${menuItems.length} items on menu`
                        : tab === "qrcode" ? "Generate table QR codes"
                          : tab === "payment" ? "Configure your payment gateways"
                            : tab === "staff" ? "Manage your team and permissions"
                              : tab === "reports" ? "View performance and sales"
                                : tab === "profile" ? "Manage your account"
                                  : "Update your store branding"}
              </div>
            </div>

            {(tab === "orders" || tab === "menu") && (
              <div className="header-actions">
                <button className="btn-ghost" onClick={() => { fetchOrders(); fetchMenuItems(); }}>↻ Refresh</button>
                {tab === "menu" && (
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Item</button>
                )}
              </div>
            )}
          </div>

          <div className="main-content">
            {tab === "orders" && (
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

            {tab === "orders" ? (
              <Orders orders={orders} updateStatus={updateStatus} />
            ) : tab === "cashier" ? (
              <CashierDashboard />
            ) : tab === "orders-management" ? (
              <OrdersManagement showToast={showToast} />
            ) : tab === "menu" ? (
              <MenuItems
                menuItems={menuItems}
                setShowAddModal={setShowAddModal}
                setEditItem={setEditItem}
                deleteFood={deleteFood}
              />
            ) : tab === "qrcode" ? (
              <QRCode showToast={showToast} />
            ) : tab === "payment" ? (
              <PaymentSettings showToast={showToast} />
            ) : tab === "staff" ? (
              <StaffManagement />
            ) : tab === "customize" ? (
              <Customize showToast={showToast} />
            ) : tab === "reports" ? (
              <ReportsAnalytics />
            ) : tab === "profile" ? (
              <Profile />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}